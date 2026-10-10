function viewQuaternion(o){
 const m=rotationMatrix(o),t=m[0]+m[4]+m[8];let x,y,z,w;
 if(t>0){const s=Math.sqrt(t+1)*2;w=s/4;x=(m[7]-m[5])/s;y=(m[2]-m[6])/s;z=(m[3]-m[1])/s;}
 else if(m[0]>m[4]&&m[0]>m[8]){const s=Math.sqrt(1+m[0]-m[4]-m[8])*2;w=(m[7]-m[5])/s;x=s/4;y=(m[1]+m[3])/s;z=(m[2]+m[6])/s;}
 else if(m[4]>m[8]){const s=Math.sqrt(1+m[4]-m[0]-m[8])*2;w=(m[2]-m[6])/s;x=(m[1]+m[3])/s;y=s/4;z=(m[5]+m[7])/s;}
 else{const s=Math.sqrt(1+m[8]-m[0]-m[4])*2;w=(m[3]-m[1])/s;x=(m[2]+m[6])/s;y=(m[5]+m[7])/s;z=s/4;}
 return [x,y,z,w];
}
function interpolateView(a,b,t){
 const x=viewQuaternion(a);let y=viewQuaternion(b),dot=x.reduce((s,v,i)=>s+v*y[i],0);
 if(dot<0){y=y.map(v=>-v);dot=-dot;}
 dot=Math.min(1,dot);let q;
 if(dot>.9995){q=x.map((v,i)=>v+(y[i]-v)*t);const length=Math.hypot(...q);q=q.map(v=>v/length);}
 else{const theta=Math.acos(dot),s=Math.sin(theta);q=x.map((v,i)=>(Math.sin((1-t)*theta)*v+Math.sin(t*theta)*y[i])/s);}
 const [u,v,w,k]=q;
 return {matrix:[1-2*(v*v+w*w),2*(u*v-w*k),2*(u*w+v*k),2*(u*v+w*k),1-2*(u*u+w*w),2*(v*w-u*k),2*(u*w-v*k),2*(v*w+u*k),1-2*(u*u+v*v)]};
}
function animateViewResult(q,guess){
 const canvas=$('view-canvas'),hint=$('view-hint');
 canvas.setAttribute('aria-label','The lime outline marks the target. The solid shape moves between your selected view and the target.');
 const outlines=()=>{const style=getComputedStyle(document.documentElement);drawShape3D(canvas,q.answer,{shape:q.shape,overlay:true,outlineOnly:true,dashed:true,outlineColor:style.getPropertyValue('--target').trim()});};
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){drawShape3D(canvas,guess,{shape:q.shape});outlines();hint.textContent='Solid: your view · Lime outline: target.';return;}
 canvas.parentElement.classList.add('view-result-stage');
 canvas.parentElement.insertAdjacentHTML('beforeend','<span id="view-result-phase" class="view-result-phase"></span>');
 const label=$('view-result-phase');
 hint.textContent='';hint.hidden=true;
 const start=performance.now(),travel=2200,pause=800,half=travel+pause;
 const frame=()=>{
  if($('view-canvas')!==canvas||!locked)return;
  const elapsed=(performance.now()-start)%(half*2),back=elapsed>=half,phase=elapsed%half,progress=Math.min(1,Math.max(0,(phase-pause)/travel)),ease=(1-Math.cos(progress*Math.PI))/2,t=back?1-ease:ease;
  if(!document.hidden){drawShape3D(canvas,interpolateView(guess,q.answer,t),{shape:q.shape});outlines();}
  label.textContent=phase<pause?(back?'Target view':'Your view'):(back?'Target → Your view':'Your view → Target');
  afterEffect(frame,33);
 };
 frame();
}
function styleViewFeedback(q,value,score){
 const feedback=$('actionarea').querySelector('.feedback'),error=orientationError(value,q.answer);
 const verdict=score===100?'You nailed it.':score>=90?'Sharp eyes.':score>=75?'Pretty dialed in.':score>=50?'In the neighbourhood.':score>=25?'A generous interpretation.':score>0?'Bold. Incorrect.':'Did you memorize the back of your phone?';
 feedback.classList.add('view-feedback');
 feedback.querySelector('.feedbacktop').innerHTML=`<div class="view-result-stats"><div class="view-result-error"><strong>${error.toFixed(1)}<small>°</small></strong><span>rotation off</span></div><div class="view-result-points"><strong>${score}<small>/100</small></strong><span>points earned</span></div></div><p class="view-verdict">${verdict}</p>`;
 feedback.querySelector('.colour-comparison')?.remove();
}
