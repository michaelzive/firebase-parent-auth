# Firebase Setup Checklist

## Projects
- Create projects: dev (rivoniaprimary-parent-auth-dev), stage (rivoniaprimary-parent-auth-stg), prod (rivoniaprimary-parent-auth-prod) with matching display names.
- Set hosting targets per env (domains TBD) in firebase.json/.firebaserc.

## Enable Services
- Firebase Auth: email/password, email verification, password reset.
- Firestore: in production mode; set Rules for roles/approval.
- Cloud Functions v2 (TypeScript); Pub/Sub; BigQuery; App Check (Turnstile); Hosting.

## App Check (Turnstile)
- Create Turnstile site key + secret per env.
- Frontend: initialize App Check with Turnstile key before Firebase app init.
- Backend: verify App Check tokens in Functions; enforce in Firestore Rules where applicable.

## Data Model (Firestore)
- users/{uid}: role, approved, parentId, timestamps.
- registrationRequests/{id}: status PENDING|APPROVED|REJECTED, email, uid, ipHash, userAgentHash, createdAt, decidedAt?, approverUid?, rejectionReason?.
- parentAccounts/{parentId}: primaryEmail, linkedEmails[], createdAt.
- auditEvents/{eventId}: type, timestamp, uid?, email?, ipHash, userAgentHash, metadata.

## Cloud Functions (v2)
- onAuthUserCreated: seed user + audit.
- approveRegistration(requestId) / rejectRegistration(requestId): set claims, update Firestore, audit.
- linkEmail(parentId, email): request/approve linking with verification.
- logAuditEvent(event): shared logger.
- Audit export: Firestore→Pub/Sub trigger + 1-minute batch writer to BigQuery (DLQ + alerts).

## Security Rules
- Enforce roles/custom claims and approval status for data access.
- Require App Check where applicable; use server timestamps; no client trust for privileged actions.

## CI/CD Inputs (GitHub Actions)
- firebase login:ci tokens per env.
- Secrets: Firebase web config per env, Turnstile site/secret keys, any webhook targets.
- Jobs: lint/test/build; deploy hosting/functions/rules per env; branch protections for prod.

## Bootstrap SUPER_ADMIN
- Create initial staff user in Auth (out of band), set custom claims (SUPER_ADMIN, approved true), seed minimal users/{uid} record.
- Document rotation and recovery steps.

## Budget & Alerts
- Set ~$10/month budget per env with alerts.
- Add alerting for DLQ messages and export gaps (no exports in 30 minutes).

## Open Items
- Hosting domains per env (TBD).
- Alert channels (email/Slack/webhook) for budgets, DLQ, and export gaps.
