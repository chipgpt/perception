// Every game converts its distance to a fraction of one tunable error bound.
// The common curve is 100 * (1 - errorFraction)^2, rounded once at the end.
const SCORING_RANGES=Object.freeze({
 view3d:180, angle:180, balance:.5,
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
function scoringError(value,q){
 let error;
 switch(q.type){
  case 'view3d':error=orientationError(value,q.answer);break;
  case 'balance':error=Math.abs(value-q.answer)/balanceWidth(q);break;
  case 'angle':case 'time':case 'timeline':
   error=Math.abs(value-q.answer);break;
  case 'motion':if(value.length<2)return Infinity;error=traceError(value,q.answer);break;
  case 'perspective':error=pointError(value,q.answer);break;
  case 'proportion':error=proportionError(value,q.answer);break;
  case 'colour':error=wheelDistance(value,q.answer);break;
  case 'rhythm':error=Math.abs(Math.log(value/q.answer));break;
  case 'duration':error=Math.abs(Math.log(durationValue(value)/q.answer));break;
  default:return value===q.answer?0:Infinity;
 }
 return error/SCORING_RANGES[q.type];
}
function scoreFor(value,q){return scoreFromError(scoringError(value,q));}
