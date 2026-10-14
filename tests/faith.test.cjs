const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(file) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports, Date, Error, JSON, Object, Array, String, Number, Math, Set,
    require: name => name === './cycle' ? load('utils/cycle.ts') : require(path.join(__dirname, '../', name.replace('@/', ''))),
  });
  return exports;
}
const { dailyVerse, christianDays, topicCards, guidanceTopics, parseGuidanceResponse, verses } = load('utils/faith.ts');
test('all prepared topics contain five distinct real catalog verses', () => {
  for (const topic of guidanceTopics) {
    const cards = topicCards(topic.id);
    assert.equal(cards.length, 5);
    assert.equal(new Set(cards.map(card => card.verse.id)).size, 5);
    assert.ok(cards.every(card => card.verse.text && card.verse.reference && card.explanation && card.goal));
  }
});
test('daily verse is deterministic and preview holidays use their own Scripture', () => {
  assert.equal(dailyVerse('2026-10-14').id, dailyVerse('2026-10-14').id);
  assert.equal(dailyVerse('2026-12-25').reference, 'Luke 2:11');
  assert.match(christianDays(2027)['2027-04-05'].name, /Preview/);
  assert.equal(dailyVerse('2027-04-05').reference, 'John 11:25');
});
test('AI response validation rejects fabricated, duplicate and prototype verse IDs', () => {
  const cards = Object.keys(verses).slice(0, 5).map(verseId => ({ verseId, explanation: 'A reflection', goal: 'One step' }));
  assert.equal(parseGuidanceResponse({ cards }).length, 5);
  assert.throws(() => parseGuidanceResponse({ cards: cards.slice(1) }));
  assert.throws(() => parseGuidanceResponse({ cards: cards.map(() => cards[0]) }));
  assert.throws(() => parseGuidanceResponse({ cards: [{ ...cards[0], verseId: '__proto__' }, ...cards.slice(1)] }));
});
test('daily goals and reflections round trip alongside older cycle records', () => {
  const cycle = load('utils/cycle.ts');
  const data = cycle.emptyCycleData();
  assert.ok(cycle.readCycleData(JSON.stringify(data)));
  data.reflections = { '2026-10-14': { pattern: 'Comparison', action: 'Pause and pray', completed: ['notice'] } };
  assert.equal(cycle.readCycleData(JSON.stringify(data)).reflections['2026-10-14'].action, 'Pause and pray');
  data.reflections['2026-10-14'].completed = [42];
  assert.throws(() => cycle.readCycleData(JSON.stringify(data)));
});
