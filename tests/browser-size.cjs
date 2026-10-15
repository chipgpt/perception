// Requires Playwright and a local build server (default localhost:4175).
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto(process.env.PERCEPTION_TEST_URL||'http://127.0.0.1:4175/?game=proportion');
 const reset=async()=>{await page.evaluate(()=>{let q;for(let seed=0;seed<100;seed++){q=sizeQuestion(rng(seed),0);if(q.wide===3&&q.tall===2)break;}deck=Array.from({length:5},()=>q);index=0;results=[];render();});await page.waitForTimeout(60);};
 const state=()=>page.evaluate(()=>{const c=document.getElementById('proportion-canvas'),r=c.getBoundingClientRect(),h=document.getElementById('size-handle').getBoundingClientRect(),s=canvasDisplayScale(c);return {q:deck[index],width:(h.x+h.width/2-r.x-(r.width-400*s)/2)/s-SIZE_BOUNDS.x,height:(h.y+h.height/2-r.y-(r.height-400*s)/2)/s-SIZE_BOUNDS.y,stage:document.querySelector('.size-stage').getBoundingClientRect().toJSON(),handle:h.toJSON(),scale:s,body:document.body.scrollHeight};});
 const near=(a,b)=>assert(Math.abs(a-b)<.1,`${a} should be ${b}`);
 const dragTo=async(w,h,touch=false)=>{const a=await state(),cx=a.handle.x+24,cy=a.handle.y+24,x=cx+(w-a.width)*a.scale,y=cy+(h-a.height)*a.scale;
  if(touch){const session=await context.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
  else{await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(x,y,{steps:4});await page.mouse.up();}
 };
 await reset();let a=await state();assert.equal(a.handle.width,48);assert.equal(a.handle.height,48);assert.equal(a.q.measurementVersion,2);near(a.width,a.q.reference);near(a.height,a.q.reference);assert.equal(await page.locator('.size-handle span').evaluate(el=>el.getBoundingClientRect().width),14);
 await page.selectOption('#theme-select','night-lab');await page.waitForTimeout(120);await page.screenshot({path:'/workspace/artifacts/size-game/mobile-start.png'});
 await page.locator('#size-handle').focus();await page.keyboard.press('ArrowRight');let b=await state();near(b.width,a.width+1);near(b.height,a.height);
 await page.keyboard.press('Shift+ArrowDown');b=await state();near(b.height,a.height+10);
 await dragTo(180,110);b=await state();near(b.width,180);near(b.height,110);
 await dragTo(210,110,true);b=await state();near(b.width,210);near(b.height,110);
 await dragTo(999,999,true);b=await state();near(b.width,304);near(b.height,207);assert(b.handle.right<=b.stage.right&&b.handle.bottom<=b.stage.bottom);
 await dragTo(-100,-100,true);b=await state();near(b.width,32);near(b.height,32);assert(b.handle.left>=b.stage.left&&b.handle.top>=b.stage.top);
 await dragTo(180,110);a=await state();
 for(const viewport of [{width:360,height:740},{width:375,height:667},{width:768,height:1024},{width:1280,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(60);b=await state();near(b.width,a.width);near(b.height,a.height);assert.deepEqual(b.q,a.q);assert(b.handle.left>=b.stage.left&&b.handle.right<=b.stage.right&&b.handle.top>=b.stage.top&&b.handle.bottom<=b.stage.bottom);assert(b.body<=viewport.height+2,`play overflow at ${viewport.width}×${viewport.height}: ${b.body}`);
 }
 // Cancelling a drag releases input, and locked answers do not change.
 await page.mouse.move(b.handle.x+24,b.handle.y+24);await page.mouse.down();
 await page.locator('#size-handle').dispatchEvent('pointercancel',{pointerId:1});await page.locator('#size-handle').dispatchEvent('pointermove',{pointerId:1,clientX:1,clientY:1});near((await state()).width,180);await page.mouse.up();
 await dragTo(a.q.answer.width*.95,a.q.answer.height*1.12);
 const output=process.env.PERCEPTION_SCREENSHOTS||'/workspace/artifacts/size-game';fs.mkdirSync(output,{recursive:true});
 await page.selectOption('#theme-select','night-lab');await page.waitForTimeout(120);await page.screenshot({path:output+'/mobile-play.png'});
 const final=await state();await page.locator('#proportion-lock').click();await page.waitForTimeout(60);
 const result=await page.evaluate(()=>({guess:results[0].guess,score:results[0].score,text:document.getElementById('actionarea').innerText,body:document.body.scrollHeight,canvas:document.getElementById('proportion-canvas').getAttribute('aria-label')}));
 near(result.guess.width,final.width);near(result.guess.height,final.height);const axes=await page.locator('.result-axes>div').allInnerTexts();assert(/Width\s+5\.0%\s+Too narrow/.test(axes[0]));assert(/Height\s+12\.0%\s+Too tall/.test(axes[1]));assert(result.canvas.includes('Dashed outline'));assert(result.body<=846);
 await page.screenshot({path:output+'/mobile-reveal.png'});
 await page.setViewportSize({width:375,height:667});await page.waitForTimeout(60);const revealHeight=await page.evaluate(()=>document.body.scrollHeight);assert(revealHeight<=669,`reveal overflow: ${revealHeight}`);
 await page.selectOption('#theme-select','focus');await page.waitForTimeout(120);assert.deepEqual(await page.evaluate(()=>results[0].guess),result.guess);
 await page.locator('#next').click();assert(await page.locator('#size-handle').isVisible());
 // Exact target is reachable through actual pointer input.
 await reset();a=await state();await dragTo(a.q.answer.width,a.q.answer.height,true);await page.locator('#proportion-lock').click();assert.equal(await page.evaluate(()=>results[0].score),100);
 // Summary regeneration uses absolute dimensions and the grid, including saved results.
 const comparison=await page.evaluate(()=>restoredComparison(results[0]));assert(comparison.includes('solid grid: target'));
 await page.evaluate(()=>{const q=deck[0];results=deck.map(q=>({q,guess:q.answer,score:100}));finish();});assert((await page.locator('.results').innerText()).includes('Width: 0.0% · spot on'));
 await page.evaluate(()=>{deck=makeDeck('2026-10-14','proportion');index=0;results=[];render();});assert.equal(await page.locator('#proportion-canvas').getAttribute('height'),'300');
 await page.evaluate(()=>reveal({width:deck[0].answer*100,height:100}));assert.equal(await page.evaluate(()=>results[0].score),100);
 assert.deepEqual(errors,[]);console.log('Verified Chromium mobile touch, mouse, independent arrows, Shift steps, min/max clamps, pointer cancellation, exact target, five responsive viewports, theme changes, reduced motion, and mobile play/reveal screenshots.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
