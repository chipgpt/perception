const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const element={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance,getComputedStyle(){return {getPropertyValue(){return '#111318'}}}});
vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx),shapes=new Set();
for(let seed=0;seed<200;seed++){
 const questions=run(`makeDeck('shape-test-${seed}','view3d')`);assert.equal(JSON.stringify(questions),JSON.stringify(run(`makeDeck('shape-test-${seed}','view3d')`)));
 for(const q of questions){const {boxes}=q.shape;assert(boxes.length>=3&&boxes.length<=5);assert.equal(new Set(boxes.map(b=>b[6])).size,boxes.length);
  const touches=(a,b)=>[0,1,2].some(axis=>Math.abs(Math.abs(a[axis]-b[axis])-(a[axis+3]+b[axis+3])/2)<1e-7&&[0,1,2].filter(k=>k!==axis).every(k=>Math.abs(a[k]-b[k])<(a[k+3]+b[k+3])/2-1e-7));
  const visited=new Set([0]);let added=true;while(added){added=false;for(let i=0;i<boxes.length;i++)if(!visited.has(i)&&[...visited].some(j=>touches(boxes[i],boxes[j]))){visited.add(i);added=true;}}assert.equal(visited.size,boxes.length);
  for(let i=0;i<boxes.length;i++){const [x,y,z,w,h,d]=boxes[i];for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1])assert(Math.hypot(x+a*w/2,y+b*h/2,z+c*d/2)<=1.100000001);for(let j=i+1;j<boxes.length;j++)assert(![0,1,2].every(axis=>Math.abs(boxes[i][axis]-boxes[j][axis])<(boxes[i][axis+3]+boxes[j][axis+3])/2-1e-7));}
  for(const index of [0,1]){const sizes=boxes[index].slice(3,6);assert(Math.max(...sizes)/Math.min(...sizes)>1.8);}
  assert.equal(run(`scoreFor(${JSON.stringify(q.answer)},${JSON.stringify(q)})`),100);shapes.add(JSON.stringify(boxes));
  let strokes=0;const canvas={getContext(){return new Proxy({},{get(target,key){if(key==='stroke')return()=>strokes++;return target[key]||(()=>{});},set(target,key,value){target[key]=value;return true;}})}};
  ctx.testCanvas=canvas;ctx.testQuestion=q;run('drawShape3D(testCanvas,testQuestion.answer,{shape:testQuestion.shape})');assert(strokes>0);
 }
}
assert.equal(shapes.size,1000);
console.log('Verified 1,000 distinct, deterministic shapes: 3–5 connected pieces, varied beam/slab dimensions, no intersections, distinct colours, bounded rotation size, exact scoring, and rendering.');
