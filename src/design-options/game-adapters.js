// Per-game presentation and lifecycle adapters. Register a replacement here;
// the controller and the shared shell do not need to know its markup.
const memoryArtwork={
 motion:'<path d="M18 76C18 42 43 17 61 31S41 77 65 79S93 58 91 30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="76" r="5" fill="var(--paper)" stroke="currentColor" stroke-width="2"/><circle cx="91" cy="30" r="4" fill="currentColor"/>',
 colour:'<rect x="21" y="21" width="68" height="68" rx="7" fill="currentColor" fill-opacity=".12"/><path d="M32 12H18a6 6 0 0 0-6 6v14m66-20h14a6 6 0 0 1 6 6v14M12 78v14a6 6 0 0 0 6 6h14m46 0h14a6 6 0 0 0 6-6V78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
};
registerGame('view3d',{initialPhase:'ready',reveal:(q,value)=>animateViewResult(q,value),render:q=>viewRound(q),presentation:(q,phase)=>({title:phase==='ready'?'Remember this view.':'Match the view.',subtitle:phase==='ready'?'Look closely. Then turn it back.':'Rotate the shape to match what you saw.',hint:'Study the shape. You’ll have three seconds.'})});
registerGame('balance',{reveal:revealBalance,render:q=>balanceRound(q),presentation:q=>q.fruit?{title:'Make an even split.',subtitle:'One cut. Two equal portions.'}:{title:q.title,subtitle:'Find the centre of balance.'}});
registerGame('halfhalf',{reveal:revealBalance,render:q=>halfRound(q),presentation:()=>({title:'Make an even split.',subtitle:'One cut. Two equal portions.'})});
registerGame('motion',{initialPhase:'ready',reveal:(q,value)=>drawTrace(value,q.answer),ready:{artwork:memoryArtwork.motion,caption:'A line will appear here.'},render:q=>motionRound(q),presentation:(q,phase)=>({title:phase==='ready'?'Remember the line.':'Trace it from memory.',subtitle:phase==='ready'?'Look once. Then trace it from memory.':'One stroke. As close as you can.'})});
registerGame('perspective',{reveal:(q,value)=>drawPerspective(q,value,true),render:q=>perspectiveRound(q),presentation:()=>({title:'Where do the lines meet?',subtitle:'Find the vanishing point.'})});
registerGame('proportion',{reveal:(q,value)=>drawProportion(value,q,true),render:q=>proportionRound(q),presentation:q=>isSizeQuestion(q)?{title:q.wide+' '+(q.wide===1?'square':'squares')+' wide.\n'+q.tall+' '+(q.tall===1?'square':'squares')+' tall.',subtitle:'The shaded square is your reference.'}:{title:q.title,subtitle:'Stretch a rectangle to match the ratio.'}});
registerGame('rhythm',{render:q=>rhythmRound(q),presentation:()=>({title:'Find your rhythm.',subtitle:'Watch the pulse. Then tap it back.',hint:'Five flashes. Five taps. No sound.'})});
registerGame('angle',{reveal:(q,value)=>drawAngle(value,q.answer),render:q=>angleRound(q),presentation:q=>({title:'Make a '+q.answer+'° angle.',subtitle:'One number. Trust your eye.'})});
registerGame('colour',{initialPhase:'ready',reveal:q=>{$('wheel').setAttribute('aria-disabled','true');drawWheel(q.answer);},ready:{artwork:memoryArtwork.colour,caption:'A colour will appear here.'},render:q=>memoryRound(q),presentation:(q,phase)=>({title:phase==='ready'?'Remember a colour.':'Find that colour.',subtitle:phase==='ready'?'Look closely. Then find it on the wheel.':'Choose the hue and how vivid it is.',hint:phase==='ready'?'You’ll have two seconds to remember it.':''})});
registerGame('time',{label:'Time',reveal:(q,value)=>{$('game-stage').querySelector('.time-cue').innerHTML=`<strong>${value.toFixed(2)}</strong><span>SECONDS ELAPSED</span>`;},render:q=>timeRound(q),presentation:()=>({title:'Trust your internal clock.',subtitle:'Start. Wait. Stop.'})});
registerGame('timeline',{render:q=>timelineRound(q),presentation:()=>({subtitle:'A moment in history. Your best guess.',hint:'Scroll to a year. The centre is your pick.'})});
registerGame('duration',{render:q=>durationRound(q),presentation:q=>({subtitle:q.caption,hint:'Turn the dial to your best guess.'})});
// Older saved rounds still use the same shared slots.
registerGame('typography',{reveal:revealTypography,render:q=>typographyRound(q)});
registerGame('choices',{render:q=>choicesRound(q)});

function revealBalance(q,value,score){
 if(q.fruit){drawHalfFruit($('balance-canvas'),q,value,true);$('balance-canvas').setAttribute('aria-label',halfSplitText(value,q)+'. Your line is unchanged. The parallel green line shows an even cut.');return;}
 const tilt=score===100?0:Math.sign(q.answer-value)*18;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){drawBalance(q,value,tilt,true);return;}
 for(let i=0;i<=15;i++)afterEffect(()=>drawBalance(q,value,tilt*i/15,true),i*20);
}
function revealTypography(q,value){
 const preview=$('type-preview');preview.classList.add('type-overlay');
 preview.innerHTML=typeHTML(q.word,value).replace('class="type-word"','class="type-word type-overlay-guess"')+typeHTML(q.word,q.answer).replace('class="type-word"','class="type-word type-overlay-target"');
 preview.setAttribute('aria-label','Your text with the target overlaid as a lime outline.');
}
