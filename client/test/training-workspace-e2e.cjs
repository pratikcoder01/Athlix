// Explicit transport fixtures: verifies UI contracts without live identity/customer data.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const actorId = '507f1f77bcf86cd799439011', recordId = '507f1f77bcf86cd799439012';
const date = '2026-11-14T00:00:00.000Z'; const errors = [];
let browser;
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
async function session(role = 'athlete') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await installSession(context, { id: actorId, name: 'Workspace Fixture', email: 'fixture@example.test', role }, 'training-fixture-token');
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /hydration|server rendered|didn't match/i.test(message.text())) errors.push(message.text()); });
  await page.routeWebSocket('**/socket.io/**', socket => socket.close()); await page.route('**/socket.io/**', route => route.abort());
  return { context, page };
}
async function trainingFlow() {
  const { context, page } = await session(); let rows = [], writes = 0, failEdit = false; let requestId;
  await page.route('**/api/training/**', async route => {
    const req = route.request(); assert.equal(req.headers().authorization, 'Bearer training-fixture-token'); const url = new URL(req.url());
    if (url.pathname.includes('/plans')) return json(route, { success: true, plans: [{ _id: recordId, weekOverview: 'Saved fixture footwork plan', notes: 'Coach-reviewed fixture', days: [{ day: 'Monday', focus: 'Footwork', drills: ['Controlled drill'], duration: '30 minutes', intensity: 'low' }] }], page: 1, hasMore: false });
    if (req.method() === 'POST') {
      const body = req.postDataJSON(); assert.equal(body.athleteId, undefined); assert.match(body.clientRequestId, /^[a-f\d-]{36}$/i); requestId = body.clientRequestId;
      const fields = { ...body }; delete fields.clientRequestId; rows = [{ _id: recordId, ...fields, version: 0, createdAt: date }]; writes++;
      return json(route, { success: true, entry: rows[0], message: 'Training entry saved' }, 201);
    }
    if (req.method() === 'PATCH') {
      const fields = req.postDataJSON(); assert.equal(fields.athleteId, undefined);
      if (failEdit) return json(route, { success: false, message: 'Fixture stale training version' }, 409);
      assert.equal(fields.version, rows[0].version); rows[0] = { ...rows[0], ...fields, version: fields.version + 1 };
      return json(route, { success: true, entry: rows[0], message: 'Training entry updated' });
    }
    if (req.method() === 'DELETE') { assert.deepEqual(req.postDataJSON(), { version: rows[0].version }); rows = []; return json(route, { success: true, message: 'Training entry removed from your history' }); }
    return json(route, { success: true, entries: rows, page: 1, hasMore: false });
  });
  await page.goto(base + '/training', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Training date', { exact: true }).fill('2026-01-01'); await page.getByLabel('Training focus', { exact: true }).fill('Fixture completed training');
  await page.getByLabel('Duration in minutes').fill('45'); await page.getByLabel('Private training notes').fill('Saved private fixture journal');
  await page.getByRole('button', { name: 'Save training entry', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Training entry saved' }).waitFor();
  assert.equal(writes, 1); assert.ok(requestId); await page.reload(); await page.getByRole('heading', { name: 'Fixture completed training', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Edit entry', exact: true }).click(); await page.getByLabel('Training focus', { exact: true }).fill('Fixture updated practice');
  await page.getByRole('button', { name: 'Update training entry', exact: true }).click(); await page.getByRole('heading', { name: 'Fixture updated practice', exact: true }).waitFor();
  failEdit = true; await page.getByRole('button', { name: 'Edit entry', exact: true }).click(); await page.getByLabel('Training focus', { exact: true }).fill('Retain my failed training draft');
  await page.getByRole('button', { name: 'Update training entry', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Fixture stale training version' }).waitFor();
  assert.equal(await page.getByLabel('Training focus', { exact: true }).inputValue(), 'Retain my failed training draft');
  await page.getByRole('button', { name: 'Cancel editing', exact: true }).click(); await page.getByRole('button', { name: 'Archive entry', exact: true }).click(); await page.getByText('No training entries on this page. Log your first completed practice.').waitFor();
  await page.getByText('Saved fixture footwork plan', { exact: true }).click(); await page.getByText('Controlled drill', { exact: true }).waitFor();
  for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Training overflow at ${width}`); }
  await page.goto(base + '/clients'); await page.getByRole('heading', { name: 'Approved coach account required', exact: true }).waitFor();
  console.log('PASS training create/reload/edit/archive, stale-draft recovery, saved plans and responsive layouts'); await context.close();
}
async function coachFlow() {
  const { context, page } = await session('coach'); let notes = { text: '', version: 0 }, failSave = false;
  await page.route('**/api/coach-clients**', async route => {
    const req = route.request(); assert.equal(req.headers().authorization, 'Bearer training-fixture-token'); const url = new URL(req.url());
    if (url.pathname.endsWith('/notes')) {
      const body = req.postDataJSON(); assert.deepEqual(Object.keys(body).sort(), ['notes', 'version']);
      if (failSave) return json(route, { success: false, message: 'Fixture notes conflict' }, 409);
      assert.equal(body.version, notes.version); notes = { text: body.notes, version: body.version + 1 };
      return json(route, { success: true, message: 'Private coaching notes saved', notes });
    }
    if (url.pathname.endsWith(recordId)) return json(route, { success: true, client: { id: recordId, name: 'Assigned fixture athlete', discipline: 'Karate', beltRank: 'White' }, notes,
      sessions: [{ _id: recordId, scheduledTime: date, durationMinutes: 60, status: 'accepted' }], page: 1, hasMore: false });
    return json(route, { success: true, clients: [{ _id: recordId, name: 'Assigned fixture athlete', discipline: 'Karate', beltRank: 'White', sessions: 1, completedSessions: 0, lastScheduledTime: date }], page: 1, hasMore: false });
  });
  await page.goto(base + '/clients'); await page.getByRole('button', { name: 'Open client record', exact: true }).click();
  await page.getByLabel('Private coaching notes', { exact: true }).fill('Fixture technical focus'); await page.getByRole('button', { name: 'Save coaching notes', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Private coaching notes saved' }).waitFor(); assert.equal(notes.version, 1);
  await page.reload(); await page.getByRole('button', { name: 'Open client record', exact: true }).click(); assert.equal(await page.getByLabel('Private coaching notes', { exact: true }).inputValue(), notes.text);
  failSave = true; await page.getByLabel('Private coaching notes', { exact: true }).fill('Keep my unsaved coaching notes'); await page.getByRole('button', { name: 'Save coaching notes', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Fixture notes conflict' }).waitFor(); assert.equal(await page.getByLabel('Private coaching notes', { exact: true }).inputValue(), 'Keep my unsaved coaching notes');
  for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Client record overflow at ${width}`); }
  console.log('PASS coach client selection, persisted private notes and conflict draft retention'); await context.close();
}
async function notificationFlow() {
  const { context, page } = await session(); let read = false;
  await page.route('**/api/notifications**', async route => {
    const req = route.request(); const url = new URL(req.url());
    if (url.pathname.endsWith('/read-all')) { read = true; return json(route, { success: true, changed: 1 }); }
    if (req.method() === 'PATCH') read = req.postDataJSON().read;
    const notification = { _id: recordId, type: 'booking', message: 'Fixture session accepted', read, link: '/bookings', createdAt: date };
    if (req.method() === 'PATCH') return json(route, { success: true, notification });
    return json(route, { success: true, notifications: url.searchParams.get('unreadOnly') === 'true' && read ? [] : [notification], unreadCount: read ? 0 : 1, page: 1, hasMore: false });
  });
  await page.goto(base + '/notifications'); await page.getByText('1 unread in-app updates', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mark read', exact: true }).click(); await page.getByText('0 unread in-app updates', { exact: true }).waitFor();
  await page.reload(); await page.getByRole('button', { name: 'Mark unread', exact: true }).click(); await page.getByText('1 unread in-app updates', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mark all read', exact: true }).click(); await page.getByText('0 unread in-app updates', { exact: true }).waitFor();
  await page.getByLabel('Only unread', { exact: true }).check(); await page.getByText('No unread notifications on this page.').waitFor();
  console.log('PASS durable notification list/read/unread/all-read and reload state'); await context.close();
}
(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); try {
  await trainingFlow(); await coachFlow(); await notificationFlow(); assert.deepEqual(errors, []); console.log('PASS no training/client/notification page exceptions or hydration errors');
} finally { await browser.close(); } })().catch(error => { console.error(error); process.exitCode = 1; });
