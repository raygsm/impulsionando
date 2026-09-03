# Phase 5C — Events + transactional outbox (repo-complete)

Status: **STAGING-CLOSED** — live outbox smoke **PASS** (verify 8/8 · 2026-09-03T03:40Z) · Phase 5 **CLOSED**  
Opened: **2026-09-02**  
Authority: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5C · [`../PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md) · [`../../05-governance/adrs/ADR-005-supabase-queues-initially.md`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md) · [`../phase-1/CONTRACT-EVENTS-JOBS.md`](../phase-1/CONTRACT-EVENTS-JOBS.md)

**Phase 5 CLOSED (staging).** Phase 6 not started.

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | EventEnvelope v1 + catalog + `domainMutationToOutboxRow` | `packages/contracts/src/event.ts` |
| 2 | Outbox table + service_role RPCs (incl. ticket+outbox TX) | `supabase/migrations/20260902200000_phase5c_event_outbox.sql` |
| 3 | Nest `OutboxService` | `apps/api/src/outbox/` |
| 4 | Support ticket create → `support.ticket.created` outbox | `apps/api/src/support/support.service.ts` |
| 5 | Worker outbox poller stub (`WORKER_OUTBOX_ENABLED`, default off) | `apps/worker/src/outbox-poller.ts` |
| 6 | Contract tests | `tests/reengineering/event-outbox.contract.test.ts` |
| 7 | Smoke skeleton (local contracts; no live hit by default) | `scripts/smoke-reengineering-event-outbox.mjs` |

## Transactional semantics

| Path | Atomicity |
| --- | --- |
| `create_support_ticket_with_outbox` RPC | **Proven in SQL** — ticket + outbox + audit event in one transaction |
| Sequential fallback (migration not applied) | **UNKNOWN** — ticket insert then best-effort outbox; logged |

supabase-js cannot open an explicit multi-statement transaction for arbitrary table writes; the RPC is the authoritative transactional path once the migration is applied.

## Initial event catalog

- `support.ticket.created` (wired on Support create)
- `invite.created`
- `invite.link_clicked`
- `account.first_login`
- `communication.requested`
- `communication.delivered`
- `communication.failed`

## Operator close checklist (staging)

1. Apply migration `20260902200000_phase5c_event_outbox.sql` on staging (`aamorcqznimmleafavai`) — **do not apply on prod** without a later gate.
2. Deploy updated API (+ worker if enabling outbox poller) GHCR images (full SHA).
3. Optional: `WORKER_OUTBOX_ENABLED=true` on worker (default off; 5B consumer unaffected).
4. Run contracts: `npm run test:phase5c:contracts`
5. Staging smoke (after migrate+deploy): create Support ticket via API → assert `reengineering_event_outbox` pending/published row with matching `correlationId`.
6. Record evidence in `STATUS.md` and `phase-2/clean-host/IMPLEMENTATION-LOG.md` if clean-host deploy is used.

### Worker degrade note (2026-09-03)

Enabling `WORKER_OUTBOX_ENABLED=true` **before** the 5C migration causes PostgREST/RPC miss (`claim_reengineering_outbox_batch`). The poller now **degrades cleanly**: logs `outbox_poll_degraded` **once**, skips ticks until a periodic probe succeeds, then emits `outbox_poll_recovered` and resumes. It does **not** crash the worker or spam `outbox_poll_failed`. Prefer applying `20260902200000_phase5c_*` before flipping the flag; leaving the flag on pre-DDL is safe for the 5B job consumer.

## Exit gate (not met by repo alone)

- Staging: ticket create commits outbox row in same DB transaction (RPC path).
- Worker drains pending → published without breaking 5B job consumer.
- Correlation preserved HTTP → envelope → outbox row.

## Explicit non-goals this slice

- Live staging/prod migration apply from this agent
- Outbox → queue job publish (later)
- Webhooks / communications (5D/5E)
- Legacy VPS / prod DNS
