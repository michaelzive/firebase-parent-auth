# Environment & Deployment Plan

## Firebase Projects / Targets
- Dev: rivoniaprimary-parent-auth-dev (display: Rivonia Primary Parent Auth (Dev))
- Stage: rivoniaprimary-parent-auth-stg (display: Rivonia Primary Parent Auth (Stage))
- Prod: rivoniaprimary-parent-auth-prod (display: Rivonia Primary Parent Auth (Prod))
- Hosting targets: per-env targets in firebase.json (domains TBD).

## Configuration & Secrets (per env)
- Firebase web config (apiKey, authDomain, projectId, etc.)
- Turnstile site key (client) and secret (server-side verification)
- Optional: analytics/monitoring webhook URLs
- Storage: GitHub Actions secrets; inject into build/runtime (no hardcoded config).

## App Check
- Provider: Turnstile per env.
- Client: initialize App Check with Turnstile key before AngularFire init.
- Server: verify App Check in Functions and enforce in Firestore Rules where applicable.

## CI/CD (GitHub Actions)
- Jobs: lint, test, build; deploy Hosting/Functions/Rules per env.
- Auth: firebase login:ci token stored in GH secrets; use firebase use <env> per workflow.
- Branch protections: require lint/test before deploy; restrict prod deploy to main + manual approval.
- Env injection: export Firebase config + Turnstile keys into build/deploy steps.

## Budgets & Alerts
- Budget per env: ~$10/month; set GCP budgets and alerts.
- Alerts: failed deploys, CI failures, Functions error rate spikes.

## Deployment Steps (high level)
1) Select env target (dev/stage/prod) in firebase.json/.firebaserc.
2) Inject env vars (Firebase config, Turnstile keys) for the chosen env.
3) Run lint/test/build.
4) Deploy: firebase deploy --only hosting,functions,firestore:rules,storage:rules as needed.

## Open Items / TODO
- Fill hosting domains per env once available.
- Choose alert channels (email/Slack/webhook) for CI/Functions/App Check/App errors.
