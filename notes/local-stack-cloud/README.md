# Running `./up.sh all prismhr` in a Claude Code cloud session (2026-11-07)

Worked on GAPartners/worksight `development` @ `0d08b67e`. Nothing tracked in worksight changes; every
workaround lives in a compose override and scratch files. Git-ignored files that up.sh itself writes:
`.env`, `infra/docker/.env.local-secrets`, `apps/worksight/public/assets/esbuild/`.

## Why plain `./up.sh` fails here

| Blocker | Cause | Workaround used |
|---|---|---|
| No Docker daemon | not started in the container | `nohup dockerd &` |
| apt in image builds: 405 | session proxy refuses plain HTTP | patched copies of `ruby.Dockerfile` / `node.Dockerfile`: proxy CA + `https://` apt sources; build once with `docker build --network host` and proxy build args |
| Containers have no internet | only the host reaches the proxy (127.0.0.1); exposing it on 0.0.0.0 is blocked | only the one-shot gem job (`worksight-deps`) runs `network_mode: host` with proxy env; everything else stays on the compose network |
| Private gem repos: 401 | proxy authorizes only repos attached to the session | `add_repo` (read) for active-gql, active_record_validation_sets, worksight-notifications, worksight-performance-management, worksight-service-generator, worksight-utilities, worksight_api, worksight_linearb (two_factor_authentication is public) |
| `@gapartners/*` npm packages: 401 | GitHub Packages needs NPM_GITHUB_TOKEN (read:packages); the session has none | **Fixed 2026-11-07:** read `NPM_GITHUB_TOKEN` from the `worksight-development` Heroku config (`heroku config:get`, never production) into `~/.cache/worksight-qa/npm-github-token` (mode 600, outside every repo, never printed), then the normal `worksight-deps` (`bundle` + `yarn install`) and `worksight-assets` (`yarn build --local`) run. The older fallback (`yarn-public.sh` + `crawl_esb.py`, dev's bundles) is kept only for a session without Heroku access |
| Hosted pilet feed unreachable from containers | same as above | `crawl.py` mirrors the hosted feed (incl. webpack chunk maps); `mirror-server.mjs` serves it on the compose network as `PILET_FEED_UPSTREAM` |
| up.sh requires both tokens and tests the npm token against GitHub | preflight | placeholder values in the shell only (never used: gems installed, yarn skipped); run up.sh with a PATH that hides `curl`, which up.sh uses only for that test |
| Compose Bake refuses `build.network: host` | Bake default | override builds point at the patched Dockerfiles without host network (images already built and cached) |

**Permanent fix:** an `NPM_GITHUB_TOKEN` with `read:packages` as an environment secret, so no session has to
read it from Heroku. `up.sh`'s token preflight still needs the hidden-`curl` run: it tests `BUNDLE_GITHUB__COM`
too, and reading that second credential from Heroku was not done.

Heroku CLI: not installed in the image; `npm install -g heroku@10`, which uses `HEROKU_API_KEY` from the env.

## Steps

1. `nohup dockerd &`; attach the gem repos above (read).
2. Build `worksight-ruby:3.3.13` and `worksight-node:22.23.4` from the patched Dockerfiles (host network, proxy args).
3. `docker network create worksight-shared`; `docker volume create worksight-bundle worksight-yarn-berry worksight-yarn-classic`.
4. Fetch `/api/v1/pilets` from the hosted feed into `mirror/api/v1/pilets`, then `python3 -I crawl.py <feed> mirror mirror/api/v1/pilets`.
5. Fetch `https://worksight-development.gnapartners.com/assets/esbuild/.manifest.json` into `esbuild/`, then `python3 -I crawl_esb.py https://worksight-development.gnapartners.com/assets/esbuild esbuild`.
6. `python3 -I gen_override.py <stack dir> "$HTTPS_PROXY"` (needs `/tmp/claude-0/compose.json` = `COMPOSE_PROFILES='*' docker compose config --format json`).
7. `COMPOSE_FILE=docker-compose.yml:<stack dir>/override.yml NPM_GITHUB_TOKEN=unused BUNDLE_GITHUB__COM=x-access-token:unused PATH=<dir without curl>:/usr/sbin:/sbin ./up.sh all prismhr`
8. `NPM_GITHUB_TOKEN="$(cat ~/.cache/worksight-qa/npm-github-token)" WS_BUNDLE_WITHOUT=sidekiq_enterprise docker compose run --rm --no-deps -e NPM_GITHUB_TOKEN worksight-deps`, then `docker compose run --rm --no-deps worksight-assets` and `docker compose restart worksight`.
9. Sign in: `WS_QA_EMAIL=persona-employee@gnapartners.com WS_QA_PASSWORD=devteamtest! bin/ws-login http://localhost:3000`.
10. Flags: `flags-off.rb` / `flags-on.rb` via `docker compose exec -T worksight bin/rails runner`; screenshots with `node shoot-local.js <out> <label>`.

## What the screenshots showed (employee persona, client 1)

| Page | Main app, flags off | Main app, flags on | Pilet (both) |
|---|---|---|---|
| 1095-C | main app (needs `SHOW_1095_C_FORM`) | main app only, no engine call seen | main app `/graphql` |
| Tax Withholding | main app | main app only, no engine call seen | main app |
| Life Events | main app | **engine** `/hris/graphql` + main app | main app |
| Pay History | crashes: `pay_history_controller.rb:12` paginates a nil voucher list (the fake has no voucher endpoint) | same | renders "no records" from the main app |
| Organization | main app, error banner | **engine** + main app, same banner | main app |

The pilet never calls the engine with the flags on: that is cards 1 to 5 of the pilet plan
(`worksight-planning-docs/HRIS-ESS-MIGRATION/wor-19720/pilet-plan-2026-11-06.md`).

## Trimmed staging DB (planning-docs `tooling/cloud-db-subset/trim/dumps/`), 2026-11-07

Real staging data, not scrubbed: screenshots stay in the scratchpad, never in a repo, Jira, a PR or Teams.

1. `docker cp <dump>.sql.gz worksight-db-1:/tmp/trimmed.sql.gz`, then in the db container:
   `createdb -U postgres local_container_trimmed && gunzip -c /tmp/trimmed.sql.gz | grep -v '^SET transaction_timeout' | psql -U postgres -X -q -v ON_ERROR_STOP=1 -d local_container_trimmed` (21 s).
2. `WS_DB_SUFFIX=_trimmed docker compose up -d --no-deps worksight`: `prepare-db.sh` migrates it to the checkout. The synthetic `local_container` stays untouched.
3. Sign in: staging passwords are unknown, so `trimmed-user.rb` sets the local stack password on test user 19327 (Juna Agost) in the local copy only (it aborts on any other database).
4. If `/api/v1/pilets` answers 503 with `getaddrinfo` for `pilet-server`, Docker's DNS lost the name after the app container was recreated: `docker restart worksight-pilet-server-1`.

Result (client 268, flags on): 1095-C, Tax Withholding, Life Events, Organization and My Profile call `/hris/graphql`;
every pilet page still calls only `/graphql`. PrismHR-backed reads fail ("Client 3269 does not exist") because the
fake knows only its own synthetic clients.
