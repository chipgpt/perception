const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{addEventListener(){},classList:{toggle(){}},dataset:{}});return elements.get(id)};
const ctx=vm.createContext({document:{getElementById:el,addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
const schedule=JSON.parse(fs.readFileSync('data/daily-trivia.json','utf8')).days;
for(const cutoff of ['2026-10-06','2026-10-07','2026-10-08','2026-10-20','2030-01-01']){
 run(`calendarDay=()=>${JSON.stringify(cutoff)}`);
 const past=new Set(Object.entries(schedule).filter(([day])=>day<cutoff).flatMap(([,entry])=>Object.values(entry.trivia)));
 for(const type of ['timeline','duration']){
  const allowed=run(`pastTriviaIds('${type}')`);assert(allowed.every(id=>past.has(id)));
  for(let seed=0;seed<100;seed++){
   const deck=run(`makeDeck('practice:${seed}','${type}')`);
   assert.equal(deck.length,Math.min(5,allowed.length));assert.equal(new Set(deck.map(q=>q.id)).size,deck.length);
   assert(deck.every(q=>allowed.includes(q.id)),'Only past daily trivia may enter standalone practice');
  }
 }
 for(let seed=0;seed<100;seed++){
  const deck=run(`makeDeck('practice:${seed}','mix')`);assert.equal(deck.length,5);assert.equal(new Set(deck.map(q=>q.type)).size,5);
  assert(deck.filter(q=>['timeline','duration'].includes(q.type)).every(q=>past.has(q.id)),'Mixed practice must also exclude today/future/unused trivia');
 }
 // Daily assignments remain identical regardless of the size of the practice archive.
 for(const day of ['2026-10-07','2026-10-08'])assert.deepEqual(run(`makeDeck('${day}','mix')`).filter(q=>['timeline','duration'].includes(q.type)).map(q=>q.id).sort(),Object.values(schedule[day].trivia).sort());
}
run("calendarDay=()=> '2026-10-07';mini='timeline';deck=[];index=0;render()");assert(el('playarea').innerHTML.includes('no past questions'));assert(el('playarea').innerHTML.includes('Play Daily Five'));assert.equal(el('roundlabel').textContent,'PRACTICE');
console.log('Verified 1,500 practice decks against past-day IDs, exclusion of current/future/unused facts, short unique sessions, empty archive UI, and unchanged daily assignments.');
