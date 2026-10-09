const fs=require('fs'),vm=require('vm'),assert=require('assert'),{execFileSync}=require('child_process');
const source=fs.readFileSync('src/design-options/generated-games.js','utf8');
const context=vm.createContext({Date,Intl});vm.runInContext(source,context);
const run=s=>vm.runInContext(s,context);
for(const [instant,day] of [
 ['2026-07-08T04:59:59Z','2026-7-7'],['2026-07-08T05:00:00Z','2026-7-8'],
 ['2026-01-08T05:59:59Z','2026-1-7'],['2026-01-08T06:00:00Z','2026-1-8'],
 ['2026-03-08T06:00:00Z','2026-3-8'],['2026-03-09T05:00:00Z','2026-3-9'],
 ['2026-11-01T05:00:00Z','2026-11-1'],['2026-11-02T06:00:00Z','2026-11-2']
])assert.equal(run(`calendarDay(new Date('${instant}'))`),day);
for(const [instant,next] of [['2026-03-08T06:00:00Z','2026-03-09T05:00:00Z'],['2026-11-01T05:00:00Z','2026-11-02T06:00:00Z']])assert.equal(run(`new Date(nextCentralMidnight(new Date('${instant}'))).toISOString()`),new Date(next).toISOString());
const probe=`const vm=require('vm'),fs=require('fs');const c=vm.createContext({Date,Intl});vm.runInContext(fs.readFileSync('src/design-options/generated-games.js','utf8'),c);process.stdout.write(vm.runInContext("calendarDay(new Date('2026-10-09T04:59:59Z'))+'|'+dailyDateLabel('2026-10-8')",c));`;
for(const TZ of ['UTC','America/Los_Angeles','Asia/Tokyo','Pacific/Auckland'])assert.equal(execFileSync(process.execPath,['-e',probe],{env:{...process.env,TZ},encoding:'utf8'}),'2026-10-8|Oct 8, 2026');
let callbacks=[],started=0;
Object.assign(context,{mode:'daily',sessionDay:'2000-1-1',start:()=>{started++;context.sessionDay=run('calendarDay()');},updateAside(){},setTimeout(fn,ms){assert(ms>0&&ms<=25*3600000);return 1;},clearTimeout(){},document:{addEventListener(name,fn){callbacks.push(fn);},hidden:false}});
run('startCentralDayRollover()');assert.equal(started,1);callbacks[0]();assert.equal(started,1);context.mode='practice';context.sessionDay='2000-1-1';callbacks[0]();assert.equal(started,1);
assert(fs.readFileSync('public/index.html','utf8').includes('startCentralDayRollover();'));
console.log('Verified Central midnight in summer/winter, both DST changes, worldwide date parity, matching display date, live daily rollover, and practice isolation.');
