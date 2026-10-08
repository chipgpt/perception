let sessionDay=calendarDay();
function shareResultsText(rounds,day,game='mix',daily=true){
 const [year,month,date]=day.split('-').map(Number);
 const dateLabel=new Date(year,month-1,date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
 const icons={view3d:'🧊',balance:'⚖️',motion:'✍️',perspective:'👁️',proportion:'▭',rhythm:'🥁',angle:'📐',colour:'🎨',time:'⏱️',timeline:'🗓️',duration:'⏳'};
 const gameLabel=game==='mix'?'five':rounds[0]?.q.skill||'game';
 const total=rounds.reduce((sum,r)=>sum+r.score,0);
 return `Perception · ${dateLabel}\n${daily?'Daily':'Practice'} ${gameLabel}\n${rounds.map(r=>(icons[r.q.type]||'•')+' '+r.score).join('  ')}\nScore: ${total}/${rounds.length*100}\nhttps://perception.thedanktank.com/`;
}
function bindShareResults(){
 const button=$('share-results'),status=$('share-status'),fallback=$('share-fallback');
 const text=shareResultsText(results,sessionDay,mini,mode==='daily'&&!review);
 button.addEventListener('click',async()=>{
  try{
   await navigator.clipboard.writeText(text);
   button.textContent='Copied!';status.textContent='Results copied. Paste them wherever you like.';fallback.hidden=true;
  }catch{
   fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();
   status.textContent='Select and copy your results below.';
  }
 });
}
