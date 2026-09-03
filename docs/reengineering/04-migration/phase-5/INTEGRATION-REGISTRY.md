# Phase 5 — Integration registry

Authority: Phase 5G · [`RUNBOOKS.md`](./RUNBOOKS.md) · [`PHASE-5G-EXIT-REPORT.md`](./PHASE-5G-EXIT-REPORT.md)

**Hard rules:** document **env var names only** · never paste credential values · staging-first · **do not invent fake people**.

Machine-readable seed: `packages/contracts/src/ops.ts` → `INTEGRATION_REGISTRY_SEED`  
API: `GET /api/v1/ops/integrations` (auth required) — live API image may still return `TBD` until redeploy picks up seed owners.

Assigned **2026-09-03**: all integration ownership, backups, and drill roles → **Cauã** (`cauaeyer`).

## Registry

| ID | Name | Owner | Environment | Credential env names | Status | Runbook |
| --- | --- | --- | --- | --- | --- | --- |
| `pgmq-reengineering-jobs` | Supabase Queues (`reengineering_jobs`) | Cauã | staging | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | staging | [Queue / DLQ](./RUNBOOKS.md#queue-dlq) |
| `webhook-reengineering-smoke` | Webhook ingress (`reengineering.smoke`) | Cauã | staging | `WEBHOOK_SECRET_REENGINEERING_SMOKE` | staging | [Safe replay](./RUNBOOKS.md#safe-replay) |
| `communication-sink` | Communication adapters (email/whatsapp sink) | Cauã | staging | `COMMUNICATION_SINK`, `COMMUNICATION_RECIPIENT_ALLOWLIST`, `WORKER_COMMUNICATION_ENABLED` | staging | [Provider outage drill](./RUNBOOKS.md#provider-outage-drill) |
| `event-outbox` | Transactional event outbox | Cauã | staging | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKER_OUTBOX_ENABLED` | staging | [Safe replay](./RUNBOOKS.md#safe-replay) |

## Operator assignment

### Integration owners (registry rows)

| Integration ID | What “Owner” means | Named owner | Backup | Date assigned |
| --- | --- | --- | --- | --- |
| `pgmq-reengineering-jobs` | Owns queue depth, poison/DLQ triage, worker consumer health for `reengineering_jobs` | Cauã | Cauã | 2026-09-03 |
| `webhook-reengineering-smoke` | Owns ingress secret rotation, signature failures, safe webhook replay for smoke provider | Cauã | Cauã | 2026-09-03 |
| `communication-sink` | Owns sink/allowlist flags, delivery failures, provider-outage posture for email/whatsapp adapters | Cauã | Cauã | 2026-09-03 |
| `event-outbox` | Owns outbox poller enablement, stuck `pending`/`failed` rows, safe outbox replay | Cauã | Cauã | 2026-09-03 |

### Drill roles ([`RUNBOOKS.md`](./RUNBOOKS.md#provider-outage-drill))

Checklist itself was **executed 2026-09-03** (PASS) — see exit report / clean-host log. Roles assigned 2026-09-03.

| Role | What it means | Name |
| --- | --- | --- |
| Drill lead | Calls start/stop, owns pass/fail call | Cauã |
| API watcher | Confirms `api.stg` `/health` stays **200** while worker is down | Cauã |
| Worker scaler | Scales `reengineering-worker` 0 → ≥1 on clean host only | Cauã |
| Incident scribe | Writes timestamped evidence (no secrets) to clean-host log / STATUS | Cauã |

## Status legend

| Status | Meaning |
| --- | --- |
| `planned` | Contracted, not deployed |
| `staging` | Staging evidence in progress |
| `live` | Production live (later gate) |
| `deprecated` | Do not extend |
| `outage` | Known provider/worker outage |

## Explicitly excluded from this registry (for now)

- Real Mercado Pago / Meta / Evolution production webhooks
- Legacy VPS cron / contained workflows
- Governed AI tools (Phase 6)
