let sessionDay=calendarDay();
function shareResultsText(rounds,day,game='mix',daily=true){
 const [year,month,date]=day.split('-').map(Number);
 const dateLabel=new Date(year,month-1,date).toLocaleDateString('en-US',{month:'short',day:'numeric'});
 const icons={view3d:'🧊',balance:'⚖️',motion:'✍️',perspective:'👁️',proportion:'▭',rhythm:'🥁',angle:'📐',colour:'🎨',time:'⏱️',timeline:'🗓️',duration:'⏳'};
 const gameLabel=game==='mix'?'five':rounds[0]?.q.skill||'game';
 const total=rounds.reduce((sum,r)=>sum+r.score,0);
 return `perception.thedanktank.com ${dateLabel}${daily?'':' · Practice '+gameLabel}\n${rounds.map(r=>(icons[r.q.type]||'•')+r.score).join(' ')}\nFinal score: ${total}/${rounds.length*100}`;
}
function bindShareResults(){
 const panel=$('share-panel');
 const allowed=mode==='daily'&&mini==='mix'&&!review;
 if(panel)panel.hidden=!allowed;
 if(!allowed)return;
 const button=$('share-results'),status=$('share-status'),fallback=$('share-fallback');
 const text=shareResultsText(results,sessionDay,mini,mode==='daily'&&!review);
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  analyticsShareClicked();
  button.disabled=true;status.textContent='';fallback.hidden=true;
  try{
   if(typeof navigator.share==='function'){
    try{
     // Invoke directly from the tap, before any asynchronous work consumes user activation.
     await navigator.share({text});
     button.textContent='Share results';status.textContent='Share sheet opened.';
     return;
    }catch(error){
     // Dismissing the native sheet should not unexpectedly copy anything.
     if(error?.name==='AbortError'){button.textContent='Share results';return;}
    }
   }
   try{
    await navigator.clipboard.writeText(text);
    button.textContent='Copied!';status.textContent='Results copied. Paste them wherever you like.';
   }catch{
    fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();
    status.textContent='Select and copy your results below.';
   }
  }finally{button.disabled=false;}
 });
}
