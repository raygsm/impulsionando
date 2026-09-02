# Phase 5 — Worker skeleton (independent process)

Opened: **2026-09-01**  
Status: **STARTED (seed only)** — documentation + process bootstrap; **not** prod queues or co-start with SSR

Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Acceleration board: [`../ACCELERATION-BOARD.md`](../ACCELERATION-BOARD.md)  
ADR: [`../../05-governance/adrs/ADR-005-supabase-queues-initially.md`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md)

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

## Exit criteria (future — not met by seed)

- Worker image on GHCR with full SHA tag
- Swarm service on clean host (separate from `reengineering-api`)
- Staging queue publish/consume smoke (pgmq) with idempotency test
- Evidence in `STATUS.md` and clean-host log

## Evidence checklist (seed)

| # | Check | State |
| --- | --- | --- |
| 1 | Phase 5 README + STATUS row | ✅ seed |
| 2 | `apps/worker` bootstrap | ⏳ |
| 3 | Health probe | ⏳ |
| 4 | Dockerfile + deploy doc | ⏳ |
| 5 | Staging queue smoke | ⏳ |
