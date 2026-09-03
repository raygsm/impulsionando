# Uncommitted batch inventory — `reengineering/program`

**Captured:** 2026-09-03 (local working tree vs `origin/reengineering/program`)  
**HEAD:** `67e109511962f86dbbdea2356bc8486b87a4abc1`  
**Scope:** uncommitted reengineering work only. **No commit performed** (inventory only).  
**Excluded from this inventory:** `.cursor/**`, `test-results/**`, any `.env*` / secrets.

Cross-cutting files that touch multiple groups are listed once under the primary group and noted again in **Shared / program docs**. Prefer the suggested commit order below to minimize half-wired modules.

---

## Concurrent agents / terminals (may still be running)

| Activity | Evidence | State at capture |
| --- | --- | --- |
| **Worker redeploy** (image `…-outbox1`, `SKIP_PULL=1`, keep `WORKER_OUTBOX_ENABLED=false`) | Terminal `198154` — `docker save \| gzip \| ssh … docker load` then deploy worker | Terminal metadata **`status: running`** (~4+ min on save/load). Local shell pid from header may already be gone; treat as **possibly still running or hung mid-transfer**. Do not assume swarm image is updated until the script finishes. |
| **4B closeout agents** | No matching long-lived deploy/closeout terminal besides completed tenant-web / API+worker loads (`806405`, `806407`) | **Not clearly running** in current terminals. DNS probe (`126019`) failed earlier; companies-column probe (`405100`) succeeded. |

Re-check before committing or redeploying: terminals folder + `docker service ps reengineering-worker` on clean host `2.25.123.224`.

---

## Suggested commit order

1. **SQL bundle** (migrations + staging apply helpers; no runtime wire-up required)
2. **4B fixes** (entitlements resilience + seed/docs/runbook; unblocks staging-partial close narrative)
3. **5C–5G feature modules** (contracts → API → worker handlers → smokes/tests → exit reports; keep as one commit or split C→G if preferred)
4. **Worker degrade** (`schema-missing` + outbox degrade contract; safe-with-DDL-missing behavior)
5. **Access gate** (Traefik basic-auth docs + apply script + hostnames note)
6. **Deploy scripts / GHCR / Dockerfile** (clean-host deploy hardening + workflow bumps)
7. **Shared program docs** (`STATUS.md`, phase READMEs, clean-host log) — last so evidence matches the code batches

`package.json` script additions should travel with the batch that introduces the script target (or ride with 5C–5G if keeping one mega-commit).

---

## 1. 4B fixes

Staging-partial close helpers: resilient `companies` select (missing cosmetic columns), Garrido config seed hardening, operator runbook, exit/board docs, frontend README boundary notes.

| Path | Notes |
| --- | --- |
| `apps/api/src/tenants/tenant-entitlements.service.ts` | Base vs optional company columns; no hard-fail on staging schema gaps |
| `scripts/staging/phase4b-seed-garrido-config.mjs` | Seed resilience |
| `docs/reengineering/04-migration/phase-4/PHASE-4B-OPERATOR-RUNBOOK.md` | **New** — operator close checklist |
| `docs/reengineering/04-migration/phase-4/PHASE-4B-EXIT-REPORT.md` | Status / evidence updates |
| `docs/reengineering/04-migration/phase-4/PHASE-4B-FRONTEND-BOUNDARIES.md` | Minor |
| `docs/reengineering/04-migration/phase-4/README.md` | Board row tweaks |
| `apps/app-web/README.md` | Boundary / deploy notes |
| `apps/platform-web/README.md` | Boundary / deploy notes |

---

## 2. 5C–5G (outbox, webhooks, communication, journey, ops)

Repo modules + contracts + smokes + contract tests + exit reports. API already imports outbox from Support (5C coupling).

### Contracts

| Path |
| --- |
| `packages/contracts/src/event.ts` |
| `packages/contracts/src/webhook.ts` |
| `packages/contracts/src/communication.ts` |
| `packages/contracts/src/journey.ts` |
| `packages/contracts/src/ops.ts` |
| `packages/contracts/src/job.ts` *(modified — invalid-envelope DLQ disposition; also feeds 5B poison path)* |
| `packages/contracts/src/index.ts` *(re-exports)* |

### API

| Path |
| --- |
| `apps/api/src/outbox/outbox.module.ts` |
| `apps/api/src/outbox/outbox.service.ts` |
| `apps/api/src/webhooks/webhooks.controller.ts` |
| `apps/api/src/webhooks/webhooks.module.ts` |
| `apps/api/src/webhooks/webhooks.service.ts` |
| `apps/api/src/journeys/journeys.controller.ts` |
| `apps/api/src/journeys/journeys.module.ts` |
| `apps/api/src/journeys/journeys.service.ts` |
| `apps/api/src/ops/ops.controller.ts` |
| `apps/api/src/ops/ops.module.ts` |
| `apps/api/src/ops/ops.service.ts` |
| `apps/api/src/app.module.ts` |
| `apps/api/src/support/support.module.ts` |
| `apps/api/src/support/support.service.ts` *(outbox publish on ticket create)* |

### Worker (feature handlers — see also §5 degrade)

| Path |
| --- |
| `apps/worker/src/outbox-poller.ts` |
| `apps/worker/src/communication/dispatch.ts` |
| `apps/worker/src/communication/sink-adapters.ts` |
| `apps/worker/src/journeys/handler.ts` |
| `apps/worker/src/job-consumer.ts` *(communication job type routing)* |
| `apps/worker/src/main.ts` *(feature flags + poller/journey wiring)* |

### Scripts / tests / docs

| Path |
| --- |
| `scripts/lib/phase5-effect-proof.mjs` |
| `scripts/phase5c-contract-all.mjs` |
| `scripts/smoke-reengineering-event-outbox.mjs` |
| `scripts/smoke-reengineering-webhook-ingress.mjs` |
| `scripts/smoke-reengineering-crm-journey.mjs` |
| `scripts/smoke-reengineering-ops-metrics.mjs` |
| `scripts/smoke-reengineering-job-poison-dlq.mjs` |
| `scripts/smoke-reengineering-job-duplicate.mjs` *(modified)* |
| `scripts/smoke-reengineering-job-enqueue-consume.mjs` *(modified)* |
| `tests/reengineering/event-outbox.contract.test.ts` |
| `tests/reengineering/webhook.contract.test.ts` |
| `tests/reengineering/communication.contract.test.ts` |
| `tests/reengineering/crm-journey.contract.test.ts` |
| `tests/reengineering/ops-metrics.contract.test.ts` |
| `tests/reengineering/job-queue.contract.test.ts` *(modified)* |
| `docs/reengineering/04-migration/phase-5/PHASE-5C-EXIT-REPORT.md` |
| `docs/reengineering/04-migration/phase-5/PHASE-5D-EXIT-REPORT.md` |
| `docs/reengineering/04-migration/phase-5/PHASE-5E-EXIT-REPORT.md` |
| `docs/reengineering/04-migration/phase-5/PHASE-5F-EXIT-REPORT.md` |
| `docs/reengineering/04-migration/phase-5/PHASE-5G-EXIT-REPORT.md` |
| `docs/reengineering/04-migration/phase-5/PHASE-5B-EXIT-REPORT.md` *(modified — staging-live notes)* |
| `docs/reengineering/04-migration/phase-5/INTEGRATION-REGISTRY.md` |
| `docs/reengineering/04-migration/phase-5/RUNBOOKS.md` |
| `docs/reengineering/04-migration/phase-5/README.md` *(modified)* |
| `package.json` *(phase5 smoke/contract script entries — prefer with this batch)* |

---

## 3. Access gate

Public staging hosts: Traefik basic-auth gate (DNS stays grey-cloud). **No passwords/hashes in repo.**

| Path |
| --- |
| `docs/reengineering/04-migration/phase-2/STAGING-ACCESS-GATE.md` |
| `scripts/apply-staging-access-gate-clean-host.sh` |
| `docs/reengineering/04-migration/phase-2/STAGING-HOSTNAMES.md` *(related hostname / gate notes)* |

---

## 4. SQL bundle

Staging Dashboard apply path for residual 5B GRANT + 5C–5G DDL. Staging project ref only in docs (`aamorcqznimmleafavai`); **no connection strings**.

| Path |
| --- |
| `supabase/migrations/20260902131000_phase5b_job_ledger_service_role_select.sql` |
| `supabase/migrations/20260902200000_phase5c_event_outbox.sql` |
| `supabase/migrations/20260902210000_phase5d_webhook_ingress.sql` |
| `supabase/migrations/20260902220000_phase5e_communication_delivery.sql` |
| `supabase/migrations/20260902230000_phase5f_crm_invite_journey.sql` |
| `supabase/migrations/20260902240000_phase5g_ops_metrics.sql` |
| `scripts/staging/phase5b-job-ledger-grants.sql` |
| `scripts/staging/PHASE5-PENDING-DASHBOARD.sql` |
| `scripts/staging/README-PHASE5-APPLY.md` |
| `scripts/apply-staging-phase5b-ledger-grants.mjs` |

---

## 5. Worker degrade

Safe behavior when 5C–5F DDL/RPC is missing (log-once degrade; keep consumer alive with outbox off).

| Path |
| --- |
| `apps/worker/src/schema-missing.ts` |
| `tests/reengineering/worker-outbox-degrade.contract.test.ts` |
| *(also consumes)* `apps/worker/src/outbox-poller.ts`, `apps/worker/src/main.ts` — primary listing under §2; commit with degrade if splitting 5C from harden |

---

## 6. Deploy scripts / GHCR / image build

Clean-host Swarm deploy script hardening + worker image packaging + GHCR workflow bumps.

| Path |
| --- |
| `scripts/deploy-reengineering-api-clean-host.sh` |
| `scripts/deploy-reengineering-worker-clean-host.sh` |
| `scripts/deploy-reengineering-tenant-web-clean-host.sh` |
| `infra/compose/Dockerfile.worker` |
| `.github/workflows/reengineering-ghcr-worker.yml` |
| `.github/workflows/reengineering-ghcr-tenant-web.yml` |

---

## Shared / program docs (commit last or with matching evidence)

| Path | Notes |
| --- | --- |
| `docs/reengineering/STATUS.md` | 4B staging-partial · 5A+5B staging-live · 5C–5G API live / DDL open |
| `docs/reengineering/04-migration/phase-2/clean-host/IMPLEMENTATION-LOG.md` | Append-only VPS evidence |
| `docs/reengineering/04-migration/phase-2/clean-host/HOST.md` | Host identity / listeners |
| `docs/reengineering/04-migration/phase-2/clean-host/README.md` | Index tweak |
| `docs/reengineering/04-migration/phase-5/UNCOMMITTED-BATCH.md` | This inventory |

---

## Explicitly excluded

| Path / pattern | Reason |
| --- | --- |
| `.cursor/**` | Local editor / MCP config |
| `test-results/**` | Local test artifacts |
| `.env*` / Dokploy env values / htpasswd | Secrets — never commit |

---

## Commit safety note

User said keep going but **did not request commits**. Tree is large and still coupled to in-flight worker image load (`…-outbox1`). Prefer finishing or aborting that redeploy, then committing in the order above when explicitly asked.
