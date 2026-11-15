const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../utils/checkIn.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {exports:exported});
const { toggleSymptom, hasSymptom } = exported;
test('symptom tags toggle without discarding custom symptoms or adding case duplicates', () => {
 assert.equal(toggleSymptom('Nausea, cramps', 'Cramps'),'Nausea');
 assert.equal(toggleSymptom('Nausea', 'Bloating'),'Nausea, Bloating');
 assert.equal(toggleSymptom('', 'Fatigue'),'Fatigue');
 assert.equal(hasSymptom('Nausea, CRAMPS','Cramps'),true);
 assert.equal(hasSymptom('Muscle cramps','Cramps'),false);
});
