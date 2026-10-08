const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
for(const type of ['timeline','duration']){
 const a=run(`makeDeck(rng(42),'${type}')`),b=run(`makeDeck(rng(42),'${type}')`);
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.length,5);assert.equal(new Set(a.map(x=>x.title)).size,5);
 for(const q of a){assert(q.source[1].startsWith('https://'));assert.equal(run(`scoreFor(${q.answer},${JSON.stringify(q)})`),100);}
}
assert.equal(run('scoreFor(1900,{type:"timeline",answer:1960})'),0);
assert.equal(run('scoreFor(25,{type:"duration",answer:100})'),0);
assert.equal(run('scoreFor(102,{type:"duration",answer:100})'),97);
for(let seed=0;seed<200;seed++){const deck=run(`makeDeck(rng(${seed}),'mix')`);assert.equal(deck.length,5);assert.equal(new Set(deck.map(q=>q.type)).size,5);}
console.log('Verified exact and distant scores, repeatable trivia decks, no duplicate questions, and 200 mixed decks with five distinct types.');
// Audit the whole maintained bank, rather than just five sampled questions.
const bankCounts={};
for(const type of ['timeline','duration']){
 const facts=run(type==='timeline'?'timelineFacts':'durationFacts');bankCounts[type]=facts.length;
 assert(facts.length>=(type==='timeline'?60:30));
 assert.equal(new Set(facts.map(f=>f[0])).size,facts.length,'Duplicate trivia title');
 for(const f of facts){
  const source=f[type==='timeline'?3:4];assert.equal(source.length,2);assert(source[0]);assert(new URL(source[1]).protocol==='https:');
  assert(f[0].length<=55,'Keep the prompt short');
  if(type==='timeline'){assert(Number.isInteger(f[1])&&f[1]>=1850&&f[1]<=2026);}
  else{assert(f[1]>=1&&f[1]<=60*86400);assert(f[2]&&f[3]);assert(Math.abs(run(`durationValue(${f[1]})`)-f[1])<1e-6,'Answer must be selectable at displayed precision');}
  assert.equal(run(`scoreFor(${f[1]},{type:'${type}',answer:${f[1]}})`),100,f[0]);
 }
 const seen=new Set();for(let seed=0;seed<1000;seed++)for(const q of run(`makeDeck(rng(${seed}),'${type}')`))seen.add(q.title);
 assert.equal(seen.size,facts.length,'Every fact must be reachable');
}
console.log(`Audited all ${bankCounts.timeline} timeline and ${bankCounts.duration} duration facts: unique short prompts, valid sources, supported ranges, selectable perfect answers, and reachable questions.`);
