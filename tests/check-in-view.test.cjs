const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const path = require('node:path');
const cycleSource = fs.readFileSync(path.join(__dirname, '../utils/cycle.ts'), 'utf8');
const cycle = {};
vm.runInNewContext(ts.transpileModule(cycleSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:cycle, Date});
function render(day) {
 const exports = {};
 const styles = new Proxy({}, {get:()=>({})});
 const text = ({children}) => React.createElement('span',null,children);
 const view = ({children}) => React.createElement('div',null,children);
 const button = ({children,accessibilityLabel,disabled}) => React.createElement('button',{'aria-label':accessibilityLabel,disabled},children);
 const source = fs.readFileSync(path.join(__dirname,'../components/DayEditor.tsx'),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{
  exports,Date,require:name=>{
   if(name==='react'||name==='react/jsx-runtime')return require(name);
   if(name==='react-native')return {View:view,ScrollView:view,Pressable:button,TextInput:({value,accessibilityLabel})=>React.createElement('textarea',{'aria-label':accessibilityLabel,defaultValue:value})};
   if(name==='expo-symbols')return {SymbolView:()=>null};
   if(name.endsWith('/Themed'))return {Text:text};
   if(name.endsWith('/cycle'))return cycle;
   if(name.endsWith('/faith'))return {holidayFor:()=>null};
   if(name.endsWith('/checkIn'))return {moodOptions:['Calm','Happy','Tired','Emotional','Anxious'],symptomOptions:['Cramps','Headache','Bloating','Fatigue'],hasSymptom:()=>false};
   if(name==='./ThemeProvider')return {useAppTheme:()=>({styles,theme:{colors:{},fonts:{},forms:{flowerSize:52},spacing:{},layout:{touchTarget:44}}})};
   if(name==='./CycleDataProvider')return {useCycleData:()=>({ready:true,data:{days:{'2000-01-01':'menstrual'},journal:{'2000-01-01':{mood:'Happy',symptoms:'Cramps',notes:'Saved past notes'}}}})};
   if(name==='./EditSheet')return {EditSheet:({title,eyebrow,children,footer})=>React.createElement('section',null,title,eyebrow,children,footer)};
   if(name==='./ActionButton')return {ActionButton:button};
   if(name==='./EntryControls')return {FormSectionHeading:({title})=>text({children:title}),Encouragement:()=>text({children:'A little encouragement'}),FlowerMood:()=>null};
   if(name==='./CycleOptions')return {CycleOptions:()=>null};
   throw Error(name);
  }
 });
 return renderToStaticMarkup(React.createElement(exports.DayEditor,{day,onClose:()=>{}}));
}
test('past day opens read-only with saved values and an Edit action',()=>{
 const html=render('2000-01-01');
 assert.match(html,/Past day · viewing/);assert.match(html,/Saved past notes/);assert.match(html,/Edit/);
 assert.doesNotMatch(html,/<textarea|Save check-in|Save changes/);
});
test('today opens directly in the shared check-in form with encouragement and Save check-in',()=>{
 const html=render(cycle.dateKey(new Date()));
 for(const text of ['A little encouragement','Menstrual','Ovulation','Neither','Symptoms','Cramps','Mood','Calm','Happy','Tired','Emotional','Anxious','A little space for your thoughts','Save check-in'])assert.ok(html.includes(text),text);
 assert.match(html,/<textarea/);
});
