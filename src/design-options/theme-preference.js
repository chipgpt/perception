(()=>{
 const themes=['focus','night-lab'];
 let theme='night-lab';
 try{const saved=window.localStorage.getItem('perception-theme');if(themes.includes(saved))theme=saved;else if(saved==='studio')window.localStorage.setItem('perception-theme','night-lab');}catch(_){}
 document.documentElement.dataset.theme=theme;
 // Both themes use Manrope. Only Night Lab needs the mono UI fonts up front.
 const fonts=['manrope-latin',...(theme==='night-lab'?['ibm-plex-mono-400-latin','ibm-plex-mono-500-latin','ibm-plex-mono-600-latin']:[])];
 document.write(fonts.map(name=>'<link rel="preload" href="assets/fonts/'+name+'.woff2" as="font" type="font/woff2" crossorigin>').join(''));
 // This inline head script runs during HTML parsing. A parser-inserted link
 // blocks first paint and the later game script until the chosen CSS is ready.
 // A dynamically appended link does neither, leaving first-draw canvases black.
 document.write('<link id="theme-stylesheet" rel="stylesheet" href="'+(window.perceptionThemeAssets?.[theme]||theme+'.css')+'">');
})();
