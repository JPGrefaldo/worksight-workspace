# CLAUDE.md — worksight-workspace

Personal hub. It holds **personal notes** (`notes/`) and the **list of repos** worked on side by
side (`repos.json`). It does not contain those repos. Each one is its own clone, with its own
remote, in the folder next to this one:

```
<parent>/
├── worksight-workspace/      ← this repo
├── worksight/                ← GAPartners/worksight
├── worksight-planning-docs/
├── gna-brain/
└── …                         ← whatever else repos.json lists
```

`bin/sync` keeps them cloned and current. A SessionStart hook runs `bin/sync --hook`, which pulls
and prints a status table. Read that table before starting work.

## Session start

**Cloud session** (`CLAUDE_CODE_REMOTE=true`): only this repo is attached at start. The hook lists
every `attach: always` repo that is missing. For each one, before doing the task:

1. Call `add_repo` with its owner and name (`access: "push"`).
2. Run the clone command it returns, cloning into the path the hook printed (a sibling of this repo).
3. Call `register_repo_root` with that path, so the repo's own CLAUDE.md, skills and rules load.

Attach `attach: on-demand` repos only when the task needs them. Once the repos are cloned, run
`bin/sync status` to confirm.

In a cloud session every `bin/sync` run (the hook, `status`, plain `sync`) also installs planning-docs'
`claude-rules/` (rules, agents, commands, skills, hooks, `CLAUDE.md`) into `~/.claude` once that clone
exists, via `claude-rules/install.sh`; the last line of its output says what it installed. Files
installed mid-session may only take effect from the next session start: until then, read the rule or
skill from `worksight-planning-docs/claude-rules/` directly when the task needs it. Settings, hooks
and permissions are not installed this way.

A cloud session gives you a `claude/<name>` working branch in each clone. **Do not work on it in a
`push: auto` repo** (this one, planning-docs): those repos are `main` only, and `bin/sync --hook`
has already switched them back to `main` at session start. If `bin/sync status` shows one of them
on any other branch, run `bin/sync` to move the commits to `main` before doing anything else.
GitHub cannot enforce this on a private free-plan repo, so `bin/sync` is the only guard: never
`git push` a `claude/*` branch of a `push: auto` repo by hand. In a `push: manual` repo, follow that repo's own branch rule
(the worksight monolith: a ticket branch from `development`, named per its PR template).

**Laptop** (`CLAUDE_CODE_REMOTE` unset): the repos are already cloned next to this one, or at the
paths in `workspace.local.json`. Never re-clone them. If one shows as missing, run `bin/sync`, which
clones it with the local git credentials.

## Where things go

| What | Where |
|---|---|
| Notes, investigations, scratch output, drafts, anything not a deliverable | `notes/` in this repo |
| Ticket plans and planning docs | `worksight-planning-docs` |
| Code and docs that belong in a JIRA PR, and **nothing else** | `worksight` |
| Team knowledge | `gna-brain`, by its own CLAUDE.md (drafts through a PR) |
| Team epics and per-PR handoffs | `gna-worklog` |
| Nothing. It is a projection of gna-brain | `gna-atlas` (read-only) |

Never leave personal or scratch files in `worksight`. If a tool writes output there that is not part
of the ticket, move it to `notes/`. A `worksight` PR should show only the ticket's change.

## Committing and pushing

- Commit in the repo the file belongs to. `cd` into it. Never stage another repo's files from here.
- `push: auto` repos (this one, planning-docs): always on `main`. `bin/sync` commits and pushes them
  on a laptop. In a cloud session, commit with a real message and then run `bin/sync`, which moves
  the clone to `main` if needed and pushes `main`. Never `git checkout -b` in these repos.
- `push: manual` repos (worksight, gna-brain, gna-worklog, gna-atlas): `bin/sync` only pulls them.
  Work on a branch and open a PR, following that repo's own CLAUDE.md.
- Never use `git add -A` in `worksight`.

## Logging in to dev / staging

`bin/ws-login staging|dev [--screenshot <file.png>]` logs in headless with `WS_QA_EMAIL` /
`WS_QA_PASSWORD`, or `WS_STAGING_*` / `WS_DEV_*` to override one env. It saves the session to
`~/.cache/worksight-qa/<host>.json`, where `qa/check-auth.mjs` and `qa/drive.mjs` look for it.

- The app logs out after 30 idle minutes (`DEVISE_TIMEOUT`). When `check-auth` reports
  `AUTH EXPIRED`, re-run `bin/ws-login` instead of the headed login.
- It refuses any host other than dev, staging or a local app. Never point stored credentials at
  production.
- Never print, echo, log or commit the credential variables or the saved session file.
  Screenshots of logged-in pages may show client data. Keep them in the scratchpad or `tmp/`,
  never in a repo.
- In a cloud session, the SessionStart hook runs `bin/cloud-browser-setup` so Chromium trusts the
  session proxy. Without it, every page fails with `ERR_CERT_AUTHORITY_INVALID`.

## Uploading evidence to a PR

GitHub has no API for PR images and videos. `bin/gh-attach <owner/repo#N> <file>...` uploads them
through the PR's own comment box in a headless browser and prints JSON with each file's
`user-attachments` URL and the snippet GitHub inserted. Nothing is posted; put the URLs in the PR body.

- Laptop only. A cloud session's proxy limits github.com to repo-scoped paths, so `/login`, `/session`,
  `/upload/policies/assets` and `user-attachments` all return 403 there. The script refuses when
  `CLAUDE_CODE_REMOTE=true`.
- Sign in once with `bin/gh-attach --login` (headed, 2FA works). The session stays in the browser
  profile at `~/.cache/worksight-qa/github-profile`. Never copy it into a repo or print its cookies.
- Images up to 10 MB (png, jpg, gif, svg), videos up to 100 MB (mp4, mov, webm). `--headed` and
  `--screenshot <file.png>` help when GitHub changes the page.

## Adding a repo

Add an entry to `repos.json` (`repo`, `push`, `attach`, `purpose`) and push. Every later session
picks it up.

## bin/sync

```
bin/sync            clone missing (laptop), pull all, commit + push the push:auto repos
bin/sync status     local state only; --fetch refreshes remote refs first
bin/sync --hook     pull only, never commits or pushes, always exits 0
  --no-clone        skip cloning     --all   also clone attach:on-demand repos
```

Pulls are fast-forward only. A repo with uncommitted tracked changes is skipped, never stashed. A
`push: auto` repo that diverged is rebased, and a conflict aborts the rebase and is reported. A
`push: manual` repo that diverged is only reported. A repo whose `origin` does not match
`repos.json` is skipped.

## The org: JP's agent company

JP is the CEO and the only one who posts to Jira, GitHub or Teams. A **chief-of-staff** session takes
JP's asks, routes each one to a department below, and keeps the decision log. Departments are
subagents defined in `.claude/agents/<role>.md`. They load at session start in every session
that starts from this repo: every cloud session, and a laptop session started in this folder.
Departments draft. They never post, commit, push or deploy.

**This is JP's personal orchestration, and Anvil is its first builder.** A ticket goes to Anvil for
the first execution. The org then finds what Anvil missed and closes each gap. It measures against
JP's bar, not Anvil's. Anvil's loop never opens a browser, and its reviewer sees only the PR
description, the acceptance criteria and `.claude/rules/`. So the gaps sit in frontend, in
browser-only behaviour, and in anything those three cannot show. The flow:

1. **Card.** ticket-architect shapes the card for Anvil's intake and lists what Anvil is likely
   to miss. JP adds the label.
2. **First build.** Anvil opens the PR and runs its loop.
3. **Gap review, in parallel.**
   - pr-reviewer reviews the code and looks outside it: how GitHub projects, FAANG and other
     companies solved the same problem.
   - qa-lead runs the browser proof.
   - security-reviewer and parity-guard run when the diff calls for them.
4. **Gap list.** The chief of staff merges the findings into one gap list. Each gap gets a route:
   `/anvil` (a rework line JP posts), `us` (fixed in JP's own session on the PR branch) or
   `follow-up`.
5. **Re-review.** The departments check the gaps on each new head until no P0 or P1 is open. Then
   the desk check runs.
6. **Ledger.** Every gap goes into a ledger. A gap that keeps recurring becomes a proposed
   `.claude/rules/` file, so Anvil's next run catches it.

**Starting a chief of staff.** In any session, type `/cos`, optionally followed by the ask. The main
session reads `.claude/agents/chief-of-staff.md` and acts as that agent. On a laptop,
`claude --agent chief-of-staff` from this folder does the same and also enforces the agent's tool
list. Any session may still call one department directly ("use the pr-reviewer agent on
GAPartners/worksight#14550"). The contract below applies either way.

`<PD>` is the planning-docs clone: `/home/user/worksight-planning-docs` in a cloud session, or the
path `bin/sync status` reports on a laptop. Every output path below is inside `<PD>`. "The ticket
folder" is the planning folder that already exists for that ticket (`HRIS-ESS-MIGRATION/wor-19721/`,
`WOR-16945/`). Create a top-level `WOR-XXXXX/` only when none exists.

| Role | Job | Writes to | Model |
|---|---|---|---|
| chief-of-staff | Routes work, merges each PR's gap list, keeps the decision log and the gap ledger, commits planning-docs. Never writes code | `decisions/`, `pr-reviews/*-gaps.md`, `pr-reviews/anvil-gap-ledger.md` | inherit |
| research-director | Finds how others solved the same problem, then checks each finding against our code at file:line | `<project>/research/`, else `research/` | opus |
| pr-reviewer | Meticulous, read-only review of the code and outside it: how GitHub projects, FAANG and other companies solved the same problem (through research-director). Rates severity, marks visible or latent, names each gap's route | `pr-reviews/` | opus |
| security-reviewer | HRIS checklist: PII in Kafka messages, encryption, keyed hashes, XSS, authorization, test data | `pr-reviews/` (`-security` suffix) | opus |
| parity-guard | Schema parity between the monolith and the engine (type, nullability, arguments, enums), and the flag routing matrix | `qa/` | opus |
| qa-lead | "What QA will see", flag-off and flag-on desk checks, the QA boundary, the browser proof | `qa/` | opus |
| ticket-architect | Shapes and splits cards for Anvil's first run, lints them before JP adds the label, and lists what Anvil is likely to miss | the ticket folder, else `cards/` | opus |
| program-manager | Read-only Jira: stale blockers, missing owners, dependencies written as prose | `status/` | sonnet |
| release-devex | Per-environment steps, rollout order, rollback runbooks | the ticket folder, else `runbooks/` | sonnet |
| scribe | Sync transcripts into timestamped decisions, tech-check drafts in the Q format | `meeting-briefs/`, the ticket folder | sonnet |

**Contractors** that departments may call: planning-docs' brief agents (`weekly-scrum-brief`,
`training-session-brief`, `teams-channel-brief`, `patterns-harvester`) and the monolith's read-side
agents (`code-review-plus` in local-notes mode, `regression-guard`, `qa-runner`, `jira-fetcher`,
`deployment-tracker`, `Explore`). The monolith's Jira writers (`jira-creator`, `jira-updater`,
`jira-commenter`, `jira-epic-*`, `jira-feature-updater`) are off limits to every department.

### Hand-off contract

Sessions and subagents share no memory, so files are the only hand-off.

1. **Brief.** The chief of staff gives a department, in its spawn prompt, the ask, the ticket or
   PR, the output path, the files to read first, and what is already ruled out.
2. **One file.** The department writes one file at that path. It starts with this header and ends
   with a `## Hand-off` section:

   ```
   ---
   role: pr-reviewer
   ask: Review GAPartners/worksight#14550, round 3
   ticket: WOR-19721            # or none
   pr: GAPartners/worksight#14550   # or none
   date: 2026-11-04
   code_checked: GAPartners/worksight jpgrefaldo/WOR-19721-v2 @ b45d9a36e6   # or none
   status: done                 # done | partial | blocked
   ---
   ```

   `## Hand-off` has four items: **Answer** (three lines at most); **For JP to decide** (numbered,
   each with a recommendation and the alternative, or "none"); **Next** (which department should
   pick this up, with what ask, or "none"); **Not done** (what was skipped, and why).
3. **Short reply.** The department replies with the file's path and its Answer lines, nothing
   else. The chief of staff reads the file, not the reply.
4. **Log.** The chief of staff appends the run to `decisions/runs.md`, moves the open questions to
   `decisions/open.md`, and records JP's rulings in `decisions/log.md`. Then it commits the
   planning-docs paths it touched and runs `bin/sync`. A new chief-of-staff session starts by
   reading those three files.

### Guardrails

- **Read-only.** Reviewers and researchers change no file in a code repo. No department commits,
  pushes, posts or deploys. Each department's Bash runs behind `.claude/hooks/department-guard.mjs`,
  which blocks git writes, GitHub and Jira writes, deploy commands and the pushing form of
  `bin/sync`. It is a seatbelt, not a sandbox; the rule is this section. Claude Code runs an
  agent's frontmatter hooks only when it trusts this folder, so open the folder once on each
  machine and accept the trust dialog. On 2026-11-04, a headless run in an untrusted cloud
  container skipped the guard. With the folder trusted, the guard blocked the same command.
- **Only JP posts.** Agents draft the exact text and name the platform and the target ("Jira
  comment on WOR-19721", "GitHub review on GAPartners/worksight#14550"). Creating a Jira issue also
  needs JP's two confirmations (`feedback-jira-no-new-tickets-without-double-confirm` in planning-docs'
  `claude-rules/memory/`).
- **Sources.** Every external claim carries its source URL, followed by
  `Checked against our code: <repo> <path:line> @ <sha>: holds | differs | not applicable`. If it
  was not checked, say "not checked" and why. Marks: **[P]** primary source fetched and read,
  **[S]** search summary or second-hand only, **[L]** our code, **[I]** our inference.
- **No employee data.** None in prompts, research files, fixtures, seeds or screenshots kept in a
  repo. This is HRIS. Use synthetic data: the accounts in planning-docs' `test-users.md`, and seed
  ids in the 9_000_000 band. The trimmed staging dump holds real PII; it never feeds a fixture, a
  research file or a prompt. Transcripts and briefs name colleagues: keep that material in
  planning-docs, and never copy it into Jira, a PR, Teams or gna-brain.
- **Teams versus subagents.** Use agent teams only for adversarial review passes. Turn them on for
  that one session with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, never in a shared settings file:
  while it is on, any subagent Claude names starts as a teammate. Use subagents for everything else.
  Subagents may nest up to three levels below the main session. The deepest chain here is chief of
  staff, then pr-reviewer, then research-director, then research-director's parallel passes.
- **One severity scale** for every reviewer:
  - **P0**: data loss, a security hole, or wrong data users see now. Stop the merge or the flag.
  - **P1**: wrong behaviour a user or QA will hit, or a rollout hazard. Fix before the flag goes on.
  - **P2**: a latent defect or a spec gap. Batch it.
  - **P3**: hygiene or a nit.

  Each finding also says **visible today**, **visible when `<flag>` is on**, or **latent**. Its
  evidence is **[v]** (re-read by the author and holds), **[a]** (from a helper agent only) or **[i]**
  (inference, not run). A P0 or P1 blocks the merge, whoever built the PR.
