import argparse, json, subprocess
from trivia import ROOT, read, validate
p=argparse.ArgumentParser();p.add_argument('--base');args=p.parse_args()
baseline=None
if args.base:
    def old(path):return json.loads(subprocess.check_output(['git','show',args.base+':'+path],cwd=ROOT,text=True))
    baseline=(old('data/trivia-bank.json'),old('data/daily-trivia.json'))
validate(read(ROOT/'data/trivia-bank.json'),read(ROOT/'data/daily-trivia.json'),baseline)
print('Bank valid; assignments and used facts immutable; no repeated daily trivia.')
