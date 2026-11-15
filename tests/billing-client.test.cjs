const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(platform = 'android', key = 'public-test-key') {
  let configured = false, identity;
  const calls = [];
  const sdk = {
    isConfigured: async () => configured,
    configure: options => { configured = true; identity = options.appUserID; calls.push(['configure', identity]); },
    getAppUserID: async () => identity,
    logIn: async id => { identity = id; calls.push(['login', id]); },
    logOut: async () => { identity = 'anonymous'; calls.push(['logout']); },
    isAnonymous: async () => identity === 'anonymous',
    invalidateCustomerInfoCache: async () => {},
    getCustomerInfo: async () => ({ identity }),
    getOfferings: async () => ({ current: { availablePackages: [{ identifier: 'monthly' }] } }),
    purchasePackage: async item => { calls.push(['purchase', identity]); return { customerInfo: { identity }, item }; },
    restorePurchases: async () => ({ identity }),
    showManageSubscriptions: async () => { calls.push(['manage', identity]); },
  };
  const exports = {};
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/billing.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, process: { env: { EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: key } },
    require: name => name === 'react-native' ? { Platform: { OS: platform } } : name === 'expo-constants' ? { default: { executionEnvironment: 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient' } } : { __esModule: true, default: sdk },
  });
  return { billing: exports, calls };
}
test('SDK configures once and serializes purchases, restore, switching accounts and logout', async () => {
  const { billing, calls } = fixture();
  await billing.loadBilling('user-a');
  await billing.buyPackage('user-a', { identifier: 'monthly' });
  const restored = await billing.restoreBilling('user-b');
  assert.equal(restored.identity, 'user-b');
  await billing.manageBilling('user-b');
  await billing.clearBillingIdentity();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['configure', 'user-a'], ['purchase', 'user-a'], ['login', 'user-b'], ['manage', 'user-b'], ['logout']]);
});
test('web and unconfigured builds never configure a native purchasing SDK', async () => {
  for (const { billing, calls } of [fixture('web'), fixture('android', '')]) {
    assert.ok(billing.billingUnavailableReason());
    await assert.rejects(billing.loadBilling('user-a'));
    assert.equal(calls.length, 0);
  }
});
test('simultaneous account operations stay ordered and reject unsigned-in purchases', async () => {
  const { billing, calls } = fixture();
  const [first, second] = await Promise.all([
    billing.buyPackage('user-a', { identifier: 'monthly' }),
    billing.buyPackage('user-b', { identifier: 'annual' }),
    billing.clearBillingIdentity(),
  ]);
  assert.equal(first.customerInfo.identity, 'user-a');
  assert.equal(second.customerInfo.identity, 'user-b');
  assert.equal(calls.at(-1)[0], 'logout');
  await assert.rejects(billing.buyPackage('', { identifier: 'monthly' }));
});
