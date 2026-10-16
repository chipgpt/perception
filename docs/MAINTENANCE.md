# Maintaining Perception

## Daily trivia

`data/trivia-bank.json` is the maintained bank for **When?** and **How long?**. Each fact has a permanent `id`, a canonical `factKey`, a numerical answer, explicit scope and a source. Preserve IDs when editing wording. Used facts are immutable; correct a substantive error through an explicit migration rather than silently rewriting a published answer.

`data/daily-trivia.json` records every published day's five types and trivia IDs. The ledger records assigned facts and fingerprints. Assignments are permanent, append-only and never reused. Adding approved facts does not change published days. The scheduler preserves the existing device-date convention for procedural puzzles. The initial schedule begins October 7, 2026, retaining that day's live soccer and Moon-landing questions.

The no-repeat guarantee covers trivia in **Daily five** from the schedule's start date, not historical games before that date or practice. Individual games are practice-only. Trivia practice draws only from Daily Fives dated before the current device-calendar day, with up to five unique questions per session; mixed practice follows the same restriction. The ledger lives in GitHub, independently of browser history. If a bank is exhausted, that trivia type is omitted from newly scheduled days. Beyond the scheduled horizon, the game falls back to five distinct procedural types instead of recycling trivia.

## Game plans: Size it up replaces Proportions

Use **Size it up** in all future game plans, mockups, instructions and roadmaps.
It replaces the aspect-ratio game: players measure width and height against a
visible reference square, with both dimensions scored independently. Do not plan
Proportions as a separate current game.

The daily schedule retains the internal type `proportion`. For dates on or after
October 15, 2026, that slot generates Size it up (`measurementVersion: 2`), including
already scheduled future days, newly extended schedules and the procedural
fallback beyond the published horizon. Current practice also uses Size it up.
Do not rename or reshuffle schedule entries to make this player-facing change;
the identifier preserves seeded challenges, saved results and permanent daily
assignments. Earlier dated rounds retain the historical ratio mechanic.

`tests/verify-size.cjs` checks every scheduled measurement slot from the changeover
onward, future generation beyond the schedule, and historical fixtures.

## Weekly automation

[Maintain and publish Perception](https://github.com/chipgpt/perception/actions/workflows/perception.yml) runs Mondays at **07:23 UTC**, on relevant changes to `main`, and through **Run workflow**. It extends the published buffer to 60 days ahead, validates the bank and schedule, builds and tests the game, commits changed assignments and publishes GitHub Pages. The job warns when fewer than 20 unused facts remain in either bank.

Scheduled/manual runs additionally research candidates when supply is low. To enable research:

1. Open [github-pages environment secrets](https://github.com/chipgpt/perception/settings/environments).
2. Open **github-pages** and add an environment secret named **OPENAI_API_KEY**, containing an OpenAI API key with Responses API access and billing enabled. This is separate from ChatGPT billing. Do not put the key in source files.
3. Run **Maintain and publish Perception** manually to test it; subsequent weekly runs use the secret automatically.

The optional repository variable `OPENAI_TRIVIA_MODEL` overrides the default `gpt-5.5`. Each eligible run makes at most **two API requests**: research (8 hosted tool calls, 6,000 output tokens) and independent review (20 hosted tool calls, 7,000 output tokens). The optional `OPENAI_TRIVIA_REVIEW_MODEL` variable overrides the review model, also `gpt-5.5` by default. It proposes up to 8 questions, only for depleted banks, and does not retry uncertain requests. These limits bound work, not an exact dollar amount; configure the API project's spending controls separately.

Research uses web search, requires source URLs present in the consulted sources, checks ranges and displayed precision, and rejects duplicate IDs, canonical identities and near-duplicate titles. Candidates are proposed in one open `auto/trivia-replenishment` pull request. An existing open PR prevents another paid research request and proceeds directly to review. A separate model request opens each linked primary source and checks numerical accuracy, scope, familiarity, stability, answer leakage and semantic duplicates. Search results alone are insufficient. Only high-confidence candidates passing every check survive; the bot removes flagged candidates, runs all game and data tests using trusted main-branch code, records evidence in `data/reviews/`, and squash-merges the exact reviewed commit. If all candidates fail, it closes the rejected batch with its evidence so the next run can research fresh questions. Deployment then rebuilds and publishes the approved bank.

Automatic merging is restricted to additive trivia-data PRs from `github-actions[bot]` on the fixed `auto/trivia-replenishment` branch in this repository. Existing questions and published assignments cannot change. Forks, code changes, malformed reviews, failed checks and changed PR heads cannot merge. Ordinary code PRs still receive validation but are not automatically merged. GitHub does not trigger PR checks for its built-in token, so the reviewer explicitly runs those checks before merging. The bot waits for GitHub to recalculate mergeability after removing flagged candidates. If merging is interrupted, a later run can resume the exact bot-authored audited commit, recheck the games, and merge without repeating paid fact verification. Weekly and manual maintenance runs perform review; a rejected unchanged batch is never repeatedly reviewed for a fee. AI review can still make mistakes; source evidence remains available for corrections without changing published assignments.

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

The share-preview artwork is generated by `scripts/build-social-image.py`, using the game's bundled fonts and native puzzle drawings. Regeneration needs Pillow with WOFF2 font support; the exported PNG ships as a static asset.

## When? scoring versions

New When? practice rounds and daily rounds dated October 16, 2026 onward carry
`timelineScoringVersion: 2` and a frozen `scoringYear`. The zero-point error bound
is `max(5, 0.25 * max(0, scoringYear - answerYear))` years. Score linearly as
`round(100 * max(0, 1 - abs(guessYear - answerYear) / bound))`. A four-year miss
within the five-year baseline earns 20 points. Older events have larger bounds.
Use the challenge year, never the date a replay is opened. Questions without
these fields retain the original 50-year bound and squared scoring curve; do not
rewrite old saved decks or stored scores. Other games' error bounds are unchanged.

## Time scoring versions

New Time practice rounds and daily rounds dated October 16, 2026 onward carry
`timeScoringVersion: 2`. Their zero-point error allowance is
`max(1.25 seconds, 0.5 * targetSeconds)`. Score linearly using
`round(100 * max(0, 1 - abs(elapsedSeconds - targetSeconds) / allowance))`.
The floor widens the scoring range on short rounds; it does not create a free
error window. Freeze the version on each question. Unversioned saved questions
and daily dates through October 15 retain the old three-second squared curve.

## Scoring rule: linear closeness for every game

All new games must convert their measured error to points linearly:
`round(100 * clamp(1 - error / zeroPointBound, 0, 1))`. Define difficulty through
the game's error measure and bound, rather than adding a power curve. Rhythm
retains its logarithmic distance measure for multiplicative bounds.
Size it up clips width and height independently, averages their closeness, then
rounds once; an oversized dimension cannot cancel an undersized one.

New practice questions and daily dates on or after October 16, 2026 carry
`scoringVersion: 2`. Question generation, IDs, answers and schedule order stay
unchanged. Do not add that marker to historical or saved questions: their original
scoring remains valid. Time and When? also retain their bound-specific metadata.

In the linear scoring version, **3D view uses a 90° zero-point rotation bound**;
**Angles uses 180°**. Historical 3D questions retain their 180° bound and original
curve. A 45° 3D miss earns 50; a 90° miss earns zero.

## Inner-box perspective, duration, and trace overlap

Questions with `scoringVersion: 2` use these rules immediately in practice and
from October 16, 2026 in daily challenges. Earlier questions retain their original
bounds, curves, and thin-line rendering.

- Perspective: error is the point distance divided by 40% of the inner-box
  diagonal, `0.4 * 0.65 * hypot(360, 260)` (about 115.4 logical units).
- How long?: error is `abs(durationValue(guess) / answer - 1) / 0.5`.
  A 25% miss earns 50 points; 50% short or long earns zero.
- Line memory: points are `round(100 * intersection / union)` of the two
  round-capped, round-joined strokes, each 12 units wide on a 400×300 board.
  A fixed half-unit raster makes scoring independent of viewport, DPR, drawing
  speed, direction, and retracing. Extra marks increase the union and lower the
  score. The target's dashed center distinguishes it from the player's stroke.
- Color memory keeps its wheel-distance scoring. Internal `colour`/`memory`
  identifiers and historical question text stay intact; UI uses American spelling.
