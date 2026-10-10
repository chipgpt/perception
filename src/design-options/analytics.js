// First-attempt Daily Five play and one daily share click are measured.
const ANALYTICS_STORAGE_KEY='perception-metrics-v1';
const ACQUISITION_SOURCES=['x','listdle','playlin','dledirectory','webgames','showhn'];
const ANALYTICS_EVENTS=['visit','start','complete','share','challenge_share_clicked','challenge_visit','challenge_start','challenge_complete',...ACQUISITION_SOURCES.flatMap(source=>['visit','start','complete'].map(stage=>'acquisition_'+source+'_'+stage))];
let analyticsReady=false,analyticsQueue=[],analyticsLedger={};
function analyticsAllowed(){return !!ANALYTICS_CONFIG.websiteId&&location.hostname===ANALYTICS_CONFIG.hostname&&navigator.doNotTrack!=='1';}
function analyticsDaily(){return analyticsAllowed()&&mode==='daily'&&mini==='mix'&&!review;}
function analyticsClaim(day,event){
 try{
  const text=localStorage.getItem(ANALYTICS_STORAGE_KEY)||'{}';
  const stored=text.length<=4096?JSON.parse(text):{};
  if(stored&&typeof stored==='object'&&!Array.isArray(stored))for(const [day,events]of Object.entries(stored)){
   if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day)||!Array.isArray(events))continue;
   analyticsLedger[day]=[...new Set([...(analyticsLedger[day]||[]),...events.filter(e=>ANALYTICS_EVENTS.includes(e))])];
  }
 }catch{}
 if(analyticsLedger[day]?.includes(event))return false;
 const previous=Array.isArray(analyticsLedger[day])?analyticsLedger[day].filter(e=>ANALYTICS_EVENTS.includes(e)):[];
 analyticsLedger[day]=[...previous,event];
 // A fixed-size ledger survives reloads and theme switches without growing history.
 analyticsLedger=Object.fromEntries(Object.entries(analyticsLedger).filter(([d])=>/^\d{4}-\d{1,2}-\d{1,2}$/.test(d)).sort(([a],[b])=>dayNumber(b)-dayNumber(a)).slice(0,7));
 let ledgerText=JSON.stringify(analyticsLedger);
 while(ledgerText.length>4096){delete analyticsLedger[Object.keys(analyticsLedger).at(-1)];ledgerText=JSON.stringify(analyticsLedger);}
 try{localStorage.setItem(ANALYTICS_STORAGE_KEY,ledgerText);}catch{}
 return true;
}
function analyticsSend(name,data){
 if(!analyticsAllowed())return;
 if(!analyticsReady){if(analyticsQueue.length<11)analyticsQueue.push([name,data]);return;}
 try{
  const sent=name?window.umami.track(name,data):window.umami.track(p=>({...p,url:'/',title:'Perception'}));
  if(sent&&typeof sent.catch==='function')sent.catch(()=>{});
 }catch{} // Analytics failure must never affect play. No retries or catch-up uploads.
}
function analyticsStarted(){
 if(!analyticsDaily()||results.length===5)return;
 if(analyticsClaim(sessionDay,'start'))analyticsSend('daily_started');
 analyticsChallenge('start');
 analyticsAcquisition('start');
}
function analyticsCompleted(){
 if(!analyticsDaily()||results.length!==5)return;
 if(!analyticsClaim(sessionDay,'complete'))return;
 const data={total:results.reduce((sum,r)=>sum+r.score,0)};
 for(const r of results)data[r.q.type]=r.score;
 analyticsSend('daily_completed',data);
 analyticsChallenge('complete');
 analyticsAcquisition('complete');
}
function analyticsAcquisition(stage){
 if(!analyticsDaily()||!['visit','start','complete'].includes(stage)||typeof URLSearchParams==='undefined')return;
 const source=new URLSearchParams(location.search||'').get('source');
 if(!ACQUISITION_SOURCES.includes(source))return;
 const event='acquisition_'+source+'_'+stage;
 if(analyticsClaim(calendarDay(),event))analyticsSend(event);
}
function analyticsChallenge(stage){
 if(!analyticsAllowed()||!['share_clicked','visit','start','complete'].includes(stage))return;
 if(stage!=='share_clicked'&&(typeof friendChallenge==='undefined'||!friendChallenge||!currentFriendChallenge()))return;
 if(analyticsClaim(calendarDay(),'challenge_'+stage))analyticsSend('challenge_'+stage);
}
function analyticsShareClicked(){
 if(!analyticsDaily())return;
 // Count the click's calendar day, independently of the Daily Five's date.
 if(analyticsClaim(calendarDay(),'share'))analyticsSend('results_share_clicked');
}
function setupAnalytics(){
 if(!analyticsAllowed())return;
 // The Cloud tracker otherwise sends an identify request on every script load.
 // Keep its ID on event payloads, but allow only our explicit event requests.
 window.perceptionAnalyticsBeforeSend=(type,payload)=>type==='event'?payload:false;
 const script=document.createElement('script');
 script.src=ANALYTICS_CONFIG.scriptUrl;script.defer=true;
 script.dataset.websiteId=ANALYTICS_CONFIG.websiteId;
 script.dataset.autoTrack='false';
 script.dataset.beforeSend='perceptionAnalyticsBeforeSend';
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
 analyticsChallenge('visit');
 analyticsAcquisition('visit');
 const interaction=e=>{
  if(e.type==='keydown'&&!['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  if(e.target.closest?.('#playarea,#actionarea'))analyticsStarted();
 };
 for(const event of ['pointerdown','click','keydown'])document.addEventListener(event,interaction,true);
}
