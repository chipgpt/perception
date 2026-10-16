const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const output='/workspace/artifacts/how-it-works';fs.mkdirSync(output,{recursive:true});
 await page.goto('http://127.0.0.1:4175/?game=proportion&mode=practice');await page.locator('#size-handle').press('Shift+ArrowRight');
 const original=await page.evaluate(()=>JSON.stringify({deck,index,results,guess}));
 for(const theme of ['night-lab','focus']){
  await page.selectOption('#theme-select',theme);
  for(const viewport of [{width:320,height:667},{width:390,height:844},{width:1024,height:768}]){
   await page.setViewportSize(viewport);await page.locator('#help').click();
   assert(await page.locator('#helpdialog').evaluate(d=>d.open));assert.equal(await page.locator('#helpdialog').getAttribute('aria-labelledby'),'help-title');
   await page.locator('#helpdialog').evaluate(d=>{d.scrollTop=0;d.querySelectorAll('details').forEach(el=>el.open=false)});
   assert.equal(await page.locator('.help-games details').count(),11);
   const fit=async()=>{const r=await page.locator('#helpdialog').evaluate(d=>{const r=d.getBoundingClientRect(),close=d.querySelector('#closehelp').getBoundingClientRect(),done=d.querySelector('#gotit').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,sw:d.scrollWidth,cw:d.clientWidth,close:close.toJSON(),done:done.toJSON(),w:innerWidth,h:innerHeight}});assert(r.left>=0&&r.right<=r.w&&r.top>=0&&r.bottom<=r.h,'dialog outside viewport');assert(r.sw<=r.cw+1,'horizontal overflow');assert(r.close.top>=0&&r.close.bottom<=r.h,'close unreachable');assert(r.done.top>=0&&r.done.bottom<=r.h,'footer unreachable');};await fit();
   if(viewport.width===390)await page.screenshot({path:output+'/scoring-'+theme+'.png'});
   // Every explanation remains readable and operable at narrow phone widths.
   for(const detail of await page.locator('.help-games details').all()){await detail.locator('summary').focus();await page.keyboard.press('Enter');assert(await detail.evaluate(d=>d.open));await fit();await page.keyboard.press('Enter');}
   await page.locator('.help-games details').filter({has:page.locator('summary',{hasText:'Size it up'})}).locator('summary').click();
   if(viewport.width===390)await page.screenshot({path:output+'/game-rules-'+theme+'.png'});
   await page.locator('#gotit').click();assert(!await page.locator('#helpdialog').evaluate(d=>d.open));assert.equal(await page.evaluate(()=>JSON.stringify({deck,index,results,guess})),original,'help changed game progress');
   await page.locator('#help').click();await page.keyboard.press('Escape');assert(!await page.locator('#helpdialog').evaluate(d=>d.open));assert(await page.locator('#help').evaluate(b=>document.activeElement===b));
  }
 }
 const examples=await page.evaluate(()=>[
  scoreFor(45,{type:'angle',answer:0,scoringVersion:2}),
  scoreFor({yaw:5.5,pitch:0,roll:0},{type:'view3d',answer:{yaw:0,pitch:0,roll:0},scoringVersion:2}),
  scoreFor(7.5,{type:'time',answer:10,timeScoringVersion:2,scoringVersion:2}),
  scoreFor(5400,{type:'duration',answer:7200,scoringVersion:2})]);assert.deepEqual(examples,[75,94,50,50]);
 assert.deepEqual(errors,[]);console.log('Verified How it works on narrow phone, phone and desktop in both themes: all eleven keyboard disclosures, visible dismissal controls, no horizontal overflow, Escape/focus return, preserved round state, and scoring examples.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
