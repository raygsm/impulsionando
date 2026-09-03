# Phase 5E — Communication platform / adapters (repo-complete)

Status: **STAGING-CLOSED** — worker communication/sink flags **ON** · Phase 5 **CLOSED** 2026-09-03T03:40Z  
Opened: **2026-09-02**  
Authority: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5E · [`../PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md)

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | CommunicationIntent v1 + policy + adapter interfaces | `packages/contracts/src/communication.ts` |
| 2 | Contracts export block (5E-marked) | `packages/contracts/src/index.ts` |
| 3 | Sink email/WhatsApp adapters (noop provider) | `apps/worker/src/communication/sink-adapters.ts` |
| 4 | Dispatch handler (policy → sink → delivery RPC) | `apps/worker/src/communication/dispatch.ts` |
| 5 | Job consumer wire (`communication.dispatch`, flag default off) | `apps/worker/src/job-consumer.ts` |
| 6 | Outbox wire (`communication.requested` sink mark, flag default off) | `apps/worker/src/outbox-poller.ts` |
| 7 | Delivery ledger migration + service_role RPCs + RLS | `supabase/migrations/20260902220000_phase5e_communication_delivery.sql` |
| 8 | Contract tests | `tests/reengineering/communication.contract.test.ts` |

## Security / safety properties (repo)

- Recipient **allowlist default-deny** (`COMMUNICATION_RECIPIENT_ALLOWLIST` empty/unset → deny).
- Opt-out, missing consent, cooldown, and dedup skip before provider.
- `COMMUNICATION_SINK` defaults to sink/noop — **no real email/WhatsApp sends** in this slice.
- Real-send path refused when sink is disabled (Phase 5E does not implement live providers).
- `WORKER_COMMUNICATION_ENABLED` **default off** — does not change 5B job-consumer behavior.
- Env var **names** only: `COMMUNICATION_SINK`, `COMMUNICATION_RECIPIENT_ALLOWLIST`, `WORKER_COMMUNICATION_ENABLED`.
- n8n may consume committed events later; it never owns domain/delivery state here.

## Flow (declared)

```text
CommunicationIntent
→ consent / opt-out / cooldown / dedup / allowlist
→ outbox event communication.requested (5C) and/or job communication.dispatch
→ worker (flag on) → sink adapter → delivery ledger status
```

## Operator close checklist (staging)

1. Apply migration `20260902220000_phase5e_communication_delivery.sql` on staging (`aamorcqznimmleafavai`) — **not** prod. **Not applied from this agent.**
2. Deploy worker image that includes communication handlers.
3. Set env names only (values never committed): `COMMUNICATION_SINK=true`, optional allowlist for synthetic recipients, `WORKER_COMMUNICATION_ENABLED=true` only when ready to exercise.
4. Run contracts: `npm run test:phase5e:contracts`.
5. Prove allowlist deny, cooldown skip, dedup skip, sink delivered — no real-recipient blast.
6. Record evidence in `STATUS.md` / clean-host log when staging verified — **do not mark Phase 5 CLOSED** on repo-complete alone.

## Exit gate (staging pending)

- Allowlisted synthetic recipient → sink **delivered** ledger row.
- Missing allowlist → **allowlist_denied** (no provider call).
- Cooldown / dedup / opt-out → skip statuses, no send.
- Worker flag off → 5B smoke job path unchanged.

## Explicitly out of scope here

- Staging/prod DB apply, SSH, Swarm deploy.
- Real provider SDKs (SES, Evolution, Meta Cloud API).
- Live 5A/5B/5C/5D staging close claims.
- Phase 5F 90-day journey proof.
- Production campaign blast.
- Marking Phase 5 CLOSED.

## Unknown / leftovers for operator

- Staging apply of `20260902220000_phase5e_*` — pending.
- Whether 5B consumer is live-closed on clean host — **UNKNOWN** (other agent); do not claim.
- Live allowlist values for synthetic contacts — operator-owned, never in git.
