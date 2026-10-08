const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{dataset:{},classList:{toggle(){}},listeners:{},addEventListener(k,fn){this.listeners[k]=fn}});return elements.get(id)}
const ctx=vm.createContext({document:{getElementById:el,querySelectorAll(){return[]},addEventListener(){}},Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
run('render=()=>{};updateAside=()=>{}');
for(const game of ['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 run(`mini='${game}';start('daily')`);assert.equal(run('mode'),'practice',game+' must be practice-only');assert.equal(el('practice-menu').open,false);
}
el('daily').listeners.click();assert.equal(run('mini'),'mix');assert.equal(run('mode'),'daily');assert.equal(run('deck.length'),5);
run("mini='mix';start('practice')");assert.equal(run('mode'),'practice');assert.equal(run('deck.length'),5);
for(const page of ['index','focus','night-lab','studio']){
 const html=fs.readFileSync(page+'.html','utf8');assert(html.includes('<details id="practice-menu" class="practice-menu">'));assert(!html.includes('role="group" aria-label="Game mode"'));assert(html.includes('aria-label="Practice games"'));assert(html.includes('Fresh mix'));assert(html.includes('id="history-button"'));assert(html.includes('aria-haspopup="dialog"'));assert(html.includes('<dialog id="history-dialog"'));assert(html.indexOf('<dialog id="history-dialog"')<html.indexOf('function bindHistoryNavigation'));assert(!html.includes('${browserHistoryHTML()}<div class="share-panel">'));
}
console.log('Verified one Daily Five, practice-only individual games, collapsed practice menu, return to daily, and fresh mixed practice.');
