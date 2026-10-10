const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base=fs.readFileSync('src/base/game.js','utf8');
const context=vm.createContext({Math});
vm.runInContext(base.slice(base.indexOf('function rotationMatrix('),base.indexOf('function polygonCentre('))+fs.readFileSync('src/design-options/view-result.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
for(const [a,b]of [[{yaw:0,pitch:0,roll:0},{yaw:180,pitch:0,roll:0}],[{yaw:179,pitch:40,roll:-80},{yaw:-179,pitch:-45,roll:140}],[{yaw:12,pitch:33,roll:44},{yaw:12,pitch:33,roll:44}]]){
 context.a=a;context.b=b;
 for(const t of [0,.25,.5,.75,1]){
  context.t=t;const m=run('interpolateView(a,b,t).matrix');assert(m.every(Number.isFinite));
  for(let row=0;row<3;row++)assert(Math.abs(Math.hypot(...m.slice(row*3,row*3+3))-1)<1e-9);
  assert(Math.abs(run('orientationError(a,interpolateView(a,b,t))-orientationError(a,b)*t'))<1e-5);
 }
}
context.a={yaw:179,pitch:0,roll:0};context.b={yaw:-179,pitch:0,roll:0};assert(Math.abs(run('orientationError(a,interpolateView(a,b,.5))')-1)<1e-6);
console.log('Verified 3D result interpolation endpoints, shortest rotation, 180-degree turns, and valid rotation matrices.');
vm.runInContext(fs.readFileSync('src/design-options/view-idle.js','utf8'),context);
for(const [width,height]of [[350,540],[1100,450],[400,300]]){
 const left=20,top=100,scale=Math.min(width/400,height/300);
 context.canvas={width:400,height:300,getBoundingClientRect:()=>({left,top,width,height})};
 for(const [x,y]of [[200,150],[0,0],[400,300],[200,155]]){
  context.event={clientX:left+(width-400*scale)/2+x*scale,clientY:top+(height-300*scale)/2+y*scale};
  const p=run('viewPointerPoint(canvas,event)');
  assert(Math.abs(p.x-x)<1e-9&&Math.abs(p.y-y)<1e-9);
 }
}
console.log('Verified 3D touch coordinates in tall, wide, and original-size stages.');
