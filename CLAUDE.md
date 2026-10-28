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
