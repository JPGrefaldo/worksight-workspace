# Sprint retro: Thu 22 Oct to Wed 28 Oct 2026 (JP, HRIS1)

Drafted 2026-10-29 from 20 Claude Code sessions in this window: WOR-12681, the HRIS ESS
migration, the WOR-19032, WOR-18899 and WOR-12677 bugs, and tooling. It also draws on
planning-docs (`WOR-12681/`, `HRIS-ESS-MIGRATION/`, `WOR-18899/`, `WOR-19032/`, `WOR-12677/`)
and on `notes/staging-ci-pilet-feed-404-2026-10-22.md`. The session transcripts for the two bugs
stop on 23 Oct, so this does not record whether staging QA ran on them after that.

The paste-ready Teams version is at the bottom. It is plain text, because Markdown does not
survive pasting into Teams.

## What got done

| Work | State at sprint end |
|---|---|
| WOR-19032 dark-mode "Changed" row, #14211 | Merged to staging 22 Oct. Contrast in dark mode went from 1.66:1 to 11.26:1. Waiting on QA, and the card stays open until production QA after WOR-12622 ships. |
| WOR-18899 Locations/EEO dropdowns filter as you type, #14185 | Merged to staging 23 Oct (`d381d49c0`). Waiting on QA; the production hotfix PR is not open yet. |
| WOR-12677 mobile Refresh report | Triaged as by design: Refresh only shows on query reports, and report 1339 is a dataset report. No PR needed. |
| WOR-12681 slice 1, #14122 (list, detail and delete pages, plus the payload-diff harness) | Merged 22 Oct through the merge queue. Now in Dev Smoke Test. |
| WOR-12681 slice 2, #14322 (form pages 4 and 5) | Erik approved it on 27 Oct. Moved onto WizardShell on 28 Oct. **Not merged**: it needs `ready-for-tests` on `a504f9c25` and a fresh approval. |
| Karl's WizardShell, #14247 (WOR-12678) | JP reviewed and approved it on 26 Oct. Merged 28 Oct. |
| WOR-19035 HRIS schema and My Profile, #14238 | Re-scoped to WOR-19035 only on 28 Oct. Erik approved it after three rounds that day. CI is green; the desk check is next. |
| HRIS ESS six-page batch, draft #14408 (Taxes, 1095-C, Dependents, Benefits Overview, Electronic Notice, org chart) | Draft. Local specs green. Rav approved the batch on 29 Oct. |
| HRIS ESS plan-confirmation pack | Posted to Teams 28 Oct. |
| Tooling | `pr-assets` branch for PR images from cloud sessions; shared claude-rules installer; `bin/gh-attach`; `weekly-harvest` routine (paused until it has connectors). |

## What went well

- **Short review loops.** On #14322 Erik's review came in at 12:46, the fixes at 13:22 and his
  approval at 13:40. #14238 went through three rounds and was approved on 28 Oct. Both bugs went
  from PR to merge in one to two days.
- **The payload-diff harness was the acceptance test.** Erik: "the builders reproduce Classic's
  payload field for field." Slice 2 matched Classic on 7 captures with no differences.
- **Working around the dependency.** Every part of slice 2 that did not need WizardShell was built
  first, so moving onto it took about an hour once #14247 merged.
- **Contract specs paid off.** They found the two ESS pages that break with the engine on before
  any user saw them. The per-page flags keep rollback to a flag flip.
- **Triage before code.** The WOR-12677 Refresh report and the empty client picker were a design
  choice and staging data, not regressions. That avoided two PRs.
- **Scope answers within a day.** Chadwick rewrote the WOR-10980 ACs and ruled on JP's questions
  the next day, so slice 2 could start.
- **The CI outages were written up fast.** The pilet-feed 404 note went to Engineers within hours,
  and DevEx picked it up.

## What didn't go well

- **HRIS ESS scope churn.**
  - Taxes went in under WOR-19035. It was demoed there on 27 Oct and approved, then found on
    28 Oct to be outside the ticket. The demo was deleted, the PR split and the approval reset.
  - The plan direction changed three times: Erik's service map (23 Oct), Jarek's decisions
    (27 Oct) and Rav's rule that every vendor write goes through Kafka (29 Oct). WOR-19035 AC 6
    now needs rewriting.
  - Moanna asked on 22 Oct for an Epic plus a Story per phase. Setting that up first would have
    stopped the Taxes mix-up.
- **Blocked on a shared component.** WizardShell (#14247) opened 22 Oct and merged 28 Oct, the last
  day, so slice 2 could not close this sprint.
- **CI and infra.**
  - 21 Oct: GitHub moved `ubuntu-latest` to 26.04, which has no Ruby 3.3.4. Every Ruby job went red
    until DevEx fixed it.
  - From 22 Oct: the Railway pilet feeds returned 404, and "Promote TLM pilets to staging" failed
    on every staging merge.
  - `ready-for-tests` is consumed on every push. #14322 has sat without tests since 17:15 on
    28 Oct.
- **Reviews concentrated on one person.** Erik reviewed almost everything: #14122, #14185, #14211,
  #14247, #14322 and #14238. Second-reviewer slots mostly stayed open, while the new process
  asks for two peer reviewers.
- **Our own misses.**
  - We suggested gating WizardShell focus on `POP`, which broke focus on Back. Erik caught it.
  - Three Classic-parity misses on #14322: the default date used local time instead of the
    server's UTC day; the manager pickers stopped at 100 people; and server errors were joined
    into one toast instead of one per message.
  - The evidence was shot twice, because the first run used local ids instead of the fixed demo
    ids.
- **Tooling time sinks.**
  - Expired or mis-scoped tokens: Jira 401, npm, and a Heroku token with `read` scope.
  - About 4.5 hours on 28 Oct went into finding out that cloud sessions cannot upload PR images.
  - Ruby 3.3.13 had to be rebuilt after merging `development`.
  - Branch deletes and label changes were refused from cloud sessions.
- **Follow-through after merge is behind.** Hotfix PRs for WOR-18899 and WOR-19032 are not
  opened, and staging QA on both is pending.

## Shout-outs

- **Erik:** reviewer on nearly every PR this sprint, usually within hours and with AC tables.
  His P1 on #14185 came with a ready-to-use spec. He caught our WizardShell focus mistake, and
  he wrote the ESS service map and launch plan with Rav.
- **Chadwick:** rewrote the WOR-10980 ACs and ruled on JP's questions within a day (5 points,
  Classic-style error toasts, the address block on `Employees/Address`). Opened WOR-19147 and
  WOR-19148 and is taking the server-error follow-up card.
- **Mark:** desk-checked WOR-12681 slice 1 and tested WOR-12677 on staging. His mobile Refresh
  report was precise enough to settle by evidence, with no back-and-forth.
- **Karl:** built WizardShell and took both of JP's asks within hours. Gracious about our focus
  mistake: "the detour cost nothing."
- **Rav:** approved the six-page batch and gave clear direction on the pilet and Kafka.
- **Jarek:** set the HRIS scope and ownership on 27 Oct ("back end first").
- **Moanna:** pushed for the Epic and Story structure, and for Playwright and review apps.
- **DevEx (Esteban, Mikey, Santiago):** fixed the Ruby runner break (#14193, #14196) and unblocked
  staging merges during the Railway outage (#14244).

## What I'll do differently

1. Confirm the ticket's scope and Jira structure (Epic, then a Story per phase) before the first
   commit, not at review.
2. Name cross-PR dependencies at planning, and ask for shared components such as WizardShell to
   land by day two.
3. Ask for the second reviewer when the PR opens, not after Erik approves.
4. Use a Classic-parity checklist on design-system migrations: time zone, pagination, how errors
   show, and fixed demo ids for evidence.
5. Refresh the Jira, npm and Heroku tokens on sprint day one.
6. Team ask: can `ready-for-tests` stay on across pushes, or can a re-push re-add it?

## Carried into next sprint

- #14322: `ready-for-tests` on `a504f9c25`, a fresh approval, second reviewers, then merge. The
  slice 1 and slice 2 Jira reports.
- #14238: QA desk check on staging, then merge, and link the PR on WOR-19035.
- #14408: create the Story and Sub-task under WOR-7592, then rename the branch, take it out of draft
  and fix the rollout note. Decide on the org chart and the Benefits pages.
- WOR-18899 and WOR-19032: QA on staging, then the production hotfix PRs.
- Mark's dev smoke test of WOR-12681, including the dark theme and a keyboard pass.
- The Q1–Q32 questions to Erik (unsent), the Rav sync, and the Kafka event standard with Jarek and
  Rav.
- Housekeeping: delete the stray branches, re-enable `weekly-harvest` with its connectors, and
  confirm DevEx restored the pilet feeds.

---

## Teams version (plain text, paste as is)

Sprint retro, 22 to 28 Oct (JP)

WHAT GOT DONE
• WOR-19032 dark-mode fix (#14211) and WOR-18899 dropdown filtering (#14185) are merged to staging. Both wait on QA, then the hotfix.
• WOR-12681 slice 1 (#14122) is merged. Slice 2 (#14322) is approved and waiting on CI and a re-approval.
• WOR-19035 (#14238) is re-scoped and approved, with the desk check next. The six-page ESS batch is in draft (#14408), and Rav approved it today.
• WOR-12677 mobile Refresh turned out to be by design, so no PR was needed.

WENT WELL
• Fast review loops. On #14322 the review, the fixes and the approval all landed within an hour.
• The payload-diff harness proved parity with Classic field for field.
• Contract specs caught the two broken ESS pages before any user saw them.
• Scope questions were answered within a day.

DIDN'T GO WELL
• HRIS ESS scope churn. Taxes landed under WOR-19035 and had to be split out, and the plan direction changed three times this week.
• Slice 2 waited on WizardShell, which merged on the last day.
• CI and infra: the Ubuntu 26.04 Ruby break, the Railway pilet feed 404s, and ready-for-tests being dropped on every push.
• Reviews mostly fell on one person.
• Our own parity misses: the time zone, the 100-person picker limit, and error toasts.
• Token expiries and cloud upload limits ate hours.

NEXT SPRINT I'LL
• Lock the ticket scope and the Epic/Story structure before the first commit.
• Flag cross-PR dependencies at planning.
• Ask for the second reviewer up front.
• Run a Classic-parity checklist on migrations.

SHOUT-OUTS 🙌
• Erik: reviewed nearly every PR this sprint, fast and thorough, caught our WizardShell focus bug, and wrote the ESS service map and launch plan with Rav.
• Chadwick: turned the WOR-10980 ACs and every scope question around within a day, which kept slice 2 moving.
• Mark: careful desk checks and precise QA reports. The mobile Refresh report was settled by evidence alone.
• Karl: WizardShell, and took our asks within hours.
• Rav and Jarek: clear direction on HRIS scope, the pilet and Kafka.
• Moanna: pushed for the Epic and Story structure.
• DevEx (Esteban, Mikey, Santiago): kept CI and staging moving through two outages.
Thanks, everyone 🙏
