# Phase 5F — 90-day CRM invitation journey (repo-complete)

Status: **STAGING-CLOSED** — live CRM journey smoke **PASS** (verify 8/8 · 2026-09-03T03:40Z) · Phase 5 **CLOSED**  
Opened: **2026-09-02**  
Authority: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5F · [`../PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md) · [`../../STATUS.md`](../../STATUS.md)

**Phase 5 CLOSED (staging).** Phase 6 not started.

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | InviteV1 / JourneyStateV1 + allowlist + cancel-reminders pure fns | `packages/contracts/src/journey.ts` |
| 2 | Nest journeys module (create / click / first-login) | `apps/api/src/journeys/` |
| 3 | Migration: journey + invite tables, RLS, `*_with_outbox` RPCs | `supabase/migrations/20260902230000_phase5f_crm_invite_journey.sql` |
| 4 | Contract tests (happy path, expiry, revoke, dup click, reminders, allowlist) | `tests/reengineering/crm-journey.contract.test.ts` |
| 5 | Smoke skeleton (`DRY_RUN` default) | `scripts/smoke-reengineering-crm-journey.mjs` |
| 6 | Worker journey handler stub (`WORKER_JOURNEY_ENABLED`, default off) | `apps/worker/src/journeys/handler.ts` |

## Journey model (synthetic only)

```text
select synthetic contact
→ create expiring/revocable invite
→ dispatch through SINK / allowlisted channels
→ record click
→ API updates CRM journey state
→ first login/action cancels incompatible reminders
→ support handoff retains authorized context
```

n8n may react to committed events (`invite.created`, `invite.link_clicked`, `account.first_login`, `communication.requested`, `support.ticket.created`). It must **not** own canonical CRM state.

## Transactional semantics

| Path | Atomicity |
| --- | --- |
| `create_crm_invite_with_outbox` / click / first-login RPCs | **Proven in SQL** — domain write + `write_reengineering_event_outbox` in one TX (requires 5C migration) |
| Sequential fallback (RPC missing) | **UNKNOWN** — logged; Nest inserts then best-effort outbox |

## Env var names (never values)

| Name | Role |
| --- | --- |
| `JOURNEY_RECIPIENT_ALLOWLIST` | Comma-separated synthetic recipients; empty = default deny |
| `JOURNEY_COMMUNICATION_SINK` | Default sink; no real provider sends from skeleton |
| `WORKER_JOURNEY_ENABLED` | Worker hook; default off |

## Operator close checklist (staging)

1. Apply migration `20260902230000_phase5f_crm_invite_journey.sql` on staging (`aamorcqznimmleafavai`) — **do not apply on prod**.
2. Ensure Phase 5C outbox migration is already applied (RPC dependency).
3. Deploy API (+ optional worker with `WORKER_JOURNEY_ENABLED=true`) GHCR images (full SHA).
4. Set `JOURNEY_RECIPIENT_ALLOWLIST` to synthetic addresses only.
5. Run contracts: `npm run test:phase5f:contracts`
6. Staging smoke (after migrate+deploy): create invite → click → first-login → assert journey status + cancelled reminders + outbox rows.
7. Record evidence in `STATUS.md` / clean-host log if deploy uses clean host.

## Exit gate (not met by repo alone)

- Staging: full async journey passes duplicate/retry/failure tests with synthetic recipients.
- No real email/WhatsApp sends.
- Support handoff retains authorized context without n8n owning CRM state.

## Explicit non-goals this slice

- Live staging/prod migration apply from this agent
- SSH / Dokploy deploy
- Real-recipient campaign blast
- Legacy VPS / prod DNS
- Phase 5 CLOSED claim
