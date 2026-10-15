function angleRound(q){let angle=0,chosen=false;
 shell(q,`<div class="angle-wrap"><canvas width="400" height="400" id="angle-dial" tabindex="0" role="application" aria-label="Rotate the line to ${q.answer} degrees. Zero degrees points right; angles increase counterclockwise. Left arrow increases the angle; right arrow decreases it."></canvas></div>`,`<p class="small-instruction">0° points right · Measure counterclockwise ↺<br>Drag the line or use arrow keys.</p><button class="primary" id="angle-lock" disabled>Choose your angle</button>`);
 const dial=$('angle-dial');let moved=false;
 const choose=v=>{if(locked)return;const next=(v%360+360)%360;if(Math.abs(next-angle)>1e-6)moved=true;angle=next;chosen=true;drawAngle(angle,undefined,!moved);$('angle-lock').disabled=false;$('angle-lock').textContent='Lock it in';};
 const point=e=>{const p=canvasPointerPoint(dial,e),x=p.x-200,y=200-p.y;if(Math.hypot(x,y)>8)choose(Math.atan2(y,x)*180/Math.PI);};
 let drag=false;dial.addEventListener('pointerdown',e=>{e.preventDefault();drag=true;dial.setPointerCapture(e.pointerId);point(e);});dial.addEventListener('pointermove',e=>{if(drag)point(e);});dial.addEventListener('pointerup',()=>drag=false);dial.addEventListener('pointercancel',()=>drag=false);
 dial.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();choose(angle+(e.key==='ArrowLeft'?1:-1));}});
 $('angle-lock').addEventListener('click',()=>{if(chosen)reveal(angle);});onGameRedraw(()=>drawAngle(angle,locked?q.answer:undefined,!moved));drawAngle(angle,undefined,true);
}
function drawAngle(angle,target,showGuides=false){
 const canvas=$('angle-dial');if(!canvas)return;const ctx=canvas.getContext('2d'),c=gamePaint(),colour=name=>c[name];
 ctx.clearRect(0,0,400,400);ctx.strokeStyle=colour('line');ctx.lineWidth=c.guide;ctx.beginPath();ctx.arc(200,200,170,0,Math.PI*2);ctx.stroke();
 const line=(a,c,width,dashed=false)=>{const t=a*Math.PI/180;ctx.beginPath();ctx.setLineDash(dashed?[5,6]:[]);ctx.moveTo(200,200);ctx.lineTo(200+Math.cos(t)*160,200-Math.sin(t)*160);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();ctx.setLineDash([]);};
 if(showGuides){
 line(0,colour('muted'),2,true);
 // Explain the reference and direction before the player moves the line.
 ctx.fillStyle=colour('ink');ctx.font=c.font(16,500,true);ctx.textAlign='center';ctx.fillText('0°',378,185);
 const end=-Math.PI/3,radius=106,x=200+Math.cos(end)*radius,y=200+Math.sin(end)*radius,direction=end-Math.PI/2;
 ctx.strokeStyle=colour('muted');ctx.lineWidth=c.guide;ctx.lineCap='round';ctx.beginPath();ctx.arc(200,200,radius,-.12,end,true);ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-12*Math.cos(direction-.45),y-12*Math.sin(direction-.45));ctx.lineTo(x,y);ctx.lineTo(x-12*Math.cos(direction+.45),y-12*Math.sin(direction+.45));ctx.stroke();
 }
 if(target!==undefined)line(target,colour('target'),c.mark,true);
 line(angle,colour('draw'),c.mark);ctx.fillStyle=colour('ink');ctx.beginPath();ctx.arc(200,200,6,0,Math.PI*2);ctx.fill();
}
