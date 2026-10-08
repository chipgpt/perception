const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
const targets={angle:new Set(),time:new Set(),rhythm:new Set(),proportion:new Set(),motion:new Set()};
for(let day=1;day<=100;day++){
 const key='sample-day-'+day;
 for(const type of Object.keys(targets)){
  const a=run(`makeDeck('${key}','${type}')`),b=run(`makeDeck('${key}','${type}')`);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.length,5);
  for(const q of a){targets[type].add(JSON.stringify(q.answer));assert.equal(run(`scoreFor(${JSON.stringify(type==='proportion'?{width:q.answer,height:1}:q.answer)},${JSON.stringify(q)})`),100);
   if(type==='angle')assert(Number.isInteger(q.answer)&&q.answer>=5&&q.answer<=175);
   if(type==='time')assert(Number.isInteger(q.answer)&&q.answer>=2&&q.answer<=15);
   if(type==='rhythm')assert(Number.isInteger(q.answer)&&q.answer>=60&&q.answer<=144);
   if(type==='proportion'){assert(q.answer>=.55&&q.answer<=2.4);assert(/^\d+ : \d+$/.test(q.label));const [w,h]=q.label.split(' : ').map(Number);assert.equal(q.answer,w/h);assert(w<=12&&h<=12);}
   if(type==='motion'){assert(q.answer.length>=73&&q.answer.length<=121);for(const p of q.answer)assert(p.x>=25&&p.x<=375&&p.y>=25&&p.y<=275);}
  }
 }
 const mix=run(`makeDeck('${key}','mix')`);assert.equal(new Set(mix.map(q=>q.type)).size,5);
 for(const q of mix){const game=q.type==='colour'?'memory':q.type;assert.equal(JSON.stringify(q),JSON.stringify(run(`makeDeck('${key}','${game}')[0]`)));}
}
assert.equal(run('integerBetween(()=>0,5,175)'),5);assert.equal(run('integerBetween(()=>.999999,5,175)'),175);
const before=run("makeDeck('2026-10-7','mix')");run("timelineFacts.push(['Test event',2000,'Test',['Test','https://example.com']])");const after=run("makeDeck('2026-10-7','mix')");assert.equal(JSON.stringify(before.map(q=>q.type)),JSON.stringify(after.map(q=>q.type)));
for(let i=0;i<before.length;i++)if(before[i].type!=='timeline')assert.equal(JSON.stringify(before[i]),JSON.stringify(after[i]));
assert(targets.angle.size>150);assert.equal(targets.time.size,14);assert(targets.rhythm.size>=80);assert(targets.proportion.size>30);assert.equal(targets.motion.size,500);
console.log('Verified 2,500 generated targets: repeatability, bounds, exact scoring, variety, matching individual/mixed rounds, and bank isolation.');
console.log(Object.fromEntries(Object.entries(targets).map(([type,values])=>[type,values.size])));
