const PLAYER_STORAGE_KEY='perception-player-v1';
const PLAYER_STORAGE_LIMIT=256*1024;
const PLAYER_HISTORY_LIMIT=720;
let playerStorageWarning='';
function dayNumber(day){const [y,m,d]=String(day).split('-').map(Number);return Date.UTC(y,m-1,d)/86400000;}
function validDay(day){if(typeof day!=='string'||!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day))return false;const [y,m,d]=day.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()+1===m&&date.getUTCDate()===d;}
function freshPlayer(){
 const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'guest-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 return {version:1,id,history:[],progress:{day:'',games:{}},stats:{lastDay:'',streak:0,best:0,played:0}};
}
function readPlayer(){
 try{
  const text=localStorage.getItem(PLAYER_STORAGE_KEY);if(!text)return null;
  if(text.length*2>PLAYER_STORAGE_LIMIT)throw new Error('Oversized save');
  const data=JSON.parse(text);
  if(data.version!==1||typeof data.id!=='string'||data.id.length>100||!Array.isArray(data.history)||!data.progress||!data.stats)throw new Error('Invalid save');
  data.history=data.history.filter(h=>validDay(h.day)&&typeof h.game==='string'&&Array.isArray(h.scores)&&h.scores.length===5&&h.scores.every(n=>Number.isInteger(n)&&n>=0&&n<=100)).slice(-PLAYER_HISTORY_LIMIT);
  if(!data.progress.games||typeof data.progress.games!=='object')data.progress={day:'',games:{}};
  if(!['streak','best','played'].every(k=>Number.isInteger(data.stats[k])&&data.stats[k]>=0&&data.stats[k]<1000000)||data.stats.lastDay&&!validDay(data.stats.lastDay))data.stats={lastDay:'',streak:0,best:0,played:0};
  return data;
 }catch{
  playerStorageWarning='Saving is unavailable or saved data could not be read. You can still play.';
  return null;
 }
}
let playerData=readPlayer()||freshPlayer();
function writePlayer(){
 // Never serialize screenshots. Old history is evicted before today's progress.
 playerData.history=playerData.history.filter(h=>dayNumber(h.day)>=dayNumber(calendarDay())-180).slice(-PLAYER_HISTORY_LIMIT);
 let text=JSON.stringify(playerData);
 while(text.length*2>PLAYER_STORAGE_LIMIT&&playerData.history.length){playerData.history.shift();text=JSON.stringify(playerData);}
 try{
  if(text.length*2>PLAYER_STORAGE_LIMIT)throw new Error('Save limit');
  localStorage.setItem(PLAYER_STORAGE_KEY,text);playerStorageWarning='';
 }catch{playerStorageWarning='Progress could not be saved in this browser. You can still play.';}
 updateStorageNotice();
}
function updateStorageNotice(){const note=$('save-note');if(note){note.textContent=playerStorageWarning;note.hidden=!playerStorageWarning;}}
function finiteTree(value){if(typeof value==='number')return Number.isFinite(value);if(Array.isArray(value))return value.length<=250&&value.every(finiteTree);if(value&&typeof value==='object')return Object.values(value).every(finiteTree);return typeof value==='string'||typeof value==='boolean'||value===null;}
function validSavedGame(game){
 try{
  if(!game||!Array.isArray(game.deck)||game.deck.length!==5||!Array.isArray(game.results)||game.results.length>5)return false;
  for(const q of game.deck){
   if(!q||!['view3d','balance','motion','perspective','proportion','rhythm','angle','colour','time','timeline','duration'].includes(q.type)||typeof q.title!=='string'||q.title.length>200||typeof q.skill!=='string'||q.skill.length>100||!finiteTree(q))return false;
   if(q.source&&(!Array.isArray(q.source)||!/^https:\/\//.test(q.source[1])))return false;
   const pairs=points=>Array.isArray(points)&&points.length>=3&&points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
   if(q.type==='view3d'&&(!q.shape||!Array.isArray(q.shape.boxes)||q.shape.boxes.length<3||q.shape.boxes.length>5||!q.shape.boxes.every(b=>Array.isArray(b)&&b.length===8&&b.slice(0,6).every(Number.isFinite)&&b.slice(3,6).every(n=>n>0)&&/^#[0-9a-f]{6}$/i.test(b[6])&&Array.isArray(b[7])&&b[7].length===6&&b[7].every(v=>typeof v==='boolean'))))return false;
   if(q.type==='balance'&&(!pairs(q.points)||q.holes&&!q.holes.every(pairs)))return false;
   if(q.type==='motion'&&(!Array.isArray(q.answer)||q.answer.length<2||!q.answer.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y))))return false;
   if(q.type==='perspective'&&(!q.answer||typeof q.answer.x!=='number'||typeof q.answer.y!=='number'))return false;
   if(q.type==='colour'&&(!Array.isArray(q.answer)||q.answer.length!==3))return false;
   if(['angle','time','rhythm','proportion','balance','timeline','duration'].includes(q.type)&&typeof q.answer!=='number')return false;
   if(scoreFor(q.type==='proportion'?{width:q.answer,height:1}:q.answer,q)!==100)return false;
  }
  return game.results.every((r,i)=>r&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100&&finiteTree(r.guess)&&Number.isFinite(scoreFor(r.guess,game.deck[i])));
 }catch{return false;}
}
function restoreDailyGame(){
 if(mode!=='daily'||review)return false;
 playerData=readPlayer()||playerData;
 const saved=playerData.progress.day===sessionDay?playerData.progress.games[mini]:null;
 if(!validSavedGame(saved))return false;
 deck=saved.deck;results=saved.results.map((r,i)=>({q:deck[i],guess:r.guess,score:r.score}));index=results.length;
 updateStorageNotice();return true;
}
function saveDailyGame(){
 if(mode!=='daily'||review)return;
 const recent=readPlayer();if(recent&&recent.id===playerData.id)playerData=recent;
 if(playerData.progress.day!==sessionDay)playerData.progress={day:sessionDay,games:{}};
 const old=playerData.progress.games[mini];
 if(old&&validSavedGame(old)&&old.results.length>results.length)return;
 if(old&&validSavedGame(old)&&old.results.length===5)return;
 playerData.progress.games[mini]={deck,results:results.map(r=>({score:r.score,guess:r.q.type==='motion'?resampleTrace(r.guess):r.guess}))};
 if(results.length===5&&!playerData.history.some(h=>h.day===sessionDay&&h.game===mini)){
  playerData.history.push({day:sessionDay,game:mini,scores:results.map(r=>r.score)});
  if(mini==='mix'&&(!playerData.stats.lastDay||dayNumber(sessionDay)>dayNumber(playerData.stats.lastDay))){
   const stats=playerData.stats;stats.streak=dayNumber(sessionDay)-dayNumber(stats.lastDay)===1?stats.streak+1:1;
   stats.lastDay=sessionDay;stats.best=Math.max(stats.best,stats.streak);stats.played++;
  }
 }
 writePlayer();
}
function browserHistoryHTML(){
 const stats=playerData.stats,active=[0,1].includes(dayNumber(calendarDay())-dayNumber(stats.lastDay))?stats.streak:0;
 const names={mix:'Daily five',view3d:'3D view',balance:'Balance',motion:'Line memory',perspective:'Perspective',proportion:'Proportions',rhythm:'Rhythm',angle:'Angles',memory:'Colour memory',time:'Time',timeline:'When?',duration:'How long?'};
 const label=day=>{const [y,m,d]=day.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});};
 return `<div class="browser-history"><p class="history-stats">Daily five streak: <strong>${active} ${active===1?'day':'days'}</strong> · Best: ${stats.best} · Played: ${stats.played}</p><div class="history-list">${playerData.history.slice(-14).reverse().map(h=>`<div class="history-row"><span>${escapeHTML(label(h.day))} · ${names[h.game]||'Daily game'}</span><strong>${h.scores.reduce((a,b)=>a+b,0)}/500</strong></div>`).join('')||'<p>No saved games yet.</p>'}</div><p class="storage-caption">Saved in this browser. Clearing site data resets your history. No cross-device sync.</p></div>`;
}

function bindHistoryNavigation(){
 const button=$('history-button'),dialog=$('history-dialog');
 button.addEventListener('click',()=>{
  playerData=readPlayer()||playerData;
  $('practice-menu').open=false;
  $('history-content').innerHTML=browserHistoryHTML();
  dialog.showModal();
 });
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
