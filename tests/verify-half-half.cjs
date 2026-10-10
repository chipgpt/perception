const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/game-themed.js','utf8').replace(/const demoGame=new URLSearchParams[\s\S]*$/,'');
const el={addEventListener(){},classList:{toggle(){}},dataset:{}};
const ctx=vm.createContext({document:{getElementById(){return el},addEventListener(){},querySelectorAll(){return[]}},Date,Math,Number,setTimeout,clearTimeout,performance,getComputedStyle:()=>({getPropertyValue:key=>key==='--canvas'?'#111318':key==='--target'?'#c7f06a':'#eef0f5'})});vm.runInContext(source,ctx);const run=s=>vm.runInContext(s,ctx);
for(let day=0;day<100;day++){
 const deck=run(`makeDeck('half-test-${day}','halfhalf')`);
 assert.equal(new Set(deck.map(q=>q.fruit.kind)).size,5);
 assert.equal(JSON.stringify(deck),JSON.stringify(run(`makeDeck('half-test-${day}','halfhalf')`)));
 assert(JSON.stringify(deck).length*2<256*1024,'Five fruit puzzles fit the bounded browser save');
 assert(run(`validSavedGame({deck:${JSON.stringify(deck)},results:[]})`));
 for(const q of deck){assert.equal(q.skill,'Half & Half');assert(q.fruit.regions.length>=3&&q.fruit.regions.length<=5);assert(run(`halfLayoutAsymmetric(${JSON.stringify(q.fruit.regions)})`),'No near symmetry axis or interchangeable-area shapes');for(let i=0;i<q.fruit.regions.length;i++)for(let j=i+1;j<q.fruit.regions.length;j++)assert(run(`halfPolygonsApart(${JSON.stringify(q.fruit.regions[i])},${JSON.stringify(q.fruit.regions[j])},0)`),'Shapes never overlap');assert.equal(run(`scoreFor(${JSON.stringify(q.answer)},${JSON.stringify(q)})`),100);
  for(let angle=0;angle<8;angle++){const value={x:100+angle*20,y:150,nx:Math.cos(angle*Math.PI/4),ny:Math.sin(angle*Math.PI/4)};
   run(`q=${JSON.stringify(q)};cut=${JSON.stringify(value)};halves=halfSplit(halfGeometry(q),cut)`);
   assert(Math.abs(run('halfArea(halves.a)+halfArea(halves.b)-halfArea(halfGeometry(q))'))<1e-7);
   assert(Math.abs(run('halfSplit(halfGeometry(q),halfBisect(halfGeometry(q),cut)).fraction-.5'))<1e-10);
   assert.equal(run('scoreFor(halfBisect(halfGeometry(q),cut),q)'),100);
  }
 }
}
const plate={type:'balance',answer:50,points:[[0,0],[100,0],[100,100],[0,100]],skill:'Balance',title:'Balance it.'};
assert.equal(run(`scoreFor(50,${JSON.stringify(plate)})`),100,'Legacy saved balance scores remain valid');
const fruit=run("makeDeck('test','halfhalf')[0]");assert.equal(run(`scoreFor({x:0,y:0,nx:0,ny:0},${JSON.stringify(fruit)})`),0,'Invalid cut earns zero');
assert.equal(run(`scoreFor({x:1000,y:1000,nx:1,ny:0},${JSON.stringify(fruit)})`),0,'Cut missing the fruit earns zero');
const html=fs.readFileSync('public/index.html','utf8');assert(html.includes('data-mini="balance">Half &amp; Half'));assert(html.includes('20 percentage points from an even split (70/30)'));
console.log('Verified 500 deterministic fruit puzzles, 4,000 cut orientations, exact area splits, bounded saves, invalid cuts, and legacy score compatibility.');

const drawing={};for(const name of ['clearRect','save','restore','translate','scale','rotate','transform','beginPath','moveTo','lineTo','closePath','clip','fillRect','fill','stroke','arc','ellipse','bezierCurveTo','quadraticCurveTo','setLineDash'])drawing[name]=()=>{};drawing.createLinearGradient=()=>({addColorStop(){}});ctx.renderCanvas={getContext(){return drawing;}};for(const kind of [...run('HALF_OBJECTS'),'pear','strawberry','mango','watermelon','peach']){run(`q=halfQuestion(rng(42),0,'${kind}');drawHalfFruit(renderCanvas,q,null);drawHalfFruit(renderCanvas,q,q.answer,true)`);}console.log('Verified initial and split rendering for all five fruits.');

const balances=run("makeDeck('test','balance')");assert(balances.every(q=>q.type==='halfhalf'&&q.fruit));assert(!html.includes('data-mini="halfhalf"'));assert.equal(JSON.stringify(balances),JSON.stringify(run("makeDeck('test','halfhalf')")));assert.equal(fruit.type,'halfhalf');

const moves=[],strokes=[];drawing.translate=(...args)=>moves.push(args);drawing.stroke=()=>strokes.push(drawing.strokeStyle);run("q=halfQuestion(rng(88),0,'blob-4');drawHalfFruit(renderCanvas,q,{x:180,y:160,nx:1,ny:0},true)");assert.deepEqual(moves,[[200,150],[-200,-180]],'Reveal keeps the original shape positions');assert.deepEqual(strokes,['#eef0f5','#c7f06a'],'Reveal retains the guess line and overlays the target');console.log('Verified stationary reveal with both cut lines.');

const square={type:'halfhalf',fruit:{},points:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]};for(const [x,score] of [[50,100],[53,72],[55,56],[60,25],[65,6],[70,0],[30,0],[35,6],[75,0]])assert.equal(run(`scoreFor({x:${x},y:50,nx:1,ny:0},${JSON.stringify(square)})`),score);console.log('Verified 20-percentage-point scoring bound, exact split, symmetry, and zero beyond 70/30.');

assert(!run('halfLayoutAsymmetric([[{x:0,y:0},{x:20,y:0},{x:20,y:20},{x:0,y:20}],[{x:40,y:0},{x:60,y:0},{x:60,y:20},{x:40,y:20}],[{x:80,y:0},{x:100,y:0},{x:100,y:20},{x:80,y:20}]])'));console.log('Verified asymmetric component areas and non-collinear centres across 500 puzzles.');
