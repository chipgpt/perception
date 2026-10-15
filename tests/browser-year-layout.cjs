// Requires a local build server on port 4175 and Playwright/Chromium.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.addInitScript(()=>localStorage.setItem('perception-theme','night-lab'));
 const check=async label=>{const tint=await page.locator('.year-selection').evaluate(e=>getComputedStyle(e).backgroundColor);assert(/(?:\/\s*0?\.0?8\s*\)|,\s*0?\.0?8\s*\))$/.test(tint),label+': selection tint must remain transparent so the chosen year is visible: '+tint);const m=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width}};const w=document.getElementById('year-wheel');return {stage:rect(document.getElementById('game-stage')),picker:rect(w.parentElement),row:rect(w.querySelector('[data-year="'+w.getAttribute('aria-valuenow')+'"]')),marker:rect(document.querySelector('.year-selection')),answer:document.querySelector('.year-answer')?rect(document.querySelector('.year-answer')):null};});
  for(const name of ['picker','row','marker']){assert(Math.abs(m[name].x-m.stage.x)<1,`${label}: ${name} off centre horizontally by ${m[name].x-m.stage.x}px`);assert(Math.abs(m[name].y-m.stage.y)<1,`${label}: ${name} off centre vertically by ${m[name].y-m.stage.y}px`);}
  if(m.answer)assert(Math.abs(m.answer.x-m.stage.x)<1,label+': answer badge off centre');
 };
 const output=process.env.PERCEPTION_SCREENSHOTS||'/workspace/artifacts/year-selector';fs.mkdirSync(output,{recursive:true});
 for(const theme of ['night-lab','focus']){
  await page.goto('http://127.0.0.1:4175/?game=timeline');await page.selectOption('#theme-select',theme);await page.waitForTimeout(80);await check(theme+' starting state');
  await page.locator('#year-wheel').press('ArrowDown');await page.locator('#trivia-lock').click();const committed=await page.evaluate(()=>JSON.stringify(results[0]));
  for(const viewport of [{width:430,height:932},{width:414,height:896},{width:390,height:844},{width:375,height:667},{width:760,height:900},{width:761,height:900},{width:1280,height:900}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(60);await check(`${theme} reveal ${viewport.width}×${viewport.height}`);assert.equal(await page.evaluate(()=>JSON.stringify(results[0])),committed,'resizing changed the committed result');
   if(viewport.width===430)await page.screenshot({path:output+'/reveal-'+theme+'.png'});
  }
 }
 assert.deepEqual(errors,[]);console.log('Verified year picker, selected year, marker, and answer badge remain centered before/after reveal in both themes across seven viewport sizes; committed guesses stay unchanged.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
