const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const context=vm.createContext({Math,Date,Number,setTimeout,clearTimeout,performance,document:{getElementById(){return {addEventListener(){}};},addEventListener(){},querySelectorAll(){return[];}}});
vm.runInContext(source,context);
const run=s=>vm.runInContext(s,context);
for(const [type,answer,guess,display,label]of [
 ['angle',175,355,'180.0','angle off'],
 ['time',10,9.5,'0.50','early'],
 ['timeline',1969,1970,'1','year off'],
 ['rhythm',100,125,'25.0','faster'],
 ['proportion',2,{width:150,height:100},'25.0','ratio off'],
 ['perspective',{x:0,y:0},{x:30,y:40},'10.0','of the diagonal off'],
 ['duration',5400,5400,'0 s','duration error']
 ]){
 context.q={type,answer};context.testGuess=guess;
 const result=run('roundErrorDisplay(q,testGuess)');assert.equal(result.value,display);assert.equal(result.label,label);
}
assert(source.includes('styleRoundFeedback(q,value,score);'));
assert(!source.includes('styleViewFeedback('));
for(const game of ['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 context.testGame=game;
 const result=run('(()=>{const target=makeDeck("2026-10-10",testGame)[0];const exact=target.type==="proportion"?{width:target.answer*10,height:10}:target.answer;return roundErrorDisplay(target,exact);})()');
 assert.equal(parseFloat(result.value),0,game+' exact answer must display zero error');
}
console.log('Verified shared round feedback and readable angular, timing, tempo, ratio, spatial, and trivia errors.');
