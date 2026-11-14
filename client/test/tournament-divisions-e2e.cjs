const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { installSession } = require('./helpers/auth-fixture.cjs');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw Error('Use an isolated loopback app');
const owner = '507f1f77bcf86cd799439011', athletes = ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439014'];
const event = { _id: '507f1f77bcf86cd799439013', __v: 0, title: 'Division fixture open', description: 'Controlled UI transport fixture', date: new Date(Date.now() + 172800000).toISOString(), registrationDeadline: new Date(Date.now() + 86400000).toISOString(), location: 'Fixture academy', entryFee: 0, disciplines: ['Karate'], status: 'upcoming', organizerId: { _id: owner, name: 'Fixture organizer' }, registrations: [], divisions: [], brackets: { seeds: [], rounds: [] } };
let browser, rejectGeneration = true;
const errors = [];
async function session(role, id) {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  await installSession(context, { id, name: 'Division fixture member', email: 'division@example.test', role });
  const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket('**/socket.io/**', socket => socket.close()); await page.route('**/socket.io/**', route => route.abort());
  await page.route('**/api/tournaments**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    assert.equal(req.headers().authorization, 'Bearer fixture-api-token');
    const payload = req.postDataJSON();
    const key = path.match(/\/divisions\/([^/]+)/)?.[1];
    const division = key ? event.divisions.find(item => item.key === key) : event.divisions[0];
    const respond = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() !== 'GET') {
      assert.equal(payload.version, event.__v);
      if (path.endsWith('/divisions')) event.divisions.push({ ...payload, registrations: [], status: 'upcoming', brackets: { seeds: [], rounds: [] } });
      else if (path.endsWith('/register')) { assert.equal(role, 'athlete'); event.registrations.push({ _id: id, name: `Athlete ${athletes.indexOf(id) + 1}` }); division.registrations.push(id); }
      else if (path.endsWith('/withdraw')) { event.registrations = event.registrations.filter(value => value._id !== id); event.divisions.forEach(item => { item.registrations = item.registrations.filter(value => value !== id); }); }
      else if (path.endsWith('/cancel')) {
        assert.equal(role, 'tournament_organizer'); assert.equal(event.status, 'upcoming'); assert.equal(division.brackets.rounds.length, 0);
        assert.ok(payload.reason.trim().length >= 5); const removed = new Set(division.registrations);
        event.registrations = event.registrations.filter(value => !removed.has(value._id));
        event.divisions = event.divisions.filter(item => item.key !== key);
        event.divisionCancellations = [...(event.divisionCancellations || []), { key, title: division.title, reason: payload.reason, cancelledAt: new Date().toISOString(), cancelledBy: owner }];
      }
      else if (path.endsWith('/generate')) {
        if (rejectGeneration) { rejectGeneration = false; return respond({ success: false, message: 'Fixture concurrent registration. Reload before generating.' }, 409); }
        division.brackets = { seeds: division.registrations.map((fighterId, index) => ({ fighterId, seed: index + 1, rationale: 'Registration order' })), rounds: [{ round: 'Final', matches: [{ p1: division.registrations[0], p2: division.registrations[1], score: 'Pending', winner: '' }] }] };
      } else if (path.includes('/divisions/')) { if (payload.status) division.status = payload.status; if (payload.brackets) division.brackets = payload.brackets; }
      else if (payload.status) event.status = payload.status;
      event.__v++;
    }
    return respond(path === '/api/tournaments' ? { success: true, tournaments: [event] } : { success: true, tournament: event, message: 'Division fixture saved' });
  });
  const response = await page.goto(base + '/tournaments', { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
  await page.getByRole('button').filter({ hasText: event.title }).click();
  return { context, page };
}
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  const organizer = await session('tournament_organizer', owner), page = organizer.page;
  await page.getByLabel('Division title', { exact: true }).fill('Adult open'); await page.getByLabel('Division key', { exact: true }).fill('adult-open');
  await page.getByLabel('Eligibility rules').fill('Organizer checks age and belt before participation.'); await page.getByRole('button', { name: 'Add division', exact: true }).click();
  await page.getByLabel('Division', { exact: true }).waitFor(); assert.equal(event.divisions.length, 1);
  await page.getByLabel('Division title', { exact: true }).fill('Unused division'); await page.getByLabel('Division key', { exact: true }).fill('unused');
  await page.getByLabel('Eligibility rules').fill('An unpublished division that can be cancelled if underfilled.'); await page.getByRole('button', { name: 'Add division', exact: true }).click();
  await page.getByLabel('Division', { exact: true }).selectOption('unused'); assert.equal(event.divisions.length, 2);
  await page.getByLabel('Division', { exact: true }).selectOption('adult-open');
  for (const id of athletes) {
    const athlete = await session('athlete', id);
    await athlete.page.getByRole('button', { name: 'Register for division', exact: true }).click(); await athlete.page.getByRole('button', { name: 'You are registered', exact: true }).waitFor();
    if (id === athletes[0]) {
      await athlete.page.getByRole('button', { name: 'Withdraw registration' }).click(); await athlete.page.getByRole('button', { name: 'Register for division', exact: true }).waitFor();
      assert.equal(event.registrations.length, 0);
      await athlete.page.getByRole('button', { name: 'Register for division', exact: true }).click(); await athlete.page.getByRole('button', { name: 'You are registered', exact: true }).waitFor();
    }
    await athlete.context.close();
  }
  await page.getByRole('button').filter({ hasText: event.title }).click(); await page.getByRole('button', { name: 'Generate division bracket', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Fixture concurrent registration' }).waitFor(); assert.equal(event.divisions[0].brackets.rounds.length, 0);
  await page.getByRole('button', { name: 'Reload data', exact: true }).click(); await page.getByRole('button', { name: 'Generate division bracket', exact: true }).click();
  // Publishing the main bracket locks enrollment, while an underfilled,
  // unpublished division can still be cancelled before the event starts.
  await page.getByRole('button', { name: 'Generate division bracket', exact: true }).waitFor({ state: 'hidden' });
  const published = JSON.stringify(event.divisions[0].brackets);
  await page.getByLabel('Division', { exact: true }).selectOption('unused');
  await page.getByLabel('Public division cancellation reason').fill('Too few entrants; contact the organizer for alternatives.');
  await page.getByRole('button', { name: 'Cancel selected division and withdraw entrants', exact: true }).click();
  await page.getByRole('heading', { name: 'Cancelled divisions', exact: true }).waitFor();
  assert.equal(event.divisions.length, 1); assert.equal(event.divisionCancellations[0].key, 'unused');
  assert.equal(JSON.stringify(event.divisions[0].brackets), published); assert.equal(event.registrations.length, 2);
  await page.getByLabel('Division', { exact: true }).selectOption('adult-open');
  await page.getByRole('button', { name: 'Start tournament', exact: true }).click(); await page.getByRole('button', { name: 'Start division', exact: true }).click();
  await page.getByRole('button', { name: 'Record Athlete 1 as winner', exact: true }).click(); await page.getByRole('button', { name: 'Complete division', exact: true }).click();
  await page.getByRole('button', { name: 'Complete tournament', exact: true }).click(); await page.getByRole('status').waitFor(); assert.equal(event.status, 'completed'); assert.equal(event.divisions[0].status, 'completed');
  for (const width of [360, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Division details overflow at ${width}`); }
  assert.deepEqual(errors, []); console.log('PASS division setup, registrations/withdrawal, conflict recovery, safe cancellation and full result lifecycle');
  await organizer.context.close();
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
