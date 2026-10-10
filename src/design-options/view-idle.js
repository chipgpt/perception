function canvasDisplayScale(canvas){
 const r=canvas.getBoundingClientRect();return Math.min(r.width/canvas.width,r.height/canvas.height);
}
function canvasPointerPoint(canvas,e){
 const r=canvas.getBoundingClientRect(),scale=canvasDisplayScale(canvas),w=canvas.width,h=canvas.height;
 return {x:(e.clientX-r.left-(r.width-w*scale)/2)/scale,y:(e.clientY-r.top-(r.height-h*scale)/2)/scale};
}
function viewPointerPoint(canvas,e){return canvasPointerPoint(canvas,e);}
function spinIdleView(q){
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const canvas=$('view-canvas'),started=performance.now();
 const frame=()=>{
  if($('view-canvas')!==canvas||$('show-view')?.disabled)return;
  if(!document.hidden)drawShape3D(canvas,{yaw:((performance.now()-started)*.025)%360,pitch:0,roll:0},{shape:q.shape});
  afterEffect(frame,33);
 };
 frame();
}

function overlayViewStart(buttonId='show-view',canvasId='view-canvas'){
 const button=$(buttonId),stage=$(canvasId).closest('.spatial-wrap,.memory-stage');
 stage.querySelector('.memory-prompt')?.remove();
 stage.classList.add('view-start-stage','view-start-waiting');button.classList.add('view-start-overlay');stage.appendChild(button);
}
function beginViewPreview(buttonId='show-view',canvasId='view-canvas'){
 const button=$(buttonId);$(canvasId).closest('.spatial-wrap,.memory-stage').classList.remove('view-start-waiting');button.classList.remove('view-start-overlay');$('controls').appendChild(button);
}
