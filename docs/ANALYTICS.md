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

Individual mini games, practice and retries do not send playing events. Controls,
rounds, share clicks, theme changes, timing and performance are not tracked.
Opening a completed saved game does not emit completion. Theme switches and
reloads do not emit duplicate daily requests. Visits are consequently *browser
days*, rather than every page load. Use event counts to compare starts and
completions. Use completion property breakdowns to inspect total and per-type
scores. This minimal schema cannot show abandonment by round or time per puzzle.

The browser ledger keeps only seven days of three flags, capped on read at 4 KB.
No growing event backlog is stored. Tracking failures never stop play. At most
three requests are held in memory while the script loads, with no retries or
historical uploads. A blocked or failed request can therefore be undercounted.
Storage clearing, unavailable storage across reloads and simultaneous tabs can
also affect deduplication; these are approximate analytics, not authoritative
player records.

Under Umami's current billing, each request and each custom property consumes a
quota unit. A complete daily play uses nine units: one visit, one start, one
completion, six score properties. An abandoned play uses at most two units, and
a non-playing visit uses one. Hobby's 100,000 monthly units would support roughly
11,000 complete daily plays with no other traffic; budget below that to leave
room for other visits. The site does not enforce an account-wide quota: check
Umami's usage dashboard, especially if this account tracks other websites.

References: https://umami.is/pricing and
https://docs.umami.is/docs/tracker-configuration.

Run `node tests/verify-analytics.cjs` after building. The regular game checks
also cover analytics integration without contacting Umami.
