import copy
import importlib.util
import sys
import unittest
from unittest.mock import patch
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from trivia import ROOT, read
spec = importlib.util.spec_from_file_location('review_trivia', ROOT / 'scripts/review-trivia.py')
review = importlib.util.module_from_spec(spec); spec.loader.exec_module(review)

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.bank = read(ROOT / 'data/trivia-bank.json')
        self.schedule = read(ROOT / 'data/daily-trivia.json')
        self.fact = copy.deepcopy(self.bank['facts'][0])
        self.fact.update(id='timeline-test-new-event', factKey='timeline-test-new-event', title='Test new event', answer=2000)
        self.verdict = {g: True for g in review.GATES}
        self.verdict.update(id=self.fact['id'], verified_answer=2000, confidence='high', source_url=self.fact['source']['url'], evidence='The primary source independently states the year.', reason='A clear, familiar, fixed historical event with source evidence.')
        self.pr = {'state':'open','draft':False,'user':{'login':'github-actions[bot]'},'head':{'ref':review.BRANCH,'repo':{'full_name':'chipgpt/perception'}},'base':{'ref':'main','repo':{'full_name':'chipgpt/perception'}},'changed_files':2}
        self.files = [{'filename':'data/trivia-bank.json','status':'modified'},{'filename':'data/reviews/2026-10-08.json','status':'added'}]
    def evaluate(self, d=None, urls=None):
        return review.evaluate([self.fact], [d or self.verdict], {self.fact['source']['url']} if urls is None else urls)
    def test_only_complete_source_backed_review_passes(self):
        self.assertEqual(len(self.evaluate()[0]), 1)
        for gate in review.GATES:
            d = {**self.verdict, gate: False}
            self.assertFalse(self.evaluate(d)[0], gate)
        for change in [{'confidence':'medium'}, {'verified_answer':1999}, {'source_url':'https://example.org/unconsulted'}]:
            self.assertFalse(self.evaluate({**self.verdict, **change})[0])
        self.assertFalse(self.evaluate(urls=set())[0])
        # Consulting some other source is insufficient: the linked primary source must support it.
        d = {**self.verdict,'source_url':'https://example.org/another'}
        self.assertFalse(self.evaluate(d, {'https://example.org/another'})[0])
    def test_missing_duplicate_and_wrong_ids_fail_closed(self):
        for decisions in [[], [self.verdict,self.verdict], [{**self.verdict,'id':'timeline-other'}]]:
            with self.assertRaises(AssertionError): review.evaluate([self.fact],decisions,{self.fact['source']['url']})
        for change in [{'accurate':'true'}, {'verified_answer':float('nan')}, {'verified_answer':True}, {'confidence':'certain'}]:
            with self.assertRaises(AssertionError): self.evaluate({**self.verdict,**change})
    def test_mixed_batch_keeps_only_verified_facts(self):
        second = {**self.fact,'id':'timeline-another-event','factKey':'timeline-another-event','title':'Another event'}
        bad = {**self.verdict,'id':second['id'],'prompt_hides_answer':False}
        passed, results = review.evaluate([self.fact,second],[self.verdict,bad],{self.fact['source']['url']})
        self.assertEqual(passed,[self.fact]); self.assertEqual([r['approved'] for r in results],[True,False])
    def test_code_forks_human_prs_and_renames_ineligible(self):
        review.allowed_pr(self.pr,self.files,'chipgpt/perception')
        for field, value in [('state','closed'),('draft',True),('user',{'login':'someone'})]:
            with self.assertRaises(AssertionError):review.allowed_pr({**self.pr,field:value},self.files,'chipgpt/perception')
        fork = copy.deepcopy(self.pr);fork['head']['repo']['full_name']='someone/perception'
        with self.assertRaises(AssertionError):review.allowed_pr(fork,self.files,'chipgpt/perception')
        for file in [{'filename':'scripts/replenish.py','status':'modified'},{'filename':'data/reviews/../../scripts/evil.json','status':'added'},{'filename':'data/trivia-bank.json','status':'renamed'}]:
            with self.assertRaises(AssertionError):review.allowed_pr(self.pr,[self.files[0],file],'chipgpt/perception')
    def test_existing_facts_cannot_be_rewritten_or_removed(self):
        proposed = copy.deepcopy(self.bank);proposed['facts'].append(self.fact)
        self.assertEqual(review.additions_only(self.bank,proposed,self.schedule),[self.fact])
        for operation in ('edit','remove','reorder','duplicate'):
            p=copy.deepcopy(proposed)
            if operation=='edit':p['facts'][0]['caption']='Changed scope'
            elif operation=='remove':p['facts'].pop(0)
            elif operation=='reorder':p['facts'][0],p['facts'][1]=p['facts'][1],p['facts'][0]
            else:p['facts'][-1]['factKey']=p['facts'][0]['factKey']
            with self.assertRaises(AssertionError):review.additions_only(self.bank,p,self.schedule)

    def test_search_hits_and_failed_page_opens_are_not_verification(self):
        url = self.fact['source']['url']
        items = [
            {'type':'web_search_call','status':'completed','action':{'type':'search','sources':[{'url':url}]}},
            {'type':'web_search_call','status':'failed','action':{'type':'open_page','url':url}},
            {'type':'message','content':[{'annotations':[{'type':'url_citation','url':url}]}]},
        ]
        self.assertEqual(review.opened_sources({'output':items}),set())
        items.append({'type':'web_search_call','status':'completed','action':{'type':'open_page','url':url}})
        self.assertEqual(review.opened_sources({'output':items}),{url})

    def test_same_day_evidence_files_are_distinct(self):
        from replenish import review_filename
        first = {'generatedOn':'2026-10-08','candidates':[{'id':'one'}]}
        second = {**first,'candidates':[{'id':'two'}]}
        self.assertNotEqual(review_filename(first),review_filename(second))
        self.assertEqual(review_filename(first),review_filename(first))
        self.files[1]['filename']='data/reviews/'+review_filename(first)
        review.allowed_pr(self.pr,self.files,'chipgpt/perception')

    def run_flow(self, *, approved=True, changed_main=False, changed_pr=False, tests_fail=False):
        base_sha='a'*40; head_sha='b'*40; new_sha='c'*40
        pr=copy.deepcopy(self.pr)
        pr.update(number=2,html_url='https://github.com/chipgpt/perception/pull/2')
        pr['head']['sha']=head_sha
        pr['mergeable']=True
        proposed=copy.deepcopy(self.bank); proposed['facts'].append(self.fact)
        calls=[]; ref_reads=0; pr_reads=0
        def api(path, method='GET', data=None):
            nonlocal ref_reads,pr_reads
            calls.append((path,method,data))
            if path.endswith('git/ref/heads/main'):
                ref_reads+=1
                return {'object':{'sha':('d'*40 if changed_main and ref_reads>1 else base_sha)}}
            if '/pulls?state=open' in path:return [pr]
            if path.endswith('/pulls/2') and method=='GET':
                pr_reads+=1
                result=copy.deepcopy(pr)
                if changed_pr and pr_reads>1:result['head']['sha']='e'*40
                elif any(p.endswith('git/refs/heads/'+review.BRANCH) and m=='PATCH' for p,m,d in calls):result['head']['sha']=new_sha
                return result
            if path.endswith('/files?per_page=100'):return self.files
            if '/comments?' in path:return []
            if path.endswith('git/commits/'+head_sha):return {'tree':{'sha':'tree-base'}}
            if path.endswith('git/trees'):return {'sha':'tree-reviewed'}
            if path.endswith('git/commits'):return {'sha':new_sha}
            if path.endswith('/merge'):return {'merged':True}
            return {}
        def output(args, **kwargs):
            if args[:3]==['git','rev-parse','HEAD']:return base_sha+'\n'
            if args[:2]==['git','show']:
                target=args[2]
                value=self.schedule if target.endswith('data/daily-trivia.json') else (proposed if target.startswith(head_sha) else self.bank)
                return __import__('json').dumps(value)
            raise AssertionError(args)
        verdict={**self.verdict,'approved':approved}
        env={'GITHUB_REPOSITORY':'chipgpt/perception','OPENAI_API_KEY':'test-only-placeholder'}
        with patch.dict(review.os.environ,env,clear=True), patch.object(review,'api',side_effect=api), patch.object(review.subprocess,'run'), patch.object(review.subprocess,'check_output',side_effect=output), patch.object(review,'research_review',return_value=([self.fact] if approved else [],[verdict])), patch.object(review,'write') as writes, patch.object(review,'trusted_tests',side_effect=RuntimeError('Failed checks') if tests_fail else None):
            if changed_main or changed_pr or tests_fail:
                with self.assertRaises((AssertionError,RuntimeError)):review.review_open_pr()
            else:review.review_open_pr()
        return calls,writes

    def test_successful_review_merges_exact_commit_with_audit(self):
        calls,writes=self.run_flow()
        trees=[data for path,method,data in calls if path.endswith('git/trees')]
        self.assertEqual(len(trees),1)
        self.assertEqual([entry['path'] for entry in trees[0]['tree']],['data/trivia-bank.json','data/reviews/verification-bbbbbbbbbbbb.json'])
        merges=[data for path,method,data in calls if path.endswith('/merge')]
        self.assertEqual(merges[0]['sha'],'c'*40)
        self.assertEqual(merges[0]['merge_method'],'squash')
        self.assertEqual(writes.call_args_list[-1].args[1],self.bank)

    def test_rejected_batch_closes_without_merging(self):
        calls,writes=self.run_flow(approved=False)
        self.assertFalse(any(path.endswith('/merge') or path.endswith('git/trees') for path,method,data in calls))
        self.assertTrue(any(method=='PATCH' and data=={'state':'closed'} for path,method,data in calls))
        writes.assert_not_called()

    def test_changed_heads_and_failed_tests_never_merge(self):
        for options in ({'changed_main':True},{'changed_pr':True},{'tests_fail':True}):
            calls,writes=self.run_flow(**options)
            self.assertFalse(any(path.endswith('/merge') or path.endswith('git/trees') for path,method,data in calls),options)
            self.assertEqual(writes.call_args_list[-1].args[1],self.bank)

    def test_waits_for_github_mergeability_and_keeps_expected_head(self):
        sha='c'*40
        states=[{'state':'open','head':{'sha':sha},'mergeable':None}, {'state':'open','head':{'sha':sha},'mergeable':True}, {'merged':True}]
        with patch.object(review,'api',side_effect=states) as api, patch.object(review.time,'sleep') as sleep:
            review.merge_reviewed('repos/chipgpt/perception/',3,sha,2)
            sleep.assert_called_once_with(2)
            self.assertEqual(api.call_args.args[2]['sha'],sha)
        for current in [{'state':'open','head':{'sha':'different'},'mergeable':True},{'state':'open','head':{'sha':sha},'mergeable':False}]:
            with patch.object(review,'api',return_value=current) as api:
                with self.assertRaises(AssertionError):review.merge_reviewed('',3,sha,2)
                self.assertEqual(api.call_count,1)

    def test_saved_review_requires_exact_bot_audited_questions(self):
        original='b'*40
        commit={'message':'Keep independently verified trivia and record review evidence','parents':[{'sha':original}], 'author':{'login':'github-actions[bot]'},'committer':{'login':'github-actions[bot]'}}
        result={**self.verdict,'approved':True,'source_consulted':True,'answer_matches':True,'factFingerprint':review.fingerprint(self.fact)}
        report={'reviewVersion':review.VERSION,'reviewedHeadSha':original,'baseSha':'a'*40,'approved':1,'decisions':[result]}
        def at(sha,path):return self.bank if path.endswith('trivia-bank.json') else report
        self.assertEqual(review.saved_review(commit,'c'*40,[self.fact],at,self.bank),report)
        for bad in [{**commit,'author':{'login':'someone'}},{**commit,'parents':[]}]:
            with self.assertRaises(AssertionError):review.saved_review(bad,'c'*40,[self.fact],at,self.bank)
        changed={**self.fact,'caption':'Changed wording'}
        with self.assertRaises(AssertionError):review.saved_review(commit,'c'*40,[changed],at,self.bank)
        with self.assertRaises(AssertionError):review.saved_review(commit,'c'*40,[self.fact],at,{'facts':[]})

if __name__=='__main__': unittest.main()
