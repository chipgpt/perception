# Perception

[Play Perception](https://perception.thedanktank.com/) — five different daily puzzles, with optional practice.

## Daily trivia

`data/trivia-bank.json` is the maintained bank for **When?** and **How long?**. Each fact has a permanent `id`, a canonical `factKey`, a numerical answer, explicit scope and a source. Preserve IDs when editing wording. Used facts are immutable; correct a substantive error through an explicit migration rather than silently rewriting a published answer.

`data/daily-trivia.json` records every published day's five types and trivia IDs. The ledger records assigned facts and fingerprints. Assignments are permanent, append-only and never reused. Adding approved facts does not change published days. The scheduler preserves the existing device-date convention for procedural puzzles. The initial schedule begins October 7, 2026, retaining that day's live soccer and Moon-landing questions.

The no-repeat guarantee covers trivia in **Daily five** from the schedule's start date, not historical games before that date or practice. Individual trivia modes are practice; practice and retries may repeat. The ledger lives in GitHub, independently of browser history. If a bank is exhausted, that trivia type is omitted from newly scheduled days. Beyond the scheduled horizon, the game falls back to five distinct procedural types instead of recycling trivia.

## Weekly automation

[Maintain and publish Perception](https://github.com/chipgpt/perception/actions/workflows/perception.yml) runs Mondays at **07:23 UTC**, on relevant changes to `main`, and through **Run workflow**. It extends the published buffer to 60 days ahead, validates the bank and schedule, builds and tests the game, commits changed assignments and publishes GitHub Pages. The job warns when fewer than 20 unused facts remain in either bank.

Scheduled/manual runs additionally research candidates when supply is low. To enable research:

1. Open [repository Actions secrets](https://github.com/chipgpt/perception/settings/secrets/actions).
2. Add a repository secret named **OPENAI_API_KEY**, containing an OpenAI API key with Responses API access and billing enabled. This is separate from ChatGPT billing. Do not put the key in source files.
3. Run **Maintain and publish Perception** manually to test it; subsequent weekly runs use the secret automatically.

The optional repository variable `OPENAI_TRIVIA_MODEL` overrides the default `gpt-5.5`. Each eligible run makes at most **one API request**, with at most 8 hosted tool calls and 6,000 output tokens. It proposes up to 12 questions, only for depleted banks, and does not retry uncertain requests. These limits bound work, not an exact dollar amount; configure the API project's spending controls separately.

Research uses web search, requires source URLs present in the consulted sources, checks ranges and displayed precision, and rejects duplicate IDs, canonical identities and near-duplicate titles. Candidates are proposed in one open `auto/trivia-replenishment` pull request. An existing open PR prevents another paid request. Review numerical accuracy, source evidence, familiarity and semantic duplicates before merging. Nothing is approved or merged automatically. Evidence and familiarity notes live in `data/reviews/`. Generated PRs run the tests before being opened; GitHub does not trigger a new PR workflow for events produced by its built-in token. Human PRs also receive the dedicated validation workflow.

Missing API credentials do not break scheduling or publishing. GitHub Actions must be allowed to create pull requests in the repository's Actions settings. If this is disabled later, research can complete but creating the review PR will fail.

## Development

Source is in `src/base/` and `src/design-options/`; generated playable files are at the repository root. Python and Node are needed only for maintenance, not for playing.

```sh
python scripts/trivia.py --check
python -m unittest discover -s tests -p 'test_*.py'
python scripts/build-site.py
for test in tests/verify-*.cjs; do node "$test"; done
```

`python scripts/trivia.py` extends the immutable buffer; `--today YYYY-MM-DD` permits isolated tests. Never delete the ledger to replenish a bank. Add new, reviewed facts instead.

GitHub Pages deploys only playable HTML/CSS through the Actions workflow. CNAME and HTTPS remain configured for `perception.thedanktank.com`. Player identity, saved progress and bounded history remain in the player's browser; scheduling adds no browser storage.
