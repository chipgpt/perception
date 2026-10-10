# Perception growth experiment

## Starting evidence

Umami shared-dashboard aggregate snapshot, October 9, 2026 at approximately
5:35 p.m. Central, queried over the preceding 30 days:

| Recorded activity | Count |
| --- | ---: |
| Visits / visitors / pageviews | 28 each |
| Daily starts | 19 |
| Daily completions | 17 |
| Share-button clicks | 13 |
| Mobile visits | 19 |
| Laptop / desktop visits | 7 / 2 |

Start-to-completion is approximately 89%; visits-to-start is 68%. This is a very
small sample of deduplicated browser-day activity, not evidence of stable rates
or a causal funnel. Share clicks may include practice and cancelled native sheets.
No referrers were returned; messaging apps often remove referrer information.
There is no measured referral conversion in the existing data.

## First experiment: a score worth challenging

The current completion screen offers **Challenge a friend** above ordinary result
sharing. It produces a clickable HTTPS link carrying today's date and score.
Recipients go straight into the Daily Five with a score to beat. Completion shows
the difference, including a tie or loss, and invites a challenge back. A link from
an earlier day explains that the challenge has ended and offers today's game.
Practice results offer neither score sharing nor friend challenges. Existing daily puzzles,
scoring, saved first attempts and compact result cards remain intact.

This tests one hypothesis: a concrete score to beat will turn sharing into more
completed daily games. It does not depend on accounts, a public leaderboard,
fabricated popularity, or promises of viral growth.

## Launch material

Short post, ready to adapt for an audience the owner already participates in:

> You think you can remember a colour. You know what 10 seconds feels like.
> …Right? Perception tests that confidence with five daily puzzles and a score
> out of 500. Free, no login, and silent. Play today's five, then send me your
> challenge: https://perception.thedanktank.com/

For a group chat, play today's game and use its generated challenge message:
“I scored [your actual score]/500 on Perception. Can you beat me?” The generated
link includes the real date and total. Do not reuse an old challenge as today's.

For a short video, record one surprising missed guess and its reveal; keep
today's answers out of public clips by recording practice. End with the actual
score and “Five puzzles. Can you beat me?” Direct viewers to the public game.

Distribution order: start with an existing friend group; invite participants to
send their own challenges; then use one relevant puzzle community that permits
self-promotion. Tailor each post and follow its rules. None of this outreach has
been posted or sent by the agent.

## Evaluate after seven days of real exposure

Compare `challenge_share_clicked`, `challenge_visit`, `challenge_start`, and
`challenge_complete` in Umami over the same window. Also watch overall Daily Five
starts/completions so increased traffic does not hide a worse playing experience.

- Few challenge clicks: improve the completion-screen invitation and share copy.
- Clicks but few arrivals: check native sharing and link visibility in the apps
  players actually use; ask consenting players what recipients saw.
- Arrivals but few starts: simplify the first puzzle's instructions using player
  feedback before adding another landing screen.
- Starts but few completions: inspect feedback about confusing puzzles; the
  current analytics cannot locate abandonment by round.
- More completed challenges: keep the flow, expand exposure gradually, and check
  returning-player retention before adding more features.

Do not declare a winner from a handful of visits or divide these aggregate
browser-day counts into an asserted viral coefficient. Actual growth requires
continued distribution and repeated observations. Review Umami quota use if
traffic rises. Publishing and outbound promotion are separate next actions.
