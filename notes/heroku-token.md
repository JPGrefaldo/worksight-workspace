# Heroku token for O27 (2026-11-05)

JP will give a read-only Heroku API token so the HRIS chief of staff can read the pilet GraphQL URL
env values on Heroku development and production (O27, card 07 / PR14703).

- Where it goes: the cloud environment's settings (environment menu in the session title bar, Edit),
  under Network secrets / API credentials, or as an environment variable named `HEROKU_API_KEY`.
  A new session picks it up.
- Never paste it into chat, a file, a commit or a log. Never print it.
- What to read once it is there, read-only (`heroku config:get -a <app> <VAR>`):
  TIMESHEETS_GRAPHQL_URL, PAYRULES_GRAPHQL_URL, TEMPLATES_GRAPHQL_URL, TRAINING_TODAY_GRAPHQL_URL,
  KNOWLEDGE_BASE_GRAPHQL_URL, PERFORMANCE_MANAGEMENT_GRAPHQL_URL, HRIS_GRAPHQL_BASE, TLM_GRAPHQL_URL,
  WORKSIGHT_MONOLITH_ORIGIN. Report only whether each is on the app's own origin.
- Staging was already read in a browser on 2026-11-05: all same-origin.
