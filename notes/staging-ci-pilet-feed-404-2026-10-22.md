# Staging CI: "Promote TLM pilets to staging" failing on every staging merge (pilet feeds are down)

Since this morning, every merge to `staging` ends with a red **Promote TLM pilets to staging** run. This is
**not** the Ruby/Ubuntu image issue from the CI Issues thread. Ruby sets up fine and the pilet builds pass.
The failure is that the pilet feeds on Railway have stopped responding.

## What fails

The `promote` job dispatches each pilet repo's "Publish pilet to feed (manual)" workflow:

- timesheets 0.2.75
- payrules 1.0.37
- templates 0.1.16

Each one builds its package, then the upload to the staging feed fails with:

```
curl: (22) The requested URL returned error: 404
{"status":"error","code":404,"message":"Application not found"}
```

from `https://main-staging-95b6.up.railway.app/api/v1/pilets`.

## Root cause

Railway itself returns "Application not found" (`x-railway-fallback: true`), which means no running service
answers on those domains. Three feed addresses are affected:

| Feed address | Used for |
| --- | --- |
| `main-staging-95b6.up.railway.app` | staging feed, uploads |
| `piral.worksight-staging.gnapartners.com` | staging feed custom domain, the promote job's version check |
| `main-development-4438.up.railway.app` | development feed |

## When it started

About **02:20–02:45 UTC on Oct 22** (20:20–20:45 MT on Oct 21).

- The development **Sync TLM pilet lock** schedule last passed at 02:17 UTC and has failed every run since
  02:45 UTC with `development feed answered 404 for https://main-development-4438.up.railway.app/api/v1/pilets`.
- The last green promote run on staging was Oct 21, 19:53 UTC.

## Affected staging runs so far

| Merge | Promote run |
| --- | --- |
| #14211 (WOR-19032) | https://github.com/GAPartners/worksight/actions/runs/39789673913/job/119862027254 |
| #14233 (WOR-18849) | https://github.com/GAPartners/worksight/actions/runs/39801241290 |
| #14225 (WOR-18441) | https://github.com/GAPartners/worksight/actions/runs/39803746637 |
| #14179 (WOR-18611) | https://github.com/GAPartners/worksight/actions/runs/39815666580 |
| production → staging merge, 16:47 UTC | https://github.com/GAPartners/worksight/actions/runs/39816953835 |

One of the pilet publish runs, for reference:
https://github.com/GAPartners/worksight-pilet-timesheets/actions/runs/39789722394

## Impact

- The job isn't a required check, so it does not block merges or the staging deploy.
- The manual fallback ("Publish pilet to feed (manual)") hits the same dead URL, so it won't help until the
  feed is back.
- The TLM pages that load pilets from these feeds (Timesheets, Pay Rules, Templates) are probably affected on
  staging and development too. Worth a quick check.

## What we need

1. **DevEx:** please check the Railway project that hosts the pilet feeds (staging and development). The
   services or their domains look stopped, removed or detached since ~02:20 UTC.
2. **Once the feeds answer again:** re-run the last failed promote run on staging, or run the workflow manually
   on `staging`, so the pinned versions get published.
3. **Everyone else:** no action needed. Don't rebase or re-run your PRs for this; merging to staging still works.

## Not checked

- Why the feeds are down: there was no Railway access to look. The pilet feeds aren't in the monolith's
  `.railway/` config.
- The most recent Railway change on staging is WOR-13809 (#13843, merged Oct 21 14:18 UTC), but the feeds kept
  answering for about 12 hours after it, so it isn't named as the cause.
