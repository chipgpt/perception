const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
const rounds=[{q:{type:'angle',skill:'Angles',title:'SECRET',answer:118},score:96},{q:{type:'duration',skill:'How long?',title:'Soccer',answer:5400},score:100}];
const text=run(`shareResultsText(${JSON.stringify(rounds)},'2026-10-7')`);
assert(!text.includes('  '),'Share text must use single spaces');assert(text.includes('Oct 7'));assert(!text.includes('2026'));assert(!text.includes('Daily five'));assert(text.includes('📐96'));assert(text.includes('⏳100'));assert(text.includes('Final score: 196/200'));assert(text.startsWith('perception.thedanktank.com Oct 7\n'));assert.equal(text.split('\n').length,3);
for(const spoiler of ['SECRET','118','Soccer','5400'])assert(!text.includes(spoiler));
assert(run(`shareResultsText(${JSON.stringify(rounds)},'2026-10-7','angle',false)`).includes('Practice Angles'));
const sample=['duration','timeline','angle','rhythm','colour'].map((type,i)=>({q:{type},score:[91,31,93,66,74][i]}));
assert.equal(run(`shareResultsText(${JSON.stringify(sample)},'2026-10-8')`),'perception.thedanktank.com Oct 8\n⏳91 🗓️31 📐93 🥁66 🎨74\nFinal score: 355/500');
assert(run(`shareResultsText(${JSON.stringify(sample)},'2026-12-23')`).startsWith('perception.thedanktank.com Dec 23\n'));
assert(source.includes("makeDeck(mode==='daily'?sessionDay:"));
console.log('Verified share date, totals, game labels, practice labels, public link, and no answer spoilers.');

(async()=>{
 const shareSource=fs.readFileSync('src/design-options/share-results.js','utf8');
 function setup(nav,state={}){
  const elements={};for(const id of ['share-panel','share-results','share-status','share-fallback'])elements[id]={textContent:'',hidden:true,disabled:false,addEventListener(type,fn){this.click=fn},focus(){this.focused=true},select(){this.selected=true}};
  let clicks=0;const copied=[];
  const navigator={clipboard:{async writeText(t){copied.push(t)}},...nav};
  const c=vm.createContext({Date,calendarDay:()=> '2026-10-8',navigator,$:id=>elements[id],results:sample,mini:'mix',mode:'daily',review:false,analyticsShareClicked:()=>clicks++,...state});
  vm.runInContext(shareSource+'\nbindShareResults();',c);
  return {panel:elements['share-panel'],button:elements['share-results'],status:elements['share-status'],fallback:elements['share-fallback'],copied,clicks:()=>clicks};
 }
 let payload,resolve;const native=setup({share:data=>{payload=data;return new Promise(r=>resolve=r)}});
 const pending=native.button.click();assert(payload,'Native share must be invoked immediately from the click');assert.equal(payload.text,run(`shareResultsText(${JSON.stringify(sample)},'2026-10-8')`));assert.equal(Object.keys(payload).length,1,'Avoid duplicating the URL in shared messages');assert(native.button.disabled);
 await native.button.click();assert.equal(native.clicks(),1);resolve();await pending;assert(!native.button.disabled);assert.equal(native.copied.length,0);
 const cancel=setup({share:async()=>{throw {name:'AbortError'}}});await cancel.button.click();assert.equal(cancel.copied.length,0);assert(cancel.fallback.hidden);assert.equal(cancel.status.textContent,'');assert(!cancel.button.disabled);
 const desktop=setup({});await desktop.button.click();assert.equal(desktop.copied.length,1);assert.equal(desktop.button.textContent,'Copied!');
 assert(!desktop.panel.hidden);
 for(const state of [{mode:'practice'},{mode:'practice',mini:'angle'},{review:true}]){const practice=setup({},state);assert(practice.panel.hidden);assert.equal(practice.button.click,undefined);assert.equal(practice.clicks(),0);}
 const rejected=setup({share:async()=>{throw {name:'NotAllowedError'}}});await rejected.button.click();assert.equal(rejected.copied.length,1);
 const denied=setup({clipboard:{async writeText(){throw new Error('blocked')}}});await denied.button.click();assert(!denied.fallback.hidden);assert(denied.fallback.focused&&denied.fallback.selected);assert.equal(denied.fallback.value,payload.text);assert(!denied.button.disabled);
 console.log('Verified native sharing on tap, cancellation, repeated taps, clipboard fallback, and manual copy when permissions fail.');
})().catch(error=>{console.error(error);process.exitCode=1});
