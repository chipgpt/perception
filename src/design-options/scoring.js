// Each scored dimension converts its distance to a tunable error bound.
// The common curve is (1 - errorFraction)^2, rounded once after summing points.
// Size it up averages two independently clipped curves, worth 50 points each.
const SCORING_RANGES=Object.freeze({
 view3d:180, angle:180, balance:.5, halfhalf:.20,
 motion:.2*Math.hypot(400,300), perspective:.4*Math.hypot(400,300),
 time:3,
 rhythm:Math.log(1.5), proportion:Math.log(1.5),
 // Colour coordinates have radius 1; one radius of error earns zero.
 colour:1, timeline:50, duration:Math.log(4)
});
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
  case 'view3d':error=orientationError(value,q.answer);break;
  case 'halfhalf':error=halfError(value,q);break;
  case 'balance':error=q.fruit?halfError(value,q):Math.abs(value-q.answer)/balanceWidth(q);break;
  case 'angle':error=angularDistance(value,q.answer);break;
  case 'time':case 'timeline':
   error=Math.abs(value-q.answer);break;
  case 'motion':if(value.length<2)return Infinity;error=traceError(value,q.answer);break;
  case 'perspective':error=pointError(value,q.answer);break;
  case 'proportion':if(isSizeQuestion(q)){const e=sizeErrors(value,q);return (e.width+e.height)/(2*SIZE_ERROR_BOUND);}error=proportionError(value,q.answer);break;
  case 'colour':error=wheelDistance(value,q.answer);break;
  case 'rhythm':error=Math.abs(Math.log(value/q.answer));break;
  case 'duration':error=Math.abs(Math.log(durationValue(value)/q.answer));break;
  default:return value===q.answer?0:Infinity;
 }
 return error/SCORING_RANGES[q.type];
}
function scoreFor(value,q){return isSizeQuestion(q)?sizeScore(value,q):scoreFromError(scoringError(value,q));}
