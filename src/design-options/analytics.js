// Only first-attempt Daily Five play is measured. Configuration is public.
const ANALYTICS_STORAGE_KEY='perception-metrics-v1';
let analyticsReady=false,analyticsQueue=[],analyticsLedger={};
function analyticsAllowed(){return !!ANALYTICS_CONFIG.websiteId&&location.hostname===ANALYTICS_CONFIG.hostname&&navigator.doNotTrack!=='1';}
function analyticsDaily(){return analyticsAllowed()&&mode==='daily'&&mini==='mix'&&!review;}
function analyticsClaim(day,event){
 try{
  const text=localStorage.getItem(ANALYTICS_STORAGE_KEY)||'{}';
  const stored=text.length<=4096?JSON.parse(text):{};
  if(stored&&typeof stored==='object'&&!Array.isArray(stored))for(const [day,events]of Object.entries(stored)){
   if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day)||!Array.isArray(events))continue;
   analyticsLedger[day]=[...new Set([...(analyticsLedger[day]||[]),...events.filter(e=>['visit','start','complete'].includes(e))])];
  }
 }catch{}
 if(analyticsLedger[day]?.includes(event))return false;
 const previous=Array.isArray(analyticsLedger[day])?analyticsLedger[day].filter(e=>['visit','start','complete'].includes(e)):[];
 analyticsLedger[day]=[...previous,event];
 // A fixed-size ledger survives reloads and theme switches without growing history.
 analyticsLedger=Object.fromEntries(Object.entries(analyticsLedger).filter(([d])=>/^\d{4}-\d{1,2}-\d{1,2}$/.test(d)).sort(([a],[b])=>dayNumber(b)-dayNumber(a)).slice(0,7));
 try{localStorage.setItem(ANALYTICS_STORAGE_KEY,JSON.stringify(analyticsLedger));}catch{}
 return true;
}
function analyticsSend(name,data){
 if(!analyticsAllowed())return;
 if(!analyticsReady){if(analyticsQueue.length<3)analyticsQueue.push([name,data]);return;}
 try{
  const sent=name?window.umami.track(name,data):window.umami.track(p=>({...p,url:'/',title:'Perception'}));
  if(sent&&typeof sent.catch==='function')sent.catch(()=>{});
 }catch{} // Analytics failure must never affect play. No retries or catch-up uploads.
}
function analyticsStarted(){
 if(!analyticsDaily()||results.length===5)return;
 if(analyticsClaim(sessionDay,'start'))analyticsSend('daily_started');
}
function analyticsCompleted(){
 if(!analyticsDaily()||results.length!==5)return;
 if(!analyticsClaim(sessionDay,'complete'))return;
 const data={total:results.reduce((sum,r)=>sum+r.score,0)};
 for(const r of results)data[r.q.type]=r.score;
 analyticsSend('daily_completed',data);
}
function setupAnalytics(){
 if(!analyticsAllowed())return;
 const script=document.createElement('script');
 script.src=ANALYTICS_CONFIG.scriptUrl;script.defer=true;
 script.dataset.websiteId=ANALYTICS_CONFIG.websiteId;
 script.dataset.autoTrack='false';
 script.dataset.domains=ANALYTICS_CONFIG.hostname;
 script.dataset.excludeSearch='true';script.dataset.excludeHash='true';script.dataset.doNotTrack='true';
 // Reuse the existing anonymous browser identity without an extra identify request.
 if(typeof playerData.id==='string'&&playerData.id.length<=50)script.dataset.distinctId=playerData.id;
 script.addEventListener('load',()=>{
  analyticsReady=!!window.umami;
  const pending=analyticsQueue;analyticsQueue=[];
  if(analyticsReady)for(const [name,data]of pending)analyticsSend(name,data);
 });
 script.addEventListener('error',()=>{analyticsQueue=[];});
 document.head.appendChild(script);
 if(analyticsClaim(calendarDay(),'visit'))analyticsSend(null);
 const interaction=e=>{
  if(e.type==='keydown'&&!['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  if(e.target.closest?.('#playarea,#actionarea'))analyticsStarted();
 };
 for(const event of ['pointerdown','click','keydown'])document.addEventListener(event,interaction,true);
}
