# worksight-workspace

Personal hub for WorkSight work: personal notes plus a manifest of the repos worked on side by side.
The repos themselves stay separate clones, so notes never show up in a `worksight` PR.

## Laptop setup (once)

Clone this repo **next to your existing clones**:

```bash
cd ~/code            # the folder that already holds worksight/, gna-brain/, …
git clone https://github.com/JPGrefaldo/worksight-workspace.git
cd worksight-workspace
bin/sync             # finds the existing clones, clones anything missing, pulls everything
```

If your clones live elsewhere, have different folder names, or you clone over SSH, copy
`workspace.local.example.json` to `workspace.local.json` and edit it. That file is gitignored and
belongs to one machine.

Needs `git` and Node (any version the monolith already needs).

## Cloud sessions

Start the session with **only** `JPGrefaldo/worksight-workspace` selected. The session-start hook
lists the repos that are missing, and CLAUDE.md has the agent attach and clone each one.

## Day to day

- `bin/sync`: pull everything, commit and push the personal repos (this one, planning-docs).
- `bin/sync status`: see branch, dirty, and ahead/behind for every repo.
- To add a repo, add it to `repos.json` and push.

Rules for where files go and how each repo is pushed are in [CLAUDE.md](CLAUDE.md).
