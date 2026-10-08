const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/theme-preference.js','utf8');
for(const [saved,expected]of [[null,'night-lab'],['night-lab','night-lab'],['focus','focus'],['studio','night-lab'],['<bad>','night-lab']]){
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
assert(writes[1].includes('night-lab.css'));
for(const name of ['index','focus','night-lab','studio']){
 const page=fs.readFileSync(name+'.html','utf8');
 assert(page.indexOf(source)>page.indexOf('<head>'));
 assert(page.indexOf(source)<page.indexOf('</head>'));
 assert(page.indexOf(source)<page.indexOf('function durationRound'));
 assert(!source.includes('appendChild'),'Stylesheet must be parser-inserted, blocking paint and game execution');
}
console.log('Verified parser-blocking theme CSS before first draw, saved themes, migration, and unavailable storage.');
