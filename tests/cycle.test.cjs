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

test('optional observations survive reload, replace by range and clear with markings', () => {
  let data = applyRange(emptyCycleData(), 'menstrual', '2026-10-14', '2026-10-16', { kind: 'menstrual', flow: 'heavy' });
  assert.equal(readCycleData(JSON.stringify(data)).observations['2026-10-15'].flow, 'heavy');
  data = applyRange(data, 'menstrual', '2026-10-15', '2026-10-15');
  assert.equal(data.observations['2026-10-15'].flow, 'heavy');
  data = applyRange(data, 'ovulation', '2026-10-15', '2026-10-15', { kind: 'ovulation', mucus: 'watery' });
  assert.equal(data.observations['2026-10-15'].flow, undefined);
  assert.equal(readCycleData(JSON.stringify(data)).observations['2026-10-15'].mucus, 'watery');
  data = applyRange(data, 'menstrual', '2026-10-14', '2026-10-14', { kind: 'menstrual' });
  assert.equal(data.observations['2026-10-14'].flow, undefined);
  data = applyRange(data, null, '2026-10-15', '2026-10-15');
  assert.equal(data.observations['2026-10-15'], undefined);
  assert.equal(data.observations['2026-10-16'].flow, 'heavy');
  assert.throws(() => applyRange(data, 'menstrual', '2026-10-14', '2026-10-14', { kind: 'ovulation' }));
  data.observations['2026-10-16'].flow = 'invalid';
  assert.throws(() => readCycleData(JSON.stringify(data)));
});

test('phase estimates stay empty without confirmed periods, including future plans', () => {
  const { estimateCyclePhases, applyLoggedRange } = exportsObject;
  const month = new Date(2026, 9, 1);
  assert.deepEqual(plain(estimateCyclePhases(emptyCycleData(), month, '2026-10-15')), {});
  const planned = applyLoggedRange(emptyCycleData(), 'menstrual', '2026-10-20', '2026-10-24', '2026-10-15');
  assert.deepEqual(plain(estimateCyclePhases(planned, month, '2026-10-25')), {});
});

test('phase estimates respect logged markings, month boundaries and the next cycle', () => {
  const { estimateCyclePhases } = exportsObject;
  let data = applyRange(emptyCycleData(), 'menstrual', '2026-10-01', '2026-10-05');
  data = applyRange(data, 'ovulation', '2026-10-16', '2026-10-17');
  const phases = estimateCyclePhases(data, new Date(2026, 9, 1), '2026-10-20');
  assert.equal(phases['2026-10-01'], undefined);
  assert.equal(phases['2026-10-06'], 'follicular');
  assert.equal(phases['2026-10-15'], undefined); // Estimated ovulation day is not confirmed.
  assert.equal(phases['2026-10-16'], undefined); // Logged flowers take precedence.
  assert.equal(phases['2026-10-18'], 'luteal');
  assert.equal(phases['2026-10-28'], 'luteal');
  assert.equal(phases['2026-10-29'], undefined);
  assert.deepEqual(plain(estimateCyclePhases(data, new Date(2026, 10, 1), '2026-11-20')), {});
});

test('phase estimates learn cycle length from confirmed starts across leap-day months', () => {
  const { estimateCyclePhases } = exportsObject;
  let data = applyRange(emptyCycleData(), 'menstrual', '2028-01-28', '2028-02-01');
  data = applyRange(data, 'menstrual', '2028-02-27', '2028-03-02');
  const phases = estimateCyclePhases(data, new Date(2028, 2, 1), '2028-03-10');
  assert.equal(phases['2028-03-02'], undefined);
  assert.equal(phases['2028-03-03'], 'follicular');
  assert.equal(phases['2028-03-14'], undefined);
  assert.equal(phases['2028-03-15'], 'luteal');
  assert.equal(phases['2028-03-27'], 'luteal');
  assert.equal(phases['2028-03-28'], undefined);
  assert.ok(Object.keys(phases).every(key => key.startsWith('2028-03-')));
});

test('phase estimates leave long unexplained gaps blank and never alter saved dates', () => {
  const { estimateCyclePhases } = exportsObject;
  let data = applyRange(emptyCycleData(), 'menstrual', '2026-01-01', '2026-01-05');
  data = applyRange(data, 'menstrual', '2026-06-01', '2026-06-05');
  const original = JSON.stringify(data);
  assert.deepEqual(plain(estimateCyclePhases(data, new Date(2026, 2, 1), '2026-06-10')), {});
  assert.equal(JSON.stringify(data), original);
});
