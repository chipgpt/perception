// Requires a local build server on port 4175 and Playwright/Chromium.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const out=process.env.PERCEPTION_SCREENSHOTS||'/workspace/artifacts/results';fs.mkdirSync(out,{recursive:true});
 const check=async label=>{const m=await page.evaluate(()=>({body:document.body.scrollHeight,width:document.body.scrollWidth,height:innerHeight,viewWidth:innerWidth,next:document.getElementById('next').getBoundingClientRect().toJSON(),metrics:[...document.querySelectorAll('.round-result-stats>div,.result-axes>div')].map(e=>({width:e.clientWidth,content:e.scrollWidth})),stage:document.getElementById('game-stage').getBoundingClientRect().height}));assert(m.width<=m.viewWidth,label+' page overflow');assert(m.body<=m.height+1,label+' vertical overflow');assert(m.stage>=96,label+' collapsed visual');assert(m.next.top>=0&&m.next.bottom<=m.height+1,label+' hidden next action');for(const e of m.metrics)assert(e.content<=e.width+1,label+' overflowing result value');};
 for(const theme of ['focus','night-lab'])for(const viewport of [{width:375,height:667},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:4175/?game=proportion');await page.selectOption('#theme-select',theme);await page.waitForTimeout(80);
  for(const exact of [false,true]){await page.evaluate(exact=>{const q={...sizeQuestion(rng(42),0),wide:3,tall:2,reference:40,answer:{width:120,height:80}};deck=[q,q];index=0;results=[];render();reveal(exact?q.answer:{width:114,height:89.6});},exact);await check('size '+theme+' '+viewport.width);const axes=await page.locator('.result-axes>div').allInnerTexts();if(exact){assert(axes.every(s=>s.includes('Spot on')));assert.equal(await page.evaluate(()=>results[0].score),100);}else{assert(/Width\s+5\.0%\s+Too narrow/.test(axes[0]));assert(/Height\s+12\.0%\s+Too tall/.test(axes[1]));}if(!exact&&viewport.width===390)await page.screenshot({path:`${out}/size-${theme}.png`});}
  for(const game of ['angle','timeline','duration']){
   await page.evaluate(game=>{deck=makeDeck('practice:result-layout',game);index=0;results=[];render();},game);
   if(game==='angle'){await page.locator('#angle-dial').press('ArrowLeft');await page.locator('#angle-lock').click();}
   if(game==='timeline'){await page.locator('#year-wheel').press('End');await page.locator('#trivia-lock').click();}
   if(game==='duration'){await page.evaluate(()=>reveal(5184000));}
   await check(game+' '+theme+' '+viewport.width);const committed=await page.evaluate(()=>JSON.stringify(results));
   if(game!=='angle'){await page.locator('.math-detail summary').click();await check(game+' expanded source');assert.equal(await page.evaluate(()=>JSON.stringify(results)),committed);await page.locator('.math-detail summary').click();}
   if(viewport.width===390)await page.screenshot({path:`${out}/${game}-${theme}.png`});
  }
 }
 // A mixed completion page shows consistent names and factual subtitles, and can scroll.
 await page.evaluate(()=>{const games=['proportion','angle','time','timeline','duration'];deck=games.map(g=>makeDeck('practice:result-summary',g)[0]);results=deck.map(q=>({q,guess:q.answer,score:100}));mini='mix';mode='daily';finish();});
 assert.equal(await page.locator('.result').count(),5);assert.equal(await page.locator('.resulthead small').count(),2);assert.equal(await page.locator('#roundlabel').innerText(),'DAILY COMPLETE');assert((await page.locator('.summary').innerText()).includes('Daily Five resets at midnight Central Time.'));
 for(const theme of ['focus','night-lab']){await page.selectOption('#theme-select',theme);await page.waitForTimeout(80);assert(await page.evaluate(()=>document.body.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/summary-${theme}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);console.log('Verified readable exact/opposing size metrics, long duration/angle/year values, visible Next buttons, expandable sources and mixed summary cards in both themes at two phone sizes.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
