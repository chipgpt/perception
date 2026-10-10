function roundErrorDisplay(q,value){
 const number=n=>Number.isFinite(n)?n.toFixed(1):'—';
 const percent=(n,label)=>({value:number(n),unit:'%',label});
 switch(q.type){
  case 'view3d':return {value:number(orientationError(value,q.answer)),unit:'°',label:'rotation off'};
  case 'angle':return {value:number(angularDistance(value,q.answer)),unit:'°',label:'angle off'};
  case 'halfhalf':return {value:number(halfError(value,q)*100),unit:'',label:'percentage points off'};
  case 'balance':return q.fruit?{value:number(halfError(value,q)*100),unit:'',label:'percentage points off'}:percent(Math.abs(value-q.answer)/balanceWidth(q)*100,'width off');
  case 'motion':return percent(traceError(value,q.answer)/500*100,'of the diagonal off');
  case 'perspective':return percent(pointError(value,q.answer)/500*100,'of the diagonal off');
  case 'time':return {value:Math.abs(value-q.answer).toFixed(2),unit:'s',label:value===q.answer?'timing error':value<q.answer?'early':'late'};
  case 'rhythm':return percent(Math.abs(value/q.answer-1)*100,value===q.answer?'tempo error':value<q.answer?'slower':'faster');
  case 'proportion':return percent(Math.abs((value.width/value.height)/q.answer-1)*100,'ratio off');
  case 'colour':return percent(wheelDistance(value,q.answer)*100,'of the wheel radius off');
  case 'timeline':return {value:String(Math.abs(value-q.answer)),unit:'',label:Math.abs(value-q.answer)===1?'year off':'years off'};
  case 'duration':return {value:durationText(Math.abs(durationValue(value)-q.answer)),unit:'',label:value===q.answer?'duration error':value<q.answer?'too short':'too long',compact:true};
  default:return {value:String(Math.round(scoringError(value,q)*100)),unit:'%',label:'error'};
 }
}
function roundAnswerDisplay(q,value){
 switch(q.type){
  case 'time':return `You: ${value.toFixed(2)} s · Target: ${q.answer} s`;
  case 'timeline':return `You: ${value} · Answer: ${q.answer}`;
  case 'duration':return `You: ${durationText(value)} · Answer: ${durationText(q.answer)}`;
  case 'rhythm':return '';
  case 'proportion':return `You: ${(value.width/value.height).toFixed(2)} : 1 · Target: ${q.label}`;
  case 'halfhalf':case 'balance':return q.fruit?halfSplitText(value,q):'';
  default:return '';
 }
}
function styleRoundFeedback(q,value,score){
 const feedback=$('actionarea').querySelector('.feedback'),error=roundErrorDisplay(q,value);
 const verdict=score===100?'You nailed it.':score>=90?'Sharp eyes.':score>=75?'Pretty dialed in.':score>=50?'In the neighbourhood.':score>=25?'A generous interpretation.':score>0?'Bold. Incorrect.':'A spectacular miss.';
 feedback.classList.add('round-feedback');
 feedback.querySelector('.feedbacktop').innerHTML=`<div class="round-result-stats"><div class="round-result-error"><strong${(error.compact||error.value.length>6)?' class="compact-error"':''}>${escapeHTML(error.value)}<small>${escapeHTML(error.unit)}</small></strong><span>${escapeHTML(error.label)}</span></div><div class="round-result-points"><strong>${score}<small>/100</small></strong><span>points earned</span></div></div><p class="round-verdict">${verdict}</p>`;
 const comparison=feedback.querySelector('.colour-comparison');
 if(q.type!=='colour'){const answer=roundAnswerDisplay(q,value);if(answer){comparison.className='round-answer';comparison.textContent=answer;}else comparison.remove();}
 feedback.querySelector('.quick-tip')?.remove();
 const detail=feedback.querySelector('.math-detail');
 if(['timeline','duration'].includes(q.type)){detail.querySelector('summary').textContent='About this answer';}else detail?.remove();
 if(q.type==='rhythm'){$('pulse').parentElement.innerHTML=`<div class="rhythm-result-comparison"><div><span>Your tempo</span><strong>${pretty(value)}</strong><small>BPM</small></div><div class="rhythm-result-target"><span>Target</span><strong>${q.answer}</strong><small>BPM</small></div></div>`;}
}
