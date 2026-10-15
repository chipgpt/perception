// Canvas renderers use the same palette, typography and strokes as DOM controls.
// Resolve on each draw so appearance changes preserve the current game state.
function gamePaint(){
 const css=getComputedStyle(document.documentElement),token=name=>css.getPropertyValue('--'+name).trim();
 return {ink:token('ink'),muted:token('muted'),line:token('line'),draw:token('draw'),target:token('target'),canvas:token('canvas'),
  mark:Number(token('mark-width'))||3,guide:Number(token('guide-width'))||1.5,
  font:(size,weight=400,mono=false)=>`${weight} ${size}px ${token(mono?'font-mono':'font')||(mono?'"IBM Plex Mono",monospace':'"Manrope",sans-serif')}`};
}
