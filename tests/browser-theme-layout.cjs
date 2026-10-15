// Requires a local build server on port 4175 and Playwright/Chromium.
const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert');
const games=['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration'];
// Palettes may change colours, but cannot introduce a second layout.
const light=fs.readFileSync('src/design-options/focus-palette.css','utf8'),dark=fs.readFileSync('src/design-options/night-lab-palette.css','utf8');
assert.equal(fs.readFileSync('public/focus.css','utf8').replace(light,'PALETTE'),fs.readFileSync('public/night-lab.css','utf8').replace(dark,'PALETTE'));
for(const palette of [light,dark])assert(palette.replace(/\/\*[\s\S]*?\*\//g,'').match(/^:root\s*\{\s*(?:(?:--[\w-]+|color-scheme):[^;{}]+;\s*)+\}\s*$/));
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.addInitScript(()=>localStorage.setItem('perception-theme','night-lab'));
 const theme=async value=>{await page.selectOption('#theme-select',value);await page.waitForFunction(value=>document.getElementById('theme-stylesheet').sheet?.href.includes(value),value);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(80);};
 const snapshot=()=>page.evaluate(()=>[...document.querySelectorAll('body *:not(script):not(style):not(link):not(option)')].filter(e=>e.getClientRects().length&&!e.closest('svg')).map(e=>{const c=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,rect:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100),style:Object.fromEntries(['fontFamily','fontSize','fontWeight','letterSpacing','textTransform','padding','gap','borderRadius','borderWidth','display','alignItems','justifyContent'].map(k=>[k,c[k]]))};}));
 const parity=async label=>{const state=await page.evaluate(()=>JSON.stringify({deck,index,results}));await theme('night-lab');const a=await snapshot();await theme('focus');const b=await snapshot();if(JSON.stringify(a)!==JSON.stringify(b))console.log(label,JSON.stringify(a.map((v,i)=>JSON.stringify(v)===JSON.stringify(b[i])?null:{dark:v,light:b[i]}).filter(Boolean).slice(0,5),null,2));assert.deepEqual(b,a,label);assert.equal(await page.evaluate(()=>JSON.stringify({deck,index,results})),state,label+' changed progress');};
 for(const viewport of [{width:375,height:667},{width:430,height:932},{width:1280,height:900}]){
  await page.setViewportSize(viewport);
  for(const game of games){await page.goto('http://127.0.0.1:4175/?game='+game);await page.evaluate(game=>{deck=makeDeck('practice:theme-parity',game);index=0;results=[];render();},game);await parity(`${game} start ${viewport.width}`);if(game==='balance'){await page.locator('#balance-canvas').press('ArrowRight');await page.locator('#half-lock').click();}else await page.evaluate(()=>{const q=deck[0];if(q.type==='view3d')viewPicker(q);if(q.type==='colour')colourPicker(q);if(q.type==='motion')tracePicker(q);reveal(q.answer);});await parity(`${game} reveal ${viewport.width}`);}
  await page.evaluate(()=>{results=deck.map(q=>({q,guess:q.answer,score:100}));finish();});await parity('summary '+viewport.width);
  await page.locator('#game-menu-toggle').click();await parity('navigation '+viewport.width);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4175/?game=proportion');await theme('focus');await page.mouse.move(0,0);
 const colours=await page.evaluate(()=>({palette:Object.fromEntries(['paper','surface','canvas','line','ink','muted','accent','draw','target'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()])),button:[getComputedStyle(document.querySelector('#proportion-lock')).backgroundColor,getComputedStyle(document.querySelector('#proportion-lock')).color]}));
 assert.deepEqual(colours.palette,{paper:'#fafafa',surface:'#fff',canvas:'#fff',line:'#e9eaed',ink:'#191b21',muted:'#737782',accent:'#3b52ec',draw:'#3b52ec',target:'#a4be21'});assert.deepEqual(colours.button,['rgb(32, 35, 45)','rgb(255, 255, 255)']);
 const output=process.env.PERCEPTION_SCREENSHOTS||'/workspace/artifacts/theme-layout';fs.mkdirSync(output,{recursive:true});
 for(const mode of ['focus','night-lab']){await theme(mode);await page.screenshot({path:output+'/'+mode+'-play.png'});}await page.locator('#proportion-lock').click();for(const mode of ['focus','night-lab']){await theme(mode);await page.screenshot({path:output+'/'+mode+'-reveal.png'});}
 assert.deepEqual(errors,[]);console.log('Verified identical light/dark geometry and typography for all 11 games in start/reveal, summaries and navigation at three viewport sizes; light palette and committed progress preserved.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
