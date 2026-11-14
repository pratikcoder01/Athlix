// Browser fixtures verify UI/request wiring only; MongoDB isolation has a
// separate real-replica-set suite in server/test/booking.integration.test.cjs.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const base = process.env.ATHLIX_E2E_BASE_URL || 'http://127.0.0.1:3100';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('Use an isolated loopback app');
const athleteId = '507f1f77bcf86cd799439011';
const coachId = '507f1f77bcf86cd799439012';
const bookingId = '507f1f77bcf86cd799439013';
const output = path.resolve(__dirname, '../../../.task-tools/screenshots');
const coach = { id: coachId, name: 'Fixture Karate Coach', discipline: 'Karate', beltRank: 'Black', bio: 'Controlled UI fixture',
  experienceYears: 5, certifications: [], pricingPerHour: 80, currency: 'INR', availabilityTimezone: 'UTC',
  availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00' }], autoConfirm: false };
// Keep the positive fixture within the published Monday availability.
const nextMonday = new Date(Date.now() + 7 * 86400000);
while (nextMonday.getUTCDay() !== 1) nextMonday.setUTCDate(nextMonday.getUTCDate() + 1);
const date = nextMonday.toISOString().slice(0, 10);
const localStart = `${date}T15:00`;
const utcStart = `${date}T09:30:00.000Z`;
let browser;

async function pageFor(role, colorScheme = 'light') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US', timezoneId: 'Asia/Kolkata', reducedMotion: 'reduce', colorScheme });
  await context.addInitScript(({ role, id }) => localStorage.setItem('athlix-auth', JSON.stringify({ state: {
    user: { id, name: 'Fixture User', email: 'fixture@example.test', role }, token: 'booking-fixture-token', isAuthenticated: true,
  }, version: 0 })), { role, id: role === 'coach' ? coachId : athleteId });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.routeWebSocket('**/socket.io/**', socket => socket.close());
  await page.route('**/socket.io/**', route => route.abort());
  return { context, page };
}

async function bookingFlow(mode = 'success') {
  const { context, page } = await pageFor('athlete', mode === 'success' ? 'dark' : 'light');
  const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
  const writes = []; let saved = null;
  await page.route('**/api/bookings**', async route => {
    const req = route.request(); const url = new URL(req.url());
    assert.equal(req.headers().authorization, 'Bearer booking-fixture-token');
    let status = 200; let payload;
    if (url.pathname.endsWith('/coaches')) payload = { success: true, coaches: [coach], page: 1, hasMore: false };
    else if (req.method() === 'POST') {
      const details = req.postDataJSON(); writes.push(details);
      if (mode === 'network') { await route.abort(); return; }
      if (mode === 'conflict') { status = 409; payload = { success: false, message: 'This session time is already reserved.' }; }
      else {
        saved = { _id: bookingId, athleteId: { _id: athleteId, name: 'Fixture Athlete' }, coachId: { _id: coachId, name: coach.name },
          scheduledTime: details.scheduledTime, durationMinutes: details.durationMinutes, price: 120, currency: 'INR', status: 'pending' };
        payload = { success: true, booking: saved, message: 'Session requested; awaiting coach acceptance' }; status = 201;
      }
    } else if (req.method() === 'PATCH') {
      assert.deepEqual(req.postDataJSON(), { status: 'cancelled' }); saved.status = 'cancelled';
      payload = { success: true, booking: saved, message: 'Session cancelled' };
    } else payload = { success: true, bookings: saved ? [saved] : [], page: 1, hasMore: false };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
  });

  await page.goto(`${base}/coaches`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: coach.name, exact: true }).waitFor();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `Coach discovery overflows at ${width}`);
  }
  await page.setViewportSize({ width: 360, height: 900 });
  if (mode === 'success') await page.screenshot({ path: path.join(output, 'coaches-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Request a session', exact: true }).click();
  await page.locator('#session-coach').waitFor();
  assert.equal(await page.locator('#session-coach').inputValue(), coachId);
  await page.locator('#session-start').fill(localStart);
  await page.locator('#session-duration').selectOption('90');
  await page.getByText(`UTC equivalent: ${date} 09:30:00 UTC`, { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Booking form overflows at 360px');
  await page.getByRole('button', { name: 'Send session request', exact: true }).click();
  if (mode === 'success') {
    await page.getByRole('status').filter({ hasText: 'Session requested; awaiting coach acceptance' }).waitFor();
    await page.getByRole('button', { name: 'Cancel session', exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 0);
    await page.screenshot({ path: path.join(output, 'booking-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Cancel session', exact: true }).click();
    await page.getByText('cancelled', { exact: true }).waitFor();
    assert.equal(saved.status, 'cancelled');
  } else {
    const message = mode === 'conflict' ? 'This session time is already reserved.' : 'Unable to reach ATHLIX. Refresh your sessions before retrying a booking.';
    await page.getByRole('alert').filter({ hasText: message }).waitFor();
    assert.equal(await page.getByRole('status').filter({ hasText: 'Session requested' }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Cancel session', exact: true }).count(), 0);
  }
  assert.deepEqual(writes, [{ coachId, scheduledTime: utcStart, durationMinutes: 90, quotedPrice: 120, quotedCurrency: 'INR' }]);
  assert.deepEqual(pageErrors, []);
  console.log(`PASS booking ${mode}: selected coach/time/quote preserved; response drives displayed state`);
  await context.close();
}

async function coachFlow() {
  const { context, page } = await pageFor('coach');
  const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
  let settings = { pricingPerHour: 0, availability: [], active: false, autoConfirm: false, experienceYears: 0, certifications: [] };
  let saved = { _id: bookingId, athleteId: { _id: athleteId, name: 'Fixture Athlete' }, coachId: { _id: coachId, name: coach.name },
    scheduledTime: utcStart, durationMinutes: 90, price: 120, currency: 'INR', status: 'pending' };
  let settingsWrites = 0; let acceptanceWrites = 0;
  await page.route('**/api/profiles/**', async route => {
    const req = route.request(); assert.equal(req.headers().authorization, 'Bearer booking-fixture-token');
    if (req.method() === 'PUT') { settings = req.postDataJSON(); settingsWrites++; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, coachProfile: settings, message: 'Settings saved' }) });
  });
  await page.route('**/api/bookings**', async route => {
    if (route.request().method() === 'PATCH') { assert.deepEqual(route.request().postDataJSON(), { status: 'accepted' }); saved.status = 'accepted'; acceptanceWrites++; }
    const payload = route.request().method() === 'PATCH' ? { success: true, booking: saved, message: 'Session accepted' } : { success: true, bookings: [saved], page: 1, hasMore: false };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.goto(`${base}/coach-settings`, { waitUntil: 'domcontentloaded' });
  await page.locator('#coach-rate').waitFor();
  await page.locator('#coach-rate').fill('150');
  await page.locator('#coach-currency').selectOption('USD');
  await page.locator('#coach-experience').fill('5');
  await page.locator('#coach-certifications').fill('Controlled test credential');
  await page.getByRole('button', { name: 'Add weekly window', exact: true }).click();
  await page.getByRole('checkbox', { name: /I have reviewed these hours in UTC/ }).check();
  await page.getByRole('checkbox', { name: /Publish my profile/ }).check();
  await page.getByRole('button', { name: 'Save coaching settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Coaching profile published' }).waitFor();
  assert.equal(settingsWrites, 1);
  assert.deepEqual(settings, { pricingPerHour: 150, currency: 'USD', experienceYears: 5, certifications: ['Controlled test credential'],
    availability: [{ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }], active: true, autoConfirm: false, availabilityTimezone: 'UTC' });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `Coach settings overflows at ${width}`);
  }
  await page.setViewportSize({ width: 360, height: 900 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.screenshot({ path: path.join(output, 'coach-settings-mobile.png'), fullPage: true });
  await page.goto(`${base}/bookings`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Accept', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await page.getByText('accepted', { exact: true }).waitFor();
  assert.equal(acceptanceWrites, 1);
  assert.equal(await page.getByRole('button', { name: 'Mark completed', exact: true }).count(), 0);
  assert.deepEqual(pageErrors, []);
  console.log('PASS coach UTC publishing, persisted rate/currency request and pending-session acceptance');
  await context.close();
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  try { await bookingFlow(); await bookingFlow('conflict'); await bookingFlow('network'); await coachFlow(); }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
