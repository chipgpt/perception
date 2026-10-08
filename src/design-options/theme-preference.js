(()=>{
 const themes=['focus','night-lab'];
 let theme='night-lab';
 try{const saved=window.localStorage.getItem('perception-theme');if(themes.includes(saved))theme=saved;else if(saved==='studio')window.localStorage.setItem('perception-theme','night-lab');}catch(_){}
 document.documentElement.dataset.theme=theme;
 const stylesheet=document.createElement('link');
 stylesheet.id='theme-stylesheet';stylesheet.rel='stylesheet';stylesheet.href=theme+'.css';
 document.head.appendChild(stylesheet);
})();
