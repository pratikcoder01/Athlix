// Controlled transport fixture only. This never authenticates with a live provider.
const assert = require('node:assert/strict');

async function installSession(context, user, token = 'fixture-api-token') {
  let signedIn = !!user;
  await context.route('**/api/notifications?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, notifications: [], unreadCount: 0, page: 1, hasMore: false }) }));
  await context.route('**/api/auth/session', async route => {
    assert.equal(route.request().method(), 'POST');
    assert.equal(route.request().headers()['x-athlix-session'], '1');
    await route.fulfill({ status: signedIn ? 200 : 401, contentType: 'application/json', body: JSON.stringify(signedIn ? { success: true, user, token } : { success: false, message: 'No fixture session' }) });
  });
  await context.route('**/api/auth/logout', async route => {
    assert.equal(route.request().method(), 'POST'); signedIn = false;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Fixture session ended' }) });
  });
  return { signOut() { signedIn = false; } };
}
module.exports = { installSession };
