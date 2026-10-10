# Minimal Umami analytics

Public tracking configuration is in `src/design-options/analytics-config.json`.
Set `websiteId` to the ID from the website's Umami settings, and `scriptUrl` to
the provided HTTPS tracking script. Rebuild with `python3 scripts/build-site.py`.
An empty ID disables analytics. No API key belongs in the website.

Tracking runs only on `perception.thedanktank.com`, respects Do Not Track, and
reuses the game's existing anonymous browser ID. Preview and GitHub Pages
fallback URLs are excluded. Automatic tracking is disabled; only these explicit
requests are sent:

| Request | When | Custom properties |
| --- | --- | --- |
| Pageview | First visit in a browser on a device-calendar day | None |
| `daily_started` | First puzzle interaction in Daily Five | None |
| `daily_completed` | Fifth answer committed in Daily Five | `total`, plus one score keyed by each of the five puzzle types |
| `results_share_clicked` | First Share results click per browser per calendar day, in Daily Five | None |
| `challenge_share_clicked` | First Challenge a friend click per browser per calendar day | None |
| `challenge_visit` | First visit through a valid challenge for today's Daily Five | None |
| `challenge_start` | First Daily Five interaction through that challenge | None |
| `challenge_complete` | First Daily Five completion through that challenge | None |

Individual mini games, practice and retries do not send playing events. Practice
results have no share or friend-challenge controls. Controls, rounds,
theme changes, timing and performance are not tracked. Sharing measures intent
(button click), including clipboard fallback, rather than proving an external post.
Opening a completed saved game does not emit completion. Theme switches and
reloads do not emit duplicate daily requests. Visits are consequently *browser
days*, rather than every page load. Use event counts to compare starts and
completions. Use completion property breakdowns to inspect total and per-type
scores. This minimal schema cannot show abandonment by round or time per puzzle.

The browser ledger keeps only seven days of bounded event flags, capped on read at 4 KB.
No growing event backlog is stored. Tracking failures never stop play. At most
eleven requests are held in memory while the script loads, with no retries or
historical uploads. A blocked or failed request can therefore be undercounted.
Storage clearing, unavailable storage across reloads and simultaneous tabs can
also affect deduplication; these are approximate analytics, not authoritative
player records.

Under Umami's current billing, each request and each custom property consumes a
quota unit. A complete daily play uses nine units: one visit, one start, one
completion, six score properties. An abandoned play uses at most two units, and
a non-playing visit uses one. Sharing adds at most one unit per browser per day,
making a completed-and-shared daily play ten units. Hobby's 100,000 monthly units would support roughly
11,000 complete daily plays with no other traffic; budget below that to leave
room for other visits. The site does not enforce an account-wide quota: check
Umami's usage dashboard, especially if this account tracks other websites.

References: https://umami.is/pricing and
https://docs.umami.is/docs/tracker-configuration.

Friend challenges contain only a Central-calendar date and a self-reported total
in the URL. No answers, player ID, or individual referral identifier is included.
Query strings remain excluded from analytics. Challenge events have no custom
properties; an incoming completed-and-shared challenge can add four requests to
the existing ten-unit daily budget. Expired or invalid challenges do not contribute
challenge visit/start/completion events. A shared score is a friendly comparison,
not an authenticated leaderboard entry.

Challenge events count browser days and share intent, not verified delivery or
unique invitees. Ratios across these counts are directional: repeat visitors,
cross-day arrivals, cancelled shares, lost parameters, tracker blocking and links
received after an earlier daily completion can affect them. Loading saved results
never re-emits completion. Use the same date window when comparing counts.

Run `node tests/verify-analytics.cjs` after building. The regular game checks
also cover analytics integration without contacting Umami.

## Acquisition campaign counts

Links may include `?source=x`, `listdle`, `playlin`, `dledirectory`, `webgames`,
or `showhn`. Only those six fixed values are accepted; arbitrary query values
are never uploaded. For Daily Five, the app sends `acquisition_<source>_visit`,
`acquisition_<source>_start`, and `acquisition_<source>_complete`. These events
have no custom properties and deduplicate per source, browser and Central day.
Practice links do not send acquisition events. The query string remains excluded
from ordinary analytics.

A campaign-tagged daily play adds at most three quota units. A tagged incoming
challenge that is completed and shared uses at most seventeen units including
the existing play and challenge events. The loading queue is capped at eleven
requests; failures remain isolated from play.

These are campaign-attributed browser days, not new-user counts or causal
conversion cohorts. The same browser can count for multiple sources; changing
links mid-play, tracker blocking, untagged return visits, and removed parameters
limit attribution. Source tags are neither authenticated nor persisted across
untagged visits. Read starts and completions as directional evidence and pair
them with real player feedback.
