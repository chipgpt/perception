(()=>{
 const themes=['focus','night-lab'];
 let theme='night-lab';
 try{const saved=window.localStorage.getItem('perception-theme');if(themes.includes(saved))theme=saved;else if(saved==='studio')window.localStorage.setItem('perception-theme','night-lab');}catch(_){}
 document.documentElement.dataset.theme=theme;
 // This inline head script runs during HTML parsing. A parser-inserted link
 // blocks first paint and the later game script until the chosen CSS is ready.
 // A dynamically appended link does neither, leaving first-draw canvases black.
 document.write('<link id="theme-stylesheet" rel="stylesheet" href="'+theme+'.css">');
})();
