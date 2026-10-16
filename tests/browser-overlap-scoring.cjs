const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.clock.install();
 const output='/workspace/artifacts/overlap-scoring';fs.mkdirSync(output,{recursive:true});
 for(const theme of ['night-lab','focus']){
  await page.goto('http://127.0.0.1:4175/?game=motion&mode=practice');await page.selectOption('#theme-select',theme);
  await page.evaluate(()=>{deck=makeDeck('practice:overlap-mobile','motion');index=0;results=[];render();});await page.locator('#show-line').click();
  await page.screenshot({path:output+'/line-preview-'+theme+'.png'});await page.clock.fastForward(3100);
  // Draw the actual generated curve with a small offset using touch input.
  const points=await page.locator('#trace-canvas').evaluate(c=>{const r=c.getBoundingClientRect(),scale=Math.min(r.width/400,r.height/300);return deck[0].answer.map(p=>({x:r.x+(r.width-400*scale)/2+(p.x+3)*scale,y:r.y+(r.height-300*scale)/2+p.y*scale}));});
  const session=await page.context().newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});for(const p of points.slice(1))await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  await page.screenshot({path:output+'/line-play-'+theme+'.png'});await page.locator('#trace-lock').click();
  const result=await page.evaluate(()=>({score:results[0].score,check:Math.round(100*traceOverlap(results[0].guess,deck[0].answer)),saved:JSON.stringify(results)}));assert.equal(result.score,result.check);assert(result.score>40&&result.score<100);
  assert(await page.locator('.round-result-error').innerText().then(s=>s.includes('Line overlap')));
  await page.screenshot({path:output+'/line-reveal-'+theme+'.png'});
  for(const viewport of [{width:320,height:667},{width:768,height:1024}]){await page.setViewportSize(viewport);await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>JSON.stringify(results)),result.saved);assert(await page.evaluate(()=>document.body.scrollWidth<=innerWidth));}
  await page.setViewportSize({width:390,height:844});await page.selectOption('#theme-select',theme==='focus'?'night-lab':'focus');assert.equal(await page.evaluate(()=>JSON.stringify(results)),result.saved);
  await page.goto('http://127.0.0.1:4175/?game=memory&mode=practice');await page.locator('#game-menu-toggle').click();const menu=await page.locator('#game-menu').innerText();assert(menu.includes('Color memory'));assert(!/colour/i.test(menu));await page.keyboard.press('Escape');assert(!/colour/i.test(await page.locator('#playarea').innerText()));
  await page.goto('http://127.0.0.1:4175/?game=perspective&mode=practice');await page.evaluate(()=>{deck=makeDeck('practice:inner-box','perspective');index=0;results=[];render();reveal({x:deck[0].answer.x+PERSPECTIVE_INNER_DIAGONAL*.2,y:deck[0].answer.y});});assert.equal(await page.evaluate(()=>results[0].score),50);assert((await page.locator('.round-result-error').innerText()).includes('inner-box'));await page.screenshot({path:output+'/perspective-reveal-'+theme+'.png'});
 }
 assert.deepEqual(errors,[]);console.log('Verified mobile thick-stroke preview/play/reveal with real touch, matching overlap score, resize/theme persistence, Color menu/prompt spelling, and inner-box Perspective feedback in both themes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
