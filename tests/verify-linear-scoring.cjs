const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx),plain=v=>JSON.parse(JSON.stringify(v));
for(const game of ['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 ctx.game=game;const deck=run("makeDeck('practice:linear-rule',game)");assert(deck.length);assert(deck.every(q=>q.scoringVersion===2),game);
 for(const q of deck){ctx.testQ=q;assert.equal(run('scoreFor(testQ.answer,testQ)'),100,game+' exact');}
 assert.deepEqual(plain(run("makeDeck('practice:linear-rule',game)")),plain(deck));
 for(const day of ['2026-10-14','2026-10-15']){ctx.day=day;assert(run('makeDeck(day,game).every(q=>q.scoringVersion===undefined)'),game+' historical version changed');}
 ctx.day='2026-10-16';assert(run('makeDeck(day,game).every(q=>q.scoringVersion===2)'),game+' future version missing');
}
for(const fraction of [0,.1,.25,.5,.75,1]){
 const expected=Math.round(100*(1-fraction));ctx.fraction=fraction;
 const cases=[
 [{type:'angle',answer:0},fraction*180],
 [{type:'view3d',answer:{yaw:0,pitch:0,roll:0}},{yaw:fraction*90,pitch:0,roll:0}],
 [{type:'perspective',answer:{x:0,y:0}},{x:fraction*run("PERSPECTIVE_INNER_DIAGONAL")*.4,y:0}],
 [{type:'halfhalf',fruit:{},points:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]},{x:50+20*fraction,y:50,nx:1,ny:0}],
 [{type:'colour',answer:[255,255,255]},run('hsvRgb(0,fraction,1)')],
 [{type:'rhythm',answer:100},100*Math.exp(fraction*Math.log(1.5))],
 [{type:'duration',answer:6000},6000*(1+fraction*.5)],
 [{type:'time',answer:10,timeScoringVersion:2},10+fraction*5],
 [{type:'timeline',answer:2025,scoringYear:2026,timelineScoringVersion:2},2025+fraction*5]
 ];
 for(const [q,guess]of cases){ctx.testQ={...q,scoringVersion:2};ctx.testGuess=guess;const actual=run('scoreFor(testGuess,testQ)');assert(Math.abs(actual-expected)<=(['duration','colour'].includes(q.type)?1:0),q.type+' fraction '+fraction+': '+actual+' vs '+expected);}
}
ctx.size=run("makeDeck('practice:linear-size','proportion')[0]");
assert.equal(run('scoreFor({width:size.answer.width*1.05,height:size.answer.height*.95},size)'),90);
assert.equal(run('scoreFor({width:size.answer.width*1.25,height:size.answer.height*.75},size)'),50);
assert.equal(run('scoreFor({width:size.answer.width*1.5,height:size.answer.height},size)'),50);
assert.equal(run('scoreFor({...size.answer,width:size.answer.width*2},{...size,scoringVersion:2})'),50,'oversize must be clipped before averaging');
assert.equal(run('scoreFor(size.answer,{...size,scoringVersion:undefined})'),100);
assert.equal(run('scoreFor({width:size.answer.width*1.05,height:size.answer.height*.95},{...size,scoringVersion:undefined})'),81,'historical size curve stays squared');
assert.equal(run("scoreFor(36,{type:'angle',answer:0})"),64);assert.equal(run("scoreFor(36,{type:'angle',answer:0,scoringVersion:2})"),80);
assert.equal(run('linearScoreFromError(Infinity)'),0);assert.equal(run('linearScoreFromError(-1)'),100);assert.equal(run('linearScoreFromError(2)'),0);
const newDeck=run("makeDeck('2026-10-16','angle')");ctx.newDeck=newDeck;assert(run('validSavedGame({deck:newDeck,results:[]})'));assert(!run('validSavedGame({deck:newDeck.map(q=>({...q,scoringVersion:3})),results:[]})'));
assert(run("makeDeck('practice:half-explanation','balance').every(q=>q.explain.includes('53/47 split earns 85 points')&&q.explain.includes('60/40 split earns 50 points'))"));
console.log('Verified linear scoring for all eleven games, shared normalized error levels, equal independent dimensions, clamps, versioned generation, saved-version validation and legacy squared scores.');

for(const [degrees,expected]of [[0,100],[9,90],[45,50],[90,0],[135,0],[180,0]]){ctx.degrees=degrees;assert.equal(run("scoreFor({yaw:degrees,pitch:0,roll:0},{type:'view3d',answer:{yaw:0,pitch:0,roll:0},scoringVersion:2})"),expected);}
assert.equal(run("scoreFor({yaw:90,pitch:0,roll:0},{type:'view3d',answer:{yaw:0,pitch:0,roll:0}})"),25,'legacy 3D bound and curve remain intact');
assert.equal(run("scoreFor(90,{type:'angle',answer:0,scoringVersion:2})"),50);
assert.equal(run("scoreFor(180,{type:'angle',answer:0,scoringVersion:2})"),0);
console.log('Verified new 3D zero-point bound of 90 degrees, unchanged 180-degree Angles bound, and historical 3D scoring.');
