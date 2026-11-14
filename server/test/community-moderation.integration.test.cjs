// Disposable replica-set evidence only; never reads MONGO_URI/customer data.
const assert = require('node:assert/strict');
const { test, mock } = require('node:test');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');
const { safeLocalMongoUri } = require('./helpers/localMongo.cjs');
const { User } = require('../dist/models/User.js');
const { Post } = require('../dist/models/Post.js');
const { Comment } = require('../dist/models/Comment.js');
const { CommunityReport } = require('../dist/models/CommunityReport.js');
const { CommunityModerationAudit } = require('../dist/models/CommunityModerationAudit.js');
const author = require('../dist/controllers/communityAuthorController.js');
const moderation = require('../dist/controllers/communityModerationController.js');
const feed = require('../dist/controllers/postController.js');
const uri = process.env.TEST_MONGO_URI;

test('real community visibility, report uniqueness and atomic moderation', { skip: !uri, timeout: 90000 }, async t => {
  const dbName = `athlix_community_test_${randomBytes(16).toString('hex')}`;
  if (!/^athlix_community_test_[a-f\d]{32}$/.test(dbName)) throw Error('Unsafe community test namespace');
  await mongoose.connect(safeLocalMongoUri(uri), { dbName, serverSelectionTimeoutMS: 10000 });
  try {
    await Promise.all([User.init(), Post.init(), Comment.init(), CommunityReport.init(), CommunityModerationAudit.init()]);
    const [owner, other, admin] = await User.create([
      { name: 'Fixture author', email: 'author@example.test', role: 'athlete' },
      { name: 'Fixture member', email: 'member@example.test', role: 'athlete' },
      { name: 'Fixture administrator', email: 'admin@example.test', role: 'admin' },
    ]);
    const post = await Post.create({ authorId: owner._id, content: 'Original test content' });
    async function invoke(handler, fields = {}) {
      const req = { user: owner, body: {}, query: {}, params: { id: String(post._id) }, app: { get: () => undefined }, ...fields };
      const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
      let error; await handler(req, res, value => { error = value; }); return { res, error };
    }
    await t.test('another member cannot edit or remove author content', async () => {
      assert.equal((await invoke(author.editCommunityPost, { user: other, body: { expectedVersion: 0, content: 'Unauthorized change' } })).res.code, 409);
      assert.equal((await invoke(author.removeCommunityPost, { user: other, body: { expectedVersion: 0 } })).res.code, 409);
      assert.equal((await Post.findById(post._id)).content, post.content);
    });
    await t.test('concurrent author edits commit once using editorial version', async () => {
      const results = await Promise.all(['First valid edit', 'Second valid edit'].map(content => invoke(author.editCommunityPost, { body: { expectedVersion: 0, content } })));
      assert.deepEqual(results.map(result => result.res.code).sort(), [200, 409]); assert.equal((await Post.findById(post._id)).version, 1);
    });
    await t.test('concurrent duplicate reports store one actor/target report', async () => {
      const results = await Promise.all([1, 2].map(() => invoke(moderation.reportCommunityPost, { user: other, body: { reason: 'privacy', details: 'Permission concern' } })));
      assert.deepEqual(results.map(result => result.res.code).sort(), [200, 201]);
      assert.equal(await CommunityReport.countDocuments({ targetId: post._id, reporterId: other._id }), 1);
    });
    await t.test('hide decision atomically closes report, hides target and appends audit', async () => {
      const report = await CommunityReport.findOne({ targetId: post._id });
      const decision = { expectedVersion: 0, expectedTargetVersion: 1, action: 'hide', note: 'Reviewed permission concern' };
      const result = await invoke(moderation.resolveCommunityReport, { user: admin, params: { reportId: String(report._id) }, body: decision });
      assert.equal(result.error, undefined); assert.equal(result.res.code, 200);
      assert.equal((await Post.findById(post._id)).visibility, 'hidden'); assert.equal((await CommunityReport.findById(report._id)).status, 'resolved');
      const audits = await CommunityModerationAudit.find({ reportId: report._id }); assert.equal(audits.length, 1); assert.equal(String(audits[0].actorId), String(admin._id));
      const repeated = await invoke(moderation.resolveCommunityReport, { user: admin, params: { reportId: String(report._id) }, body: decision });
      assert.equal(repeated.error?.statusCode, 409); assert.equal(await CommunityModerationAudit.countDocuments({ reportId: report._id }), 1);
      const liked = await invoke(feed.toggleLikePost, { user: other, body: { liked: true } }); assert.equal(liked.res.code, 404);
    });
    await t.test('audit failure rolls back actual target and report mutations', async () => {
      const target = await Post.create({ authorId: owner._id, content: 'Rollback fixture' });
      const report = await CommunityReport.create({ reporterId: other._id, targetType: 'post', targetId: target._id, reason: 'spam' });
      const injection = mock.method(CommunityModerationAudit, 'create', async () => { throw Error('Synthetic audit storage failure'); });
      try {
        const result = await invoke(moderation.resolveCommunityReport, { user: admin, params: { reportId: String(report._id) }, body: { expectedVersion: 0, expectedTargetVersion: 0, action: 'hide', note: 'Must roll back' } });
        assert.match(result.error.message, /Synthetic audit/);
      } finally { injection.mock.restore(); }
      assert.equal((await Post.findById(target._id)).visibility, 'visible'); assert.equal((await Post.findById(target._id)).version, 0);
      assert.equal((await CommunityReport.findById(report._id)).status, 'open'); assert.equal(await CommunityModerationAudit.countDocuments({ reportId: report._id }), 0);
    });
    await t.test('hidden/deleted comments do not appear in rows or persisted counts', async () => {
      const parent = await Post.create({ authorId: owner._id, content: 'Count fixture' });
      await Comment.create(['visible', 'hidden', 'deleted'].map(visibility => ({ authorId: owner._id, postId: parent._id, content: visibility + ' fixture', visibility })));
      const result = await invoke(feed.getPosts);
      assert.equal(result.res.code, 200); assert.equal(result.res.body.posts.some(row => String(row._id) === String(post._id)), false);
      assert.equal(result.res.body.posts.find(row => String(row._id) === String(parent._id)).commentsCount, 1);
      const comments = await invoke(feed.getCommentsByPostId, { params: { id: String(parent._id) } });
      assert.equal(comments.res.body.comments.length, 1); assert.equal(comments.res.body.comments[0].content, 'visible fixture');
    });
    await t.test('hidden parent rejects comment creation and private comment reads', async () => {
      const count = await Comment.countDocuments({ postId: post._id });
      const result = await invoke(feed.commentPost, { body: { content: 'Must not become orphaned' } }); assert.equal(result.res.code, 404);
      assert.equal(await Comment.countDocuments({ postId: post._id }), count);
      assert.equal((await invoke(feed.getCommentsByPostId)).res.code, 404);
    });
    await t.test('parent removal race serializes with comment transaction and prevents later writes', async () => {
      const parent = await Post.create({ authorId: owner._id, content: 'Race fixture' });
      const [removed, commented] = await Promise.all([
        invoke(author.removeCommunityPost, { params: { id: String(parent._id) }, body: { expectedVersion: 0 } }),
        invoke(feed.commentPost, { params: { id: String(parent._id) }, body: { content: 'Concurrent fixture comment' } }),
      ]);
      assert.equal(removed.res.code, 200); assert.ok(commented.res.code === 201 || commented.res.code === 404 || commented.error?.statusCode === 404);
      const later = await invoke(feed.commentPost, { params: { id: String(parent._id) }, body: { content: 'After removal' } }); assert.equal(later.res.code, 404);
      const comments = await invoke(feed.getCommentsByPostId, { params: { id: String(parent._id) } }); assert.equal(comments.res.code, 404);
    });
  } finally {
    mock.restoreAll();
    if (mongoose.connection.db?.databaseName !== dbName || !/^athlix_community_test_[a-f\d]{32}$/.test(dbName)) throw Error('Refusing unsafe database cleanup');
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
