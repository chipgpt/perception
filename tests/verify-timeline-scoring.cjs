const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx),plain=v=>JSON.parse(JSON.stringify(v));
const recent={type:'timeline',answer:2025,timelineScoringVersion:2,scoringYear:2026};ctx.q=recent;
assert.equal(run('timelineErrorBound(q)'),5);
for(const [error,score]of [[0,100],[1,80],[2,60],[3,40],[4,20],[5,0],[10,0]])for(const sign of [-1,1]){ctx.guessValue=recent.answer+sign*error;assert.equal(run('scoreFor(guessValue,q)'),score);}
assert.equal(run('scoreFor(Infinity,q)'),0);
for(const [age,bound]of [[0,5],[1,5],[20,5],[40,10],[100,25],[126,31.5]]){ctx.age=age;assert.equal(run('timelineErrorBound({...q,answer:q.scoringYear-age})'),bound);}
assert.equal(run('timelineErrorBound({...q,answer:2030})'),5,'future event cannot create a negative bound');
assert.equal(run('scoreFor(2021,q)'),20);
run("calendarDay=()=> '2040-1-1'");assert.equal(run('scoreFor(2021,q)'),20,'replay date must not alter score');
const old={type:'timeline',answer:2025};ctx.oldQuestion=old;assert.equal(run('scoreFor(2021,oldQuestion)'),85,'unversioned saved questions retain squared 50-year scoring');
const id=run("Object.values(TRIVIA_BY_ID).find(f=>f.type==='timeline').id");ctx.factId=id;
const oldFact=run("scheduledTriviaQuestion(factId,'2026-10-15')");assert.equal(oldFact.timelineScoringVersion,undefined);
const future=run("scheduledTriviaQuestion(factId,'2026-10-16')");assert.equal(future.timelineScoringVersion,2);assert.equal(future.scoringYear,2026);
assert.equal(run("scheduledTriviaQuestion(factId,'2027-1-1').scoringYear"),2027);
for(const day of ['2026-10-14','2026-10-15']){ctx.testDay=day;assert(run("makeDeck(testDay,'timeline').every(q=>q.timelineScoringVersion===undefined)"));assert(run("makeDeck(testDay,'mix').filter(q=>q.type==='timeline').every(q=>q.timelineScoringVersion===undefined)"));}
run("calendarDay=()=> '2026-10-15'");assert(run("makeDeck('practice:new-timeline','timeline').every(q=>q.timelineScoringVersion===3&&q.scoringYear===2026)"));
for(const [day,entry]of Object.entries(JSON.parse(fs.readFileSync('data/daily-trivia.json')).days))if(day>='2026-10-16'&&entry.types.includes('timeline')){ctx.testDay=day;const q=run("makeDeck(testDay,'mix').find(q=>q.type==='timeline')");assert.equal(q.timelineScoringVersion,day>='2026-10-24'?3:2);assert.equal(q.scoringYear,Number(day.slice(0,4)));assert.deepEqual(plain(run("makeDeck(testDay,'mix')")),plain(run("makeDeck(testDay,'mix')")));}
ctx.future=future;assert(run('validSavedGame({deck:Array(5).fill(future),results:[]})'));
assert(!run('validSavedGame({deck:Array(5).fill({...future,timelineScoringVersion:4}),results:[]})'));
assert(!run('validSavedGame({deck:Array(5).fill({...future,scoringYear:NaN}),results:[]})'));
console.log('Verified five-year linear baseline (four years off = 20), age-based bounds, symmetry, clamps, frozen challenge years, future daily/practice generation, saved version validation, and legacy scoring.');

const gentle={type:'timeline',answer:2025,timelineScoringVersion:3,scoringYear:2026};ctx.gentle=gentle;
assert.equal(run('timelineErrorBound(gentle)'),10);
for(const [error,score]of [[0,100],[1,90],[4,60],[5,50],[7,30],[9,10],[10,0],[20,0]])for(const sign of [-1,1]){ctx.value=gentle.answer+error*sign;assert.equal(run('scoreFor(value,gentle)'),score);}
for(const [age,bound,sevenScore]of [[0,10,30],[10,10,30],[30,10,30],[60,20,65],[100,100/3,79]]){ctx.age=age;assert.equal(run('timelineErrorBound({...gentle,answer:2026-age})'),bound);assert.equal(run('scoreFor(2026-age-7,{...gentle,answer:2026-age})'),sevenScore);}
assert.equal(run('timelineErrorBound({...gentle,answer:2030})'),10);
assert.equal(run('scoreFor(NaN,gentle)'),0);assert.equal(run('scoreFor(Infinity,gentle)'),0);
run("calendarDay=()=> '2099-01-01'");assert.equal(run('scoreFor(2018,gentle)'),30,'frozen year must survive replay decades later');
const cutover=run("scheduledTriviaQuestion(factId,'2026-10-24')");ctx.cutover=cutover;assert.equal(cutover.timelineScoringVersion,3);assert.equal(cutover.scoringYear,2026);assert(run('validSavedGame({deck:Array(5).fill(cutover),results:[]})'));
assert.equal(run("scheduledTriviaQuestion(factId,'2026-10-23').timelineScoringVersion"),2);
assert(run("makeDeck('2026-10-24','timeline').every(q=>q.timelineScoringVersion===3)"));
const pokemon=run("scheduledTriviaQuestion('timeline-pokemon-first-released','2026-10-23')");ctx.pokemon=pokemon;assert.equal(run('scoreFor(1989,pokemon)'),7);assert.equal(run('scoreFor(1989,{...pokemon,timelineScoringVersion:3})'),30);
console.log('Verified gentler ten-year / one-third-age bounds, seven-year Pokemon miss = 30, versioned cutover, frozen years, restored v2/v3 questions, clamps, and unchanged historical scores.');
