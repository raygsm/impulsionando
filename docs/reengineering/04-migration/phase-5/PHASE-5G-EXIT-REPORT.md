# Phase 5G — Operational readiness (staging-closed)

Status: **STAGING-CLOSED** — Phase 5 **CLOSED** 2026-09-03T03:40Z · verify **8/8 PASS** · named owners **Cauã**  
Opened: **2026-09-02**  
Authority: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5G · [`../PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md)

## Drill executed (staging — factual)

- **2026-09-03T02:50Z** — provider-outage drill **PASS** on clean host `2.25.123.224`: `reengineering-worker` scaled **0** → `api.stg` + `tenant.stg` `/health` still **200** → worker restored **1/1**. Evidence: [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) (same timestamp entry).
- **2026-09-03T03:40Z** — residual GRANTs applied + `phase5:staging:verify` **8/8 PASS** → Phase 5 **CLOSED**. Phase 6 **not** started.

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | Queue metrics + integration registry contracts | `packages/contracts/src/ops.ts` |
| 2 | Contracts export block (5G-marked) | `packages/contracts/src/index.ts` |
| 3 | Nest ops API `GET /api/v1/ops/queue-metrics` · `GET /api/v1/ops/integrations` | `apps/api/src/ops/` |
| 4 | Read-only metrics RPC migration (unapplied) | `supabase/migrations/20260902240000_phase5g_ops_metrics.sql` |
| 5 | Integration registry (owners assigned) | [`INTEGRATION-REGISTRY.md`](./INTEGRATION-REGISTRY.md) |
| 6 | Runbooks (replay / DLQ / provider outage drill) | [`RUNBOOKS.md`](./RUNBOOKS.md) |
| 7 | Contract tests | `tests/reengineering/ops-metrics.contract.test.ts` |
| 8 | Smoke skeleton (default DRY_RUN) | `scripts/smoke-reengineering-ops-metrics.mjs` |

## Security properties (repo)

- Ops routes require Bearer auth (`SupabaseAuthGuard`).
- Metrics use **service-role** RPC reads only — no queue enqueue/delete/move.
- Responses validated by Zod + `assertNoSecretFields` (rejects secret-like keys).
- Integration registry returns **env var names only** — never credential values.
- Provider latency fields are explicitly `null` (UNKNOWN) until telemetry exists.

## Operator close checklist (staging)

1. Confirm Phase 5B migration `20260902130000_phase5b_*` already applied on staging (`aamorcqznimmleafavai`).
2. Apply **additive** migration `20260902240000_phase5g_ops_metrics.sql` on staging only — **not** prod (usually via Dashboard paste of `scripts/staging/PHASE5-PENDING-DASHBOARD.sql`).
3. Deploy API image that includes `OpsModule` (do not break Jobs/Webhooks/Outbox/Journeys).
4. Run contracts: `npm run test:phase5g:contracts`.
5. Dry-run smoke: `node scripts/smoke-reengineering-ops-metrics.mjs` (`DRY_RUN=1` default).
6. Refresh `PHASE5G_OPS_BEARER` (~1h JWT) per [`RUNBOOKS.md`](./RUNBOOKS.md#refresh-phase5g-ops-bearer) — write into `~/.config/impulsionando/staging-operator-secrets.env` only; **never** print/echo the token.
7. Live staging smoke when DDL ready: `DRY_RUN=0` with that Bearer — prove 401 without auth, 200 with auth, no secrets in JSON.
8. Assign named owners in [`INTEGRATION-REGISTRY.md`](./INTEGRATION-REGISTRY.md) — **DONE 2026-09-03** (Owner/Backup/drill roles: Cauã).
9. Provider-outage drill — **DONE 2026-09-03T02:50Z** (PASS). Re-run only if worker topology changes.
10. Record evidence in `STATUS.md` / clean-host log — **DONE** on verify 8/8 (2026-09-03T03:40Z).

## Exit gate (staging — CLOSED 2026-09-03T03:40Z)

- Dashboard/contracts expose backlog, oldest job age, failure rate, DLQ backlog — **PASS** (ops-metrics live).
- Each live integration has a named owner + runbook link — **owners Cauã** (2026-09-03).
- Safe replay notes reviewed; no automated blast replay — runbooks present.
- Provider-outage drill: worker scaled to 0 → API/FE remain healthy — **PASS 2026-09-03T02:50Z**.
- Full `phase5:staging:verify` **8/8 PASS** after residual service_role GRANTs.

## Explicitly out of scope here

- Applying migration to prod.
- Phase 6 governed AI (not started).
- Prod cutover.
