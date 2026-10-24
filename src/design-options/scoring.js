// Each scored dimension converts its distance to a tunable error bound.
// New questions use linear closeness; unversioned historical questions retain squaring.
// Versioned Time and When? questions use linear closeness with contextual bounds.
// Size it up averages two independently clipped curves, worth 50 points each.
const SCORING_RANGES=Object.freeze({
 view3d:180, angle:180, balance:.5, halfhalf:.20,
 motion:.2*Math.hypot(400,300), perspective:.4*Math.hypot(400,300),
 time:3,
 rhythm:Math.log(1.5), proportion:Math.log(1.5),
 // Colour coordinates have radius 1; one radius of error earns zero.
 colour:1, timeline:50, duration:Math.log(4)
});
// Versioned questions freeze their scoring year, preserving historical replays.
const LINEAR_SCORING_START='2026-10-16';
const VIEW3D_LINEAR_BOUND=90;
const PERSPECTIVE_INNER_SCALE=.65;
const PERSPECTIVE_CORNERS=[[20,20],[380,20],[380,280],[20,280]];
const PERSPECTIVE_INNER_DIAGONAL=Math.hypot(360,260)*PERSPECTIVE_INNER_SCALE;
const TRACE_STROKE_WIDTH=12;
const TRACE_COVERAGE_START='2026-10-17';
const TRACE_AREA_ALLOWANCE=1.25;
function usesTraceCoverage(q){return q.type==='motion'&&q.traceScoringVersion===3;}
// Fixed half-unit sampling keeps scores independent of screen size and device DPR.
// Each round-capped stroke is the union of capsules around its line segments.
function traceMask(points){
 const scale=2,width=800,height=600,radius=TRACE_STROKE_WIDTH/2,mask=new Uint8Array(width*height);
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
  const left=Math.max(0,Math.floor((Math.min(a.x,b.x)-radius)*scale)),right=Math.min(width-1,Math.ceil((Math.max(a.x,b.x)+radius)*scale));
  const top=Math.max(0,Math.floor((Math.min(a.y,b.y)-radius)*scale)),bottom=Math.min(height-1,Math.ceil((Math.max(a.y,b.y)+radius)*scale));
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
   const px=(x+.5)/scale,py=(y+.5)/scale,t=length2?Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/length2)):0;
   if((px-a.x-t*dx)**2+(py-a.y-t*dy)**2<=radius*radius)mask[y*width+x]=1;
  }
 }
 return mask;
}
function traceAreas(points,target){
 if(!Array.isArray(points)||points.length<2||!Array.isArray(target)||target.length<2)return {intersection:0,drawn:0,target:0};
 const a=traceMask(points),b=traceMask(target);let intersection=0,drawn=0,targetArea=0;
 for(let i=0;i<a.length;i++){if(a[i]&&b[i])intersection++;drawn+=a[i];targetArea+=b[i];}
 return {intersection,drawn,target:targetArea};
}
// October 16 and previously saved v2 questions retain intersection-over-union.
function traceOverlap(points,target){
 const a=traceAreas(points,target),union=a.drawn+a.target-a.intersection;
 return union?a.intersection/union:0;
}
function traceCoverageResult(points,target){
 const a=traceAreas(points,target),coverage=a.target?a.intersection/a.target:0,areaRatio=a.target?a.drawn/a.target:0;
 const penalty=Math.max(0,areaRatio-TRACE_AREA_ALLOWANCE);
 return {coverage,areaRatio,penalty,closeness:Math.max(0,coverage-penalty)};
}
function perspectiveDiagonal(q){return q.scoringVersion===2?PERSPECTIVE_INNER_DIAGONAL:Math.hypot(400,300);}

const TIMELINE_SCORING_START=LINEAR_SCORING_START;
const TIMELINE_GENTLE_START='2026-10-24';
const TIME_SCORING_START=LINEAR_SCORING_START;
function usesRelativeTime(q){return q.type==='time'&&q.timeScoringVersion===2;}
function timeErrorBound(q){return usesRelativeTime(q)?Math.max(1.25,q.answer*.5):SCORING_RANGES.time;}
function usesAgeBasedTimeline(q){return q.type==='timeline'&&[2,3].includes(q.timelineScoringVersion);}
function timelineErrorBound(q){const age=Math.max(0,q.scoringYear-q.answer);return q.timelineScoringVersion===3?Math.max(10,age/3):usesAgeBasedTimeline(q)?Math.max(5,age*.25):SCORING_RANGES.timeline;}
function linearScoreFromError(fraction){return Number.isFinite(fraction)?Math.round(100*Math.max(0,Math.min(1,1-fraction))):0;}
function wheelDistance(a,b){
 const position=rgb=>{const {h,s}=rgbHsv(rgb),angle=h*Math.PI/180;
  return {x:Math.cos(angle)*s,y:Math.sin(angle)*s};};
 return pointError(position(a),position(b));
}
function scoreFromError(fraction){
 if(!Number.isFinite(fraction))return 0;
 const closeness=1-Math.max(0,Math.min(1,fraction));
 return Math.round(100*closeness*closeness);
}
function angularDistance(a,b){const delta=Math.abs(a-b)%360;return Math.min(delta,360-delta);}
function scoringError(value,q){
 let error;
 switch(q.type){
  case 'view3d':return orientationError(value,q.answer)/(q.scoringVersion===2?VIEW3D_LINEAR_BOUND:SCORING_RANGES.view3d);
  case 'halfhalf':error=halfError(value,q);break;
  case 'balance':error=q.fruit?halfError(value,q):Math.abs(value-q.answer)/balanceWidth(q);break;
  case 'angle':error=angularDistance(value,q.answer);break;
  case 'timeline':return Math.abs(value-q.answer)/timelineErrorBound(q);
  case 'time':return Math.abs(value-q.answer)/timeErrorBound(q);
  case 'motion':if(usesTraceCoverage(q))return 1-traceCoverageResult(value,q.answer).closeness;if(q.scoringVersion===2)return 1-traceOverlap(value,q.answer);if(value.length<2)return Infinity;error=traceError(value,q.answer);break;
  case 'perspective':return pointError(value,q.answer)/(.4*perspectiveDiagonal(q));
  case 'proportion':if(isSizeQuestion(q)){const e=sizeErrors(value,q);return (e.width+e.height)/(2*SIZE_ERROR_BOUND);}error=proportionError(value,q.answer);break;
  case 'colour':error=wheelDistance(value,q.answer);break;
  case 'rhythm':error=Math.abs(Math.log(value/q.answer));break;
  case 'duration':if(q.scoringVersion===2)return Math.abs(durationValue(value)/q.answer-1)/.5;error=Math.abs(Math.log(durationValue(value)/q.answer));break;
  default:return value===q.answer?0:Infinity;
 }
 return error/SCORING_RANGES[q.type];
}
function scoreFor(value,q){if(isSizeQuestion(q))return sizeScore(value,q);const error=scoringError(value,q);return q.scoringVersion===2||usesAgeBasedTimeline(q)||usesRelativeTime(q)?linearScoreFromError(error):scoreFromError(error);}
