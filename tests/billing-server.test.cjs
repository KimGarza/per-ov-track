const assert = require('node:assert/strict');
const { test } = require('node:test');
const now = Date.parse('2026-11-15T12:00:00Z');
const response = (overrides = {}) => ({ subscriber: { entitlements: { premium: { product_identifier: 'monthly', expires_date: '2026-12-15T12:00:00Z' } }, subscriptions: { monthly: { is_sandbox: false, ...overrides } } } });
async function status(body, options = {}) {
  const { fetchBillingStatus } = await import('../server/api/billing.mjs');
  return fetchBillingStatus({ userId: 'cognito/user', apiKey: 'test-only', now, fetchImpl: async (url, request) => {
    assert.equal(url, 'https://api.revenuecat.com/v1/subscribers/cognito%2Fuser');
    assert.equal(request.headers.Authorization, 'Bearer test-only');
    return { ok: true, json: async () => body };
  }, ...options });
}
test('billing verifies active subscriptions and denies expired or refunded access', async () => {
  assert.equal((await status(response())).active, true);
  const expired = response(); expired.subscriber.entitlements.premium.expires_date = '2026-11-14T12:00:00Z';
  assert.equal((await status(expired)).active, false);
  assert.equal((await status(response({ refunded_at: '2026-11-15' }))).active, false);
});
test('billing handles grace periods, cancellation through paid expiry, and missing products', async () => {
  const grace = response({ grace_period_expires_date: '2026-11-16T12:00:00Z' });
  grace.subscriber.entitlements.premium.expires_date = '2026-11-14T12:00:00Z';
  assert.equal((await status(grace)).active, true);
  assert.equal((await status(response({ unsubscribe_detected_at: '2026-11-14' }))).active, true);
  assert.equal((await status({ subscriber: { entitlements: {}, subscriptions: {} } })).active, false);
  const missing = response(); missing.subscriber.subscriptions = {};
  assert.equal((await status(missing)).active, false);
});
test('sandbox subscriptions cannot unlock production; malformed responses and outages fail closed', async () => {
  assert.equal((await status(response({ is_sandbox: true }))).active, false);
  assert.equal((await status(response({ is_sandbox: true }), { allowSandbox: true })).active, true);
  await assert.rejects(status({}));
  await assert.rejects(status(response(), { fetchImpl: async () => ({ ok: false }) }));
});
