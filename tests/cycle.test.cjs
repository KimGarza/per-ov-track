const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../utils/cycle.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject, Date, Error, JSON, Object, Array, String, Number, Math });
const { dateKey, parseDate, rangeDates, selectRange, applyRange, cycleDay, readCycleData, emptyCycleData } = exportsObject;
const plain = value => JSON.parse(JSON.stringify(value));

test('local date keys round trip without UTC date shifts', () => {
  assert.equal(dateKey(new Date(2026, 9, 14, 23, 59)), '2026-10-14');
  assert.equal(dateKey(parseDate('2026-10-14')), '2026-10-14');
  assert.throws(() => parseDate('2026-02-30'));
  assert.throws(() => parseDate('2026-2-3'));
});
test('booking selection restarts on earlier dates and after completed ranges', () => {
  let range = selectRange({ start: null, end: null }, '2026-10-14');
  range = selectRange(range, '2026-10-12');
  assert.deepEqual(plain(range), { start: '2026-10-12', end: null });
  range = selectRange(range, '2026-10-18');
  assert.deepEqual(plain(range), { start: '2026-10-12', end: '2026-10-18' });
  assert.deepEqual(plain(selectRange(range, '2026-11-02')), { start: '2026-11-02', end: null });
});
test('ranges include both endpoints across months, years, leap days and DST', () => {
  assert.deepEqual(plain(rangeDates('2028-02-28', '2028-03-01')), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.deepEqual(plain(rangeDates('2026-12-31', '2027-01-02')), ['2026-12-31', '2027-01-01', '2027-01-02']);
  assert.deepEqual(plain(rangeDates('2026-03-07', '2026-03-10')), ['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);
  assert.equal(rangeDates('2026-11-01', '2026-11-03').length, 3);
  assert.equal(rangeDates('2026-10-14', '2026-10-14').length, 1);
  assert.throws(() => rangeDates('2026-10-15', '2026-10-14'));
  assert.throws(() => rangeDates('2026-01-01', '2028-01-01'));
});
test('saved ranges replace only selected dates; clearing preserves journal and other dates', () => {
  const initial = emptyCycleData();
  initial.journal['2026-10-14'] = { mood: 'Happy', symptoms: 'None', notes: 'A note' };
  const period = applyRange(initial, 'menstrual', '2026-09-29', '2026-10-03');
  const both = applyRange(period, 'ovulation', '2026-10-12', '2026-10-17');
  assert.equal(both.days['2026-09-30'], 'menstrual');
  assert.equal(both.days['2026-10-14'], 'ovulation');
  assert.equal(initial.days['2026-10-14'], undefined);
  const corrected = applyRange(both, 'menstrual', '2026-10-14', '2026-10-14');
  assert.equal(corrected.days['2026-10-14'], 'menstrual');
  assert.equal(corrected.days['2026-10-15'], 'ovulation');
  const cleared = applyRange(corrected, null, '2026-10-14', '2026-10-15');
  assert.equal(cleared.days['2026-10-14'], undefined);
  assert.equal(cleared.days['2026-10-16'], 'ovulation');
  assert.equal(cleared.journal['2026-10-14'].notes, 'A note');
});
test('cycle day uses the latest logged period start and ignores future periods', () => {
  let data = applyRange(emptyCycleData(), 'menstrual', '2026-09-29', '2026-10-03');
  data = applyRange(data, 'menstrual', '2026-10-27', '2026-10-30');
  assert.equal(cycleDay(data, '2026-10-14'), 16);
  assert.equal(cycleDay(data, '2026-10-29'), 3);
  assert.equal(cycleDay(emptyCycleData(), '2026-10-14'), null);
});
test('saved data restores check-ins and rejects invalid records', () => {
  const data = applyRange(emptyCycleData(), 'ovulation', '2026-10-14', '2026-10-14');
  data.journal['2026-10-14'] = { mood: 'Calm', symptoms: 'None', notes: 'Keep this' };
  assert.deepEqual(plain(readCycleData(JSON.stringify(data))), plain(data));
  assert.throws(() => readCycleData('{bad json'));
  assert.throws(() => readCycleData(JSON.stringify({ ...data, days: { '2026-02-30': 'menstrual' } })));
  assert.throws(() => readCycleData(JSON.stringify({ ...data, days: { '2026-10-14': 'invalid' } })));
  assert.throws(() => readCycleData(JSON.stringify({ ...data, journal: { '2026-10-14': { mood: 42 } } })));
});

test('future plans remain unconfirmed after their date until explicitly logged', () => {
  const { applyLoggedRange } = exportsObject;
  const planned = applyLoggedRange(emptyCycleData(), 'menstrual', '2026-10-15', '2026-10-17', '2026-10-14');
  assert.equal(planned.pendingDays['2026-10-15'], true);
  assert.equal(cycleDay(planned, '2026-10-16'), null);
  const confirmed = applyLoggedRange(planned, 'menstrual', '2026-10-15', '2026-10-15', '2026-10-16');
  assert.equal(confirmed.pendingDays['2026-10-15'], undefined);
  assert.equal(confirmed.pendingDays['2026-10-16'], true);
  assert.equal(cycleDay(confirmed, '2026-10-16'), 2);
  const cleared = applyLoggedRange(confirmed, null, '2026-10-16', '2026-10-17', '2026-10-16');
  assert.equal(cleared.pendingDays['2026-10-16'], undefined);
});
test('diary entries and pending dates round trip and reject malformed data', () => {
  const data = emptyCycleData();
  data.diary = { '2026-10-15': 'A little sunlight today.' };
  data.days['2026-10-16'] = 'ovulation'; data.pendingDays = { '2026-10-16': true };
  assert.equal(readCycleData(JSON.stringify(data)).diary['2026-10-15'], 'A little sunlight today.');
  assert.throws(() => readCycleData(JSON.stringify({ ...data, diary: { '2026-10-15': 42 } })));
  assert.throws(() => readCycleData(JSON.stringify({ ...data, pendingDays: { '2026-10-16': false } })));
  assert.equal(exportsObject.mixColor('rgb(240, 108, 115)', '#fff6f6'), 'rgb(247, 174, 178)');
});

test('journal page typography, ink and highlight round trip with validation', () => {
  const data = emptyCycleData();
  data.diary = { '2026-10-15': 'A page with color.' };
  data.diaryStyles = { '2026-10-15': { font: 'SpaceMono', ink: 'rose', highlight: 'sage' } };
  assert.deepEqual(plain(readCycleData(JSON.stringify(data)).diaryStyles), data.diaryStyles);
  data.diaryStyles['2026-10-15'].font = 'missing-font';
  assert.throws(() => readCycleData(JSON.stringify(data)));
});
