const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const { Types } = require('mongoose');
const { Post } = require('../dist/models/Post.js');
const { Comment } = require('../dist/models/Comment.js');
const controller = require('../dist/controllers/postController.js');
const policy = require('../dist/utils/communityPolicy.js');
const userId = new Types.ObjectId('507f1f77bcf86cd799439011');
const postId = '507f1f77bcf86cd799439012';
const commentId = '507f1f77bcf86cd799439013';
const user = { _id: userId, name: 'Test Athlete', role: 'athlete' };
const date = '2026-11-14T00:00:00.000Z';
afterEach(() => mock.restoreAll());
async function invoke(handler, { body = {}, query = {}, params = { id: postId }, account = user } = {}) {
  const emit = mock.fn();
  const req = { body, query, params, user: account, app: { get: () => ({ emit }) } };
  const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  await handler(req, res, error => { throw error; });
  return { req, res, emit };
}
function queryResult(records) {
  const calls = {};
  const chain = {};
  for (const name of ['select','populate','sort','skip','limit']) chain[name] = (...args) => { calls[name] = args; return chain; };
  chain.lean = async () => records;
  return { calls, chain };
}

for (const [name, handler] of Object.entries(controller)) {
  test(`${name} rejects missing sessions before using persistence`, async () => {
    const find = mock.method(Post, 'find', () => { throw Error('No anonymous reads'); });
    const create = mock.method(Post, 'create', () => { throw Error('No anonymous writes'); });
    const result = await invoke(handler, { account: null });
    assert.equal(result.res.code, 401); assert.equal(find.mock.callCount(), 0); assert.equal(create.mock.callCount(), 0);
  });
}
test('post schema rejects oversized, blank, media and forged author payloads', () => {
  for (const body of [{content:''},{content:'  '},{content:'x'.repeat(5001)},{content:'valid',authorId:userId},{content:'valid',mediaUrl:'https://tracker.example/pixel'}, {content:{$ne:null}}]) {
    assert.equal(policy.communityPostSchema.safeParse(body).success, false);
  }
  assert.equal(policy.communityPostSchema.parse({content:'  Training reflection  '}).content,'Training reflection');
});
test('post handler enforces text-only schema even without route validation', async () => {
  const create = mock.method(Post, 'create', async () => { throw Error('Must not write'); });
  const result = await invoke(controller.createPost, { body: {content:'Valid text', authorId: postId} });
  assert.equal(result.res.code,400); assert.equal(create.mock.callCount(),0);
});
test('published post derives author from the session and emits only safe member fields', async () => {
  const create = mock.method(Post,'create',async fields=>({_id:postId,...fields,get:()=>date}));
  const result = await invoke(controller.createPost,{body:{content:'  Saved reflection  '}});
  assert.equal(result.res.code,201);
  assert.deepEqual(create.mock.calls[0].arguments[0],{authorId:userId,content:'Saved reflection',mediaUrl:'',mediaType:'none'});
  assert.deepEqual(result.res.body.post.authorId,{_id:userId,name:user.name,role:'athlete'});
  assert.equal(result.res.body.post.likesCount,0);assert.equal(result.res.body.post.commentsCount,0);
  assert.equal(result.emit.mock.calls[0].arguments[0],'new_post');
  assert.equal(result.res.body.post.authorId.email,undefined);
});
test('failed post persistence propagates failure and never emits a successful publication', async () => {
  mock.method(Post,'create',async()=>{throw Error('Database offline');});
  await assert.rejects(invoke(controller.createPost,{body:{content:'Keep this draft'}}),/Database offline/);
});
test('realtime failure after persistence still reports the actual successful publication', async () => {
  const create=mock.method(Post,'create',async fields=>({_id:postId,...fields,get:()=>date}));
  const warning=mock.method(console,'warn',()=>{});
  const req={body:{content:'Persisted even if realtime is down'},user,app:{get:()=>({emit:()=>{throw Error('sensitive transport failure');}})}};
  const res={status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await controller.createPost(req,res,error=>{throw error;});
  assert.equal(res.code,201);assert.equal(res.body.post.content,req.body.content);assert.equal(create.mock.callCount(),1);
  assert.equal(warning.mock.callCount(),1);assert.doesNotMatch(warning.mock.calls[0].arguments[0],/sensitive transport failure/);
  assert.match(warning.mock.calls[0].arguments[0],/community_realtime_delivery_failed/);
});
test('feed pagination is bounded and author projections exclude private identifiers', async () => {
  const records = [{_id:postId,authorId:{_id:userId,name:user.name,role:'athlete'},content:'Saved',createdAt:date,likes:[userId],commentsCount:999}, {_id:commentId,content:'Next page',likes:[]}];
  const result = queryResult(records); mock.method(Post,'find',()=>result.chain);
  const aggregate = mock.method(Comment,'aggregate',async()=>[{_id:new Types.ObjectId(postId),count:2}]);
  const response = await invoke(controller.getPosts,{query:{page:'2',limit:'1'}});
  assert.equal(response.res.code,200);assert.equal(response.res.body.hasMore,true);assert.equal(response.res.body.posts.length,1);
  assert.deepEqual(result.calls.skip,[1]);assert.deepEqual(result.calls.limit,[2]);assert.deepEqual(result.calls.populate,['authorId','name role']);
  assert.equal(response.res.body.posts[0].commentsCount,2);assert.equal(response.res.body.posts[0].likedByMe,true);
  assert.equal(response.res.body.posts[0].likes,undefined);assert.equal(response.res.body.posts[0].likesCount,1);
  assert.equal(aggregate.mock.callCount(),1);
});
test('invalid feed pagination never reaches the database', async () => {
  const find=mock.method(Post,'find',()=>{throw Error('Do not query');});
  for(const query of [{page:0},{limit:5000},{page:{$gt:0}},{limit:['12']},{search:{$regex:'.*'}}]) {
    const result=await invoke(controller.getPosts,{query});assert.equal(result.res.code,400);
  }
  assert.equal(find.mock.callCount(),0);
});
test('empty feed has an honest empty result and performs no comment aggregation', async () => {
  const result=queryResult([]);mock.method(Post,'find',()=>result.chain);
  const aggregate=mock.method(Comment,'aggregate',async()=>{throw Error('No unnecessary aggregation');});
  const response=await invoke(controller.getPosts);
  assert.deepEqual(response.res.body.posts,[]);assert.equal(response.res.body.hasMore,false);assert.equal(aggregate.mock.callCount(),0);
});
for(const liked of [true,false]) {
  test(`like desired state ${liked} uses a single actor-derived atomic operation`, async () => {
    const update=mock.method(Post,'findByIdAndUpdate',()=>({select:async()=>({likes:liked?[userId]:[]})}));
    const result=await invoke(controller.toggleLikePost,{body:{liked}});
    assert.equal(result.res.code,200);assert.equal(result.res.body.liked,liked);assert.equal(result.res.body.likesCount,liked?1:0);
    const [id,operation,options]=update.mock.calls[0].arguments;
    assert.equal(id,postId);assert.deepEqual(operation,liked?{$addToSet:{likes:userId}}:{$pull:{likes:userId}});
    assert.deepEqual(options,{new:true,runValidators:true});
  });
}
test('malformed or actor-injected likes and invalid ids fail without persistence', async () => {
  const update=mock.method(Post,'findByIdAndUpdate',()=>{throw Error('No write');});
  for(const body of [{},{liked:'true'},{liked:true,userId:postId},{liked:{$ne:false}}]) {
    const response=await invoke(controller.toggleLikePost,{body});assert.equal(response.res.code,400);
  }
  const response=await invoke(controller.toggleLikePost,{body:{liked:true},params:{id:'bad-id'}});assert.equal(response.res.code,400);
  assert.equal(update.mock.callCount(),0);
});
test('a missing post cannot receive a like', async () => {
  mock.method(Post,'findByIdAndUpdate',()=>({select:async()=>null}));
  const result=await invoke(controller.toggleLikePost,{body:{liked:true}});assert.equal(result.res.code,404);
});
test('duplicate legacy like entries never inflate the reported member count', async () => {
  mock.method(Post,'findByIdAndUpdate',()=>({select:async()=>({likes:[userId,userId]})}));
  const result=await invoke(controller.toggleLikePost,{body:{liked:true}});
  assert.equal(result.res.body.liked,true);assert.equal(result.res.body.likesCount,1);
});
test('comment author and target are server-derived and no mutable post counter is written', async () => {
  mock.method(Post,'exists',async()=>true);
  const create=mock.method(Comment,'create',async fields=>({_id:commentId,...fields,get:()=>date}));
  const postUpdate=mock.method(Post,'findByIdAndUpdate',()=>{throw Error('No count race');});
  const result=await invoke(controller.commentPost,{body:{content:'  Useful feedback  '}});
  assert.equal(result.res.code,201);assert.deepEqual(create.mock.calls[0].arguments[0],{authorId:userId,postId,content:'Useful feedback'});
  assert.equal(result.res.body.comment.authorId.email,undefined);assert.equal(postUpdate.mock.callCount(),0);
});
test('comment validation rejects excessive, blank and identity-injected content before reads', async () => {
  const exists=mock.method(Post,'exists',async()=>{throw Error('No query');});
  for(const body of [{content:' '},{content:'x'.repeat(2001)},{content:'Good',authorId:postId},{content:'Good',postId:commentId}]) {
    const result=await invoke(controller.commentPost,{body});assert.equal(result.res.code,400);
  }
  const result=await invoke(controller.commentPost,{body:{content:'Good'},params:{id:'x'}});assert.equal(result.res.code,400);assert.equal(exists.mock.callCount(),0);
});
test('comments on a missing post produce404 without orphan writes', async () => {
  mock.method(Post,'exists',async()=>false);const create=mock.method(Comment,'create',async()=>{throw Error('No orphan');});
  const response=await invoke(controller.commentPost,{body:{content:'Good'}});assert.equal(response.res.code,404);assert.equal(create.mock.callCount(),0);
});
test('comment reads validate target and paginate with safe authors', async () => {
  mock.method(Post,'exists',async()=>true);const records=[{_id:commentId,content:'First'},{_id:postId,content:'More'}];const result=queryResult(records);
  const find=mock.method(Comment,'find',()=>result.chain);
  const response=await invoke(controller.getCommentsByPostId,{query:{page:'3',limit:'1'}});
  assert.deepEqual(find.mock.calls[0].arguments[0],{postId});assert.deepEqual(result.calls.skip,[2]);assert.deepEqual(result.calls.limit,[2]);
  assert.deepEqual(result.calls.populate,['authorId','name role']);assert.equal(response.res.body.comments.length,1);assert.equal(response.res.body.hasMore,true);
});
test('invalid comments query or missing post never returns a pretend empty success', async () => {
  const exists=mock.method(Post,'exists',async()=>false);const find=mock.method(Comment,'find',()=>{throw Error('No query');});
  let result=await invoke(controller.getCommentsByPostId,{query:{limit:1000}});assert.equal(result.res.code,400);assert.equal(exists.mock.callCount(),0);
  result=await invoke(controller.getCommentsByPostId);assert.equal(result.res.code,404);assert.equal(find.mock.callCount(),0);
});
