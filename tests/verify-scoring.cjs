const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
const score=(value,q)=>run(`scoreFor(${JSON.stringify(value)},${JSON.stringify(q)})`);
for(const [error,expected]of [[0,100],[.1,81],[.25,56],[.5,25],[.75,6],[1,0],[2,0]]){
 assert.equal(run(`scoreFromError(${error})`),expected);
 for(const type of ['angle','time','timeline']){
  const range=run(`SCORING_RANGES.${type}`);
  assert.equal(score(10+error*range,{type,answer:10}),expected,type);
  assert.equal(score(10-error*range,{type,answer:10}),expected,type+' symmetry');
 }
 for(const width of [100,200,310]){
  const q={type:'balance',answer:width/2,points:[[0,0],[width,0],[width,50],[0,50]]};
  assert.equal(score(q.answer+error*width*.5,q),expected,'balance relative width');
  assert.equal(score(q.answer-error*width*.5,q),expected,'balance symmetry');
 }
 assert.equal(score({yaw:error*180,pitch:0,roll:0},{type:'view3d',answer:{yaw:0,pitch:0,roll:0}}),error<=1?expected:100,'3D shortest rotation');
 assert.equal(score({x:error*160,y:error*120},{type:'perspective',answer:{x:0,y:0}}),expected);
 const ratioRange=run('SCORING_RANGES.proportion');
 for(const sign of [-1,1])assert.equal(score({width:Math.exp(sign*error*ratioRange),height:1},{type:'proportion',answer:1}),expected);
 for(const target of [60,90,144])for(const sign of [-1,1])assert.equal(score(target*Math.exp(sign*error*Math.log(1.5)),{type:'rhythm',answer:target}),expected);
 const durationRange=run('SCORING_RANGES.duration');
 for(const sign of [-1,1])assert(Math.abs(score(6000*Math.exp(sign*error*durationRange),{type:'duration',answer:6000})-expected)<=2);
}
assert.equal(score({width:300,height:200},{type:'proportion',answer:1.5}),100);
assert.equal(score([],{type:'motion',answer:[{x:0,y:0},{x:100,y:0}]}),0);
assert.equal(score([{x:0,y:0},{x:100,y:0}],{type:'motion',answer:[{x:0,y:0},{x:100,y:0}]}),100);
assert.equal(score([{x:0,y:100},{x:100,y:100}],{type:'motion',answer:[{x:0,y:0},{x:100,y:0}]}),0);
assert.equal(score(13,{type:'time',answer:10}),0);
assert.equal(score(11,{type:'time',answer:10}),44);
assert.equal(score(2000,{type:'timeline',answer:1950}),0);
assert(source.includes('function angleRound(q){let angle=0,chosen=false;'));
for(const type of ['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 const q=run(`makeDeck('scoring-check','${type}')[0]`);
 const value=q.type==='proportion'?{width:q.answer,height:1}:q.answer;
 assert.equal(score(value,q),100,type+' exact answer');
}
for(let i=0;i<=1000;i++){
 const a=run(`scoreFromError(${i/1000})`),b=run(`scoreFromError(${(i+1)/1000})`);
 assert(a>=0&&a<=100&&a>=b);
}
assert.equal(run('scoreFromError(Infinity)'),0);
console.log('Verified shared scoring curve, all 11 exact answers, monotonicity, symmetry, scale invariance, and invalid trace handling.');

assert.equal(score([255,255,255],{type:'colour',answer:[255,0,0]}),0);
assert.equal(score([255,128,128],{type:'colour',answer:[255,0,0]}),25);
assert.equal(score([255,0,0],{type:'colour',answer:[0,255,255]}),0);
assert(run('wheelDistance(hsvRgb(359,1,1),hsvRgb(1,1,1))')<.04);
assert.equal(score(120,{type:'duration',answer:60}),25);
assert.equal(score(30,{type:'duration',answer:60}),25);
assert.throws(()=>run("makeDeck('test','typography')"));
for(let day=1;day<=100;day++)assert(!run("makeDeck('day-"+day+"','mix')").some(q=>q.type==='typography'));

for(const value of [5371,5390,5400,5410,5429]){
 assert.equal(run(`durationText(${value})`),'1 h 30 min');
 assert.equal(score(value,{type:'duration',answer:5400}),100);
}
assert.equal(run('durationValue(5431)'),5460);
assert(score(5431,{type:'duration',answer:5400})<100);
for(const answer of [12,1500,2880,4800,5400,11640,29.5*86400]){
 const nearby=answer+(answer>=86400?100:answer>=3600?20:answer>=60?.2:.01);
 assert.equal(run(`durationText(${answer})`),run(`durationText(${nearby})`));
 assert.equal(score(nearby,{type:'duration',answer}),100);
}
console.log('Verified displayed durations match scored values, including soccer 1 h 30 min and precision boundaries.');
