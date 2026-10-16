const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
for(const [target,bound]of [[2,1.25],[2.5,1.25],[3,1.5],[5,2.5],[10,5],[15,7.5]]){ctx.q={type:'time',answer:target,timeScoringVersion:2};assert.equal(run('timeErrorBound(q)'),bound);for(const [fraction,expected]of [[0,100],[.1,90],[.5,50],[.8,20],[1,0],[2,0]])for(const sign of [-1,1]){ctx.elapsed=target+sign*fraction*bound;assert.equal(run('scoreFor(elapsed,q)'),expected);}}
ctx.q={type:'time',answer:2,timeScoringVersion:2};assert.equal(run('scoreFor(2.25,q)'),80,'floor is not a free-error window');assert.equal(run('scoreFor(Infinity,q)'),0);
assert.equal(run("scoreFor(11,{type:'time',answer:10})"),44,'historical score stays squared');assert.equal(run("scoreFor(11,{type:'time',answer:10,timeScoringVersion:2})"),80);
for(const day of ['2026-10-14','2026-10-15']){ctx.day=day;assert(run("makeDeck(day,'time').every(q=>q.timeScoringVersion===undefined)"));assert(run("makeDeck(day,'mix').filter(q=>q.type==='time').every(q=>q.timeScoringVersion===undefined)"));}
for(const day of ['2026-10-16','2027-1-1','practice:relative-time']){ctx.day=day;assert(run("makeDeck(day,'time').every(q=>q.timeScoringVersion===2)"));}
const deck=run("makeDeck('2026-10-16','time')");ctx.testDeck=deck;assert(run('validSavedGame({deck:testDeck,results:[]})'));assert(!run('validSavedGame({deck:testDeck.map(q=>({...q,timeScoringVersion:3})),results:[]})'));
console.log('Verified Time’s 1.25-second floor, 50% relative bound, linear scores, symmetry, clamps, no free-error window, future/practice cutover and legacy saved scoring.');
