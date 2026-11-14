const assert = require('node:assert/strict');
const { test, afterEach, mock } = require('node:test');
const mongoose = require('mongoose');
const { Post } = require('../dist/models/Post.js');
const { Comment } = require('../dist/models/Comment.js');
const { CommunityReport } = require('../dist/models/CommunityReport.js');
const { CommunityModerationAudit } = require('../dist/models/CommunityModerationAudit.js');
const author = require('../dist/controllers/communityAuthorController.js');
const moderation = require('../dist/controllers/communityModerationController.js');
const feed = require('../dist/controllers/postController.js');
const policy = require('../dist/utils/communityPolicy.js');
const transaction = require('../dist/utils/communityTransaction.js');
const postId='507f1f77bcf86cd799439011', commentId='507f1f77bcf86cd799439012', reportId='507f1f77bcf86cd799439013';
const user={_id:new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),name:'Member',role:'athlete'};
afterEach(()=>mock.restoreAll());
function query(result, inspect={}) {return {select(value){inspect.select=value;return this;},populate(...value){inspect.populate=value;return this;},session(value){inspect.session=value;return this;},
  sort(value){inspect.sort=value;return this;},skip(value){inspect.skip=value;return this;},limit(value){inspect.limit=value;return this;},lean(){return Promise.resolve(result);},then(resolve,reject){return Promise.resolve(result).then(resolve,reject);}};}
async function invoke(handler, fields={}) {const req={user,body:{},query:{},params:{id:postId,commentId,reportId},...fields}; const res={status(code){this.code=code;return this;},json(body){this.body=body;return this;}};let error;await handler(req,res,value=>{error=value;});return {res,error};}
function parentWrite(){return mock.method(transaction,'withCommunityPostWrite',async(_id,work)=>work({fixture:true}));}
function session(){let ended=0;const value={withTransaction:async work=>work(),endSession:async()=>ended++};mock.method(mongoose,'startSession',async()=>value);return {value,ended:()=>ended};}

test('author payloads require version, trim bounds and reject authority/status injection',()=>{
  assert.deepEqual(policy.communityPostEditSchema.parse({expectedVersion:0,content:' Saved '}),{expectedVersion:0,content:'Saved'});
  for(const body of [{content:'text'},{expectedVersion:-1,content:'text'},{expectedVersion:0,content:''},{expectedVersion:0,content:'text',authorId:postId},{expectedVersion:0,content:'text',visibility:'visible'}]) assert.equal(policy.communityPostEditSchema.safeParse(body).success,false);
  assert.equal(policy.communityCommentEditSchema.safeParse({expectedVersion:0,content:'x'.repeat(2001)}).success,false);
  assert.equal(policy.communityRemoveSchema.safeParse({expectedVersion:0,authorId:postId}).success,false);
});
test('report and decision schemas bound details, reasons, versions and require accountability',()=>{
  for(const body of [{reason:'invented'},{reason:'other'},{reason:'spam',details:'x'.repeat(1001)},{reason:'spam',reporterId:postId}]) assert.equal(policy.communityReportSchema.safeParse(body).success,false);
  for(const body of [{action:'hide',expectedVersion:0,note:'Reviewed'},{action:'hide',expectedVersion:0,expectedTargetVersion:0,note:' '},{action:'restore',expectedVersion:0,note:'Reviewed'},{action:'dismiss',expectedVersion:0,note:'Reviewed',resolvedBy:postId}]) assert.equal(policy.communityResolveSchema.safeParse(body).success,false);
  assert.equal(policy.communityResolveSchema.safeParse({action:'dismiss',expectedVersion:0,note:'Reviewed concern'}).success,true);
});
for(const [name,handler] of Object.entries({...author,...moderation})) test(`${name} rejects anonymous access`,async()=>{const result=await invoke(handler,{user:undefined});assert.equal(result.res.code,401);assert.equal(result.error,undefined);});
for(const role of ['athlete','coach','academy_owner','tournament_organizer']) test(`${role} cannot read or resolve private moderation reports`,async()=>{
  const find=mock.method(CommunityReport,'find',()=>{throw Error('No private read');});
  for(const handler of [moderation.getCommunityReports,moderation.resolveCommunityReport])assert.equal((await invoke(handler,{user:{...user,role}})).res.code,403);
  assert.equal(find.mock.callCount(),0);
});
test('post edits and removal enforce principal ownership, CAS and visibility',async()=>{
  const update=mock.method(Post,'findOneAndUpdate',()=>query({version:1}));
  assert.equal((await invoke(author.editCommunityPost,{body:{expectedVersion:0,content:'Edited'}})).res.code,200);
  const [filter,change]=update.mock.calls[0].arguments;assert.equal(filter.authorId,user._id);assert.equal(filter._id,postId);assert.deepEqual(filter.visibility,{$nin:['hidden','deleted']});assert.deepEqual(change,{$set:{content:'Edited'},$inc:{version:1}});
  await invoke(author.removeCommunityPost,{body:{expectedVersion:1}});const [removeFilter,removeChange]=update.mock.calls[1].arguments;assert.equal(removeFilter.authorId,user._id);assert.equal(removeFilter.version,1);assert.deepEqual(removeChange.$set,{visibility:'deleted'});
});
test('foreign/stale author edit reports conflict and cannot claim saved content',async()=>{mock.method(Post,'findOneAndUpdate',()=>query(null));assert.equal((await invoke(author.editCommunityPost,{body:{expectedVersion:0,content:'Edit'}})).res.code,409);});
test('comment edits scope parent, author and version within parent-serialized transaction',async()=>{
  const tx=parentWrite(),update=mock.method(Comment,'findOneAndUpdate',()=>query({version:3}));
  assert.equal((await invoke(author.editCommunityComment,{body:{expectedVersion:2,content:'Updated comment'}})).res.code,200);
  assert.equal(tx.mock.calls[0].arguments[0],postId);const [filter,,options]=update.mock.calls[0].arguments;assert.equal(filter.postId,postId);assert.equal(filter.authorId,user._id);assert.equal(filter.version,2);assert.ok(options.session);
});
test('missing or foreign comment removal fails with no claimed success',async()=>{parentWrite();mock.method(Comment,'findOneAndUpdate',()=>query(null));const result=await invoke(author.removeCommunityComment,{body:{expectedVersion:0}});assert.equal(result.error.statusCode,409);});
test('report target and reporter derive from path and principal; duplicate actor report is idempotent',async()=>{
  const tx=parentWrite();const create=mock.method(CommunityReport,'create',async rows=>rows);
  const result=await invoke(moderation.reportCommunityPost,{body:{reason:'privacy',details:'Permission concern'}});assert.equal(result.res.code,201);assert.equal(tx.mock.calls[0].arguments[0],postId);
  const [rows,options]=create.mock.calls[0].arguments;assert.deepEqual(rows,[{reporterId:user._id,targetType:'post',targetId:postId,reason:'privacy',details:'Permission concern'}]);assert.ok(options.session);
  create.mock.mockImplementation(async()=>{throw {code:11000};});assert.equal((await invoke(moderation.reportCommunityPost,{body:{reason:'spam'}})).res.code,200);
});
test('a comment report requires a visible comment under the exact visible parent',async()=>{
  parentWrite();const exists=mock.method(Comment,'exists',()=>query(null));const create=mock.method(CommunityReport,'create',async()=>{throw Error('No missing-target report');});
  const result=await invoke(moderation.reportCommunityComment,{body:{reason:'spam'}});assert.equal(result.error.statusCode,404);assert.equal(create.mock.callCount(),0);assert.deepEqual(exists.mock.calls[0].arguments[0],{_id:commentId,postId,...policy.communityVisible});
});
test('queue is admin-only, bounded, status-filtered and uses safe account projections',async()=>{
  const inspect={},targetInspect={};const find=mock.method(CommunityReport,'find',()=>query([{_id:reportId,targetType:'post',targetId:postId}],inspect));
  mock.method(Post,'findById',()=>query({_id:postId,content:'Review text',authorId:{_id:user._id,name:user.name,role:user.role}},targetInspect));
  const result=await invoke(moderation.getCommunityReports,{user:{...user,role:'admin'},query:{page:'2',limit:'1',status:'open'}});
  assert.equal(result.res.code,200);assert.deepEqual(find.mock.calls[0].arguments[0],{status:'open'});assert.equal(inspect.skip,1);assert.equal(inspect.limit,2);assert.deepEqual(inspect.populate,['reporterId','name role']);assert.deepEqual(targetInspect.populate,['authorId','name role']);assert.doesNotMatch(inspect.select+' '+targetInspect.select,/email|phone|firebaseUid|password/);assert.equal(result.res.body.reports[0].target.visibility,'visible');
});
test('hide resolution updates target/report and appends actor audit in one session',async()=>{
  const sess=session();mock.method(CommunityReport,'findOne',()=>query({_id:reportId,targetType:'comment',targetId:commentId}));
  const target=mock.method(Comment,'findOneAndUpdate',()=>query({_id:commentId}));const update=mock.method(CommunityReport,'findOneAndUpdate',async()=>({_id:reportId}));const audit=mock.method(CommunityModerationAudit,'create',async()=>[]);
  const result=await invoke(moderation.resolveCommunityReport,{user:{...user,role:'admin'},body:{expectedVersion:0,expectedTargetVersion:2,action:'hide',note:'Reviewed harassment'}});
  assert.equal(result.res.code,200);assert.equal(sess.ended(),1);const [filter,change,options]=target.mock.calls[0].arguments;assert.equal(filter.version,2);assert.deepEqual(filter.visibility,{$nin:['hidden','deleted']});assert.equal(change.$set.visibility,'hidden');assert.equal(change.$set.hiddenBy,user._id);assert.equal(options.session,sess.value);
  assert.equal(update.mock.calls[0].arguments[2].session,sess.value);const [rows,auditOptions]=audit.mock.calls[0].arguments;assert.equal(rows[0].actorId,user._id);assert.equal(rows[0].reportId,reportId);assert.equal(rows[0].resultingTargetVersion,3);assert.equal(auditOptions.session,sess.value);
});
test('stale/removed moderation target leaves report open and writes no audit',async()=>{
  const sess=session();mock.method(CommunityReport,'findOne',()=>query({_id:reportId,targetType:'post',targetId:postId}));mock.method(Post,'findOneAndUpdate',()=>query(null));
  const reportUpdate=mock.method(CommunityReport,'findOneAndUpdate',async()=>{throw Error('No report close');});const audit=mock.method(CommunityModerationAudit,'create',async()=>{throw Error('No audit');});
  const result=await invoke(moderation.resolveCommunityReport,{user:{...user,role:'admin'},body:{expectedVersion:0,expectedTargetVersion:0,action:'hide',note:'Review'}});
  assert.equal(result.error.statusCode,409);assert.equal(reportUpdate.mock.callCount(),0);assert.equal(audit.mock.callCount(),0);assert.equal(sess.ended(),1);
});
test('missing/closed report cannot hide any target',async()=>{session();mock.method(CommunityReport,'findOne',()=>query(null));const update=mock.method(Post,'findOneAndUpdate',()=>{throw Error('No target write');});const result=await invoke(moderation.resolveCommunityReport,{user:{...user,role:'admin'},body:{expectedVersion:0,expectedTargetVersion:0,action:'hide',note:'Review'}});assert.equal(result.error.statusCode,409);assert.equal(update.mock.callCount(),0);});
test('dismissal records a decision and audit without changing target visibility',async()=>{
  session();mock.method(CommunityReport,'findOne',()=>query({_id:reportId,targetType:'post',targetId:postId}));mock.method(CommunityReport,'findOneAndUpdate',async()=>({_id:reportId}));const audit=mock.method(CommunityModerationAudit,'create',async()=>[]);const target=mock.method(Post,'findOneAndUpdate',()=>{throw Error('Dismissal must not restore or hide');});
  assert.equal((await invoke(moderation.resolveCommunityReport,{user:{...user,role:'admin'},body:{expectedVersion:0,action:'dismiss',note:'No policy breach found'}})).res.code,200);assert.equal(target.mock.callCount(),0);assert.equal(audit.mock.callCount(),1);
});
test('hidden/deleted posts and comments are excluded from feed counts and like writes',async()=>{
  const find=mock.method(Post,'find',()=>query([{_id:postId,content:'Visible',likes:[],version:2}]));const aggregate=mock.method(Comment,'aggregate',async()=>[]);
  const result=await invoke(feed.getPosts);assert.equal(result.res.code,200);assert.deepEqual(find.mock.calls[0].arguments[0],policy.communityVisible);assert.deepEqual(aggregate.mock.calls[0].arguments[0][0].$match.visibility,{$nin:['hidden','deleted']});assert.equal(result.res.body.posts[0].version,2);
  const update=mock.method(Post,'findOneAndUpdate',()=>query(null));assert.equal((await invoke(feed.toggleLikePost,{body:{liked:true}})).res.code,404);assert.deepEqual(update.mock.calls[0].arguments[0].visibility,{$nin:['hidden','deleted']});
});
test('hidden/missing parent aborts child transaction before any callback and ends session',async()=>{
  const sess=session();const update=mock.method(Post,'updateOne',async()=>({matchedCount:0}));let called=0;
  await assert.rejects(transaction.withCommunityPostWrite(postId,async()=>{called++;return true;}),error=>error.statusCode===404);assert.equal(called,0);assert.equal(sess.ended(),1);assert.deepEqual(update.mock.calls[0].arguments[0],{_id:postId,...policy.communityVisible});
});
