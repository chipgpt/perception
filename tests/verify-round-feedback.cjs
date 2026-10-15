const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const context=vm.createContext({Math,Date,Number,setTimeout,clearTimeout,performance,document:{getElementById(){return {addEventListener(){}};},addEventListener(){},querySelectorAll(){return[];}}});
vm.runInContext(source,context);
const run=s=>vm.runInContext(s,context);
for(const [type,answer,guess,display,label]of [
 ['angle',175,355,'180.0','Angle error'],
 ['time',10,9.5,'0.50','Timing error'],
 ['timeline',1969,1970,'1','Year error'],
 ['rhythm',100,125,'25.0','Tempo error'],
 ['proportion',2,{width:150,height:100},'25.0','Ratio error'],
 ['perspective',{x:0,y:0},{x:30,y:40},'10.0','Position error'],
 ['duration',5400,5400,'0 s','Duration error']
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

// Width and height must remain separate, including exact and opposing errors.
const size=run('sizeQuestion(rng(42),0)');context.size=size;
let axes=run('roundErrorDisplay(size,{width:size.answer.width*.95,height:size.answer.height*1.12}).axes');
assert.equal(axes[0].label,'Width');assert.equal(axes[0].value,'5.0');assert.equal(axes[0].note,'Too narrow');
assert.equal(axes[1].label,'Height');assert.equal(axes[1].value,'12.0');assert.equal(axes[1].note,'Too tall');
axes=run('roundErrorDisplay(size,size.answer).axes');assert(axes.every(a=>a.value==='0.0'&&a.note==='Spot on'));
assert.equal(run("roundErrorDisplay({type:'time',answer:10},9.999).note"),'Spot on','rounded zero must not claim an early or late error');
assert.equal(run("roundErrorDisplay({type:'timeline',answer:1969},1970).unit"),'year');
assert.equal(run("roundErrorDisplay({type:'timeline',answer:1969},1971).unit"),'years');
assert(run("roundErrorDisplay({type:'duration',answer:1},5184000).compact"));
assert(!run("resultMetricHTML({label:'<img>',value:'<script>',unit:'%',note:'<iframe>'})").includes('<img>'));
assert(run("summaryResultTitle({skill:'When?',type:'timeline',title:'<script>'})").includes('&lt;script&gt;'));
console.log('Verified independent size feedback, direction labels, rounded exact timing, singular years, long duration values, and escaped result labels.');
