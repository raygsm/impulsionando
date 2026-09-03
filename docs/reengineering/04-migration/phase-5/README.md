# Phase 5 — Worker skeleton (independent process)

Opened: **2026-09-01**  
Closed: **2026-09-03T03:40Z**  
Status: **CLOSED (staging)** — `phase5:staging:verify` **8/8 PASS** · residual service_role GRANTs applied · owners **Cauã** · Phase 6 now **IN PROGRESS (6A/6B)** — see [`../phase-6/README.md`](../phase-6/README.md)

Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Acceleration board: [`../ACCELERATION-BOARD.md`](../ACCELERATION-BOARD.md)  
ADR: [`../../05-governance/adrs/ADR-005-supabase-queues-initially.md`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md)
Detailed plan: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5
5C exit: [`PHASE-5C-EXIT-REPORT.md`](./PHASE-5C-EXIT-REPORT.md)

## Goal

Independent **worker process** skeleton in the monorepo — separate lifecycle from SSR and API, aligned with ADR-001 (pnpm workspaces) and ADR-005 (Supabase Queues initially).

Minimum skeleton:

- `apps/worker` (or equivalent) entrypoint
- Health/readiness signal (HTTP or process probe)
- Config surface (env, no secrets in repo)
- Stub consumer or no-op loop proving deployability
- Dockerfile / GHCR path documented (publish not required for seed)

## In scope (seed → gate)

- Package layout + `package.json` workspace member
- Bootstrap script (`node dist/main` or equivalent)
- Shared logging/config conventions matching `apps/api`
- README + evidence hooks in this folder

## Out of scope (explicit)

| Item | Reason |
| --- | --- |
| Co-start with SSR / `start-core-runtime.mjs` | Violates target execution boundaries |
| Prod queues (pgmq) provisioning | ADR-005 — staging evidence first |
| Migrating Pulsonitor/Colors/cron jobs | Later vertical slices |
| Publishing jobs from Nest Support pilot | Phase 3 still closing residuals |

## Authorization boundary

| Allowed | Forbidden |
| --- | --- |
| Local/staging skeleton build | Prod queue consumers |
| GHCR workflow design (dispatch-only) | Workers as child process of web container |
| Health endpoint on worker port | Re-enable contained legacy workflows without decision |

## Exit criteria (staging — met 2026-09-03T03:40Z)

- Worker image on clean host (local-load SHA tag; GHCR push optional / not required for close)
- Swarm service on clean host (separate from `reengineering-api`)
- Staging queue publish/consume smoke (pgmq) with idempotency test — **PASS**
- Transactional outbox/event contract and secure webhook proof — **PASS**
- Communication adapter with consent/deduplication/delivery-state (sink) — staging flags **ON**
- One synthetic/allowlisted end-to-end async journey — **PASS**
- Queue/integration observability and recovery runbook — ops metrics + drill **PASS**
- Evidence in `STATUS.md` and clean-host log — recorded

## Evidence checklist

| # | Check | State |
| --- | --- | --- |
| 1 | Phase 5 README + STATUS row | ✅ CLOSED |
| 2 | `apps/worker` bootstrap | ✅ health + heartbeat |
| 3 | Health probe | ✅ `GET /health` / `ready` on port 3200 |
| 4 | Dockerfile + deploy doc | ✅ `Dockerfile.worker` · `reengineering-ghcr-worker.yml` |
| 5 | Staging verify 8/8 | ✅ `npm run phase5:staging:verify` 2026-09-03T03:40Z |
