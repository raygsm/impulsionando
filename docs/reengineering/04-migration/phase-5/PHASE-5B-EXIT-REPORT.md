# Phase 5B — Queue semantics (repo-complete)

Status: **REPO-COMPLETE** — staging migration + smokes pending operator  
Opened: **2026-09-02**  
ADR: [`../../05-governance/adrs/ADR-005-supabase-queues-initially.md`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md)

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | Job envelope + helpers | `packages/contracts/src/job.ts` |
| 2 | pgmq queues + idempotency ledger migration | `supabase/migrations/20260902130000_phase5b_reengineering_jobs_queue.sql` |
| 3 | API publisher `POST /api/v1/jobs/enqueue` | `apps/api/src/jobs/` |
| 4 | Worker queue consumer (poll, idempotency, DLQ) | `apps/worker/src/job-consumer.ts` |
| 5 | Contract tests | `tests/reengineering/job-queue.contract.test.ts` |
| 6 | Staging smokes | `scripts/smoke-reengineering-job-*.mjs` |

## Operator close checklist (staging)

1. Apply migration `20260902130000_phase5b_reengineering_jobs_queue.sql` on staging (`aamorcqznimmleafavai`).
2. Deploy updated API + worker GHCR images (full SHA).
3. Set worker env: `WORKER_CONSUMER_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Run contract tests: `npm run test:phase5b:contracts`
5. Run smokes:
   - `npm run phase5:smoke:job-enqueue-consume`
   - `npm run phase5:smoke:job-duplicate`
6. Record evidence in `STATUS.md` and `phase-2/clean-host/IMPLEMENTATION-LOG.md`.

## Smoke job type

`reengineering.smoke.echo` — records one row in `reengineering_job_effects` per idempotency scope key.

## Exit gate

- Publish → consume → single effect proven on staging.
- Duplicate delivery with same idempotency key produces exactly one effect row.
- Poison messages move to `reengineering_jobs_dlq` after max attempts.
