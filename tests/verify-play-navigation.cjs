const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{dataset:{},classList:{values:new Set(),toggle(name,on){if(on)this.values.add(name);else this.values.delete(name)},contains(name){return this.values.has(name)}},listeners:{},addEventListener(k,fn){this.listeners[k]=fn}});return elements.get(id)}
const ctx=vm.createContext({document:{getElementById:el,querySelectorAll(){return[]},addEventListener(){}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
run('render=()=>{};updateAside=()=>{}');
for(const game of ['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 run(`mini='${game}';start('daily')`);assert.equal(run('mode'),'practice',game+' must be practice-only');assert.equal(el('practice-menu').open,false);
 assert(el('practice-menu').classList.contains('active'));assert(!el('daily').classList.contains('active'));
}
el('daily').listeners.click();assert.equal(run('mini'),'mix');assert.equal(run('mode'),'daily');assert.equal(run('deck.length'),5);
assert(!el('practice-menu').classList.contains('active'));assert(el('daily').classList.contains('active'));
run("mini='mix';start('practice')");assert.equal(run('mode'),'practice');assert.equal(run('deck.length'),5);
assert(el('practice-menu').classList.contains('active'));
for(const page of ['index','focus','night-lab','studio']){
 const html=fs.readFileSync('public/'+page+'.html','utf8');assert(html.includes('<details id="practice-menu" class="practice-menu">'));assert(!html.includes('role="group" aria-label="Game mode"'));assert(html.includes('aria-label="Practice games"'));assert(html.includes('Fresh mix'));assert(html.includes('id="history-button"'));assert(html.includes('aria-haspopup="dialog"'));assert(html.includes('<dialog id="history-dialog"'));assert(html.indexOf('<dialog id="history-dialog"')<html.indexOf('function bindHistoryNavigation'));assert(!html.includes('${browserHistoryHTML()}<div class="share-panel">'));
}
console.log('Verified one Daily Five, practice-only individual games, collapsed practice menu, return to daily, and fresh mixed practice.');

ctx.URL=URL;ctx.location={href:'https://perception.thedanktank.com/?game=balance&from=challenge&day=2026-10-09&beat=300#test'};ctx.history={replaceState(_state,_title,path){ctx.location.href=new URL(path,ctx.location.href).href;}};
run("mini='angle';start('practice')");let url=new URL(ctx.location.href);assert.equal(url.searchParams.get('game'),'angle');assert.equal(url.searchParams.get('from'),'challenge');assert.equal(url.searchParams.get('beat'),'300');assert.equal(url.hash,'#test');
run("mini='mix';start('practice')");url=new URL(ctx.location.href);assert.equal(url.searchParams.get('game'),'mix');assert.equal(url.searchParams.get('mode'),'practice');
el('daily').listeners.click();url=new URL(ctx.location.href);assert(!url.searchParams.has('game'));assert(!url.searchParams.has('mode'));assert.equal(url.searchParams.get('from'),'challenge');
assert(fs.readFileSync('public/index.html','utf8').includes("start(new URLSearchParams(location.search).get('mode')==='practice'?'practice':'daily')"));console.log('Verified selected game and mixed-practice mode follow the URL, while challenge and campaign parameters remain intact.');

run("mini='view3d';start('practice')");assert.equal(el('practice-label').textContent,'Practice: 3D View');
run("mini='memory';start('practice')");assert.equal(el('practice-label').textContent,'Practice: Colour memory');
run("mini='mix';start('practice')");assert.equal(el('practice-label').textContent,'Practice: Fresh mix');
el('daily').listeners.click();assert.equal(el('practice-label').textContent,'Practice');
console.log('Verified Practice label follows the selected game and resets for Daily Five.');
