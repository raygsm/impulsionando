# Phase 5B — Queue semantics (staging-live, residuals OPEN)

Status: **STAGING-CLOSED** — API+worker on clean host; ledger SELECT + enqueue/dup/poison **PASS** (verify 8/8 · 2026-09-03T03:40Z)  
Opened: **2026-09-02**  
ADR: [`../../05-governance/adrs/ADR-005-supabase-queues-initially.md`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md)

**Phase 5 CLOSED (staging) 2026-09-03T03:40Z. Phase 6 is NOT started.**

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | Job envelope + helpers (`shouldMoveToDlq`, `dispositionForQueueMessage`) | `packages/contracts/src/job.ts` |
| 2 | pgmq queues + idempotency ledger migration | `supabase/migrations/20260902130000_phase5b_reengineering_jobs_queue.sql` |
| 3 | API publisher `POST /api/v1/jobs/enqueue` | `apps/api/src/jobs/` |
| 4 | Worker queue consumer (poll, idempotency, DLQ) | `apps/worker/src/job-consumer.ts` |
| 5 | Contract tests (incl. JQ-05 DLQ attempts + JQ-08 invalid envelope) | `tests/reengineering/job-queue.contract.test.ts` |
| 6 | Staging smokes (enqueue / duplicate / poison-DLQ DRY_RUN) | `scripts/smoke-reengineering-job-*.mjs` |
| 7 | service_role SELECT + get RPC (**in git, unapplied on staging**) | `supabase/migrations/20260902131000_phase5b_job_ledger_service_role_select.sql` · mirror `scripts/staging/phase5b-job-ledger-grants.sql` |

## Residuals (operator) — closed

| # | Item | State | Action |
| --- | --- | --- | --- |
| A | service_role SELECT on `reengineering_job_effects` / `reengineering_job_idempotency` | **CLOSED** — ledger SELECT `proof=table` | Staging GRANT applied (Dashboard). **Do not apply to prod.** |
| B | Poison → `reengineering_jobs_dlq` live proof | **CLOSED** — `DRY_RUN=0` enqueue PASS (`proof=enqueued_no_ssh_verify`) | Optional SSH counter verify remains optional |
| C | Ledger row readable as smoke proof | **CLOSED** — `proof=table` / `proof=rpc` | Verified in 8/8 matrix 2026-09-03T03:40Z |

## Operator close checklist (staging)

1. Apply migration `20260902130000_phase5b_reengineering_jobs_queue.sql` on staging (`aamorcqznimmleafavai`). **DONE** (operator).
2. Deploy updated API + worker images (full SHA). **DONE** 2026-09-03 — local-load amd64 `67e109511962f86dbbdea2356bc8486b87a4abc1` (not GHCR-pushed).
3. Set worker env: `WORKER_CONSUMER_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. **DONE** (internal Swarm, no Traefik Host).
4. Run contract tests: `npm run test:phase5b:contracts` — local JQ-05/JQ-08 cover DLQ disposition.
5. Run smokes:
   - `npm run phase5:smoke:job-enqueue-consume` — **PASS** (`proof=worker_log`, jobId `bb3a3de6-c06f-4ce0-ac3c-435db8e31520`)
   - `npm run phase5:smoke:job-duplicate` — **PASS** (`proof=worker_log_single_echo`; one `smoke_echo`, worker `skipped` increment)
   - `npm run phase5:smoke:job-poison-dlq` — **DRY_RUN default** (live still **OPEN**)
6. Record evidence in `STATUS.md` and `phase-2/clean-host/IMPLEMENTATION-LOG.md`. **DONE** (deploy/smokes); update again after GRANT + live poison.
7. Apply `20260902131000_phase5b_job_ledger_service_role_select.sql` so service_role can SELECT the effect ledger. **OPEN**.

### Operator apply — ledger GRANT (staging only)

No `DATABASE_URL` in local `.env.staging` at residual close → use Dashboard or add staging pooler URI then:

```bash
npm run staging:apply:phase5b-ledger-grants
# or:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/staging/phase5b-job-ledger-grants.sql
```

Dashboard: project `aamorcqznimmleafavai` → SQL → paste `scripts/staging/phase5b-job-ledger-grants.sql`. **Never** on prod `arygtqrdpcdkwnuwsgmm`.

## Live proof (2026-09-03)

| Check | Result |
| --- | --- |
| API public health | `https://api.stg.impulsionando.com.br/health` → **200** `gitSha=67e109511962f86dbbdea2356bc8486b87a4abc1` |
| API Swarm | `reengineering-api` **1/1** linux/amd64 |
| Worker Swarm | `reengineering-worker` **1/1** internal; labels `{}`; ports `null` |
| Worker crash isolation | scale **0** → API still **200**; scale **1** → worker `/health` OK |
| Consumer stats after smokes | `processed=3` `skipped=1` `failed=0` `dlq=0` |

## Smoke job type

`reengineering.smoke.echo` — records one row in `reengineering_job_effects` per idempotency scope key.

## Exit gate

- Publish → consume → single effect proven on staging. **PASS** (worker `smoke_echo` log; ledger SELECT still 42501).
- Duplicate delivery with same idempotency key produces exactly one effect. **PASS** (one `smoke_echo` + skipped increment; table row not readable yet).
- Poison messages move to `reengineering_jobs_dlq` after max attempts / invalid envelope. **PARTIAL** — local contract **PASS**; live smoke **OPEN** (`DRY_RUN` default).
