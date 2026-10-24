// Requires a local build server on port 4175 and Playwright/Chromium.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.goto('http://127.0.0.1:4175/?game=timeline');
 for(const [day,expected,bound]of [['2026-10-15',85,null],['2026-10-16',20,5],['2026-10-24',60,10]]){
  await page.evaluate(day=>{const id=Object.values(TRIVIA_BY_ID).find(f=>f.type==='timeline').id,q={...scheduledTriviaQuestion(id,day),title:'A recent event',answer:2025};deck=Array(5).fill(q);index=0;results=[];render();},day);
  await page.locator('#year-wheel').press('End');for(let i=0;i<5;i++)await page.locator('#year-wheel').press('ArrowUp');await page.locator('#trivia-lock').click();assert.equal(await page.evaluate(()=>results[0].guess),2021);assert.equal(await page.evaluate(()=>results[0].score),expected);
  const committed=await page.evaluate(()=>JSON.stringify(results));for(const theme of ['focus','night-lab']){await page.selectOption('#theme-select',theme);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>JSON.stringify(results)),committed);assert(await page.evaluate(()=>document.body.scrollHeight<=innerHeight+1));const text=await page.locator('#actionarea').innerText();if(bound)assert(text.includes('0 points at '+bound+' years off'));else assert(!text.includes('0 points at'));}
 }
 for(const theme of ['focus','night-lab']){
  await page.selectOption('#theme-select',theme);await page.evaluate(()=>{const q=scheduledTriviaQuestion('timeline-pokemon-first-released','2026-10-24');deck=Array(5).fill(q);index=0;results=[];render();});
  await page.locator('#year-wheel').press('End');for(let i=0;i<37;i++)await page.locator('#year-wheel').press('ArrowUp');await page.locator('#trivia-lock').click();assert.equal(await page.evaluate(()=>results[0].guess),1989);assert.equal(await page.evaluate(()=>results[0].score),30);assert((await page.locator('#actionarea').innerText()).includes('0 points at 10 years off'));assert(await page.locator('#next').evaluate(b=>b.getBoundingClientRect().bottom<=innerHeight));
  const out=process.env.PERCEPTION_SCREENSHOTS||'/workspace/artifacts/gentler-timeline';fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/'+theme+'.png'});
 }
 assert.deepEqual(errors,[]);console.log('Verified actual keyboard guesses under all three scoring versions, Pokemon seven-year miss = 30, visible bound and Next button, and theme/state persistence on a small phone.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
