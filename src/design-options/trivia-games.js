function pastTriviaIds(type,before=calendarDay()){
 const cutoff=before.split('-').map((n,i)=>i?String(Number(n)).padStart(2,'0'):n).join('-');
 return [...new Set(Object.entries(DAILY_TRIVIA_SCHEDULE).filter(([day])=>day<cutoff).map(([,day])=>day.trivia[type]).filter(id=>id&&TRIVIA_BY_ID[id]?.type===type))];
}
function triviaDeck(random,type){return shuffleWith(random,pastTriviaIds(type)).slice(0,5).map(scheduledTriviaQuestion);}
function emptyTriviaPractice(){
 shell({type:mini,skill:mini==='timeline'?'When?':'How long?',title:'The practice archive is growing.'},'<p class="trivia-caption">Practice uses questions from past Daily Fives. There are no past questions of this type yet. Play today’s Daily Five while the archive grows.</p>','<button id="archive-daily" class="primary">Play Daily Five</button>');
 $('roundlabel').textContent='PRACTICE';$('scoremax').textContent='';
 $('archive-daily').addEventListener('click',()=>{mini='mix';document.querySelectorAll('[data-mini]').forEach(b=>b.classList.toggle('active',b.dataset.mini===mini));start('daily');updateAside();});
}
// The selected answer uses exactly the precision shown by the dial.
function durationValue(seconds){const step=seconds>=86400?8640:seconds>=3600?60:seconds>=60?1:.1;return Math.round(seconds/step)*step;}
function durationText(seconds){seconds=durationValue(seconds);if(seconds>=86400)return pretty(seconds/86400)+' days';if(seconds>=3600){const minutes=Math.round(seconds/60);return Math.floor(minutes/60)+' h'+(minutes%60?' '+minutes%60+' min':'');}if(seconds>=60){const total=Math.round(seconds);return Math.floor(total/60)+' min'+(total%60?' '+total%60+' s':'');}return pretty(seconds)+' s';}
function triviaFeedback(value,q){return q.type==='timeline'?`${Math.abs(value-q.answer)} years away · Answer: ${q.answer} · You: ${value}`:`Answer: ${durationText(q.answer)} · You: ${durationText(value)}`;}
function triviaScore(value,q){const error=q.type==='timeline'?Math.abs(value-q.answer):Math.abs(Math.log(value/q.answer));if(error<=(q.type==='timeline'?0:.03))return 100;return Math.round(100*Math.max(0,1-error/(q.type==='timeline'?60:Math.log(4)))**2);}
function triviaPalette(){const css=getComputedStyle(document.documentElement);return Object.fromEntries(['ink','muted','line','draw','target','canvas'].map(k=>[k,css.getPropertyValue('--'+k).trim()]));}
function timelineYear(centre){return Math.round(Math.max(1850,Math.min(2026,centre)));}
function durationStep(seconds){return seconds>=86400?8640:seconds>=3600?60:seconds>=60?1:.1;}
function nudgeDuration(seconds,direction){return Math.max(1,Math.min(5184000,Math.round((durationValue(seconds)+direction*durationStep(durationValue(seconds)))*10)/10));}
function timelineRound(q){
 let selected=null,centre=1970,span=80;
 const low=1850,high=2026;
 shell(q,'<p class="trivia-caption">Slide the timeline. The centre marks your year.</p><div class="timeline-stage"><canvas id="timeline-canvas" width="400" height="200" tabindex="0" role="slider" aria-valuemin="1850" aria-valuemax="2026" aria-valuenow="1970" aria-label="Year. Slide the timeline or use arrow keys to adjust."></canvas></div><output class="trivia-value" id="trivia-value" aria-live="polite">Choose a year</output>','<div class="trivia-nudge"><button id="year-minus" class="nudge-button" aria-label="One year earlier">−</button><span>1 year steps</span><button id="year-plus" class="nudge-button" aria-label="One year later">+</button></div><button class="primary" id="trivia-lock" disabled>Choose a year</button>');
 const canvas=$('timeline-canvas'),ctx=canvas.getContext('2d'),yearX=y=>200+(y-centre)/span*340;
 const draw=target=>{
  const c=triviaPalette();ctx.clearRect(0,0,400,200);ctx.fillStyle=c.canvas;ctx.fillRect(0,0,400,200);
  ctx.strokeStyle=c.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,110);ctx.lineTo(370,110);ctx.stroke();
  const labelStep=span>120?20:10,tickStep=span>120?5:1;
  ctx.font='13px sans-serif';ctx.textAlign='center';
  for(let y=Math.max(low,Math.ceil((centre-span/2)/tickStep)*tickStep);y<=Math.min(high,centre+span/2);y+=tickStep){
   const x=yearX(y),major=y%labelStep===0;ctx.strokeStyle=c.line;ctx.lineWidth=major?2:1;ctx.beginPath();ctx.moveTo(x,major?98:105);ctx.lineTo(x,major?122:115);ctx.stroke();
   if(major){ctx.fillStyle=c.muted;ctx.fillText(y,x,145);}
  }
  const pin=(year,colour,label,top)=>{const x=yearX(year);ctx.strokeStyle=colour;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,top+12);ctx.lineTo(x,110);ctx.stroke();ctx.fillStyle=colour;ctx.beginPath();ctx.arc(x,top,7,0,Math.PI*2);ctx.fill();if(label){ctx.font='bold 15px sans-serif';ctx.fillText(label+' '+year,Math.max(70,Math.min(330,x)),top-16);}};
  // The fixed centre is always the selected year, even at either end of the timeline.
  pin(centre,selected===null?c.muted:c.draw,target===undefined?'':'You',70);
  if(target!==undefined)pin(target,c.target,'Answer',35);
 };
 const choose=y=>{centre=Math.max(low,Math.min(high,y));selected=timelineYear(centre);$('trivia-value').textContent=selected;$('trivia-lock').disabled=false;$('trivia-lock').textContent='Lock it in';canvas.setAttribute('aria-valuenow',selected);draw();};
 const nudge=direction=>{if(locked)return;choose((selected===null?timelineYear(centre):selected)+direction);};
 $('year-minus').addEventListener('click',()=>nudge(-1));$('year-plus').addEventListener('click',()=>nudge(1));
 let origin=null;
 const end=()=>{if(!origin)return;origin=null;canvas.classList.remove('dragging');centre=selected;draw();};
 canvas.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();origin={x:e.clientX,centre};canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId);choose(centre);});
 canvas.addEventListener('pointermove',e=>{if(!origin||locked)return;choose(origin.centre-(e.clientX-origin.x)/canvas.getBoundingClientRect().width*400/340*span);});
 canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
 canvas.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();if(e.key==='Home')choose(low);else if(e.key==='End')choose(high);else nudge((e.key==='ArrowRight'?1:-1)*(e.shiftKey?10:1));});
 $('trivia-lock').addEventListener('click',()=>{if(selected===null)return;origin=null;centre=selected;reveal(selected);span=Math.max(80,Math.abs(selected-q.answer)*2.4+20);draw(q.answer);$('trivia-value').textContent='Your year · answer revealed';});
 draw();
}
function durationRound(q){
 let selected=60,touched=false;
 const maxLog=Math.log(60*86400),start=135*Math.PI/180,sweep=270*Math.PI/180;
 shell(q,`<p class="trivia-caption">${escapeHTML(q.caption)}</p><div class="duration-stage"><canvas id="duration-canvas" width="400" height="300" tabindex="0" role="slider" aria-valuemin="1" aria-valuemax="5184000" aria-valuenow="60" aria-label="Duration. Turn the dial, then use minus and plus to fine tune."></canvas></div>`,'<div class="trivia-nudge"><button id="duration-minus" class="nudge-button" aria-label="Decrease duration">−</button><span id="duration-step">1 s steps</span><button id="duration-plus" class="nudge-button" aria-label="Increase duration">+</button></div><button class="primary" id="trivia-lock" disabled>Choose a duration</button>');
 const canvas=$('duration-canvas'),ctx=canvas.getContext('2d'),angle=v=>start+Math.log(v)/maxLog*sweep;
 const draw=target=>{
  const c=triviaPalette();ctx.clearRect(0,0,400,300);ctx.fillStyle=c.canvas;ctx.fillRect(0,0,400,300);ctx.lineWidth=12;ctx.strokeStyle=c.line;ctx.beginPath();ctx.arc(200,145,100,start,start+sweep);ctx.stroke();ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const [v,label]of [[1,'1 s'],[60,'1 min'],[3600,'1 h'],[86400,'1 day'],[5184000,'60 days']]){const a=angle(v);ctx.fillStyle=c.muted;ctx.fillText(label,200+Math.cos(a)*132,145+Math.sin(a)*132);}
  const mark=(v,colour,r)=>{const a=angle(v);ctx.strokeStyle=colour;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(200+Math.cos(a)*72,145+Math.sin(a)*72);ctx.lineTo(200+Math.cos(a)*112,145+Math.sin(a)*112);ctx.stroke();ctx.fillStyle=colour;ctx.beginPath();ctx.arc(200+Math.cos(a)*100,145+Math.sin(a)*100,r,0,Math.PI*2);ctx.fill();};
  mark(selected,c.draw,9);if(target!==undefined)mark(target,c.target,6);ctx.fillStyle=c.ink;ctx.font='bold 26px sans-serif';ctx.fillText(touched?durationText(selected):'How long?',200,138);ctx.fillStyle=c.muted;ctx.font='13px sans-serif';ctx.fillText(target!==undefined?'You · target marked':touched?'YOUR GUESS':'TURN THE DIAL',200,169);
 };
 const choose=v=>{selected=durationValue(Math.max(1,Math.min(5184000,v)));touched=true;$('trivia-lock').disabled=false;$('trivia-lock').textContent='Lock it in';const step=durationStep(selected),label=step===8640?'0.1 day':step===60?'1 min':step===1?'1 s':'0.1 s';$('duration-step').textContent=label+' steps';$('duration-minus').setAttribute('aria-label','Decrease by '+label);$('duration-plus').setAttribute('aria-label','Increase by '+label);canvas.setAttribute('aria-valuenow',selected);canvas.setAttribute('aria-valuetext',durationText(selected));draw();};
 const nudge=direction=>{if(!locked)choose(nudgeDuration(selected,direction));};
 $('duration-minus').addEventListener('click',()=>nudge(-1));$('duration-plus').addEventListener('click',()=>nudge(1));
 let dragging=false;
 const point=e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*400-200,y=(e.clientY-rect.top)/rect.height*300-145;let a=(Math.atan2(y,x)-start+Math.PI*2)%(Math.PI*2);if(a>sweep)a=a<(sweep+Math.PI*2)/2?sweep:0;choose(Math.exp(a/sweep*maxLog));};
 canvas.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();dragging=true;canvas.setPointerCapture(e.pointerId);point(e);});canvas.addEventListener('pointermove',e=>{if(dragging&&!locked)point(e);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 canvas.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const direction=['ArrowRight','ArrowUp'].includes(e.key)?1:-1;if(e.shiftKey)choose(selected*Math.exp(direction*.02));else nudge(direction);});
 $('trivia-lock').addEventListener('click',()=>{if(touched){reveal(selected);draw(q.answer);}});draw();
}
