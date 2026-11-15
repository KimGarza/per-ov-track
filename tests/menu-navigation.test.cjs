const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../utils/menuNavigation.ts'), 'utf8');
const exported = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported });
const { menuReducer: reduce, initialMenuState: initial } = exported;
test('all root sections keep menu open, switch directly, and toggle off on a second click', () => {
  for (const panel of ['account', 'themes', 'settings', 'subscription', 'support']) {
    const state = reduce(initial, { type: 'select', panel });
    assert.equal(state.open, true);
    assert.equal(state.pages[0], panel);
    assert.equal(reduce(state, { type: 'select', panel }).pages.length, 0);
    assert.equal(reduce(state, { type: 'select', panel: 'journal' }).pages[0], 'journal');
    assert.equal(reduce(state, { type: 'close-panel' }).open, true);
  }
});
test('account back navigation unwinds each nested page before closing the menu', () => {
  let state = reduce(initial, { type: 'select', panel: 'account' });
  state = reduce(state, { type: 'navigate', panel: 'account-options' });
  state = reduce(state, { type: 'navigate', panel: 'password' });
  state = reduce(state, { type: 'back' });
  assert.equal(state.pages.at(-1), 'account-options');
  state = reduce(state, { type: 'back' });
  assert.equal(state.pages.at(-1), 'account');
  state = reduce(state, { type: 'back' });
  assert.equal(state.open, true);
  assert.equal(state.pages.length, 0);
  assert.equal(reduce(state, { type: 'back' }).open, false);
});
test('switching from a nested account page clears its history; close clears everything', () => {
  let state = reduce(initial, { type: 'select', panel: 'account' });
  state = reduce(state, { type: 'navigate', panel: 'privacy' });
  state = reduce(state, { type: 'select', panel: 'support' });
  assert.equal(state.pages.length, 1);
  assert.equal(state.pages[0], 'support');
  const closed = reduce(state, { type: 'close' });
  assert.equal(closed.open, false);
  assert.equal(reduce(closed, { type: 'open' }).pages.length, 0);
});
