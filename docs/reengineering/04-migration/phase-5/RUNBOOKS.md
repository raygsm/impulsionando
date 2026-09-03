# Phase 5 — Runbooks (ops)

Authority: Phase 5G · [`PHASE-5G-EXIT-REPORT.md`](./PHASE-5G-EXIT-REPORT.md) · [`INTEGRATION-REGISTRY.md`](./INTEGRATION-REGISTRY.md)

**Hard rules:** no secrets in this file · no prod apply from drill notes · no real-recipient blast · prefer staging (`api.stg.impulsionando.com.br`).

---

## Safe replay

Use when a job/webhook/outbox item must be reprocessed after a known-safe failure.

### Preconditions

- Staging only unless a separate prod gate exists.
- Original failure root cause understood (provider 5xx, worker crash, bad deploy).
- Idempotency key / scope known — replay must be **single-effect**.
- Recipient allowlist / sink mode still enforced for communications.

### Allowed replay shapes

| Surface | Safe approach | Forbidden |
| --- | --- | --- |
| Jobs (5B) | Re-enqueue with the **same** `idempotency-key` for completed scopes (expect skip) **or** a **new** key only when intentional new effect | Blind bulk re-enqueue of DLQ without inspection |
| Webhooks (5D) | Provider redelivery within skew + **new** idempotency key after audit review | Replaying raw body with secrets into logs |
| Outbox (5C) | Worker poller retry of `pending`/`failed` rows with bounded backoff | Manual SQL status flip to `published` without consumer proof |

### Operator steps (staging)

1. Read metrics: `GET /api/v1/ops/queue-metrics` (auth required).
2. Identify DLQ / failed idempotency counts — do not dump payloads to chat.
3. For a **single** known `msg_id` / outbox row / ingress id, document correlation id.
4. Replay one item; confirm effect ledger / delivery row does not duplicate.
5. Record evidence (timestamp, correlation id, queue depths before/after) — no secrets.

### Safe recovery notes

- Prefer **scale worker back up** over manual SQL when backlog is healthy workers-down.
- Never copy `SUPABASE_SERVICE_ROLE_KEY` / webhook secrets into tickets or git.
- If payload may contain PII, keep redaction (`payload_sha256` / redacted JSON) as source of truth.

---

## Queue / DLQ {#queue-dlq}

### Observe

- Contract/API: backlog + `oldestJobAgeSeconds` + `dlqBacklog` via ops metrics.
- Idempotency: `processing` / `completed` / `failed` counts.
- Failure rate = `failed / (completed + failed)` (null when denominator 0).

### DLQ triage

1. Confirm worker health (`WORKER_CONSUMER_ENABLED`, process up, no crash loop).
2. Sample **one** DLQ message schema (job type, tenant id, correlation id) — not full PII.
3. If poison payload (schema invalid): leave in DLQ; fix publisher; do not infinite-retry.
4. If transient provider/outage: after provider healthy, safe-replay **one** then batch carefully.
5. After recovery, confirm `dlqBacklog` decreases and API remains 200.

### Move / delete

- Use existing service-role RPCs from 5B (`move_reengineering_job_to_dlq`, `delete_reengineering_job`) only from controlled worker/ops tooling — not ad-hoc prod SQL.
- No `db push` / reset.

---

## Provider outage drill {#provider-outage-drill}

**Goal:** prove public API + frontend stay healthy when async workers / providers are unavailable.

### Last execution

| Field | Value |
| --- | --- |
| When | **2026-09-03T02:50Z** |
| Host | clean `2.25.123.224` (`reengineering-worker`) |
| Result | **PASS** — worker **0** → `api.stg` + `tenant.stg` health **200** → worker **1/1** |
| Log | [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) |
| Phase 5 | **CLOSED** 2026-09-03T03:40Z (verify 8/8; owners Cauã) · Phase 6 not started |

### Checklist (staging)

| # | Step | Expected | 2026-09-03 |
| --- | --- | --- | --- |
| 1 | Baseline: `GET https://api.stg.impulsionando.com.br/health` → **200** | Pass / Fail | Pass |
| 2 | Baseline: tenant FE health → **200** | Pass / Fail | Pass |
| 3 | Note queue metrics snapshot (auth) | Record backlog | Optional / skipped |
| 4 | Scale **worker** service replicas to **0** (Dokploy/Swarm on clean host only) | Worker gone | Done |
| 5 | Re-check API `/health` → still **200** | Pass / Fail | Pass |
| 6 | Re-check FE → still **200** | Pass / Fail | Pass |
| 7 | Optional: enqueue one job — expect backlog to rise, no API 5xx | Pass / Fail | Optional / skipped |
| 8 | Scale worker replicas back to **≥1** | Consumer resumes | **1/1** |
| 9 | Confirm backlog drains / consumer heartbeat | Pass / Fail | Worker up |
| 10 | Record drill timestamp in clean-host `IMPLEMENTATION-LOG.md` | Done | Done |

### Pass criteria

- API and frontend remain **200** while worker is at 0.
- No prod DNS / legacy VPS changes.
- No secrets pasted into the log.

### Named owners (assigned 2026-09-03)

| Role | Name |
| --- | --- |
| Drill lead | Cauã |
| API watcher | Cauã |
| Worker scaler | Cauã |
| Incident scribe | Cauã |

See [`INTEGRATION-REGISTRY.md`](./INTEGRATION-REGISTRY.md) for full owner/backup tables.

---

## Refresh `PHASE5G_OPS_BEARER` {#refresh-phase5g-ops-bearer}

Ops smokes need a short-lived staging Supabase **access_token** (~1h). Store it only in the local operator secrets file — **never** print, commit, or paste into chat/docs.

### Steps (operator laptop)

1. Ensure staging smoke user exists: `npm run staging:ensure-smoke-user` (uses `.env.staging` `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — script must not echo password/token).
2. Sign in against **staging** Auth only (`aamorcqznimmleafavai`) with that test user (`signInWithPassword`) and take `session.access_token`.
3. Write **only** into `~/.config/impulsionando/staging-operator-secrets.env` (mode `600`, **not** git), e.g. a line `PHASE5G_OPS_BEARER=…` — do not `echo`/`cat` the value into the terminal transcript if avoidable; prefer editor or redirect that stays local.
4. Before live smoke: `set -a && source ~/.config/impulsionando/staging-operator-secrets.env && set +a` then `DRY_RUN=0 node scripts/smoke-reengineering-ops-metrics.mjs` (or `npm run phase5:staging:verify`).
5. On **401** or token age > ~1h, repeat steps 2–4. Do not reuse prod tokens.

### Forbidden

- Logging the JWT in smoke JSON, IMPLEMENTATION-LOG, STATUS, tickets, or Cursor chat.
- Putting `PHASE5G_OPS_BEARER` in repo `.env*` committed files.

---

## Related

- Registry: [`INTEGRATION-REGISTRY.md`](./INTEGRATION-REGISTRY.md)
- Exit report: [`PHASE-5G-EXIT-REPORT.md`](./PHASE-5G-EXIT-REPORT.md)
- Program status: [`../../STATUS.md`](../../STATUS.md)
