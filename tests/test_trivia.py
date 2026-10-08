import copy, datetime as dt, importlib.util, json, sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from trivia import *
from replenish import accept_candidates, source_urls

class TriviaTests(unittest.TestCase):
    def setUp(self):
        self.bank=read(ROOT/'data/trivia-bank.json');self.schedule=read(ROOT/'data/daily-trivia.json')
    def test_idempotent_and_preserves_today(self):
        extended=extend(self.bank,self.schedule,dt.date(2026,10,7))
        self.assertEqual(extended,self.schedule)
        self.assertEqual(self.schedule['days']['2026-10-07']['trivia'],{'duration':'duration-soccer-match','timeline':'timeline-first-moon-landing'})
    def test_extension_bank_growth_never_changes_published_days(self):
        future=extend(self.bank,self.schedule,dt.date(2026,10,14))
        for day,entry in self.schedule['days'].items():self.assertEqual(future['days'][day],entry)
        f=copy.deepcopy(self.bank['facts'][0]);f.update(id='timeline-test-event',factKey='timeline-test-event',title='Test event',answer=2000)
        self.bank['facts'].append(f)
        grown=extend(self.bank,self.schedule,dt.date(2026,10,14))
        for day,entry in self.schedule['days'].items():self.assertEqual(grown['days'][day],entry)
        validate(self.bank,grown,(read(ROOT/'data/trivia-bank.json'),self.schedule))
    def test_exhaustion_never_recycles(self):
        future=extend(self.bank,self.schedule,dt.date(2028,1,1))
        used=[id for e in future['days'].values() for id in e['trivia'].values()]
        self.assertEqual(len(used),len(set(used)))
        self.assertEqual(len(used),len(self.bank['facts']))
        self.assertTrue(all(t not in TRIVIA for t in future['days']['2028-01-01']['types']))
    def test_used_answer_cannot_change(self):
        f=next(f for f in self.bank['facts'] if f['id']=='duration-soccer-match');f['answer']=89*60
        with self.assertRaises(AssertionError):validate(self.bank,self.schedule)
    def test_duplicate_assignment_and_missing_source_rejected(self):
        day=next(d for d,e in self.schedule['days'].items() if d!='2026-10-07' and 'duration' in e['trivia'])
        self.schedule['days'][day]['trivia']['duration']='duration-soccer-match'
        with self.assertRaises(AssertionError):validate(self.bank,self.schedule)
        self.bank['facts'][0]['source']['url']='http://example.com'
        with self.assertRaises(AssertionError):validate_fact(self.bank['facts'][0])
    def test_baseline_cannot_be_removed(self):
        modified=copy.deepcopy(self.schedule);del modified['days']['2026-10-07']
        with self.assertRaises(AssertionError):validate(self.bank,modified,(self.bank,self.schedule))
    def test_unselectable_duration_rejected(self):
        f=copy.deepcopy(next(f for f in self.bank['facts'] if f['type']=='duration'));f['answer']=5401
        with self.assertRaises(AssertionError):validate_fact(f)
    def test_research_requires_consulted_source_and_unique_fact(self):
        f=copy.deepcopy(self.bank['facts'][0]);f.update(id='timeline-test-event',factKey='timeline-test-event',title='Test event',answer=2000)
        item={'fact':f,'evidence':'The consulted source specifies the year.','familiarity':'A familiar event from school history.'}
        accepted,evidence,rejected=accept_candidates([item],self.bank,{f['source']['url']},['timeline'])
        self.assertEqual(len(accepted),1);self.assertEqual(len(evidence),1);self.assertFalse(rejected)
        self.assertFalse(accept_candidates([item],self.bank,set(),['timeline'])[0])
        self.assertEqual(len(accept_candidates([item,item],self.bank,{f['source']['url']},['timeline'])[0]),1)
        item['fact']['factKey']=self.bank['facts'][0]['factKey']
        self.assertFalse(accept_candidates([item],self.bank,{f['source']['url']},['timeline'])[0])
    def test_sources_parse_from_api_response(self):
        self.assertEqual(source_urls({'output':[{'type':'web_search_call','action':{'sources':[{'url':'https://example.com'}]}}]}),{'https://example.com'})
if __name__=='__main__':unittest.main()
