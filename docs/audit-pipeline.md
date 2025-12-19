# Audit Pipeline

## Flow (1-minute batch, low cost)
1) Firestore trigger on auditEvents writes payload to Pub/Sub with dedupe ID.
2) Scheduled Cloud Function runs every minute, batches Pub/Sub messages, writes to BigQuery via Storage Write API or streaming inserts.
3) On success, ack messages; on failure, retry with backoff and dedupe; after max attempts, send to DLQ.

## BigQuery Table
- Partition: timestamp (daily).
- Cluster: type, email.
- Retention: raw table expires at 60 days; create long-lived aggregate view (weekly/monthly summaries).
- Payload: minimal fields (type, timestamp, uid?, email?, ipHash, userAgentHash, metadata) to limit cost/PII.

## Dead-Letter Queue (DLQ)
- Max delivery attempts: 5.
- DLQ retention: 14 days.
- Dedupe: use eventId/messageId to avoid duplicates on retries.

## Alerting
- Trigger if any DLQ messages appear.
- Trigger if no successful exports in 30 minutes.
- Optional: trigger if failure rate > 5% in a 30-minute window.
- Channels: TBD (email/Slack/webhook).

## Error Handling & Recovery
- Retries with exponential backoff.
- DLQ inspection runbook: reprocess DLQ messages after fix; keep idempotent writes.
- Log structured errors with correlation IDs.

## Cost Controls
- 1-minute batching to reduce per-insert overhead.
- On-demand BigQuery; small payloads; partitioning + clustering for efficient queries.
- Budget alerts (~$10/month per env) and table expiration to cap storage.
