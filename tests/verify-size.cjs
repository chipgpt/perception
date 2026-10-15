const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx),plain=v=>JSON.parse(JSON.stringify(v));
const q=run('sizeQuestion(rng(42),0)'),score=v=>{ctx.testQ=q;ctx.value=v;return run('scoreFor(value,testQ)');};
const guess=(w,h)=>({width:q.answer.width*w,height:q.answer.height*h});
assert.equal(score(q.answer),100);assert.equal(score(guess(1.05,1.05)),81);
assert.equal(score(guess(2,2)),0,'same ratio at wrong size');
assert.equal(score(guess(1,1.5)),50,'one exact dimension');
assert.equal(score(guess(1.2,.8)),36,'opposing errors do not cancel');
assert.equal(score(guess(1.2,1.2)),score(guess(1.2,.8)));
assert.equal(score(guess(1.1,1)),score(guess(1,1.1)),'equal weight');
assert.equal(score(guess(0,1)),0);assert.equal(score({width:NaN,height:100}),0);
assert.deepEqual(plain(run('clampSize({width:-100,height:-100})')),{width:32,height:32});
assert.deepEqual(plain(run('clampSize({width:1e9,height:1e9})')),{width:304,height:207});
const pairs=new Set(),refs=new Set(),starts=new Set();
for(let seed=0;seed<1000;seed++){
 const a=run(`makeDeck('practice:${seed}','proportion')`),b=run(`makeDeck('practice:${seed}','proportion')`);assert.deepEqual(plain(a),plain(b));
 assert(run(`validSavedGame({deck:makeDeck('practice:${seed}','proportion'),results:[]})`));
 for(const q of a){assert.equal(q.measurementVersion,2);pairs.add(`${q.wide}/${q.tall}`);refs.add(q.reference);starts.add(JSON.stringify(q.start));
  assert.deepEqual(plain(run(`clampSize(${JSON.stringify(q.answer)})`)),plain(q.answer),'every answer reachable');
  assert.equal(q.start.width,q.reference);assert.equal(q.start.height,q.reference);assert(q.answer.width+48<400-24&&q.answer.height+90<400-24,'target clearance');
 }
}
assert.equal(pairs.size,19);assert(!pairs.has('1/1'));assert(refs.has(32)&&refs.has(54));assert(starts.size===refs.size);
for(const fixture of JSON.parse(fs.readFileSync('tests/fixtures/size-legacy.json'))){
 for(const game of ['proportion','mix'])assert.deepEqual(plain(run(`makeDeck('${fixture.day}','${game}')`)),fixture[game],'historical seed and challenge unchanged');
 ctx.oldDeck=fixture.proportion;assert(run('validSavedGame({deck:oldDeck,results:oldDeck.map(q=>({guess:{width:q.answer,height:1},score:100}))})'));
}
assert(run("makeDeck('2026-10-15','proportion').every(q=>q.measurementVersion===2)"));
assert(run("makeDeck('2026-10-14','proportion').every(q=>typeof q.answer==='number')"));
assert(run("validSavedGame({deck:makeDeck('2026-10-15','proportion'),results:makeDeck('2026-10-15','proportion').map(q=>({guess:q.answer,score:100}))})"));
assert(!run("validSavedGame({deck:makeDeck('2026-10-15','proportion').map(q=>({...q,measurementVersion:3})),results:[]})"));
assert(!run("validSavedGame({deck:makeDeck('2026-10-15','proportion').map(q=>({...q,answer:{width:999,height:999}})),results:[]})"));
assert(!run("validSavedGame({deck:makeDeck('2026-10-15','proportion'),results:[{guess:{width:999,height:32},score:0}]})"));
console.log('Verified 5,000 measurement rounds: deterministic, all 19 nontrivial dimension pairs, reference extremes, reachable targets, start bounds, equal scoring, opposing errors, versioned saves, and unchanged historical challenge decks.');

// Future plans retain the stable type ID but must use the measurement mechanic.
const scheduled=run("Object.entries(DAILY_TRIVIA_SCHEDULE).filter(([day,entry])=>dayNumber(day)>=dayNumber(SIZE_DAILY_START)&&entry.types.includes('proportion')).map(([day])=>day)");
assert(scheduled.length>0,'future measurement slots must be covered');
for(const day of scheduled){
 ctx.futureDay=day;
 const question=run("makeDeck(futureDay,'mix').find(q=>q.type==='proportion')");
 assert(question&&question.measurementVersion===2,day+' must use Size it up');
 assert.equal(question.skill,'Size it up');
 assert.equal(question.answer.width,question.reference*question.wide);
 assert.equal(question.answer.height,question.reference*question.tall);
 assert.deepEqual(plain(run("makeDeck(futureDay,'mix')")),plain(run("makeDeck(futureDay,'mix')")),'scheduled challenge must reproduce');
}
for(const day of ['2030-01-01','2035-06-15']){
 ctx.futureDay=day;assert(run("makeDeck(futureDay,'proportion').every(q=>q.measurementVersion===2&&q.skill==='Size it up')"));
 assert(run("makeDeck(futureDay,'mix').filter(q=>q.type==='proportion').every(q=>q.measurementVersion===2)"));
}
console.log(`Verified ${scheduled.length} scheduled measurement slots use Size it up, plus future standalone and fallback generation.`);
