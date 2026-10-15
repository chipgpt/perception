// Shared contract: a game registers its renderer and presentation, then mounts
// its stage and controls. Only this shell owns page layout, phase and chrome.
const gameRegistry=new Map();
let activeGameShell=null;
function registerGame(type,definition){
 if(gameRegistry.has(type))throw new Error('Game already registered: '+type);
 if(typeof definition.render!=='function')throw new Error('A game needs a renderer: '+type);
 gameRegistry.set(type,Object.freeze({...definition}));
}
function renderGame(q){
 const game=gameRegistry.get(q.type);
 if(!game)throw new Error('Unknown puzzle type: '+q.type);
 game.render(q);
}
function revealGame(q,value,score){gameRegistry.get(q.type)?.reveal?.(q,value,score);}
function disposeGameShell(){
 const previous=activeGameShell;activeGameShell=null;
 if(previous)for(const cleanup of previous.cleanups)cleanup();
}
function onGameRedraw(paint){if(activeGameShell)activeGameShell.redraw=paint;}
function onGameCleanup(cleanup){if(activeGameShell)activeGameShell.cleanups.push(cleanup);}
function setGamePhase(phase){$('playarea').dataset.phase=phase;}
function leaveGameShell(){
 disposeGameShell();
 document.body?.removeAttribute('data-game-active');
 $('playarea').removeAttribute?.('data-phase');
}
function mountGameShell({question:q,stage,controls='',phase}){
 disposeGameShell();
 const game=gameRegistry.get(q.type)||{};phase=phase||game.initialPhase||'play';
 const presentation=phase==='empty'?{}:game.presentation?.(q,phase)||{};
 const title=presentation.title||q.title,subtitle=presentation.subtitle||'';
 const text=value=>escapeHTML(value).replace(/\n/g,'<br>');
 document.body.dataset.gameActive='true';
 $('playarea').dataset.puzzle=q.type;setGamePhase(phase);gamebar();
 $('playarea').innerHTML=`<section class="mixed-question game-round" aria-labelledby="challenge"><div class="game-prompt"><p class="eyebrow">${escapeHTML(game.label||q.skill)}</p><h1 id="challenge">${text(title)}</h1>${subtitle?`<p class="game-subtitle">${text(subtitle)}</p>`:''}</div><div class="game-stage" id="game-stage">${stage}</div></section><div class="mixed-controls game-controls" id="controls">${controls}</div><div class="actionarea game-feedback" id="actionarea"></div>`;
 if(presentation.hint&&!$('controls').querySelector('.small-instruction'))$('controls').insertAdjacentHTML('afterbegin',`<p class="small-instruction">${text(presentation.hint)}</p>`);
 activeGameShell={cleanups:[],redraw:null};
 return {stage:$('game-stage'),controls:$('controls'),feedback:$('actionarea'),setPhase:setGamePhase,onCleanup:onGameCleanup,onRedraw:onGameRedraw};
}
function prepareMemoryStart(buttonId='show-view',canvasId='view-canvas'){
 const stage=$(canvasId).closest('.spatial-wrap,.memory-stage'),intro=gameRegistry.get($('playarea').dataset.puzzle)?.ready;
 stage.querySelector('.memory-prompt')?.remove();stage.classList.add('memory-ready');
 if(intro){stage.classList.add('memory-ready-illustration');stage.insertAdjacentHTML('beforeend',`<div class="memory-ready-art" aria-hidden="true"><svg viewBox="0 0 110 110" fill="none">${intro.artwork}</svg><span>${escapeHTML(intro.caption)}</span></div>`);}
}
function beginMemoryPreview(buttonId='show-view',canvasId='view-canvas'){
 const stage=$(canvasId).closest('.spatial-wrap,.memory-stage');
 stage.classList.remove('memory-ready','memory-ready-illustration');stage.querySelector('.memory-ready-art')?.remove();
 setGamePhase('preview');
}
function bindGameChrome(){
 const menu=$('game-menu'),toggle=$('game-menu-toggle'),close=$('game-menu-close');
 toggle.addEventListener('click',()=>{
  for(const button of [$('daily'),...menu.querySelectorAll('[data-mini]')]){
   const selected=button.id==='daily'?mode==='daily':mode==='practice'&&button.dataset.mini===mini;
   button.classList.toggle('active',selected);
   if(selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  }
  menu.showModal();toggle.setAttribute('aria-expanded','true');
 });
 close.addEventListener('click',()=>menu.close());
 menu.addEventListener('cancel',()=>toggle.setAttribute('aria-expanded','false'));
 menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');$('practice-menu').open=false;});
 menu.addEventListener('click',event=>{if(event.target===menu){const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)menu.close();}});
 // Selecting a destination keeps existing navigation handlers and save behavior.
 $('theme-stylesheet').addEventListener('load',()=>activeGameShell?.redraw?.());
 for(const button of [$('daily'),$('history-button'),...menu.querySelectorAll('[data-mini]')])button.addEventListener('click',()=>menu.close());
}
