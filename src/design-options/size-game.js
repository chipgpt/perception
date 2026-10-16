// Dimensions are stored in a fixed square coordinate system. The canvas and
// handle use the same uniform display scale; resizing never changes a guess.
const SIZE_BOUNDS=Object.freeze({x:48,y:90,min:32,width:304,height:207});
const SIZE_ERROR_BOUND=.5;
const SIZE_DAILY_START='2026-10-15';
function isSizeQuestion(q){return q.measurementVersion===2;}
function sizeQuestion(random,round){
 // At least one dimension must grow beyond the starting reference square.
 const wide=integerBetween(random,1,5),tall=integerBetween(random,wide===1?2:1,4);
 const reference=integerBetween(random,32,Math.floor(Math.min(54,260/wide,175/tall)));
 return {id:'proportion-'+round,type:'proportion',measurementVersion:2,skill:'Size it up',
  title:wide+' '+(wide===1?'square':'squares')+' wide / '+tall+' '+(tall===1?'square':'squares')+' tall',
  wide,tall,reference,answer:{width:wide*reference,height:tall*reference},
  start:{width:reference,height:reference},
  tip:'Dashed outline: your rectangle. Solid grid: target.',
  explain:'Measure both dimensions against the visible square. Width and height earn equal shares of the points.'};
}
function clampSize(size){return {width:Math.max(SIZE_BOUNDS.min,Math.min(SIZE_BOUNDS.width,size.width)),height:Math.max(SIZE_BOUNDS.min,Math.min(SIZE_BOUNDS.height,size.height))};}
function sizeErrors(value,q){return {width:Math.abs(value.width/q.answer.width-1),height:Math.abs(value.height/q.answer.height-1)};}
function sizeScore(value,q){
 const e=sizeErrors(value,q),axis=n=>{const closeness=Math.max(0,1-n/SIZE_ERROR_BOUND);return q.scoringVersion===2?closeness:closeness**2;};
 if(!Number.isFinite(e.width)||!Number.isFinite(e.height)||value.width<=0||value.height<=0)return 0;
 return Math.round(50*(axis(e.width)+axis(e.height)));
}
function sizeFeedback(value,q){
 const axis=(name,small,large)=>{const delta=value[name]/q.answer[name]-1,pct=Math.abs(delta)*100;
  return pct<.05?name+' spot on':pct.toFixed(1)+'% '+(delta<0?small:large);};
 return axis('width','too narrow','too wide')+' · '+axis('height','too short','too tall');
}
function proportionRound(q){
 if(!isSizeQuestion(q)){legacyProportionRound(q);return;}
 let size={width:q.reference,height:q.reference},drag=null;
 shell(q,'<div class="spatial-wrap size-stage"><canvas id="proportion-canvas" width="400" height="400" data-logical-width="400" data-logical-height="400" role="img" aria-label="Your rectangle starts as one reference square. The shaded square stays fixed as you resize."></canvas><button id="size-handle" class="size-handle" aria-label="Resize rectangle. Left and right change width; up and down change height. Hold Shift for larger steps."><span aria-hidden="true"><svg width="10" height="10" viewBox="0 0 16 16"><path d="M3 3L13 13M5 13H13V5" fill="none" stroke="currentColor" stroke-width="2"/></svg></span></button></div>',
  '<p class="small-instruction">Drag the corner. Trust your eye.</p><button id="proportion-lock" class="primary">Lock it in</button>');
 const canvas=$('proportion-canvas'),handle=$('size-handle');
 const positionHandle=()=>{const r=canvas.getBoundingClientRect(),scale=canvasDisplayScale(canvas);
  handle.style.left=((r.width-400*scale)/2+(SIZE_BOUNDS.x+size.width)*scale)+'px';
  handle.style.top=((r.height-400*scale)/2+(SIZE_BOUNDS.y+size.height)*scale)+'px';};
 const draw=()=>{drawProportion(size,q);positionHandle();};
 handle.addEventListener('pointerdown',e=>{if(locked||drag||e.isPrimary===false||e.button>0)return;e.preventDefault();handle.focus();handle.setPointerCapture(e.pointerId);drag={id:e.pointerId,point:canvasPointerPoint(canvas,e),size:{...size}};});
 handle.addEventListener('pointermove',e=>{if(locked||!drag||drag.id!==e.pointerId)return;
  const p=canvasPointerPoint(canvas,e);size=clampSize({width:drag.size.width+p.x-drag.point.x,height:drag.size.height+p.y-drag.point.y});draw();});
 const release=e=>{if(drag?.id===e.pointerId)drag=null;};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,release);
 handle.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const amount=e.shiftKey?10:1;
  const axis=['ArrowLeft','ArrowRight'].includes(e.key)?'width':'height';size=clampSize({...size,[axis]:size[axis]+(['ArrowLeft','ArrowUp'].includes(e.key)?-amount:amount)});draw();});
 $('proportion-lock').addEventListener('click',()=>{if(!locked){handle.hidden=true;reveal({...size});}});
 const onResize=()=>{drag=null;drawProportion(size,q,locked);positionHandle();};
 if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(onResize);observer.observe(canvas);onGameCleanup(()=>observer.disconnect());}
 if(typeof window!=='undefined'){window.addEventListener('resize',onResize);onGameCleanup(()=>window.removeEventListener('resize',onResize));}
 onGameRedraw(()=>drawProportion(size,q,locked));draw();
}
function paintSize(canvas,size,q,revealed){
 // Keep game geometry in 400 logical units; only the backing bitmap changes.
 if(canvas.isConnected){const r=canvas.getBoundingClientRect(),pixels=Math.max(1,Math.round(Math.min(r.width,r.height)*(window.devicePixelRatio||1)));if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels;}}
 const ctx=canvas.getContext('2d'),c=gamePaint(),{x,y}=SIZE_BOUNDS,scale=canvas.width/400;
 ctx.setTransform(scale,0,0,scale,0,0);
 // Align both edges of each stroke to device pixels without rounding the guess.
 const outline=(left,top,width,height,weight)=>{const pixels=Math.max(1,Math.round(weight*scale)),snap=n=>(Math.round(n*scale-pixels/2)+pixels/2)/scale,l=snap(left),t=snap(top);ctx.lineWidth=pixels/scale;ctx.strokeRect(l,t,snap(left+width)-l,snap(top+height)-t);};
 ctx.clearRect(0,0,400,400);
 ctx.fillStyle=c.muted;ctx.font=c.font(13);ctx.fillText('Reference square',x,y-18);
 ctx.fillStyle=c.draw;ctx.globalAlpha=.12;ctx.fillRect(x,y,q.reference,q.reference);ctx.globalAlpha=1;
 if(!revealed){ctx.strokeStyle=c.muted;ctx.setLineDash([3,3]);outline(x,y,q.reference,q.reference,c.guide);ctx.setLineDash([]);}
 if(revealed){ctx.strokeStyle=c.target;ctx.lineWidth=c.guide;
  for(let col=0;col<q.wide;col++)for(let row=0;row<q.tall;row++)outline(x+col*q.reference,y+row*q.reference,q.reference,q.reference,c.guide);
  outline(x,y,q.answer.width,q.answer.height,c.mark);}
 ctx.strokeStyle=c.draw;ctx.setLineDash(revealed?[7,5]:[]);outline(x,y,size.width,size.height,c.mark);ctx.setLineDash([]);
 if(revealed){ctx.font=c.font(12);ctx.fillStyle=c.ink;ctx.fillText('Dashed: you · Solid grid: target',48,389);}
}
function drawProportion(size,q,revealed=false){
 if(!isSizeQuestion(q)){legacyDrawProportion(size,revealed?q.answer:undefined);return;}
 const canvas=$('proportion-canvas');if(canvas){paintSize(canvas,size,q,revealed);if(revealed)canvas.setAttribute('aria-label',sizeFeedback(size,q)+'. Dashed outline is your rectangle; solid grid is the target.');}
}
