# Maintaining Perception

## Daily trivia

`data/trivia-bank.json` is the maintained bank for **When?** and **How long?**. Each fact has a permanent `id`, a canonical `factKey`, a numerical answer, explicit scope and a source. Preserve IDs when editing wording. Used facts are immutable; correct a substantive error through an explicit migration rather than silently rewriting a published answer.

`data/daily-trivia.json` records every published day's five types and trivia IDs. The ledger records assigned facts and fingerprints. Assignments are permanent, append-only and never reused. Adding approved facts does not change published days. The scheduler preserves the existing device-date convention for procedural puzzles. The initial schedule begins October 7, 2026, retaining that day's live soccer and Moon-landing questions.

The no-repeat guarantee covers trivia in **Daily five** from the schedule's start date, not historical games before that date or practice. Individual games are practice-only. Trivia practice draws only from Daily Fives dated before the current device-calendar day, with up to five unique questions per session; mixed practice follows the same restriction. The ledger lives in GitHub, independently of browser history. If a bank is exhausted, that trivia type is omitted from newly scheduled days. Beyond the scheduled horizon, the game falls back to five distinct procedural types instead of recycling trivia.

## Weekly automation

[Maintain and publish Perception](https://github.com/chipgpt/perception/actions/workflows/perception.yml) runs Mondays at **07:23 UTC**, on relevant changes to `main`, and through **Run workflow**. It extends the published buffer to 60 days ahead, validates the bank and schedule, builds and tests the game, commits changed assignments and publishes GitHub Pages. The job warns when fewer than 20 unused facts remain in either bank.

Scheduled/manual runs additionally research candidates when supply is low. To enable research:

1. Open [github-pages environment secrets](https://github.com/chipgpt/perception/settings/environments).
2. Open **github-pages** and add an environment secret named **OPENAI_API_KEY**, containing an OpenAI API key with Responses API access and billing enabled. This is separate from ChatGPT billing. Do not put the key in source files.
3. Run **Maintain and publish Perception** manually to test it; subsequent weekly runs use the secret automatically.

The optional repository variable `OPENAI_TRIVIA_MODEL` overrides the default `gpt-5.5`. Each eligible run makes at most **two API requests**: research (8 hosted tool calls, 6,000 output tokens) and independent review (20 hosted tool calls, 7,000 output tokens). The optional `OPENAI_TRIVIA_REVIEW_MODEL` variable overrides the review model, also `gpt-5.5` by default. It proposes up to 8 questions, only for depleted banks, and does not retry uncertain requests. These limits bound work, not an exact dollar amount; configure the API project's spending controls separately.

Research uses web search, requires source URLs present in the consulted sources, checks ranges and displayed precision, and rejects duplicate IDs, canonical identities and near-duplicate titles. Candidates are proposed in one open `auto/trivia-replenishment` pull request. An existing open PR prevents another paid research request and proceeds directly to review. A separate model request opens each linked primary source and checks numerical accuracy, scope, familiarity, stability, answer leakage and semantic duplicates. Search results alone are insufficient. Only high-confidence candidates passing every check survive; the bot removes flagged candidates, runs all game and data tests using trusted main-branch code, records evidence in `data/reviews/`, and squash-merges the exact reviewed commit. If all candidates fail, it closes the rejected batch with its evidence so the next run can research fresh questions. Deployment then rebuilds and publishes the approved bank.

Automatic merging is restricted to additive trivia-data PRs from `github-actions[bot]` on the fixed `auto/trivia-replenishment` branch in this repository. Existing questions and published assignments cannot change. Forks, code changes, malformed reviews, failed checks and changed PR heads cannot merge. Ordinary code PRs still receive validation but are not automatically merged. GitHub does not trigger PR checks for its built-in token, so the reviewer explicitly runs those checks before merging. Weekly and manual maintenance runs perform review; a rejected unchanged batch is never repeatedly reviewed for a fee. AI review can still make mistakes; source evidence remains available for corrections without changing published assignments.

Missing API credentials do not break scheduling or publishing. GitHub Actions must be allowed to create pull requests in the repository's Actions settings. If this is disabled later, research can complete but creating the review PR will fail.

## Development

Source is in `src/base/` and `src/design-options/`; generated playable files are in `public/`. Python and Node are needed only for maintenance, not for playing.

```sh
python scripts/trivia.py --check
python -m unittest discover -s tests -p 'test_*.py'
python scripts/build-site.py
for test in tests/verify-*.cjs; do node "$test"; done
```

`python scripts/trivia.py` extends the immutable buffer; `--today YYYY-MM-DD` permits isolated tests. Never delete the ledger to replenish a bank. Add new, reviewed facts instead.

The build writes the complete playable site into `public/`. GitHub Pages publishes that directory at the domain root through the Actions workflow. CNAME and HTTPS remain configured for `perception.thedanktank.com`. Player identity, saved progress and bounded history remain in the player's browser; scheduling adds no browser storage.
