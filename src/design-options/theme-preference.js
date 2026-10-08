(()=>{
 const themes=['focus','night-lab','studio'];
 let theme='night-lab';
 try{const saved=window.localStorage.getItem('perception-theme');if(themes.includes(saved))theme=saved;}catch(_){}
 document.documentElement.dataset.theme=theme;
 const stylesheet=document.createElement('link');
 stylesheet.id='theme-stylesheet';stylesheet.rel='stylesheet';stylesheet.href=theme+'.css';
 document.head.appendChild(stylesheet);
})();
