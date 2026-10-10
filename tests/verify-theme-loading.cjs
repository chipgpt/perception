const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/theme-preference.js','utf8');
for(const [saved,expected]of [[null,'focus'],['night-lab','night-lab'],['focus','focus'],['studio','night-lab'],['<bad>','focus'],['system','focus']]){
 const writes=[],store=new Map(saved?[['perception-theme',saved]]:[]);
 const document={documentElement:{dataset:{}},write(s){writes.push(s)}};
 const window={localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};
 vm.runInNewContext(source,{document,window});
 assert.equal(document.documentElement.dataset.theme,expected);
 assert.equal(writes[1],`<link id="theme-stylesheet" rel="stylesheet" href="${expected}.css">`);
 assert(writes[0].includes('manrope-latin.woff2'));
 assert.equal(writes[0].includes('ibm-plex-mono-400-latin.woff2'),expected==='night-lab');
 if(saved==='studio')assert.equal(store.get('perception-theme'),'night-lab');
}
const writes=[];vm.runInNewContext(source,{document:{documentElement:{dataset:{}},write:s=>writes.push(s)},window:{localStorage:{getItem(){throw Error('Unavailable')}}}});
assert(writes[1].includes('focus.css'));
for(const name of ['index','focus','night-lab','studio']){
 const page=fs.readFileSync('public/'+name+'.html','utf8');
 assert(page.indexOf(source)>page.indexOf('<head>'));
 assert(page.indexOf(source)<page.indexOf('</head>'));
 assert(page.indexOf(source)<page.indexOf('function durationRound'));
 assert(!source.includes('appendChild'),'Stylesheet must be parser-inserted, blocking paint and game execution');
}
console.log('Verified parser-blocking theme CSS before first draw, saved themes, migration, and unavailable storage.');

for(const dark of [false,true]){
 const writes=[],document={documentElement:{dataset:{}},write:s=>writes.push(s)};
 vm.runInNewContext(source,{document,window:{matchMedia:()=>({matches:dark}),localStorage:{getItem:()=>null}}});
 assert.equal(document.documentElement.dataset.themePreference,'system');
 assert.equal(document.documentElement.dataset.theme,dark?'night-lab':'focus');
}
const listeners={},media={matches:false,addEventListener(k,fn){listeners.system=fn}},root={dataset:{theme:'focus',themePreference:'system'}},sheet={},select={addEventListener(k,fn){listeners.select=fn}};
vm.runInNewContext(fs.readFileSync('src/design-options/theme-switcher.js','utf8'),{document:{documentElement:root,getElementById:id=>id==='theme-select'?select:sheet},window:{matchMedia:()=>media,localStorage:{setItem(){}}}});
media.matches=true;listeners.system();assert.equal(root.dataset.theme,'night-lab');
select.value='focus';listeners.select();media.matches=false;listeners.system();media.matches=true;listeners.system();assert.equal(root.dataset.theme,'focus');
select.value='system';listeners.select();assert.equal(root.dataset.theme,'night-lab');
console.log('Verified System follows OS changes and explicit Light/Dark choices stay locked.');
