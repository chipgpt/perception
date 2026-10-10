// A challenge contains only a date and total, never answers or player identifiers.
function readFriendChallenge(search){
 const params=new URLSearchParams(search),day=params.get('day'),score=params.get('beat');
 if(params.get('from')!=='challenge'||!validDay(day)||!/^\d{1,3}$/.test(score||'')||Number(score)>500)return null;
 return {day:day.split('-').map(Number).join('-'),score:Number(score)};
}
const friendChallenge=typeof location!=='undefined'&&typeof URLSearchParams!=='undefined'?readFriendChallenge(location.search):null;
function currentFriendChallenge(){return friendChallenge&&friendChallenge.day===calendarDay()&&mode==='daily'&&mini==='mix'&&!review;}
function friendChallengeURL(total,day){
 const url=new URL('https://perception.thedanktank.com/');
 url.search=new URLSearchParams({from:'challenge',day,beat:String(total)}).toString();
 return url.href;
}
function friendChallengeText(){
 const total=results.reduce((sum,r)=>sum+r.score,0);
 return `I scored ${total}/500 on Perception. Can you beat me?\nFive daily puzzles. No login.\n${friendChallengeURL(total,sessionDay)}`;
}
function renderFriendChallenge(){
 const banner=$('friend-challenge');if(!banner)return;
 banner.hidden=!friendChallenge||mode!=='daily'||mini!=='mix'||review;
 if(banner.hidden)return;
 if(!currentFriendChallenge()){
  banner.textContent='That daily challenge has ended. Play today’s five and send a fresh challenge.';return;
 }
 if(results.length===5){
  const total=results.reduce((sum,r)=>sum+r.score,0),delta=total-friendChallenge.score;
  banner.textContent=delta>0?`You beat your friend by ${delta} ${delta===1?'point':'points'}! Send a challenge back.`:delta===0?`A tie at ${total}/500. Challenge someone else to break it.`:`Your friend scored ${friendChallenge.score}/500. You were ${-delta} points away. Try again tomorrow.`;
 }else banner.textContent=`Your friend scored ${friendChallenge.score}/500. Can you beat them? Same five puzzles. Your own first attempt.`;
}
function bindFriendChallenge(){
 renderFriendChallenge();
 const button=$('challenge-friend');if(!button)return;
 button.hidden=mode!=='daily'||mini!=='mix'||review||sessionDay!==calendarDay()||results.length!==5;
 if(button.hidden)return;
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  analyticsShareClicked();analyticsChallenge('share_clicked');
  button.disabled=true;
  const text=friendChallengeText(),status=$('share-status'),fallback=$('share-fallback');
  status.textContent='';fallback.hidden=true;
  try{
   if(typeof navigator.share==='function'){
    try{await navigator.share({text});status.textContent='Challenge shared.';return;}
    catch(error){if(error?.name==='AbortError')return;}
   }
   try{await navigator.clipboard.writeText(text);status.textContent='Challenge copied. Send it to a friend.';}
   catch{fallback.hidden=false;fallback.value=text;fallback.focus();fallback.select();status.textContent='Select and copy your challenge below.';}
  }finally{button.disabled=false;}
 });
}
