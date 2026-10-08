const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const data=new Map();let denied=false;
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{if(denied)throw new Error('Quota exceeded');data.set(k,v)}};
function context(){const el={addEventListener(){},classList:{toggle(){}},dataset:{}};const c=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},localStorage:storage,crypto,Date,Math,Number,setTimeout,clearTimeout,performance});vm.runInContext(source,c);return s=>vm.runInContext(s,c);}
let run=context();
run("mini='mix';mode='daily';sessionDay='2026-10-7';deck=makeDeck(sessionDay);results=[];saveDailyGame()");
const id=run('playerData.id'),originalDeck=run('JSON.stringify(deck)');
run("results=[{q:deck[0],guess:deck[0].type==='proportion'?{width:deck[0].answer,height:1}:deck[0].answer,score:100}];saveDailyGame()");
assert(!data.get('perception-player-v1').includes('comparisonImage'));
run=context();assert.equal(run('playerData.id'),id);
run("mini='mix';mode='daily';sessionDay='2026-10-7';results=[]");assert(run('restoreDailyGame()'));assert.equal(run('index'),1);assert.equal(run('JSON.stringify(deck)'),originalDeck);
run("results=deck.map(q=>({q,guess:q.type==='proportion'?{width:q.answer,height:1}:q.answer,score:100}));saveDailyGame()");
assert.equal(run('playerData.stats.streak'),1);assert.equal(run('playerData.stats.played'),1);
run('saveDailyGame()');assert.equal(run('playerData.history.length'),1);
run=context();run("mini='mix';mode='daily';sessionDay='2026-10-7';results=[]");assert(run('restoreDailyGame()'));assert.equal(run('index'),5);assert.equal(run('results.reduce((s,r)=>s+r.score,0)'),500);
for(const day of ['2026-10-8','2026-10-10'])run(`sessionDay='${day}';deck=makeDeck(sessionDay);results=deck.map(q=>({q,guess:q.type==='proportion'?{width:q.answer,height:1}:q.answer,score:100}));saveDailyGame()`);
assert.equal(run('playerData.stats.streak'),1);assert.equal(run('playerData.stats.best'),2);assert.equal(run('playerData.stats.played'),3);
const before=data.get('perception-player-v1');run("mode='practice';saveDailyGame()");assert.equal(data.get('perception-player-v1'),before);
denied=true;run("mode='daily';sessionDay='2026-10-11';deck=makeDeck(sessionDay);results=[];saveDailyGame()");assert(run('playerStorageWarning.length')>0);assert.equal(data.get('perception-player-v1'),before);denied=false;
run("playerData.history=Array.from({length:1000},()=>({day:calendarDay(),game:'mix',scores:[1,2,3,4,5]}));writePlayer()");assert(run('playerData.history.length')<=720);assert(data.get('perception-player-v1').length*2<=256*1024);
assert.equal(run("dayNumber('2026-11-2')-dayNumber('2026-11-1')"),1);
assert.equal(run("validSavedGame({deck:[{}],results:[]})"),false);
for(const game of ['mix','view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']){
 assert(run(`(()=>{const deck=makeDeck('2026-10-7','${game}');return validSavedGame({deck,results:deck.map(q=>({guess:q.type==='proportion'?{width:q.answer,height:1}:q.answer,score:100}))});})()`),game+' can be restored');
}
data.set('perception-player-v1','broken JSON');run=context();assert(run('playerStorageWarning.length')>0);
run("mini='mix';mode='daily';sessionDay=calendarDay();deck=makeDeck(sessionDay);results=[];saveDailyGame()");assert.equal(JSON.parse(data.get('perception-player-v1')).version,1);
console.log('Verified stable identity, partial/complete reloads, frozen decks, streaks, practice isolation, quota failure, bounded storage, date arithmetic, and corrupt saves.');
