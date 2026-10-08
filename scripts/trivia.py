"""Permanent trivia assignments. Standard-library only; no browser storage or API needed."""
import argparse, copy, datetime as dt, difflib, hashlib, json, math, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TYPES=['view3d','balance','motion','perspective','proportion','rhythm','angle','memory','time','timeline','duration']
TRIVIA=('timeline','duration')

def read(path): return json.loads(path.read_text())
def write(path,data): path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def fingerprint(fact): return hashlib.sha256(json.dumps(fact,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def day_key(day): return f'{day.year}-{day.month}-{day.day}'
def seed(text):
    n=2166136261
    for c in text: n=((n^ord(c))*16777619)&0xffffffff
    return n

def random_stream(n):
    while True:
        n=(n+0x6D2B79F5)&0xffffffff
        t=((n^(n>>15))*(1|n))&0xffffffff
        t^=(t+(((t^(t>>7))*(61|t))&0xffffffff))&0xffffffff
        yield ((t^(t>>14))&0xffffffff)/4294967296

def shuffle(values,key):
    result=list(values); random=random_stream(seed(key))
    for i in range(len(result)-1,0,-1):
        j=math.floor(next(random)*(i+1));result[i],result[j]=result[j],result[i]
    return result

def normalized(title): return re.sub(r'[^a-z0-9]','',title.lower())
def validate_fact(f):
    expected={'id','factKey','type','title','answer','caption','explain','source'}
    assert set(f)==expected,'Unexpected fact fields'
    assert f['type'] in TRIVIA,'Unknown trivia type'
    assert re.fullmatch(r'(timeline|duration)-[a-z0-9]+(-[a-z0-9]+)*',f['id']),'Invalid permanent ID'
    assert f['id'].startswith(f['type']+'-')
    assert re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*',f['factKey']),'Invalid canonical fact key'
    assert all(isinstance(f[k],str) and 0<len(f[k])<=n for k,n in [('title',55),('caption',110),('explain',600)])
    assert isinstance(f['answer'],(int,float)) and not isinstance(f['answer'],bool) and math.isfinite(f['answer'])
    assert set(f['source'])=={'name','url'} and isinstance(f['source']['name'],str) and 0<len(f['source']['name'])<=100
    assert re.fullmatch(r'https://[^\s<>"\']+',f['source']['url']) and len(f['source']['url'])<600,'An HTTPS source is required'
    if f['type']=='timeline': assert int(f['answer'])==f['answer'] and 1850<=f['answer']<=2026,'Timeline outside picker range'
    else:
        a=f['answer'];assert 1<=a<=60*86400,'Duration outside picker range'
        step=8640 if a>=86400 else 60 if a>=3600 else 1 if a>=60 else .1
        assert abs(round(a/step)*step-a)<1e-6,'Duration is not selectable at displayed precision'

def validate(bank,schedule,baseline=None):
    assert bank['version']==schedule['version']==1
    ids={};keys=set();titles=set()
    for f in bank['facts']:
        validate_fact(f)
        assert f['id'] not in ids,'Duplicate ID'
        assert f['factKey'] not in keys,'Duplicate canonical fact'
        title=(f['type'],normalized(f['title']));assert title not in titles,'Duplicate title'
        ids[f['id']]=f;keys.add(f['factKey']);titles.add(title)
    start=dt.date.fromisoformat(schedule['startsOn']);assigned={}
    for day,entry in sorted(schedule['days'].items()):
        date=dt.date.fromisoformat(day);assert date.isoformat()==day and date>=start
        assert set(entry)=={'types','trivia'} and len(entry['types'])==len(set(entry['types']))==5
        assert all(t in TYPES for t in entry['types'])
        assert set(entry['trivia'])==set(entry['types'])&set(TRIVIA),'Missing daily trivia assignment'
        for t,id in entry['trivia'].items():
            assert id in ids and ids[id]['type']==t
            assert id not in assigned,'A fact was assigned more than once'
            assigned[id]=day
            assert schedule['used'][id]=={'day':day,'fingerprint':fingerprint(ids[id])},'Used fact changed'
    dates=sorted(dt.date.fromisoformat(k) for k in schedule['days'])
    assert dates and dates[0]==start and all((b-a).days==1 for a,b in zip(dates,dates[1:])), 'Daily schedule must be contiguous'
    assert set(assigned)==set(schedule['used']),'Ledger and published days differ'
    if baseline:
        old_bank,old_schedule=baseline
        assert old_schedule['startsOn']==schedule['startsOn'],'Cannot reset schedule origin'
        for day,entry in old_schedule['days'].items(): assert schedule['days'].get(day)==entry,'Published day changed or removed'
        for id,entry in old_schedule['used'].items(): assert schedule['used'].get(id)==entry,'Used ledger changed or removed'
        # IDs and canonical identities survive rewording; existing facts cannot disappear.
        for old in old_bank['facts']:
            assert old['id'] in ids and old['factKey']==ids[old['id']]['factKey'],'Existing fact identity changed or removed'
    return ids

def extend(bank,schedule,today,horizon=60):
    result=copy.deepcopy(schedule)
    # Bootstrap a ledger for the one existing public day, once only.
    if result['days'] and not result['used']:
        facts={f['id']:f for f in bank['facts']}
        for day,e in result['days'].items():
            for id in e['trivia'].values():result['used'][id]={'day':day,'fingerprint':fingerprint(facts[id])}
    ids=validate(bank,result)
    last=max((dt.date.fromisoformat(k) for k in result['days']),default=dt.date.fromisoformat(result['startsOn'])-dt.timedelta(days=1))
    end=today+dt.timedelta(days=horizon-1)
    day=last+dt.timedelta(days=1)
    while day<=end:
        iso=day.isoformat(); key=day_key(day);available={t:[f for f in bank['facts'] if f['type']==t and f['id'] not in result['used']] for t in TRIVIA}
        eligible=[t for t in TYPES if t not in TRIVIA or available[t]]
        types=shuffle(eligible,key+'|schedule-v1')[:5];entry={'types':types,'trivia':{}}
        for t in types:
            if t not in TRIVIA:continue
            # Sort by stable IDs so source-file ordering is irrelevant to future draws.
            options=sorted(available[t],key=lambda f:f['id'])
            f=shuffle(options,key+'|'+t+'|assignment-v1')[0]
            entry['trivia'][t]=f['id'];result['used'][f['id']]={'day':iso,'fingerprint':fingerprint(f)}
        result['days'][iso]=entry;day+=dt.timedelta(days=1)
    validate(bank,result,(bank,schedule) if schedule['used'] else None)
    return result

def supply(bank,schedule):
    return {t:sum(f['type']==t and f['id'] not in schedule['used'] for f in bank['facts']) for t in TRIVIA}

def candidate_duplicate(candidate,facts):
    for f in facts:
        if f['id']==candidate['id'] or f['factKey']==candidate['factKey']:return f['id']
        if f['type']==candidate['type'] and difflib.SequenceMatcher(None,normalized(f['title']),normalized(candidate['title'])).ratio()>=.88:return f['id']
    return None

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--today',default=dt.datetime.now(dt.timezone.utc).date().isoformat());parser.add_argument('--horizon',type=int,default=60);parser.add_argument('--root',type=Path,default=ROOT)
    args=parser.parse_args();assert 1<=args.horizon<=365
    bank=read(args.root/'data/trivia-bank.json');path=args.root/'data/daily-trivia.json';schedule=read(path)
    if not args.check:schedule=extend(bank,schedule,dt.date.fromisoformat(args.today),args.horizon);write(path,schedule)
    validate(bank,schedule);unused=supply(bank,schedule)
    print(json.dumps({'scheduledThrough':max(schedule['days']), 'unused':unused,'assignedFacts':len(schedule['used'])}))
    for t,count in unused.items():
        if count<20:print(f'::warning::{t}: {count} unused questions remain. Replenish the bank; never recycle used facts.')
if __name__=='__main__':main()
