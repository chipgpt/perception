const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
const target=[{x:100,y:150},{x:200,y:150}];ctx.testQ={type:'motion',answer:target,scoringVersion:2,traceScoringVersion:3};
const check=points=>{ctx.testGuess=points;return {score:run('scoreFor(testGuess,testQ)'),...run('traceCoverageResult(testGuess,testQ.answer)')}};
assert.equal(check(target).score,100);
assert.equal(check([...target].reverse()).score,100);
assert.equal(check([{x:100,y:150},{x:150,y:150},{x:200,y:150}]).score,100);
assert.equal(check([...target,...target.slice().reverse(),...target]).score,100,'repeated ink is counted once');
assert.equal(check([]).score,0);assert.equal(check([target[0]]).score,0);
const misplaced=check(target.map(p=>({...p,y:p.y+4})));assert.equal(misplaced.penalty,0,'ordinary misplaced trace gets no ink penalty');assert(misplaced.score>=65&&misplaced.score<=70,'only uncovered target counts');
ctx.shifted=target.map(p=>({...p,y:p.y+4}));assert(misplaced.score>run('scoreFor(shifted,{...testQ,traceScoringVersion:undefined})')+10,'fix double penalty for ordinary offsets');
const under=check([{x:100,y:150},{x:225,y:150}]);assert(under.areaRatio>1.2&&under.areaRatio<1.25);assert.equal(under.score,100,'extra ink within allowance costs nothing');assert.equal(under.penalty,0);
const over=check([{x:100,y:150},{x:250,y:150}]);assert.equal(over.coverage,1);assert(over.penalty>0);assert(over.score>=78&&over.score<=80,'full coverage with about 146% ink deducts about 21 points');
// Sweep actual rasterized strokes across the 125% boundary. Penalty starts
// only after the boundary and grows by 1 point per extra 1% of target area.
let last=100,below=false,above=false;for(let end=220;end<=245;end++){
 const result=check([{x:100,y:150},{x:end,y:150}]);assert(result.score<=last);last=result.score;
 if(result.areaRatio<=1.25){below=true;assert.equal(result.penalty,0);assert.equal(result.score,100);}
 else{above=true;assert(result.penalty>0);assert(Math.abs(result.penalty-(result.areaRatio-1.25))<1e-12);}
}assert(below&&above);
const partial=check([{x:100,y:150},{x:150,y:150}]);assert.equal(partial.penalty,0);assert(partial.score>=50&&partial.score<=55);
assert.equal(check(target.map(p=>({...p,y:p.y+12}))).score,0);
const scribble=[];for(let y=0;y<=300;y+=6){scribble.push({x:(y/6)%2?400:0,y},{x:(y/6)%2?0:400,y});}assert.equal(check(scribble).score,0,'board scribble earns zero even with full coverage');
assert.equal(check([{x:0,y:150},{x:400,y:150}]).score,0,'excess ink clamps to zero');
for(const y of [0,300]){const edge=[{x:0,y},{x:400,y}];ctx.testQ.answer=edge;assert.equal(check(edge).score,100);}ctx.testQ.answer=target;
for(const day of ['2026-10-15','2026-10-16']){ctx.day=day;assert(run("makeDeck(day,'motion').every(q=>q.traceScoringVersion===undefined)"));}
for(const day of ['2026-10-17','practice:coverage']){ctx.day=day;assert(run("makeDeck(day,'motion').every(q=>q.traceScoringVersion===3&&q.scoringVersion===2)"));}
ctx.saved=run("makeDeck('2026-10-17','motion')");assert(run('validSavedGame({deck:saved,results:[]})'));assert(!run('validSavedGame({deck:saved.map(q=>({...q,traceScoringVersion:4})),results:[]})'));assert(!run("validSavedGame({deck:makeDeck('practice:angle','angle').map(q=>({...q,traceScoringVersion:3})),results:[]})"));
assert.equal(run("roundErrorDisplay(testQ,testQ.answer).label"),'Target covered');assert.equal(run("roundErrorDisplay(testQ,testQ.answer).note"),'No excess-ink penalty');ctx.oversized=[{x:100,y:150},{x:250,y:150}];assert(run("roundErrorDisplay(testQ,oversized).note.includes('pts for excess ink')"));
assert(fs.readFileSync('src/design-options/how-to-play.html','utf8').includes('1.25× the target’s area'));
console.log('Verified target coverage, 125% unique-ink allowance and threshold crossing, linear excess penalty, ordinary offsets, partial traces, retracing, speed/direction invariance, edges, board scribbles, dated generation and saved-version compatibility.');
