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
 const low=1850,high=2026,rowHeight=48;
 let selected=1970,touched=false;
 shell(q,'<p class="trivia-caption">Scroll to a year. The centre is your pick.</p><div class="timeline-stage year-picker"><div id="year-wheel" class="year-wheel" tabindex="0" role="slider" aria-label="Year. Scroll vertically or use up and down arrows." aria-valuemin="1850" aria-valuemax="2026" aria-valuenow="1970">'+Array.from({length:high-low+1},(_,i)=>'<div class="year-row" data-year="'+(low+i)+'" aria-hidden="true">'+(low+i)+'</div>').join('')+'</div><div class="year-selection" aria-hidden="true"></div></div>','<button class="primary" id="trivia-lock" disabled>Choose a year</button>');
 const wheel=$('year-wheel'),stage=wheel.parentElement;
 const update=()=>{wheel.setAttribute('aria-valuenow',selected);wheel.setAttribute('aria-valuetext',String(selected));if(touched){$('trivia-lock').disabled=false;$('trivia-lock').textContent='Lock it in';}};
 const choose=year=>{if(locked)return;motion++;wheel.classList.remove('year-wheel-dragging');selected=timelineYear(year);touched=true;wheel.scrollTop=(selected-low)*rowHeight;update();};
 const fit=()=>{if(!wheel.isConnected){observer?.disconnect();return;}wheel.style.paddingBlock=Math.max(0,(stage.clientHeight-rowHeight)/2)+'px';wheel.scrollTop=(selected-low)*rowHeight;};
 let observer=null;
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(fit);observer.observe(stage);}
 fit();update();
 const touch=()=>{if(locked)return;touched=true;update();};
 let drag=null,suppressClick=false,motion=0;
 const snap=()=>{wheel.classList.remove('year-wheel-dragging');choose(low+wheel.scrollTop/rowHeight);};
 wheel.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();touch();motion++;suppressClick=false;drag={y:e.clientY,time:performance.now(),velocity:0,start:e.clientY};wheel.classList.add('year-wheel-dragging');wheel.setPointerCapture(e.pointerId);});
 wheel.addEventListener('pointermove',e=>{if(!drag||locked)return;e.preventDefault();const now=performance.now(),delta=drag.y-e.clientY;drag.velocity=delta/Math.max(16,now-drag.time);wheel.scrollTop=Math.max(0,Math.min((high-low)*rowHeight,wheel.scrollTop+delta));selected=timelineYear(low+wheel.scrollTop/rowHeight);update();if(Math.abs(e.clientY-drag.start)>4)suppressClick=true;drag.y=e.clientY;drag.time=now;});
 const endDrag=()=>{if(!drag)return;let velocity=performance.now()-drag.time<100?drag.velocity:0;drag=null;const token=++motion;
  const coast=()=>{if(locked||token!==motion||!wheel.isConnected)return;const previous=wheel.scrollTop;wheel.scrollTop=Math.max(0,Math.min((high-low)*rowHeight,previous+velocity*16));selected=timelineYear(low+wheel.scrollTop/rowHeight);update();velocity*=.9;if(Math.abs(velocity)<.08||Math.abs(wheel.scrollTop-previous)<.1){snap();return;}afterEffect(coast,16);};
  if(suppressClick&&Math.abs(velocity)>.08)coast();else snap();
 };
 wheel.addEventListener('pointerup',endDrag);wheel.addEventListener('pointercancel',()=>{motion++;drag=null;snap();});wheel.addEventListener('lostpointercapture',endDrag);
 wheel.addEventListener('wheel',()=>{if(locked)return;motion++;wheel.classList.remove('year-wheel-dragging');touch();},{passive:true});
 wheel.addEventListener('scroll',()=>{if(locked)return;selected=timelineYear(low+wheel.scrollTop/rowHeight);update();},{passive:true});
 wheel.addEventListener('click',e=>{if(suppressClick)return;const row=e.target.closest('[data-year]');if(row)choose(Number(row.dataset.year));});
 wheel.addEventListener('keydown',e=>{if(locked||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','PageUp','PageDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?10:1;choose(e.key==='Home'?low:e.key==='End'?high:selected+(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)?-1:1)*(e.key.startsWith('Page')?10:step));});
 $('trivia-lock').addEventListener('click',()=>{if(!touched||locked)return;selected=timelineYear(low+wheel.scrollTop/rowHeight);wheel.scrollTop=(selected-low)*rowHeight;reveal(selected);fit();wheel.setAttribute('aria-disabled','true');wheel.classList.add('year-wheel-locked');const answer=document.createElement('div');answer.className='year-answer';answer.textContent='Answer · '+q.answer;stage.appendChild(answer);});
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
 const point=e=>{const p=canvasPointerPoint(canvas,e),x=p.x-200,y=p.y-145;let a=(Math.atan2(y,x)-start+Math.PI*2)%(Math.PI*2);if(a>sweep)a=a<(sweep+Math.PI*2)/2?sweep:0;choose(Math.exp(a/sweep*maxLog));};
 canvas.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();dragging=true;canvas.setPointerCapture(e.pointerId);point(e);});canvas.addEventListener('pointermove',e=>{if(dragging&&!locked)point(e);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 canvas.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const direction=['ArrowRight','ArrowUp'].includes(e.key)?1:-1;if(e.shiftKey)choose(selected*Math.exp(direction*.02));else nudge(direction);});
 $('trivia-lock').addEventListener('click',()=>{if(touched){reveal(selected);draw(q.answer);}});draw();
}
