# Firebase Parent Auth – Context

## Purpose
Build a production-ready authentication and registration gateway for a school Parent Portal. Frontend is Angular 21 with Tailwind and Zod; backend is Firebase (Auth, Firestore, Functions v2, Hosting, App Check). This app handles auth/registration/approval, audit logging, and admin monitoring; the Parent Portal itself is separate.

## Target Tech Stack
- Angular 21 (standalone components, signals, functional guards, OnPush everywhere), Angular Router.
- Tailwind CSS (single design system), Zod for form validation.
- AngularFire (latest) with Firebase Web SDK; strict TypeScript.
- Firebase: Auth (email/password, email verification, password reset, persistence), Firestore, Functions v2, App Check (Turnstile), Hosting, Pub/Sub, BigQuery (audit exports).

## Core Features & Flows
- Auth: email/password login, remember-me persistence, password reset via email, email verification, generic errors (no user enumeration), App Check enforced.
- Registration + Approval: create auth user + registrationRequests record; user blocked until approved by staff; approvals/rejections only via Functions; custom claims set on approval.
- Roles (custom claims; guards are UX-only, enforcement via Functions + Firestore Security Rules):
	- Parent: guardian account linked to children; receives child_in_grade_* claims based on enrolled grades.
	- Teacher: staff member with classroom/grade access.
	- Approver: can vet/approve registrations and edit parent/child data during approval.
	- child_in_grade_0 ... child_in_grade_7: applied to parents to indicate they have a child in that grade; used for grade-targeted authorization/notifications.
- Audit logging: auditEvents collection with REGISTERED, EMAIL_VERIFIED, LOGIN_SUCCESS/FAILED, PASSWORD_RESET_REQUESTED, APPROVAL_APPROVED/REJECTED, EMAIL_LINK_REQUESTED. Exported to BigQuery in 1-minute batches; 60-day raw retention; aggregate views for long-lived summaries.
- Admin: approvals dashboard, users, audit log viewer with filters/pagination, reports, monitoring of DLQ/alerts.

## Routing (planned)
- Public: /login, /register, /forgot-password, /verify-email, /pending-approval
- Protected: /app (parent dashboard shell), /app/link-email
- Admin: /admin, /admin/approvals, /admin/users, /admin/audit, /admin/reports

## Data Model (Firestore)
- users/{uid}: auth-linked profile, roles, approved flag, parentId, timestamps
- registrationRequests/{id}: {email, uid, parentId, childSummary[{firstName, grade}], status PENDING|APPROVED|REJECTED, createdAt, ipHash, userAgentHash, rejectionReason?, approverUid?, decidedAt}
- parentAccounts/{parentId}: source of truth for family; {primaryEmail, linkedEmails[], children[{firstName, surname, grade, saId}], createdAt, updatedAt}. Approver edits overwrite children data here.
- auditEvents/{eventId}: {type, timestamp, uid?, email?, ipHash, userAgentHash, metadata}

## Cloud Functions (v2, TS)
- onAuthUserCreated: seed minimal user + audit.
- approveRegistration(requestId), rejectRegistration(requestId): set claims (parent + child_in_grade_*), update Firestore (including parentAccounts children when edited by approver), audit.
- linkEmail(parentId, email): request/approve linking, audit.
- logAuditEvent(event): reusable logger.
- Audit export: Firestore trigger → Pub/Sub → scheduled 1-minute batch write to BigQuery (partitioned/clustered, dedupe, retries, DLQ).

## Security & Compliance
- App Check enforced (reCAPTCHA) on client; verification in Functions/Rules.
- Firestore Security Rules to enforce roles/claims and approval state; no sensitive data in localStorage; generic auth errors.
- Rate limiting on registration/login via Functions; idempotent ops; server timestamps only.

## Environments
- Firebase projects: dev `rivoniaprimary-parent-auth-dev`, stage `rivoniaprimary-parent-auth-stg`, prod `rivoniaprimary-parent-auth-prod` (display names set accordingly).
- Hosting targets per env (domains TBD). Firebase config and Turnstile keys injected via env/CI, not committed.

## Audit Export Ops
- Cadence: 1-minute batches from Pub/Sub to BigQuery using Storage Write API/streaming inserts.
- Retention: 60-day raw table; long-lived aggregate view.
- DLQ: max 5 deliveries, 14-day retention. Alerts: any DLQ messages; no successful exports in 30 minutes; optional >5% failure rate.

## CI/CD
- GitHub Actions: lint/test/build; deploy Hosting/Functions/Rules per env with firebase tokens; branch protections; budgets/alerts (~$10/mo per env).

## Open Items
- Hosting domains per env (TBD).
- Alerting channels (email/Slack/webhook) for DLQ/export failures and budgets.
