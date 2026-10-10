// Equal filled area on either side of a cut; saved fruit rounds remain playable.
const HALF_OBJECTS=['blob-3','blob-4','blob-5','blob-6','blob-7'];
const HALF_SAVED_OBJECTS=[...HALF_OBJECTS,'blob-2','pear','strawberry','mango','watermelon','peach'];
function halfBlobShape(kind,random){
 const lobes=Number(kind.split('-')[1]),phase=random()*Math.PI*2,stretch=.75+random()*.6;
 // Alternate generous lobes and deep valleys, with different sizes and widths.
 // Positive radii and increasing angles keep the outline simple, without crossings.
 const anchors=[],points=[];
 for(let i=0;i<lobes;i++){
  anchors.push({a:i*Math.PI*2/lobes,r:65+random()*75});
  anchors.push({a:(i+.35+random()*.3)*Math.PI*2/lobes,r:23+random()*23});
 }
 anchors[Math.floor(random()*lobes)*2].r=150;
 for(let i=0;i<240;i++){
  const a=i/240*Math.PI*2;let index=anchors.findIndex((p,j)=>a>=p.a&&a<(anchors[j+1]?.a??Math.PI*2));
  const left=anchors[index],right=anchors[(index+1)%anchors.length],end=index+1===anchors.length?Math.PI*2:right.a;
  const t=(a-left.a)/(end-left.a),smooth=(1-Math.cos(t*Math.PI))/2,r=left.r+(right.r-left.r)*smooth;
  points.push({x:200+Math.cos(a+phase)*r*stretch,y:180+Math.sin(a+phase)*r/stretch});
 }
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),scale=Math.min(270/(maxX-minX),240/(maxY-minY));
 const base=points.map(p=>({x:Math.round((200+(p.x-(minX+maxX)/2)*scale)*1000)/1000,y:Math.round((180+(p.y-(minY+maxY)/2)*scale)*1000)/1000}));
 return {kind,base,points:base,rotation:0,sx:1,sy:1,skew:0};
}
function halfPolygonsApart(a,b,gap=10){
 for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],length=Math.hypot(q.x-p.x,q.y-p.y),nx=-(q.y-p.y)/length,ny=(q.x-p.x)/length;
  const project=points=>points.map(v=>v.x*nx+v.y*ny),pa=project(a),pb=project(b);
  if(Math.max(...pa)+gap<=Math.min(...pb)||Math.max(...pb)+gap<=Math.min(...pa))return true;
 }
 return false;
}
function halfClusterCandidate(kind,random){
 const count=3+Math.floor(random()*3),regions=[];
 for(let index=0;index<count;index++){
  const type=Math.floor(random()*5);let raw;
  if(type===0)raw=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
  if(type===1)raw=[{x:.2+random()*.6,y:0},{x:1,y:1},{x:0,y:1}];
  if(type===2){const inset=.12+random()*.2;raw=[{x:inset,y:0},{x:1-inset,y:0},{x:1,y:1},{x:0,y:1}];}
  if(type===3)raw=Array.from({length:6},(_,i)=>({x:Math.cos(i*Math.PI/3),y:Math.sin(i*Math.PI/3)}));
  if(type===4)raw=Array.from({length:48},(_,i)=>({x:Math.cos(i*Math.PI/24),y:Math.sin(i*Math.PI/24)}));
  const minX=Math.min(...raw.map(p=>p.x)),maxX=Math.max(...raw.map(p=>p.x)),minY=Math.min(...raw.map(p=>p.y)),maxY=Math.max(...raw.map(p=>p.y));
  const size=index===0?190+random()*45:index===1?105+random()*25:48+random()*35,aspect=.6+random()*.4,angle=random()*Math.PI*2;
  const outline=raw.map(p=>{const x=((p.x-minX)/(maxX-minX)-.5)*size,y=((p.y-minY)/(maxY-minY)-.5)*size*aspect;return {x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};});
  let placed;
  for(let attempt=0;!placed;attempt++){
   const scale=Math.pow(.85,Math.floor(attempt/100)),xs=outline.map(p=>p.x*scale),ys=outline.map(p=>p.y*scale);
   const x=18-Math.min(...xs)+random()*(364-(Math.max(...xs)-Math.min(...xs))),y=30-Math.min(...ys)+random()*(300-(Math.max(...ys)-Math.min(...ys)));
   const candidate=outline.map(p=>({x:x+p.x*scale,y:y+p.y*scale}));
   if(regions.every(region=>halfPolygonsApart(region,candidate)))placed=candidate;
  }
  regions.push(placed);
 }
 // Expand the entire scattered group to use the canvas, preserving clear gaps.
 const all=regions.flat(),minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
 const scale=Math.min(364/(maxX-minX),300/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 for(let i=0;i<regions.length;i++)regions[i]=regions[i].map(p=>({x:Math.round((200+(p.x-cx)*scale)*1000)/1000,y:Math.round((180+(p.y-cy)*scale)*1000)/1000}));
 const colors=shuffleWith(random,['#4d70ff','#e965a0','#f08a55','#3dcec3','#9861ef']).slice(0,count);
 return {kind,base:regions[0],points:regions[0],regions,colors,rotation:0,sx:1,sy:1,skew:0};
}
function halfRegionCentre(points){
 let crossSum=0,x=0,y=0;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=a.x*b.y-b.x*a.y;crossSum+=cross;x+=(a.x+b.x)*cross;y+=(a.y+b.y)*cross;}
 return {x:x/(3*crossSum),y:y/(3*crossSum)};
}
function halfLayoutAsymmetric(regions){
 // Distinct component areas cannot be swapped by a reflection or rotation.
 const areas=regions.map(halfArea).sort((a,b)=>a-b);
 if(areas.some((area,i)=>i&&area/areas[i-1]<1.12))return false;
 // With non-collinear centres, no reflection axis can fix every component.
 // The smaller covariance eigenvalue measures spread away from the best axis.
 const centres=regions.map(halfRegionCentre),n=centres.length,cx=centres.reduce((sum,p)=>sum+p.x,0)/n,cy=centres.reduce((sum,p)=>sum+p.y,0)/n;
 let xx=0,yy=0,xy=0;for(const p of centres){xx+=(p.x-cx)**2/n;yy+=(p.y-cy)**2/n;xy+=(p.x-cx)*(p.y-cy)/n;}
 return (xx+yy-Math.hypot(xx-yy,2*xy))/2>=14**2;
}
function halfClusterShape(kind,random){
 for(;;){const shape=halfClusterCandidate(kind,random);if(halfLayoutAsymmetric(shape.regions))return shape;}
}
function halfGeometry(q){return q.fruit.regions||q.points;}
function halfArea(points){if(Array.isArray(points[0]))return points.reduce((sum,p)=>sum+halfArea(p),0);let sum=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=a.x*b.y-b.x*a.y;}return Math.abs(sum)/2;}
function halfClip(points,cut,side=1){if(Array.isArray(points[0]))return points.map(p=>halfClip(p,cut,side)).filter(p=>p.length>=3);const out=[],distance=p=>side*((p.x-cut.x)*cut.nx+(p.y-cut.y)*cut.ny);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=distance(a),db=distance(b);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}}return out;}
function halfSplit(points,cut){const a=halfClip(points,cut),b=halfClip(points,cut,-1),total=halfArea(points);return {a,b,fraction:halfArea(a)/total};}
function halfScoreFraction(f){return scoreFromError(Math.abs(f-.5)/SCORING_RANGES.halfhalf);}
function halfBisect(points,cut){const flat=Array.isArray(points[0])?points.flat():points;let low=Math.min(...flat.map(p=>p.x*cut.nx+p.y*cut.ny)),high=Math.max(...flat.map(p=>p.x*cut.nx+p.y*cut.ny));for(let i=0;i<45;i++){const t=(low+high)/2,c={...cut,x:cut.nx*t,y:cut.ny*t};if(halfSplit(points,c).fraction>.5)low=t;else high=t;}const t=(low+high)/2;return {...cut,x:cut.nx*t,y:cut.ny*t};}
function halfCurve(start,segments){const points=[{x:start[0],y:start[1]}];let last=start;for(const s of segments){for(let i=1;i<=24;i++){const t=i/24,u=1-t;points.push({x:u*u*u*last[0]+3*u*u*t*s[0]+3*u*t*t*s[2]+t*t*t*s[4],y:u*u*u*last[1]+3*u*u*t*s[1]+3*u*t*t*s[3]+t*t*t*s[5]});}last=s.slice(4);}return points;}
function halfFruitShape(kind,random=Math.random){if(kind.startsWith('blob-'))return halfBlobShape(kind,random);let base;if(kind==='pear')base=halfCurve([198,66],[[166,54,150,86,148,114],[142,145,79,164,90,218],[98,274,155,282,206,276],[266,282,305,246,291,198],[283,154,246,145,240,108],[239,75,230,61,198,66]]);if(kind==='strawberry')base=halfCurve([197,94],[[165,65,107,81,94,119],[78,160,132,241,192,273],[229,254,294,171,288,126],[283,89,233,67,197,94]]);if(kind==='mango')base=halfCurve([142,77],[[189,52,266,82,282,124],[315,200,255,257,203,268],[151,284,95,245,98,199],[92,169,117,151,114,122],[110,104,117,90,142,77]]);if(kind==='peach')base=halfCurve([200,85],[[240,60,290,77,303,119],[326,170,304,238,265,255],[222,286,158,272,122,250],[76,230,73,168,100,126],[122,82,172,64,200,85]]);if(kind==='watermelon')base=[{x:169,y:67},{x:310,y:179},...halfCurve([310,179],[[330,229,272,277,203,272],[148,274,96,252,85,218]]).slice(1),{x:169,y:67}];
 const rotation=(random()-.5)*1.9,sx=.83+random()*.2,sy=.86+random()*.13,skew=(random()-.5)*.35;const transform=p=>{let x=(p.x-200)*sx+(p.y-180)*skew,y=(p.y-180)*sy;return {x:200+x*Math.cos(rotation)-y*Math.sin(rotation),y:180+x*Math.sin(rotation)+y*Math.cos(rotation)};};base=base.map(p=>({x:Math.round(p.x*1000)/1000,y:Math.round(p.y*1000)/1000}));return {kind,base,rotation,sx,sy,skew,points:base.map(transform).map(p=>({x:Math.round(p.x*1000)/1000,y:Math.round(p.y*1000)/1000}))};}

function halfCanvasPath(ctx,points){ctx.beginPath();for(const polygon of Array.isArray(points[0])?points:[points]){polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}}
function halfLeaf(ctx,x,y,w,h,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-w*.15,-h,w*.8,-h,w,0);ctx.bezierCurveTo(w*.65,h*.35,w*.3,h*.45,0,0);ctx.fillStyle='#72a642';ctx.fill();ctx.strokeStyle='#9ac866';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(w*.45,-h*.1,w*.9,0);ctx.stroke();ctx.restore();}
function paintHalfFruit(ctx,q){if(q.kind.startsWith('blob-')){for(const [index,region] of (q.regions||[q.base]).entries()){halfCanvasPath(ctx,region);ctx.fillStyle=q.colors?.[index]||'#849df5';ctx.fill();}return;}ctx.save();ctx.translate(200,180);ctx.rotate(q.rotation);ctx.transform(q.sx,0,q.skew,q.sy,0,0);ctx.translate(-200,-180);halfCanvasPath(ctx,q.base);ctx.save();ctx.clip();let g=ctx.createLinearGradient(95,90,292,263);const colors={pear:['#e8dc79','#c7b147','#879941'],strawberry:['#ff6d65','#e23c47','#982938'],mango:['#ffe597','#edac43','#dd773c'],watermelon:['#ff827b','#f35058','#d93955'],peach:['#ffd38a','#f39b63','#d66b59']}[q.kind];colors.forEach((c,i)=>g.addColorStop(i/2,c));ctx.fillStyle=g;ctx.fillRect(45,30,325,290);
if(q.kind==='pear'){for(let i=0;i<135;i++){const x=88+((i*47)%211),y=82+((i*71)%198);ctx.fillStyle=i%3?'#766c2340':'#fff4ba70';ctx.beginPath();ctx.arc(x,y,.65+(i%3)*.22,0,Math.PI*2);ctx.fill();}}
if(q.kind==='strawberry'){for(let row=0;row<7;row++)for(let col=0;col<7;col++){const x=109+col*27+(row%2)*12,y=112+row*25;ctx.save();ctx.translate(x,y);ctx.rotate((x-190)*.003);ctx.fillStyle='#973142';ctx.beginPath();ctx.ellipse(0,1,2.5,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffdba3';ctx.beginPath();ctx.ellipse(0,-.4,1.5,2.8,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
if(q.kind==='watermelon'){halfCanvasPath(ctx,q.base.slice(1,-1));ctx.strokeStyle='#44894b';ctx.lineWidth=22;ctx.stroke();ctx.strokeStyle='#c6dc9a';ctx.lineWidth=11;ctx.stroke();for(const [x,y,a] of [[178,142,-.4],[198,192,.3],[236,194,-.3],[149,206,.5],[220,232,.1],[275,198,-.7]]){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#552d35';ctx.beginPath();ctx.ellipse(0,0,2.5,5,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
if(q.kind==='mango'){ctx.strokeStyle='#ffe9b17a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(137,103);ctx.bezierCurveTo(121,139,112,205,157,241);ctx.stroke();}
if(q.kind==='peach'){ctx.strokeStyle='#cf795770';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(200,86);ctx.bezierCurveTo(181,127,213,193,199,251);ctx.stroke();}
ctx.restore();halfCanvasPath(ctx,q.base);ctx.strokeStyle='#ffffff18';ctx.lineWidth=1;ctx.stroke();if(q.kind==='pear'||q.kind==='peach'||q.kind==='mango'){const x=q.kind==='mango'?147:200,y=q.kind==='mango'?78:q.kind==='peach'?82:67;ctx.strokeStyle='#9e7b54';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-9,y-13,x+1,y-29);ctx.stroke();halfLeaf(ctx,x-1,y-17,37,13,-.22);}if(q.kind==='strawberry'){for(let i=0;i<5;i++)halfLeaf(ctx,194,94,40,13,(i*-.58)-.12);ctx.fillStyle='#4c853b';ctx.beginPath();ctx.ellipse(198,91,15,7,.1,0,Math.PI*2);ctx.fill();}ctx.restore();}

function halfQuestion(random,round,kind){
 const selected=kind||HALF_OBJECTS[Math.floor(random()*HALF_OBJECTS.length)];
 const shape=selected.startsWith('blob-')?halfClusterShape(selected,random):halfFruitShape(selected,random);
 const {points,...fruit}=shape;
 return {id:'half-half-'+round,type:'halfhalf',skill:'Half & Half',title:'Cut it in half.',fruit,points,answer:halfBisect(fruit.regions||points,{x:200,y:180,nx:1,ny:0}),tip:'The green line shows an even cut at your angle.',explain:'Split the total filled area into equal halves: count all the shapes together. Empty space does not count. Every colour counts equally. We measure the shape geometry, so screen size and pixel density do not affect your score. A 50/50 split earns 100 points. The same scoring curve as the other games applies: a 53/47 split earns 64 points, a 60/40 split earns 11 points, and a 65/35 split or worse earns zero.'};
}
function halfError(value,q){
 if(!value||!['x','y','nx','ny'].every(k=>Number.isFinite(value[k]))||Math.abs(Math.hypot(value.nx,value.ny)-1)>1e-6)return Infinity;
 return Math.abs(halfSplit(halfGeometry(q),value).fraction-.5);
}
function halfSplitText(value,q){const percent=Math.round(halfSplit(halfGeometry(q),value).fraction*100);return percent+'% / '+(100-percent)+'% split';}
function halfCutEnds(c){const tx=-c.ny,ty=c.nx;return [{x:c.x+tx*143,y:c.y+ty*143},{x:c.x-tx*143,y:c.y-ty*143}];}
function drawHalfFruit(canvas,q,cut,target=false){
 if(!canvas)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,400,300);ctx.save();ctx.translate(200,150);ctx.scale(.85,.85);ctx.translate(-200,-180);
 paintHalfFruit(ctx,q.fruit);
 const stroke=(c,color,dashed=false,handles=false)=>{const tx=-c.ny,ty=c.nx;ctx.beginPath();ctx.moveTo(c.x-tx*500,c.y-ty*500);ctx.lineTo(c.x+tx*500,c.y+ty*500);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dashed?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);if(handles)for(const p of halfCutEnds(c)){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();ctx.stroke();}};
 if(cut)stroke(cut,getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),false,!target);
 if(target)stroke(halfBisect(halfGeometry(q),cut),getComputedStyle(document.documentElement).getPropertyValue('--target').trim()||'#c7f06a',true);
 ctx.restore();
}
function halfRound(q){
 let cut=null,drag=null;shell(q,'<div class="spatial-wrap half-wrap"><canvas width="400" height="300" id="balance-canvas" tabindex="0" role="application" aria-label="Cut the shape into equal areas. Drag a cut; move its handles or the line to adjust. Arrow keys move it; Shift and arrows rotate it."></canvas></div>','<p class="small-instruction" id="half-hint">Cut half the total coloured area onto each side.</p><button id="half-lock" class="primary" disabled>Draw a cut</button>');
 const canvas=$('balance-canvas'),button=$('half-lock');
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:200+((e.clientX-r.left)/r.width*400-200)/.85,y:180+((e.clientY-r.top)/r.height*300-150)/.85};};
 const choose=()=>{button.disabled=false;button.textContent='Slice it';$('half-hint').textContent='Move the cut or either handle. Then slice.';drawHalfFruit(canvas,q,cut);};
 const set=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<12)return;cut={x:(a.x+b.x)/2,y:(a.y+b.y)/2,nx:-dy/len,ny:dx/len};choose();};
 canvas.addEventListener('pointerdown',e=>{if(locked)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=point(e);if(cut){const ends=halfCutEnds(cut),near=ends.findIndex(a=>Math.hypot(a.x-p.x,a.y-p.y)<24);if(near>=0){drag={mode:'handle',other:ends[1-near]};return;}if(Math.abs((p.x-cut.x)*cut.nx+(p.y-cut.y)*cut.ny)<22){drag={mode:'move',start:p,old:{...cut}};return;}}drag={mode:'new',start:p};});
 canvas.addEventListener('pointermove',e=>{if(locked||!drag)return;const p=point(e);if(drag.mode==='new')set(drag.start,p);if(drag.mode==='handle')set(drag.other,p);if(drag.mode==='move'){cut={...drag.old,x:drag.old.x+p.x-drag.start.x,y:drag.old.y+p.y-drag.start.y};choose();}});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>drag=null);
 canvas.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(!cut)cut={x:200,y:180,nx:1,ny:0};if(e.shiftKey){const theta=Math.atan2(cut.ny,cut.nx)+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)*Math.PI/90;cut.nx=Math.cos(theta);cut.ny=Math.sin(theta);}else{if(e.key==='ArrowLeft')cut.x-=2;if(e.key==='ArrowRight')cut.x+=2;if(e.key==='ArrowUp')cut.y-=2;if(e.key==='ArrowDown')cut.y+=2;}choose();});
 button.addEventListener('click',()=>{if(cut)reveal(cut);});drawHalfFruit(canvas,q,null);
}
