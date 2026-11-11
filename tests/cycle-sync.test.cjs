const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/services/cycleSync.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject, Object, Array, JSON, Set,
  require: name => name.includes('async-storage') ? { default: {} } : { emptyCycleData: () => ({ version: 1, days: {}, journal: {} }) },
});
const { changedDates, entryForDay, applyRemote } = exportsObject;
test('only modified dates enter the offline mutation queue', () => {
  const before = { version: 1, days: { '2026-11-01': 'menstrual' }, journal: {} };
  const after = { ...before, days: { ...before.days, '2026-11-03': 'ovulation' } };
  assert.deepEqual(Array.from(changedDates(before, after)), ['2026-11-03']);
});
test('cloud tombstone removes the full daily entry without altering other days', () => {
  const before = { version: 1, days: { '2026-11-01': 'menstrual', '2026-11-03': 'ovulation' }, journal: { '2026-11-01': { mood: 'calm', symptoms: '', notes: '' } } };
  const after = applyRemote(before, { date: '2026-11-01', deleted: true });
  assert.equal(after.days['2026-11-01'], undefined);
  assert.equal(after.journal['2026-11-01'], undefined);
  assert.equal(after.days['2026-11-03'], 'ovulation');
  assert.equal(before.days['2026-11-01'], 'menstrual');
});
test('empty daily record becomes a deletion mutation', () => {
  const entry = entryForDay({ version: 1, days: {}, journal: {} }, '2026-11-02');
  assert.equal(entry.deleted, true);
});
