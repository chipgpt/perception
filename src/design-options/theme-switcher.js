(()=>{
 const select=document.getElementById('theme-select');
 select.value=document.documentElement.dataset.theme;
 select.addEventListener('change',()=>{
  const theme=select.value;
  document.getElementById('theme-stylesheet').href=theme+'.css';
  document.documentElement.dataset.theme=theme;
  try{window.localStorage.setItem('perception-theme',theme);}catch(_){}
 });
})();
