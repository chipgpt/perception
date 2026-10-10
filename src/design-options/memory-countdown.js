// Reuse the round's cancellable timers so a countdown cannot outlive its preview.
function memoryCountdown(button,duration){
 const deadline=performance.now()+duration;
 button.classList.add('memory-countdown');
 const update=()=>{const remaining=Math.max(0,deadline-performance.now());button.textContent='Memorize · '+Math.ceil(remaining/1000)+'s';button.style.setProperty('--memory-remaining',String(remaining/duration));};
 update();
 for(let elapsed=100;elapsed<duration;elapsed+=100)afterEffect(update,elapsed);
}
