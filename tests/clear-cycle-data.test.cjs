const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(relative) {
 const exported = {};
 const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
 vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exported, Date, Object, Set, require: () => load('utils/cycle.ts') });
 return exported;
}
const { clearDataRange, clearRangeSummary } = load('utils/clearCycleData.ts');
const before = { version: 1, days: { '2026-10-20': 'menstrual', '2026-11-01': 'menstrual', '2026-11-15': 'ovulation', '2026-11-20': 'menstrual' }, journal: { '2026-11-01': { mood: 'Calm' }, '2026-11-20': { notes: 'Future' } }, diary: { '2026-11-03': 'A page', '2026-11-20': 'A plan' }, reflections: { '2026-11-15': { action: 'Rest' } }, observations: { '2026-11-01': { kind: 'menstrual', flow: 'light' } } };
test('clearing current/range dates includes both endpoints and preserves past/future across every record type', () => {
 const after = clearDataRange(before, '2026-11-01', '2026-11-15');
 assert.equal(after.days['2026-10-20'], 'menstrual');
 assert.equal(after.days['2026-11-20'], 'menstrual');
 assert.equal(after.journal['2026-11-20'].notes, 'Future');
 assert.equal(after.diary['2026-11-20'], 'A plan');
 assert.equal(after.days['2026-11-01'], undefined);
 assert.equal(after.days['2026-11-15'], undefined);
 assert.equal(after.diary['2026-11-03'], undefined);
 assert.equal(after.reflections['2026-11-15'], undefined);
 assert.equal(after.observations['2026-11-01'], undefined);
 assert.equal(before.days['2026-11-01'], 'menstrual');
});
test('clear preview counts unique recorded dates and inclusive calendar days, including DST and leap day', () => {
 const summary = clearRangeSummary(before, '2026-11-01', '2026-11-15');
 assert.equal(summary.recordedDays, 3); assert.equal(summary.calendarDays, 15);
 assert.equal(clearRangeSummary(before, '2026-11-15', '2026-11-15').calendarDays, 1);
 assert.equal(clearRangeSummary(before, '2024-02-28', '2024-03-01').calendarDays, 3);
 assert.equal(clearRangeSummary(before, '2026-03-07', '2026-03-09').calendarDays, 3);
});
test('all-cycle scope clears future entries too; legacy unbounded resets remain supported', () => {
 const all = clearDataRange(before, null);
 assert.equal(Object.keys(all.days).length, 0); assert.equal(Object.keys(all.journal).length, 0);
 assert.equal(clearDataRange(before, '2026-11-01').days['2026-11-20'], undefined);
});
test('server reset range rejects malformed, impossible, inverted and distant future dates', async () => {
 const { parseResetRange } = await import('../server/api/reset-range.mjs');
 const today = '2026-11-15';
 for(const input of [null, {}, {scope:'from',from:'2026-02-30'}, {scope:'from',from:'2026-11-15',through:'2026-11-14'}, {scope:'from',from:'2026-11-01',through:'2026-12-01'}]) assert.equal(parseResetRange(input, today),null);
 assert.deepEqual(parseResetRange({scope:'from',from:'2026-11-01'}, today), {scope:'from',from:'2026-11-01',through:today});
 assert.equal(parseResetRange({scope:'all'},today).from,null);
});
test('sync applies a bounded reset from another device without removing future or earlier data', async () => {
 const source=fs.readFileSync(path.join(__dirname,'../src/services/cycleSync.ts'),'utf8');
 const exports={};const storage=new Map();
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
  exports,Object,Set,JSON,fetch:async()=>({status:200,json:async()=>({generation:1,revision:1,resetFrom:'2026-11-01',resetTo:'2026-11-15',entries:[],nextCursor:null})}),
  require:name=>name.includes('async-storage')?{__esModule:true,default:{getItem:async key=>storage.get(key),setItem:async(key,value)=>storage.set(key,value)}}:name.includes('clearCycleData')?{clearDataRange}:load('utils/cycle.ts'),
 });
 let persisted;
 const result=await exports.syncAccount('https://test.invalid','test-token','test-sub',before,async next=>{persisted=next;});
 assert.equal(result.data.days['2026-10-20'],'menstrual');assert.equal(result.data.days['2026-11-20'],'menstrual');
 assert.equal(result.data.days['2026-11-01'],undefined);assert.equal(persisted.diary['2026-11-20'],'A plan');
 assert.equal(result.state.generation,1);
});
