function angleRound(q){let angle=0,chosen=false;
 shell(q,`<div class="angle-wrap"><canvas width="400" height="400" id="angle-dial" tabindex="0" role="application" aria-label="Rotate the line to ${q.answer} degrees. Left and right arrows adjust it."></canvas></div>`,`<p class="small-instruction">Drag the line or use arrow keys.</p><button class="primary" id="angle-lock" disabled>Choose your angle</button>`);
 const dial=$('angle-dial');
 const choose=v=>{if(locked)return;angle=(v%360+360)%360;chosen=true;drawAngle(angle,undefined,false);$('angle-lock').disabled=false;$('angle-lock').textContent='Lock it in';};
 const point=e=>{const p=canvasPointerPoint(dial,e),x=p.x-200,y=200-p.y;if(Math.hypot(x,y)>8)choose(Math.atan2(y,x)*180/Math.PI);};
 let drag=false;dial.addEventListener('pointerdown',e=>{e.preventDefault();drag=true;dial.setPointerCapture(e.pointerId);point(e);});dial.addEventListener('pointermove',e=>{if(drag)point(e);});dial.addEventListener('pointerup',()=>drag=false);dial.addEventListener('pointercancel',()=>drag=false);
 dial.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();choose(angle+(e.key==='ArrowLeft'?1:-1));}});
 $('angle-lock').addEventListener('click',()=>{if(chosen)reveal(angle);});drawAngle(angle,undefined,true);
}
function drawAngle(angle,target,showZero=false){
 const canvas=$('angle-dial');if(!canvas)return;const ctx=canvas.getContext('2d'),style=getComputedStyle(document.documentElement),colour=name=>style.getPropertyValue('--'+name).trim();
 ctx.clearRect(0,0,400,400);ctx.strokeStyle=colour('line');ctx.lineWidth=2;ctx.beginPath();ctx.arc(200,200,170,0,Math.PI*2);ctx.stroke();
 const line=(a,c,width,dashed=false)=>{const t=a*Math.PI/180;ctx.beginPath();ctx.setLineDash(dashed?[5,6]:[]);ctx.moveTo(200,200);ctx.lineTo(200+Math.cos(t)*160,200-Math.sin(t)*160);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();ctx.setLineDash([]);};
 if(showZero)line(0,colour('muted'),2,true);
 if(target!==undefined)line(target,colour('target'),5);
 line(angle,colour('draw'),5);ctx.fillStyle=colour('ink');ctx.beginPath();ctx.arc(200,200,6,0,Math.PI*2);ctx.fill();
}
