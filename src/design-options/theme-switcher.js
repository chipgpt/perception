(()=>{
 const select=document.getElementById('theme-select'),root=document.documentElement;
 const media=window.matchMedia?.('(prefers-color-scheme: dark)');
 let preference=root.dataset.themePreference||'system';
 const sync=()=>{
  const theme=preference==='system'?(media?.matches?'night-lab':'focus'):preference;
  const sheet=document.getElementById('theme-stylesheet'),href=window.perceptionThemeAssets?.[theme]||theme+'.css';
  if(root.dataset.theme!==theme)sheet.href=href;
  root.dataset.theme=theme;root.dataset.themePreference=preference;select.value=preference;
  select.title='Theme: '+(preference==='system'?'System':preference==='focus'?'Light':'Dark');
 };
 select.addEventListener('change',()=>{preference=select.value;try{window.localStorage.setItem('perception-theme',preference);}catch(_){}sync();});
 media?.addEventListener('change',()=>{if(preference==='system')sync();});
 sync();
})();
