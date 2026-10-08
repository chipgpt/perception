const fs=require('fs'),assert=require('assert'),crypto=require('crypto');
for(const theme of ['focus','night-lab']){
 const css=fs.readFileSync(theme+'.css','utf8'),html=fs.readFileSync(theme+'.html','utf8');
 assert(!css.includes('@import'),'No remote font stylesheet dependency');
 assert(!css.includes('fonts.googleapis.com')&&!css.includes('fonts.gstatic.com'));
 const faces=css.match(/@font-face\s*\{[^}]+\}/g);assert.equal(faces.length,5);
 for(const face of faces){
  assert(face.includes('font-display: optional'),'Slow fonts must never swap into an already-painted page');
  const path=face.match(/url\(([^)]+)\)/)[1];assert(path.startsWith('assets/fonts/'));
  assert.equal(fs.readFileSync(path).subarray(0,4).toString(),'wOF2');
 }
 const hash=crypto.createHash('sha256').update(css).digest('hex').slice(0,12);
 assert(html.includes(theme+'.css?v='+hash),'CSS changes must invalidate cached remote-font styles');
}
for(const family of ['manrope','spacegrotesk','ibmplexmono'])assert(fs.readFileSync('assets/fonts/'+family+'-OFL.txt','utf8').includes('SIL OPEN FONT LICENSE'));
console.log('Verified local licensed WOFF2 fonts, no late font swaps or external imports, and content-versioned theme stylesheets.');
