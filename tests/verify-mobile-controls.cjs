const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const nodes=new Map();
const drawing=new Proxy({},{get:()=>()=>{}});
function element(id){if(!nodes.has(id))nodes.set(id,{events:{},attrs:{},textContent:'',dataset:{},disabled:false,classList:{add(){},remove(){},toggle(){}},addEventListener(name,fn){this.events[name]=fn;},setAttribute(name,value){this.attrs[name]=String(value);},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:400,height:300};},getContext(){return drawing;}});return nodes.get(id);}
const ctx=vm.createContext({document:{getElementById:element,addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance,getComputedStyle(){return {getPropertyValue(){return '#123456';}}}});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
run('shell=()=>{};reveal=value=>{locked=true;globalThis.submitted=value;};');
const fire=(id,event,args={})=>element(id).events[event]({preventDefault(){},pointerId:1,...args});
run("locked=false;timelineRound({answer:1947});");
// Tapping either side no longer chooses an off-centre year.
fire('timeline-canvas','pointerdown',{clientX:25});fire('timeline-canvas','pointerup');assert.equal(element('trivia-value').textContent,1970);
fire('timeline-canvas','pointerdown',{clientX:200});fire('timeline-canvas','pointermove',{clientX:166});fire('timeline-canvas','pointerup');assert.equal(element('trivia-value').textContent,1978);
fire('year-plus','click');assert.equal(element('trivia-value').textContent,1979);
fire('timeline-canvas','keydown',{key:'End'});fire('year-plus','click');assert.equal(element('trivia-value').textContent,2026);
fire('timeline-canvas','keydown',{key:'Home'});fire('year-minus','click');assert.equal(element('trivia-value').textContent,1850);
fire('trivia-lock','click');assert.equal(run('submitted'),1850);fire('year-plus','click');assert.equal(element('timeline-canvas').attrs['aria-valuenow'],'1850');
run("locked=false;durationRound({caption:'Regulation playing time',answer:5400});");
const a=135*Math.PI/180+Math.log(5400)/Math.log(5184000)*270*Math.PI/180;
fire('duration-canvas','pointerdown',{clientX:200+Math.cos(a)*100,clientY:145+Math.sin(a)*100});fire('duration-canvas','pointerup');
assert.equal(element('duration-canvas').attrs['aria-valuenow'],'5400');assert.equal(element('duration-step').textContent,'1 min steps');
fire('duration-plus','click');assert.equal(element('duration-canvas').attrs['aria-valuenow'],'5460');
fire('duration-minus','click');fire('trivia-lock','click');assert.equal(run('submitted'),5400);
fire('duration-plus','click');assert.equal(element('duration-canvas').attrs['aria-valuenow'],'5400');
for(const [v,dir,expected] of [[1,-1,1],[59.9,1,60],[60,-1,59],[3599,1,3600],[3600,-1,3540],[5400,1,5460],[5184000,1,5184000]])assert.equal(run(`nudgeDuration(${v},${dir})`),expected);
const comparison=run(`summaryComparison({q:{type:'colour',skill:'Colour memory',hex:'#00ff00'},guess:[255,0,0],comparisonImage:'old-wheel-image'})`);
assert(comparison.includes('<svg'));assert(comparison.toLowerCase().includes('#ff0000'));assert(comparison.toLowerCase().includes('#00ff00'));assert(!comparison.includes('old-wheel-image'));
console.log('Verified centred timeline selection, drag direction, one-year bounds, exact minute adjustments, locked answers, precision boundaries, and summary color swatches.');
