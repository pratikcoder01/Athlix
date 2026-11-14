// Browser fixtures test UI/API wiring. They do not exercise a live MongoDB or Firebase project.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const userId='507f1f77bcf86cd799439011';
const postId='507f1f77bcf86cd799439012';
const academyId='507f1f77bcf86cd799439013';
const date='2026-11-14T00:00:00.000Z';
const screenshotDirectory=path.resolve(__dirname,'../../../.task-tools/screenshots');
let browser;
const browserErrors=[];
async function session(role='athlete') {
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await context.addInitScript(({role,userId})=>localStorage.setItem('athlix-auth',JSON.stringify({state:{user:{id:userId,name:'Fixture Athlete',email:'fixture@example.test',role},token:'workspace-fixture-token',isAuthenticated:true},version:0})),{role,userId});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  page.on('pageerror',error=>browserErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&/hydration|server rendered|didn't match/i.test(message.text()))browserErrors.push(message.text());});
  await page.routeWebSocket('**/socket.io/**',socket=>socket.close());await page.route('**/socket.io/**',route=>route.abort());
  return {context,page};
}
const json=(route,payload,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(payload)});
async function profileFlow() {
  const {context,page}=await session();let saves=0;
  let profile={bio:'Original persisted profile',discipline:'Karate',beltRank:'White',location:'Test city',achievements:[],profileImage:''};
  await page.route('**/api/profiles**',async route=>{
    assert.equal(route.request().headers().authorization,'Bearer workspace-fixture-token');
    if(route.request().method()==='PUT') {const body=route.request().postDataJSON();assert.deepEqual(Object.keys(body).sort(),['achievements','beltRank','bio','discipline','location']);profile={...profile,...body};saves++;return json(route,{success:true,message:'Profile saved in fixture',profile});}
    return json(route,{success:true,user:{_id:userId,name:'Fixture Athlete',role:'athlete'},profile});
  });
  await page.goto(base+'/profile',{waitUntil:'domcontentloaded'});
  await page.getByLabel('About your training').fill('Updated persisted training introduction');
  await page.getByLabel('Achievements · one per line').fill('Local pilot participation 2026');
  await page.getByRole('button',{name:'Save profile',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Profile saved in fixture'}).waitFor();
  assert.equal(saves,1);assert.equal(profile.bio,'Updated persisted training introduction');assert.deepEqual(profile.achievements,['Local pilot participation 2026']);
  await page.reload();await page.getByLabel('About your training').waitFor();assert.equal(await page.getByLabel('About your training').inputValue(),profile.bio);
  console.log('PASS workspace profile read/save/reload with owner-derived payload');await context.close();
}
async function academyFlow() {
  const {context,page}=await session('academy_owner');const records=[];let saves=0;
  await page.route('**/api/academies**',async route=>{
    if(route.request().method()==='POST') {const fields=route.request().postDataJSON();assert.equal(fields.latitude,0);assert.equal(fields.longitude,0);assert.equal(fields.ownerId,undefined);saves++;
      const academy={_id:academyId,name:fields.name,address:fields.address,disciplines:fields.disciplines,description:fields.description,schedule:fields.schedule,ownerId:userId,location:{type:'Point',coordinates:[fields.longitude,fields.latitude]}};
      records.push(academy);return json(route,{success:true,message:'Listing saved',academy});}
    return json(route,{success:true,academies:records,page:1,hasMore:false});
  });
  await page.goto(base+'/academies',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Add academy listing'}).click();
  await page.getByLabel('Academy name',{exact:true}).first().fill('Permissioned fixture academy');await page.getByLabel('Street address').fill('Test address for browser fixture');
  await page.getByLabel('Latitude',{exact:true}).fill('0');await page.getByLabel('Longitude',{exact:true}).fill('0');
  await page.getByLabel('About the academy').fill('Owner supplied fixture record');await page.getByRole('button',{name:'Save academy listing'}).click();
  await page.getByRole('status').filter({hasText:'Listing saved'}).waitFor();assert.equal(saves,1);
  await page.goto(base+'/gyms',{waitUntil:'domcontentloaded'});await page.waitForURL('**/academies');await page.getByRole('heading',{name:'Find a place to train.'}).waitFor();
  console.log('PASS academy owner creation, zero coordinates and gyms directory redirect');await context.close();
}
async function communityFlow() {
  const {context,page}=await session();let writes=0;let rejectWrite=false;let rejectLike=false;
  const author={_id:userId,name:'Fixture Athlete',role:'athlete'};
  const posts=[{_id:postId,authorId:author,content:'Existing permissioned training reflection',createdAt:date,likesCount:0,likedByMe:false,commentsCount:0}];
  const comments=[];
  await page.route('**/api/posts**',async route=>{
    const req=route.request();assert.equal(req.headers().authorization,'Bearer workspace-fixture-token');const url=new URL(req.url());
    if(url.pathname.endsWith('/like')) {if(rejectLike)return json(route,{success:false,message:'Fixture like conflict'},409);const body=req.postDataJSON();assert.equal(typeof body.liked,'boolean');posts[0].likedByMe=body.liked;posts[0].likesCount=body.liked?1:0;return json(route,{success:true,liked:body.liked,likesCount:posts[0].likesCount});}
    if(url.pathname.endsWith('/comments')) {if(req.method()==='POST'){const body=req.postDataJSON();assert.deepEqual(Object.keys(body),['content']);const comment={_id:academyId,authorId:author,content:body.content,createdAt:date};comments.push(comment);posts[0].commentsCount=comments.length;return json(route,{success:true,comment});}return json(route,{success:true,comments,page:1,hasMore:false});}
    if(req.method()==='POST') {if(rejectWrite)return json(route,{success:false,message:'Fixture post could not be saved'},503);const body=req.postDataJSON();assert.deepEqual(Object.keys(body),['content']);const post={_id:academyId,authorId:author,content:body.content,createdAt:date,likesCount:0,likedByMe:false,commentsCount:0};posts.unshift(post);writes++;return json(route,{success:true,post});}
    return json(route,{success:true,posts,page:1,hasMore:false});
  });
  await page.goto(base+'/feed',{waitUntil:'domcontentloaded'});await page.getByLabel('What are you working on?').fill('Fixture post published');await page.getByRole('button',{name:'Publish post',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Your post was published.'}).waitFor();assert.equal(writes,1);
  let article=page.getByRole('article').filter({hasText:'Fixture post published'});
  await article.getByRole('button',{name:/^Like ·/}).click();await article.getByRole('button',{name:'Liked · 1',exact:true}).waitFor();
  await article.getByRole('button',{name:'Comments · 0',exact:true}).click();await article.getByLabel('Add to the conversation').fill('Fixture comment persisted');await article.getByRole('button',{name:'Publish comment'}).click();
  await page.getByText('Fixture comment persisted',{exact:true}).waitFor();assert.equal(comments.length,1);
  article=page.getByRole('article').filter({hasText:'Fixture post published'});rejectLike=true;await article.getByRole('button',{name:'Liked · 1',exact:true}).click();await page.getByRole('alert').filter({hasText:'Fixture like conflict'}).waitFor();assert.equal(await article.getByRole('button',{name:'Liked · 1',exact:true}).count(),1);
  rejectWrite=true;await page.getByLabel('What are you working on?').fill('Keep this unsaved draft');await page.getByRole('button',{name:'Publish post',exact:true}).click();await page.getByRole('alert').filter({hasText:'Fixture post could not be saved'}).waitFor();assert.equal(await page.getByLabel('What are you working on?').inputValue(),'Keep this unsaved draft');assert.equal(writes,1);
  for(const width of [360,768,1440]) {await page.setViewportSize({width,height:900});const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(sizes.scroll<=sizes.width+1,`Feed overflow at ${width}`);if(width===360)await page.screenshot({path:path.join(screenshotDirectory,'community-360.png')});}
  console.log('PASS community publish/like/comment, failure recovery and responsive widths');await context.close();
}
(async()=>{await fs.mkdir(screenshotDirectory,{recursive:true});browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});try{await profileFlow();await academyFlow();await communityFlow();assert.deepEqual(browserErrors,[]);console.log('PASS no page exceptions or hydration errors in workspace smoke');}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
