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
`bin/sync status` to confirm. A cloud session gives you a working branch for each repo. Use it in
any repo you change.

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
- `push: auto` repos (this one, planning-docs): `bin/sync` commits and pushes them on a laptop. In a
  cloud session, commit with a real message and then run `bin/sync`, which pushes the current branch.
- `push: manual` repos (worksight, gna-brain, gna-worklog, gna-atlas): `bin/sync` only pulls them.
  Work on a branch and open a PR, following that repo's own CLAUDE.md.
- Never use `git add -A` in `worksight`.

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
