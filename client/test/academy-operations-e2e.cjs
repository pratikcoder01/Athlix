// Explicit API/session transport fixtures, not live provider/database acceptance.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const ownerId = '507f1f77bcf86cd799439011', academyId = '507f1f77bcf86cd799439012', memberId = '507f1f77bcf86cd799439013';
const today = new Date().toISOString().slice(0, 10);
const token = 'academy-operations-fixture';
const json = (route, value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
let browser; const errors = [];
async function session(role = 'academy_owner', theme = 'dark') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await installSession(context, { id: ownerId, name: 'Fixture Owner', email: 'owner@example.test', role }, token);
  await context.addInitScript(theme => localStorage.setItem('athlix-theme-storage', JSON.stringify({ state: { theme }, version: 0 })), theme);
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', item => { if (item.type() === 'error' && /hydration|server rendered|didn't match/i.test(item.text())) errors.push(item.text()); });
  await page.routeWebSocket('**/socket.io/**', socket => socket.close()); await page.route('**/socket.io/**', route => route.abort());
  return { context, page };
}
async function ownerFlow() {
  const { context, page } = await session();
  const academy = { _id: academyId, ownerId, name: 'Permissioned academy', address: 'Fixture address', disciplines: ['Karate', 'Judo'],
    location: { type: 'Point', coordinates: [0, 0] }, description: 'Owner supplied', schedule: 'Monday 18:00 UTC', isPublished: true, archivedAt: null, version: 0 };
  const members = [], records = []; let saves = 0;
  await page.route('**/api/academies/**', async route => {
    const req = route.request(), url = new URL(req.url()), body = req.method() === 'GET' ? null : req.postDataJSON();
    assert.equal(req.headers().authorization, `Bearer ${token}`);
    if (url.pathname.endsWith('/operations')) return json(route, { success: true, academy, summary: { totalMembers: members.length,
      activeMembers: members.filter(member => member.status === 'active').length, inactiveMembers: members.filter(member => member.status === 'inactive').length,
      date: today, attendance: { present: records.filter(record => record.status === 'present').length, absent: 0, excused: 0 } } });
    if (url.pathname.endsWith('/members')) {
      if (req.method() === 'GET') return json(route, { success: true, members, page: 1, hasMore: false });
      assert.equal(body.permissionConfirmed, true); assert.equal(body.academyId, undefined);
      if (members.some(member => member.memberCode === body.memberCode.toUpperCase())) return json(route, { success: false, message: 'This member code already exists in this academy' }, 409);
      const member = { ...body, _id: memberId, academyId, status: 'active', memberCode: body.memberCode.toUpperCase(), version: 0 };
      delete member.permissionConfirmed; members.push(member); saves++;
      return json(route, { success: true, message: 'Member record saved', member }, 201);
    }
    if (url.pathname.endsWith(`/members/${memberId}`)) {
      assert.equal(body.expectedVersion, members[0].version); Object.assign(members[0], body, { version: members[0].version + 1 });
      return json(route, { success: true, message: 'Member record saved', member: members[0] });
    }
    if (url.pathname.endsWith('/attendance')) {
      if (req.method() === 'GET') return json(route, { success: true, records: records.map(record => ({ ...record, memberId: { _id: memberId, name: members[0].name, memberCode: members[0].memberCode } })), date: today, page: 1, hasMore: false });
      assert.deepEqual(Object.keys(body).sort(), ['date', 'memberId', 'status']); assert.equal(body.memberId, memberId);
      const record = { _id: '507f1f77bcf86cd799439014', academyId, ...body }; records.splice(0, records.length, record);
      return json(route, { success: true, message: 'Attendance saved', record });
    }
    assert.equal(req.method(), 'PATCH'); assert.equal(body.expectedVersion, academy.version);
    if (body.disciplines) assert.deepEqual(body.disciplines, ['Karate', 'Judo']);
    Object.assign(academy, body, { version: academy.version + 1 });
    if (body.archived !== undefined) academy.archivedAt = body.archived ? new Date().toISOString() : null;
    return json(route, { success: true, message: body.archived === true ? 'Academy archived; records retained' : body.archived === false ? 'Academy restored' : 'Academy listing saved', academy });
  });
  await page.goto(`${base}/academies/${academyId}/manage`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Academy name', { exact: true }).fill('Updated permissioned academy');
  await page.getByRole('button', { name: 'Save listing changes', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Academy listing saved' }).waitFor();
  assert.equal(academy.name, 'Updated permissioned academy'); assert.deepEqual(academy.disciplines, ['Karate', 'Judo']);
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  await page.getByLabel('Member name', { exact: true }).fill('Permissioned fixture member'); await page.getByLabel('Member code', { exact: true }).fill('ath-1');
  await page.getByLabel('Contact email · optional', { exact: true }).fill('member@example.test');
  await page.getByLabel(/I have permission to store/).check(); await page.getByRole('button', { name: 'Save member record', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Member record saved' }).waitFor(); assert.equal(saves, 1);
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  await page.getByLabel('Member name', { exact: true }).fill('Keep duplicate draft'); await page.getByLabel('Member code', { exact: true }).fill('ath-1');
  await page.getByLabel(/I have permission to store/).check(); await page.getByRole('button', { name: 'Save member record', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'This member code already exists' }).waitFor(); assert.equal(await page.getByLabel('Member name', { exact: true }).inputValue(), 'Keep duplicate draft'); assert.equal(saves, 1);
  await page.getByRole('button', { name: 'Close new member form', exact: true }).click();
  await page.getByLabel('Active member on this page').selectOption(memberId); await page.getByRole('button', { name: 'Save attendance', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Attendance saved' }).waitFor(); await page.getByText('present', { exact: true }).waitFor();
  assert.equal(records.length, 1);
  await page.getByRole('combobox', { name: 'Attendance status', exact: true }).selectOption('excused'); await page.getByRole('button', { name: 'Save attendance', exact: true }).click();
  await page.getByText('excused', { exact: true }).waitFor(); assert.equal(records.length, 1); assert.equal(records[0].status, 'excused');
  await page.getByRole('button', { name: /Permissioned fixture member.*ATH-1/ }).click(); await page.getByRole('combobox', { name: 'Membership status', exact: true }).selectOption('inactive');
  await page.getByRole('button', { name: 'Save member changes', exact: true }).click();
  await page.getByRole('button', { name: /Permissioned fixture member.*inactive/ }).waitFor(); assert.equal(members[0].status, 'inactive');
  await page.getByRole('button', { name: 'Archive academy', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Academy archived' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Add member', exact: true }).isDisabled(), true); assert.equal(await page.getByRole('button', { name: 'Save attendance', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Restore academy', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Academy restored' }).waitFor();
  assert.equal(members.length, 1); assert.equal(records.length, 1);
  for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(100); const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert.ok(sizes.scroll <= sizes.width + 1, `Academy management overflow at ${width}`); }
  await page.reload(); await page.getByRole('button', { name: /Permissioned fixture member.*inactive/ }).waitFor();
  console.log('PASS academy listing/member/attendance persistence wiring, duplicate recovery, archive/restore and responsive widths'); await context.close();
}
async function deniedFlows() {
  const { context, page } = await session('athlete', 'light'); let requests = 0;
  await page.route('**/api/academies/**', route => { requests++; return json(route, { success: false, message: 'Forbidden' }, 403); });
  await page.goto(`${base}/academies/${academyId}/manage`, { waitUntil: 'domcontentloaded' }); await page.getByRole('alert').filter({ hasText: 'Approved academy owner access' }).waitFor();
  assert.equal(requests, 0); assert.equal(await page.getByRole('heading', { name: 'Member records', exact: true }).count(), 0); await context.close();
  const foreign = await session('academy_owner', 'light');
  await foreign.page.route('**/api/academies/**', route => json(route, { success: false, message: 'Academy not found' }, 404));
  await foreign.page.goto(`${base}/academies/${academyId}/manage`, { waitUntil: 'domcontentloaded' }); await foreign.page.getByRole('alert').filter({ hasText: 'Academy not found' }).waitFor();
  assert.equal(await foreign.page.getByRole('button', { name: 'Add member', exact: true }).count(), 0); await foreign.context.close();
  console.log('PASS academy role denial and unavailable-tenant recovery without private record display');
}
(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); try { await ownerFlow(); await deniedFlows(); assert.deepEqual(errors, []); } finally { await browser.close(); } })().catch(error => { console.error(error); process.exitCode = 1; });
