function captureSummaryComparison(result){
 const ids={view3d:'view-canvas',balance:'balance-canvas',motion:'trace-canvas',perspective:'perspective-canvas',proportion:'proportion-canvas',angle:'angle-dial',colour:'wheel'};
 const canvas=$(ids[result.q.type]);
 if(canvas&&result.q.type!=='colour')result.comparisonImage=canvas.toDataURL('image/png');
}
function summaryComparison(result){
 const {q,guess}=result;
 if(q.type==='colour')return restoredComparison(result);
 if(result.comparisonImage)return `<img class="result-comparison-image" src="${result.comparisonImage}" alt="Your answer and the target overlaid for ${escapeHTML(q.skill)}" loading="lazy">`;
 if(['view3d','balance','motion','perspective','proportion','angle','colour'].includes(q.type))return restoredComparison(result);
 // Numeric puzzles use two labelled marks on the same scale.
 const format=v=>q.type==='duration'?durationText(v):q.type==='time'?v.toFixed(2)+' s':q.type==='rhythm'?pretty(v)+' BPM':String(v);
 const logarithmic=q.type==='duration',a=logarithmic?Math.log(guess):guess,b=logarithmic?Math.log(q.answer):q.answer;
 const padding=q.type==='timeline'?10:Math.max(.1,Math.abs(a-b)*.2);
 const low=q.type==='timeline'?Math.min(a,b)-padding:Math.min(0,a,b),high=Math.max(a,b)+padding;
 const x=v=>24+(v-low)/(high-low||1)*272;
 return `<svg class="result-comparison-chart" viewBox="0 0 320 82" role="img" aria-label="Your answer: ${escapeHTML(format(guess))}. Target: ${escapeHTML(format(q.answer))}.">
  <path d="M24 26H296 M24 60H296" class="comparison-track"/>
  <path d="M${x(a)} 26L${x(b)} 60" class="comparison-link"/>
  <circle cx="${x(a)}" cy="26" r="5" class="comparison-guess"/>
  <circle cx="${x(b)}" cy="60" r="5" class="comparison-target"/>
  <text x="24" y="15">You: ${escapeHTML(format(guess))}</text>
  <text x="24" y="79">Target: ${escapeHTML(format(q.answer))}</text>
 </svg>`;
}
function restoredComparison({q,guess}){
 if(q.type==='view3d'){
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=300;
  drawShape3D(canvas,guess,{shape:q.shape});drawShape3D(canvas,q.answer,{shape:q.shape,overlay:true});
  return `<img class="result-comparison-image" src="${canvas.toDataURL()}" alt="Your 3D view and target overlaid">`;
 }
 const path=points=>points.map(p=>Array.isArray(p)?p.join(','):p.x+','+p.y).join(' ');
 let content='';
 const line=(a,b,target=false)=>`<path d="M${a.join(' ')}L${b.join(' ')}" fill="none" stroke="var(--${target?'target':'draw'})" stroke-width="5"/>`;
 if(q.type==='angle'){const end=a=>[200+Math.cos(a*Math.PI/180)*155,220-Math.sin(a*Math.PI/180)*155];content=line([200,220],end(q.answer),true)+line([200,220],end(guess));}
 if(q.type==='motion')content=`<polyline points="${path(q.answer)}" fill="none" stroke="var(--target)" stroke-width="5"/><polyline points="${path(guess)}" fill="none" stroke="var(--draw)" stroke-width="5"/>`;
 if(q.type==='perspective')content=line([guess.x,guess.y],[q.answer.x,q.answer.y],true)+`<circle cx="${q.answer.x}" cy="${q.answer.y}" r="8" fill="var(--target)"/><circle cx="${guess.x}" cy="${guess.y}" r="6" fill="var(--draw)"/>`;
 if(q.type==='balance'){content=`<path d="${[q.points,...(q.holes||[])].map(p=>'M'+path(p)+'Z').join(' ')}" fill="var(--draw)" fill-rule="evenodd"/>`+line([q.answer,30],[q.answer,235],true)+`<path d="M${guess} 190l-14 30h28Z" fill="var(--ink)"/>`;}
 if(q.type==='proportion'){const a=guess.width/guess.height,b=q.answer,h=Math.min(160,330/Math.max(a,b));content=`<rect x="${200-b*h/2}" y="${150-h/2}" width="${b*h}" height="${h}" fill="none" stroke="var(--target)" stroke-width="5"/><rect x="${200-a*h/2}" y="${150-h/2}" width="${a*h}" height="${h}" fill="none" stroke="var(--draw)" stroke-width="5"/>`;}
 if(q.type==='colour')content=`<rect x="30" y="70" width="160" height="150" rx="12" fill="${rgbHex(guess)}"/><rect x="210" y="70" width="160" height="150" rx="12" fill="${q.hex}"/><text x="110" y="250" text-anchor="middle" fill="var(--ink)" font-size="24">You</text><text x="290" y="250" text-anchor="middle" fill="var(--ink)" font-size="24">Target</text>`;
 return `<svg class="result-comparison-image" viewBox="0 0 400 300" role="img" aria-label="Your answer and target for ${escapeHTML(q.skill)}">${content}</svg>`;
}
