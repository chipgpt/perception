const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/design-options/friend-challenge.js','utf8');
function harness(search='',navigator={}){
 const elements={};for(const id of ['friend-challenge','challenge-friend','share-status','share-fallback'])elements[id]={hidden:true,textContent:'',addEventListener(_,fn){this.click=fn},focus(){this.focused=true},select(){this.selected=true}};
 const events=[],c=vm.createContext({URL,URLSearchParams,location:{search},calendarDay:()=> '2026-10-9',validDay(day){if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(day||''))return false;const [y,m,d]=day.split('-').map(Number),v=new Date(Date.UTC(y,m-1,d));return v.getUTCFullYear()===y&&v.getUTCMonth()+1===m&&v.getUTCDate()===d},mode:'daily',mini:'mix',review:false,sessionDay:'2026-10-9',results:[],navigator,$:id=>elements[id],analyticsShareClicked(){events.push('share')},analyticsChallenge(stage){events.push(stage)}});
 vm.runInContext(source,c);return {elements,events,run:s=>vm.runInContext(s,c)};
}
(async()=>{
 for(const query of ['?from=challenge&day=2026-2-30&beat=300','?from=challenge&day=2026-10-9&beat=501','?from=challenge&day=2026-10-9&beat=-1','?from=challenge&day=2026-10-9&beat=<img>','?day=2026-10-9&beat=300'])assert.equal(harness(query).run('friendChallenge'),null);
 const c=harness('?from=challenge&day=2026-10-09&beat=300');
 c.run('renderFriendChallenge()');assert(c.elements['friend-challenge'].textContent.includes('300/500'));
 c.run('results=Array.from({length:5},()=>({score:80}));bindFriendChallenge()');assert(c.elements['friend-challenge'].textContent.includes('beat your friend by 100'));assert(!c.elements['challenge-friend'].hidden);
 const text=c.run('friendChallengeText()'),url=text.split('\n').at(-1);assert.equal(new URL(url).searchParams.get('beat'),'400');assert.equal(harness(new URL(url).search).run('friendChallenge.score'),400);
 c.run('results=Array.from({length:5},()=>({score:60}));renderFriendChallenge()');assert(c.elements['friend-challenge'].textContent.includes('tie'));
 c.run('results=Array.from({length:5},()=>({score:40}));renderFriendChallenge()');assert(c.elements['friend-challenge'].textContent.includes('100 points away'));
 c.run("mode='practice';bindFriendChallenge()");assert(c.elements['challenge-friend'].hidden);assert(c.elements['friend-challenge'].hidden);
 const old=harness('?from=challenge&day=2026-10-8&beat=300');old.run('renderFriendChallenge()');assert(old.elements['friend-challenge'].textContent.includes('has ended'));assert(!old.run('currentFriendChallenge()'));
 let payload;const native=harness('',{share:async data=>{payload=data}});native.run('results=Array.from({length:5},()=>({score:80}));bindFriendChallenge()');await native.elements['challenge-friend'].click();assert(payload.text.includes('400/500'));assert.deepEqual(native.events,['share','share_clicked']);
 const cancel=harness('',{share:async()=>{throw {name:'AbortError'}}});cancel.run('results=Array.from({length:5},()=>({score:80}));bindFriendChallenge()');await cancel.elements['challenge-friend'].click();assert(cancel.elements['share-fallback'].hidden);assert.equal(cancel.elements['share-status'].textContent,'');
 const fallback=harness();fallback.run('results=Array.from({length:5},()=>({score:80}));bindFriendChallenge()');await fallback.elements['challenge-friend'].click();assert(fallback.elements['share-fallback'].value.includes('beat=400'));assert(fallback.elements['share-fallback'].selected);
 console.log('Verified challenge round trip, invalid dates/scores, expiry, win/tie/loss, practice isolation, native sharing, cancellation and manual copying.');
})().catch(error=>{console.error(error);process.exitCode=1});
