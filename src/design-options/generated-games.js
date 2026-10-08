// Independent streams make each game reproducible without coupling its questions to other games.
const GENERATED_RANGES={angle:[5,175],time:[2,15],rhythm:[60,144],ratioTerms:[1,12],ratioBounds:[.55,2.4],pathAnchors:[4,6]};
const GAME_TYPES=['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration'];
function hashSeed(text){let hash=2166136261;for(const c of String(text)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function calendarDay(now=new Date()){return [now.getFullYear(),now.getMonth()+1,now.getDate()].join('-');}
function shuffleWith(random,list){const copy=list.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function integerBetween(random,min,max){return min+Math.floor(random()*(max-min+1));}
function makeDeck(day,game=mini){
 // Accept an RNG for existing tooling; normal play passes a date or a practice-session seed.
 const key=typeof day==='function'?String(Math.floor(day()*4294967296)):String(day);
 const forGame=type=>{
  if(!GAME_TYPES.includes(type))throw new Error('Unknown mini-game');
  if(['angle','time','rhythm','proportion','motion','view3d'].includes(type))return Array.from({length:5},(_,round)=>generatedQuestion(type,rng(hashSeed(key+'|'+type+'|v1|'+round)),round));
  return makeGameDeck(rng(hashSeed(key+'|'+type+'|v1')),type);
 };
 if(game==='mix'&&/^\d{4}-\d{1,2}-\d{1,2}$/.test(key)){
  const dateKey=key.split('-').map((n,i)=>i?String(Number(n)).padStart(2,'0'):n).join('-');
  const daily=typeof DAILY_TRIVIA_SCHEDULE==='undefined'?null:DAILY_TRIVIA_SCHEDULE[dateKey];
  if(daily)return daily.types.map(type=>daily.trivia[type]?scheduledTriviaQuestion(daily.trivia[type]):forGame(type)[0]);
  // A delayed schedule job must never accidentally recycle trivia. Procedural games
  // keep Daily five playable beyond the published horizon, deterministically.
  return shuffleWith(rng(hashSeed(key+'|schedule-v1')),GAME_TYPES.filter(type=>!['timeline','duration'].includes(type))).slice(0,5).map(type=>forGame(type)[0]);
 }
 if(game==='mix')return shuffleWith(rng(hashSeed(key+'|schedule-v1')),GAME_TYPES.filter(type=>!['timeline','duration'].includes(type)||pastTriviaIds(type).length)).slice(0,5).map(type=>forGame(type)[0]);
 return forGame(game);
}
function generatedQuestion(type,random,round){
 const q={id:type+'-'+round,type};
 if(type==='view3d'){const answer={yaw:random()*360-180,pitch:random()*120-60,roll:random()*180-90};return {...q,skill:'3D view',title:'Match this view.',answer,shape:makeBlockShape(random),tip:'Solid is your view. The lime outline is the target.',explain:'Each puzzle has a generated, connected shape of three to five coloured pieces. Drag the shape to turn it; use the green handle to tilt the whole view. The score measures the smallest rotation between your view and the target.'};}
 if(type==='angle'){q.answer=integerBetween(random,...GENERATED_RANGES.angle);return {...q,skill:'Angles',title:q.answer+'°',tip:'The lime line shows the target angle.',explain:'The target can be any whole degree from 5° to 175°. Scores measure the angular distance from your guess.'};}
 if(type==='time'){q.answer=integerBetween(random,...GENERATED_RANGES.time);return {...q,skill:'Time awareness',title:'Feel '+q.answer+' seconds.',unit:' s',tip:'Notice whether you stop early or late.',explain:'Any whole duration from 2 to 15 seconds. The clock measures Start to Stop; switching away resets a running round.'};}
 if(type==='rhythm'){q.answer=integerBetween(random,...GENERATED_RANGES.rhythm);return {...q,skill:'Rhythm',title:'Copy the pulse.',tip:'Watch five flashes, then tap five beats at the same pace.',explain:'The pulse can be any whole tempo from 60 to 144 BPM. Your tempo is measured from the intervals between five taps. No sound is played.'};}
 if(type==='proportion'){let width,height;do{width=integerBetween(random,...GENERATED_RANGES.ratioTerms);height=integerBetween(random,...GENERATED_RANGES.ratioTerms);}while(width/height<GENERATED_RANGES.ratioBounds[0]||width/height>GENERATED_RANGES.ratioBounds[1]);const gcd=(a,b)=>b?gcd(b,a%b):a,divisor=gcd(width,height);width/=divisor;height/=divisor;q.answer=width/height;q.label=width+' : '+height;return {...q,skill:'Proportions',title:'Make '+q.label+'.',tip:'The lime outline shows the target proportion.',explain:'The ratio compares width with height using whole numbers, reduced to their simplest form. Any size works. Scores measure ratio error independently of size.'};}
 const line=makeMemoryPath(random);return {...q,skill:'Line memory',title:'Trace that path.',answer:line.points,previewMs:3000,tip:'Your trace and the remembered path are overlaid.',explain:'A generated path with three to five connected sections, using either corners or smooth bends. It stays within the canvas and can be drawn in one stroke. Scores compare the complete paths; speed and direction do not matter.'};
}
function makeMemoryPath(random){
 const count=integerBetween(random,...GENERATED_RANGES.pathAnchors),anchors=[];
 let previous=150;
 for(let i=0;i<count;i++){
  let y=integerBetween(random,55,245);
  if(Math.abs(y-previous)<35)y=previous<150?Math.min(245,previous+55):Math.max(55,previous-55);
  anchors.push({x:45+i*310/(count-1)+(i&&i<count-1?integerBetween(random,-10,10):0),y});previous=y;
 }
 const smooth=random()<.55,points=[];
 for(let i=0;i<count-1;i++){
  const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(count-1,i+2)];
  for(let step=0;step<24;step++){
   const t=step/24;
   const coordinate=key=>smooth?.5*((2*b[key])+(-a[key]+c[key])*t+(2*a[key]-5*b[key]+4*c[key]-d[key])*t*t+(-a[key]+3*b[key]-3*c[key]+d[key])*t*t*t):b[key]+(c[key]-b[key])*t;
   points.push({x:coordinate('x'),y:Math.max(30,Math.min(270,coordinate('y')))});
  }
 }
 points.push({...anchors[count-1]});
 // Mirror and sometimes turn vertically; fit the entire path inside generous margins.
 const vertical=random()<.35,mirror=random()<.5;
 return {points:points.map(p=>vertical?{x:40+(p.y-30)/240*320,y:35+(mirror?355-p.x:p.x-45)/310*230}:{x:mirror?400-p.x:p.x,y:p.y}),smooth};
}

function makeBlockShape(random){
 const count=integerBetween(random,3,5),parts=[];
 const dimensions=index=>{
  const values=index===0?[1.5+random()*.6,.45+random()*.25,.5+random()*.25]:index===1?[1+random()*.5,.8+random()*.4,.22+random()*.18]:[.4+random()*.5,.4+random()*.4,.3+random()*.4];
  return shuffleWith(random,values);
 };
 parts.push([0,0,0,...dimensions(0)]);
 const overlaps=(a,b)=>[0,1,2].every(axis=>Math.abs(a[axis]-b[axis])<(a[axis+3]+b[axis+3])/2-1e-8);
 for(let index=1;index<count;index++){
  const size=dimensions(index);let candidate;
  for(let attempt=0;attempt<100;attempt++){
   const parent=parts[integerBetween(random,0,parts.length-1)],axis=integerBetween(random,0,2),sign=random()<.5?-1:1;
   const position=parent.slice(0,3).map((value,j)=>j===axis?value+sign*(parent[j+3]+size[j])/2:value+(random()-.5)*parent[j+3]*.35);
   candidate=[...position,...size];if(!parts.some(part=>overlaps(candidate,part)))break;candidate=null;
  }
  if(!candidate){const parent=parts.reduce((a,b)=>a[0]+a[3]/2>b[0]+b[3]/2?a:b);candidate=[parent[0]+(parent[3]+size[0])/2,parent[1],parent[2],...size];}
  parts.push(candidate);
 }
 const mid=[0,1,2].map(axis=>(Math.min(...parts.map(p=>p[axis]-p[axis+3]/2))+Math.max(...parts.map(p=>p[axis]+p[axis+3]/2)))/2);
 let radius=0;for(const p of parts)for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])radius=Math.max(radius,Math.hypot(...p.slice(0,3).map((value,i)=>value-mid[i]+[x,y,z][i]*p[i+3]/2)));
 const scale=1.1/radius,colours=shuffleWith(random,['#2448ED','#D4EE46','#F08A55','#E965A0','#3DCEC3']);
 const faces=[[2,-1],[2,1],[0,-1],[0,1],[1,1],[1,-1]];
 const boxes=parts.map((p,index)=>[...p.slice(0,3).map((value,axis)=>(value-mid[axis])*scale),...p.slice(3).map(value=>value*scale),colours[index],faces.map(([axis,sign])=>!parts.some((other,j)=>j!==index&&Math.abs(p[axis]+sign*p[axis+3]/2-(other[axis]-sign*other[axis+3]/2))<1e-8&&[0,1,2].filter(k=>k!==axis).every(k=>other[k]-other[k+3]/2<=p[k]-p[k+3]/2+1e-8&&other[k]+other[k+3]/2>=p[k]+p[k+3]/2-1e-8)))]);
 return {boxes};
}

function scheduledTriviaQuestion(id){
 const f=TRIVIA_BY_ID[id];if(!f)throw new Error('Missing scheduled trivia');
 return {id:f.id,type:f.type,skill:f.type==='timeline'?'When?':'How long?',title:f.title,answer:f.answer,caption:f.caption,explain:f.explain,source:[f.source.name,f.source.url],tip:'Answer: '+(f.type==='timeline'?f.answer:durationText(f.answer))};
}
