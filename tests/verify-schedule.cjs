const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);
const run=s=>vm.runInContext(s,ctx),schedule=JSON.parse(fs.readFileSync('data/daily-trivia.json')).days,used=new Set();
for(const [day,entry] of Object.entries(schedule)){
 const key=day.split('-').map(Number).join('-'),deck=run(`makeDeck('${key}','mix')`);
 assert.equal(deck.length,5);assert.equal(new Set(deck.map(q=>q.type)).size,5);
 assert.deepEqual(deck.map(q=>q.type==='colour'?'memory':q.type),entry.types);
 for(const q of deck.filter(q=>['timeline','duration'].includes(q.type))){assert.equal(q.id,entry.trivia[q.type]);assert(!used.has(q.id));used.add(q.id);assert.equal(run(`scoreFor(${q.answer},${JSON.stringify(q)})`),100);}

}
// Test seed parity separately from immutable published days: approved additions may
// replenish a bank after an older day was scheduled with that bank exhausted.
const {execFileSync}=require('child_process');
const vectors=JSON.parse(execFileSync('python3',['-c',"import sys,json;sys.path.insert(0,'scripts');from trivia import shuffle,TYPES;print(json.dumps([shuffle(types,key) for types,key in [(TYPES,'2026-10-7|schedule-v1'),(TYPES[:-1],'2027-1-1|schedule-v1'),(TYPES[:-2],'2030-2-28|schedule-v1')]]))"],{encoding:'utf8'}));
for(const [i,types,key] of [[0,run('GAME_TYPES'),'2026-10-7|schedule-v1'],[1,run('GAME_TYPES.slice(0,-1)'),'2027-1-1|schedule-v1'],[2,run('GAME_TYPES.slice(0,-2)'),'2030-2-28|schedule-v1']])assert.deepEqual(Array.from(run(`shuffleWith(rng(hashSeed(${JSON.stringify(key)})),${JSON.stringify(types)})`)),vectors[i]);
const far=run("makeDeck('2030-1-1','mix')");assert(far.every(q=>!['timeline','duration'].includes(q.type)));
run("calendarDay=()=> '2030-1-1'");assert.equal(run("makeDeck('practice:1','timeline').length"),5);
console.log(`Verified ${Object.keys(schedule).length} published days: JS/Python deterministic parity, no repeated trivia, perfect scores, and safe procedural fallback.`);
