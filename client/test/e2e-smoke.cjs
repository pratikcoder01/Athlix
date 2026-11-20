// UI fixtures validate request wiring and rendering, not cloud/database integration.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const output = path.resolve(__dirname, '../../../.task-tools/screenshots');
const athleteId = '507f1f77bcf86cd799439012';
const ownerId = '507f1f77bcf86cd799439011';
const eventId = '507f1f77bcf86cd799439013';
let browser;
async function pageFor(role) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await installSession(context, role ? { id: role === 'athlete' ? athleteId : ownerId, name: 'Fixture User', email: 'fixture@example.test', role } : null);
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  await page.routeWebSocket('**/socket.io/**', socket => socket.close());
  await page.route('**/socket.io/**', route => route.abort());
  return {context,page};
}
const visible = locator => locator.waitFor({state:'visible'});
async function recoveryTests() {
  for (const mode of ['missing','expired','confirm-rejected','success']) {
    const {context,page} = await pageFor(); const calls=[];
    await page.route('https://identitytoolkit.googleapis.com/**', async route => {
      const body=route.request().postDataJSON();
      if (!route.request().url().includes('/accounts:resetPassword')) return route.fulfill({status:200,contentType:'application/json',body:'{}'});
      calls.push(body);
      const message=mode==='expired'?'EXPIRED_OOB_CODE':mode==='confirm-rejected'&&body.newPassword?'INVALID_OOB_CODE':null;
      await route.fulfill({status:message?400:200,contentType:'application/json',body:JSON.stringify(message?{error:{code:400,message}}:{email:'athlete@example.test',requestType:'PASSWORD_RESET'})});
    });
    await page.goto(`${base}/reset-password${mode==='missing'?'':'?mode=resetPassword&oobCode=fixture-recovery-code'}`,{waitUntil:'domcontentloaded'});
    if(mode==='missing'||mode==='expired') {
      await visible(page.getByRole('alert').filter({hasText:/link/i}));assert.equal(await page.locator('#new-password').count(),0);
      if (mode === 'missing') assert.equal(calls.length,0);
      else { assert.ok(calls.length >= 1); assert.ok(calls.every(call => !call.newPassword)); }
    } else {
      await visible(page.locator('#new-password'));
      await page.locator('#new-password').fill('new-test-password');await page.locator('#confirm-password').fill('new-test-password');
      await page.getByRole('button',{name:/UPDATE PASSWORD/}).click();
      if(mode==='success') {await visible(page.getByText('Your password has been updated.'));assert.equal(new URL(page.url()).search,'');}
      else {await visible(page.getByRole('alert').filter({hasText:/link/i}));assert.equal(await page.getByText('Your password has been updated.').count(),0);}
      assert.ok(calls.length >= 2);assert.ok(calls.every(call => call.oobCode === 'fixture-recovery-code'));
      const confirmations=calls.filter(call => call.newPassword);
      assert.equal(confirmations.length,1);assert.equal(confirmations[0].newPassword,'new-test-password');
    }
    console.log(`PASS password recovery ${mode}`);await context.close();
  }
}
function fixtureEvent() {return {_id:eventId,__v:0,title:'Local pilot open',description:'Fixture event for UI request wiring.',date:new Date(Date.now()+30*86400000).toISOString(),registrationDeadline:new Date(Date.now()+29*86400000).toISOString(),location:'Test academy',entryFee:0,disciplines:['Karate'],status:'upcoming',organizerId:{_id:ownerId,name:'Approved organizer'},registrations:[{_id:athleteId,name:'Ada Athlete'},{_id:'507f1f77bcf86cd799439014',name:'Bea Athlete'}],brackets:{seeds:[],rounds:[]}};}
async function tournamentTests() {
  const {context,page}=await pageFor('tournament_organizer');let event=fixtureEvent();let writes=0;
  await page.route('**/api/tournaments**',async route=>{
    const req=route.request();assert.equal(req.headers()['authorization'],'Bearer fixture-api-token');
    const url=new URL(req.url());const method=req.method();let body;
    if(method==='POST'&&url.pathname.endsWith('/generate')) {
      body=req.postDataJSON();assert.equal(body.version,event.__v);event.__v++;writes++;
      event.brackets={seeds:event.registrations.map((a,i)=>({fighterId:a._id,seed:i+1,rationale:'Registration order'})),rounds:[{round:'Final',matches:[{p1:athleteId,p2:'507f1f77bcf86cd799439014',winner:'',score:'Pending'}]}]};
    } else if(method==='PUT') {
      body=req.postDataJSON();assert.equal(body.version,event.__v);event.__v++;writes++;
      if(body.status)event.status=body.status;if(body.brackets)event.brackets=body.brackets;
    }
    const payload=url.pathname==='/api/tournaments'?{success:true,tournaments:[event]}:{success:true,tournament:event,message:'Saved fixture event'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.goto(`${base}/tournaments`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button').filter({hasText:'Local pilot open'}).click();
  await page.getByRole('button',{name:'Generate bracket & close registration'}).click();
  await page.getByRole('button',{name:'Start tournament'}).click();
  await page.getByRole('button',{name:'Record Ada Athlete as winner',exact:true}).click();
  await page.getByRole('button',{name:'Complete tournament',exact:true}).click();
  await visible(page.getByRole('status').filter({hasText:'Saved fixture event'}));assert.equal(event.status,'completed');assert.equal(writes,4);
  assert.equal(event.brackets.rounds[0].matches[0].winner,athleteId);
  await page.screenshot({path:path.join(output,'tournament-desktop.png')});
  console.log('PASS organizer generation/start/result/completion with versioned requests');await context.close();
  const athlete=await pageFor('athlete');event=fixtureEvent();event.registrations=event.registrations.slice(1);let registered=false;
  await athlete.page.route('**/api/tournaments**',async route=>{
    const req=route.request();if(req.method()==='POST'){assert.ok(req.url().endsWith('/register'));registered=true;event.registrations.push({_id:athleteId,name:'Fixture Athlete'});event.__v++;}
    const payload=new URL(req.url()).pathname==='/api/tournaments'?{success:true,tournaments:[event]}:{success:true,tournament:event,message:'Registration saved'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await athlete.page.goto(`${base}/tournaments`,{waitUntil:'domcontentloaded'});
  await athlete.page.getByRole('button').filter({hasText:'Local pilot open'}).click();await athlete.page.getByRole('button',{name:'Register for event',exact:true}).click();
  await visible(athlete.page.getByRole('button',{name:'You are registered'}));assert.ok(registered);assert.ok(await athlete.page.getByRole('button',{name:'You are registered'}).isDisabled());
  console.log('PASS athlete registration request and duplicate-submit UI gate');await athlete.context.close();
}
async function videoTests() {
  const {context,page}=await pageFor('athlete');let uploads=0;const requestIds=[];
  let finishLateReply;const lateReply=new Promise(resolve=>{finishLateReply=resolve;});
  await page.route('**/api/cv/analyze',async route=>{
    uploads++;assert.equal(route.request().headers().authorization,'Bearer fixture-api-token');
    const fields=route.request().postDataBuffer().toString('utf8');const match=fields.match(/name="requestId"\r\n\r\n([a-f\d-]{36})/i);assert.ok(match,'Upload must include its stable request UUID');requestIds.push(match[1]);
    if(uploads===2)return route.fulfill({status:202,contentType:'application/json',body:JSON.stringify({task_id:'51c48680-38ce-4cc4-9905-548b310cd5d1',status:'pending'})});
    if(uploads===4){await new Promise(resolve=>setTimeout(resolve,1500));await route.fulfill({status:202,contentType:'application/json',body:JSON.stringify({task_id:'51c48680-38ce-4cc4-9905-548b310cd5d1',status:'pending'})}).catch(()=>{});finishLateReply();return;}
    return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Analysis is unavailable in this test fixture.'})});
  });
  await page.route('**/api/cv/status/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({task_id:'51c48680-38ce-4cc4-9905-548b310cd5d1',status:'failed',error:'Fixture analysis was interrupted.'})}));
  await page.goto(`${base}/kata`,{waitUntil:'domcontentloaded'});
  await visible(page.getByRole('button',{name:'Log out',exact:true}));
  await page.locator('#video-upload-input').setInputFiles({name:'fixture.mp4',mimeType:'video/mp4',buffer:Buffer.from('bounded UI fixture')});
  await page.screenshot({path:path.join(output,'video-selected-debug.png')});
  const analyze=page.getByRole('button',{name:/Run Pose Analysis/i});
  await visible(analyze);assert.ok(await analyze.isDisabled());assert.equal(uploads,0);
  await page.getByRole('checkbox',{name:/permission to upload/}).check();await analyze.click();
  await visible(page.getByText('Analysis is unavailable in this test fixture.'));assert.equal(uploads,1);
  assert.equal(await page.getByText(/Analysis completed/i).count(),0);
  await page.getByRole('button',{name:'Try Again',exact:true}).click();await visible(page.getByText('Fixture analysis was interrupted.',{exact:true}));
  assert.equal(requestIds[1],requestIds[0],'Uncertain transport failure must retry the same accepted operation');
  await page.getByRole('button',{name:'Try Again',exact:true}).click();await visible(page.getByText('Analysis is unavailable in this test fixture.',{exact:true}));
  assert.notEqual(requestIds[2],requestIds[1],'Confirmed terminal failure must permit a new analysis operation');
  await page.getByRole('button',{name:'Try Again',exact:true}).click();await visible(page.getByRole('heading',{name:'Analyzing Movement Technique',exact:true}));
  await page.getByRole('button',{name:'Log out',exact:true}).click();await lateReply;
  await page.locator('#video-upload-input').waitFor({state:'attached'});assert.equal(await page.getByRole('heading',{name:'Analyzing Movement Technique',exact:true}).count(),0);
  assert.equal(await page.getByText('fixture.mp4',{exact:true}).count(),0);
  console.log('PASS video consent, stable retry/new-job UUIDs, terminal failures and in-flight logout cleanup');await context.close();
}
async function responsiveTests() {
  const {context,page}=await pageFor();const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push({message:error.message,url:page.url(),width:page.viewportSize()?.width}));
  for(const width of [360,768,1440]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['/','/signup','/login','/pricing','/tournaments','/kata','/academies']) {
      await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.locator('h1,h2').first().waitFor();
      // SSR headings alone do not establish that the interactive tree hydrated.
      await page.waitForFunction(()=>['dark','light'].includes(document.documentElement.style.colorScheme));
      await page.waitForLoadState('networkidle');
      const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:window.innerWidth}));
      assert.ok(dimensions.scroll<=dimensions.view+1,`${route} overflows at ${width}: ${JSON.stringify(dimensions)}`);
      if((route==='/'&&width!==768)||(route==='/tournaments'&&width===360))await page.screenshot({path:path.join(output,`${route==='/'?'home':'tournaments'}-${width}.png`)});
    }
  }
  assert.deepEqual(pageErrors,[]);console.log('PASS responsive routes at360/768/1440px without page exceptions or horizontal overflow');await context.close();
}
async function themeTests() {
  const {context,page}=await pageFor();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await visible(page.getByRole('button',{name:'Toggle theme',exact:true}));
  await page.waitForFunction(()=>document.documentElement.style.colorScheme === 'dark');
  assert.ok(await page.locator('html').evaluate(root=>root.classList.contains('dark')));
  await page.getByRole('button',{name:'Toggle theme',exact:true}).click();
  await page.waitForFunction(()=>!document.documentElement.classList.contains('dark'));
  await page.reload();await page.waitForFunction(()=>!document.documentElement.classList.contains('dark'));
  assert.deepEqual(errors,[]);console.log('PASS default dark theme and persisted explicit light preference without hydration errors');await context.close();
}
(async()=>{
  await fs.mkdir(output,{recursive:true});browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
  try{if(process.env.ATHLIX_E2E_SCOPE==='video'){await videoTests();}else{await recoveryTests();await tournamentTests();await videoTests();await responsiveTests();await themeTests();}}
  finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
