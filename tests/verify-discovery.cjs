const fs=require('fs'),assert=require('assert');
const origin='https://perception.thedanktank.com/';
for(const name of ['index','focus','night-lab','studio','about']){
 const html=fs.readFileSync('public/'+name+'.html','utf8');
 assert(html.indexOf('<meta charset="utf-8">')<1024,'UTF-8 declaration must precede bootstrap code');
 assert.equal((html.match(/<title>/g)||[]).length,1);
 const canonical=origin+(name==='about'?'about.html':'');
 assert(html.includes(`rel="canonical" href="${canonical}"`));
 for(const key of ['description','robots','twitter:card','twitter:title','twitter:description','twitter:image'])assert(html.includes(`name="${key}"`));
 for(const key of ['og:title','og:description','og:url','og:image','og:image:width','og:image:height','og:image:alt'])assert(html.includes(`property="${key}"`));
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);
 assert.equal(graph['@context'],'https://schema.org');assert.equal(graph['@graph'].find(n=>n['@type']==='WebApplication').offers.price,'0');
 assert(!html.includes('aggregateRating'),'No invented ratings');
 if(name!=='about'){assert(html.includes('<noscript>'));assert(html.includes('href="about.html"'));}
}
const sitemap=fs.readFileSync('public/sitemap.xml','utf8');assert(sitemap.includes(origin+'</loc>'));assert(sitemap.includes(origin+'about.html</loc>'));assert(!sitemap.includes('focus.html')&&!sitemap.includes('night-lab.html'));
const robots=fs.readFileSync('public/robots.txt','utf8');assert(robots.includes('User-agent: *\nAllow: /'));assert(robots.includes(origin+'sitemap.xml'));
assert(fs.readFileSync('public/llms.txt','utf8').includes(origin+'about.html'));
const png=fs.readFileSync('public/assets/social/perception.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
const packageScript=fs.readFileSync('scripts/package-site.py','utf8');assert(packageScript.includes("shutil.copytree(root/'public',out)"),'The complete public site must ship at the domain root');assert(!fs.existsSync('index.html'));assert(!fs.existsSync('focus.css'));
console.log('Verified canonical aliases, metadata, social preview dimensions, structured game data, static instructions, crawler files, and deployment packaging.');
