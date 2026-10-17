function roundErrorDisplay(q,value){
 const number=n=>Number.isFinite(n)?n.toFixed(1):'—';
 const percent=(n,label,note)=>({value:number(n),unit:'%',label,note});
 switch(q.type){
  case 'view3d':return {value:number(orientationError(value,q.answer)),unit:'°',label:'Rotation error'};
  case 'angle':return {value:number(angularDistance(value,q.answer)),unit:'°',label:'Angle error'};
  case 'halfhalf':return {value:number(halfError(value,q)*100),unit:'',label:'Split error',note:'percentage points'};
  case 'balance':return q.fruit?{value:number(halfError(value,q)*100),unit:'',label:'Split error',note:'percentage points'}:percent(Math.abs(value-q.answer)/balanceWidth(q)*100,'Balance error','of the shape’s width');
  case 'motion':if(usesTraceCoverage(q)){const trace=traceCoverageResult(value,q.answer);return percent(trace.coverage*100,'Target covered',trace.penalty>0?'−'+number(Math.min(trace.coverage,trace.penalty)*100)+' pts for excess ink':'No excess-ink penalty');}if(q.scoringVersion===2)return percent(traceOverlap(value,q.answer)*100,'Line overlap','shared area ÷ combined area');return percent(traceError(value,q.answer)/500*100,q.type==='motion'?'Path error':'Position error','of the play-area diagonal');
  case 'perspective':return percent(pointError(value,q.answer)/perspectiveDiagonal(q)*100,'Position error',q.scoringVersion===2?'of the inner-box diagonal':'of the play-area diagonal');
  case 'time':return {value:Math.abs(value-q.answer).toFixed(2),unit:'s',label:'Timing error',note:(Math.abs(value-q.answer)<.005?'Spot on':value<q.answer?'Too early':'Too late')+(usesRelativeTime(q)?' · 0 points at '+pretty(timeErrorBound(q))+' s off':'')};
  case 'rhythm':return percent(Math.abs(value/q.answer-1)*100,'Tempo error',Math.abs(value/q.answer-1)*100<.05?'Spot on':value<q.answer?'Too slow':'Too fast');
  case 'proportion':if(isSizeQuestion(q)){const e=sizeErrors(value,q);return {value:(e.width*100).toFixed(1)+'% / '+(e.height*100).toFixed(1)+'%',unit:'',label:'Size error',compact:true,axes:['width','height'].map(axis=>sizeAxisDisplay(value,q,axis))};}return percent(Math.abs((value.width/value.height)/q.answer-1)*100,'Ratio error');
  case 'colour':return percent(wheelDistance(value,q.answer)*100,'Color error','of the wheel radius');
  case 'timeline':return {value:String(Math.abs(value-q.answer)),unit:Math.abs(value-q.answer)===1?'year':'years',label:'Year error',note:usesAgeBasedTimeline(q)?'0 points at '+pretty(timelineErrorBound(q))+' years off':undefined};
  case 'duration':return {value:durationText(Math.abs(durationValue(value)-q.answer)),unit:'',label:'Duration error',note:(value===q.answer?'Spot on':value<q.answer?'Too short':'Too long')+(q.scoringVersion===2?' · 0 points at 50% off':''),compact:true};
  default:return {value:String(Math.round(scoringError(value,q)*100)),unit:'%',label:'Error'};
 }
}
function roundAnswerDisplay(q,value){
 switch(q.type){
  case 'time':return `Your guess: ${value.toFixed(2)} s · Target: ${q.answer} s`;
  case 'timeline':return `Your guess: ${value} · Answer: ${q.answer}`;
  case 'duration':return `Your guess: ${durationText(value)} · Answer: ${durationText(q.answer)}`;
  case 'rhythm':return '';
  case 'proportion':if(isSizeQuestion(q))return sizeFeedback(value,q);return `Your guess: ${(value.width/value.height).toFixed(2)} : 1 · Target: ${q.label}`;
  case 'halfhalf':case 'balance':return q.fruit?halfSplitText(value,q):'';
  default:return '';
 }
}
function sizeAxisDisplay(value,q,axis){
 const delta=value[axis]/q.answer[axis]-1,percent=Math.abs(delta)*100;
 return {label:axis==='width'?'Width':'Height',value:percent.toFixed(1),unit:'%',note:percent<.05?'Spot on':delta<0?(axis==='width'?'Too narrow':'Too short'):(axis==='width'?'Too wide':'Too tall')};
}
function resultMetricHTML(metric){
 return `<span class="result-metric-label">${escapeHTML(metric.label)}</span><strong${(metric.compact||metric.value.length>6)?' class="compact-error"':''}>${escapeHTML(metric.value)}${metric.unit?`<small>${escapeHTML(metric.unit)}</small>`:''}</strong>${metric.note?`<span class="result-metric-note">${escapeHTML(metric.note)}</span>`:''}`;
}
function resultVerdict(score){return score===100?'Nailed it.':score>=90?'Very close.':score>=75?'Well judged.':score>=50?'A good start.':score>=25?'Room to refine.':'Keep practicing.';}
function summaryResultTitle(q){return escapeHTML(gameRegistry.get(q.type)?.label||q.skill)+(['timeline','duration'].includes(q.type)?`<small>${escapeHTML(q.title)}</small>`:'');}
function summaryResultDescription({q,guess}){
 const error=roundErrorDisplay(q,guess);
 if(error.axes)return error.axes.map(m=>`${m.label}: ${m.value}% · ${m.note.toLowerCase()}`).join('\n');
 return `${error.label}: ${error.value}${error.unit==='%'||error.unit==='°'?'':' '}${error.unit}${error.note?' · '+error.note.toLowerCase():''}`.trim();
}
function styleRoundFeedback(q,value,score){
 const feedback=$('actionarea').querySelector('.feedback'),error=roundErrorDisplay(q,value);
 feedback.classList.add('round-feedback');
 const metric=error.axes?`<div class="result-axes">${error.axes.map(axis=>`<div>${resultMetricHTML(axis)}</div>`).join('')}</div>`:resultMetricHTML(error);
 feedback.querySelector('.feedbacktop').innerHTML=`<div class="round-result-stats"><div class="round-result-points"><span class="result-metric-label">Round score</span><strong>${score}<small>/100</small></strong></div><div class="round-result-error">${metric}</div></div><p class="round-verdict">${resultVerdict(score)}</p>`;
 const comparison=feedback.querySelector('.colour-comparison');
 if(q.type!=='colour'){const answer=roundAnswerDisplay(q,value);if(answer&&!error.axes){comparison.className='round-answer';comparison.textContent=answer;}else comparison.remove();}
 feedback.querySelector('.quick-tip')?.remove();
 const detail=feedback.querySelector('.math-detail');
 if(['timeline','duration'].includes(q.type)){detail.querySelector('summary').textContent='About this answer';}else detail?.remove();
 if(q.type==='rhythm'){$('pulse').parentElement.innerHTML=`<div class="rhythm-result-comparison"><div><span>Your guess</span><strong>${pretty(value)}</strong><small>BPM</small></div><div class="rhythm-result-target"><span>Target</span><strong>${q.answer}</strong><small>BPM</small></div></div>`;}
}
