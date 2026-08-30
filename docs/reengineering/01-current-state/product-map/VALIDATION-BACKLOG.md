# Product-map validation backlog

The journey registry provides coverage, not behavioral proof. This backlog turns each `UNKNOWN` into an evidence task.

## Validation rules

- Use anonymized fixtures or dedicated test accounts.
- Never export production user records into the repository.
- Begin with read-only inspection.
- Any write characterization needs an exact target, expected records, cleanup/reconciliation plan, owner, and approval.
- Payment and communication tests must use confirmed sandbox/test destinations unless a separately approved production test exists.
- Every authorization test includes an allow case and at least one deny case.
- Every webhook/job test includes replay or duplicate delivery.
- Every destructive failure path requires a restore or rollback gate before execution.

## Ordered evidence tasks

| Order | Journey | Evidence task | Safe first action | Completion evidence | Gate |
| ---: | --- | --- | --- | --- | --- |
| 1 | J-01 | Complete host/prefix → Cloudflare → Nginx → upstream → runtime → release → SHA map | Read-only exports and process inspection | **LIVE 2026-08-30** topology in `phase-0/DOMAINS-AND-RUNTIMES.md` (CF rules export still open) | Phase 0 — mostly done |
| 2 | J-15 | Identify and contain every production publisher | Read-only GitHub/VPS registry comparison | Authority + stub done; **orphans still active** — residual blocker | Phase 0 — open |
| 3 | J-16 | Prove backup scope and isolated restoration | Read provider policies and existing backup manifests | Policy documented; **restore not proven** — see BACKUPS.md next step | Phase 0 exit blocker |
| 4 | J-02 | Document canonical auth/session/membership path | Static trace plus safe test-account plan | **STATIC** `AUTH-SESSION-TRACE.md`; allow/deny not executed | Phase 0 — static done |
| 5 | J-03 | Trace onboarding transaction and partial-failure behavior | Static call/data trace | Idempotent replay characterization and owner | Phase 0 |
| 6 | J-05 | Identify live payment providers and state machines | Provider metadata and code/table trace without secrets | Signed webhook, duplicate, out-of-order, reconciliation, refund evidence | Phase 0 exit blocker |
| 7 | J-07 | Identify every live scheduler/job and its consumer | Read-only logs/configuration | Owner, frequency, auth, idempotency, timeout, retry and side-effect map | Phase 0 exit blocker |
| 8 | J-06 | Inventory active communication providers/instances | Read-only provider/config metadata | Sender, consent, template, callback, retry, dedupe and owner map | Phase 0 |
| 9 | J-08 | Build anonymized Chrismed vertical fixture | Static schema/route trace first | Patient/professional deny tests plus appointment/document characterization | Sensitive-data approval |
| 10 | J-09 | Characterize Colors order/webhook/affiliate path | Static trace and provider sandbox confirmation | Duplicate webhook and commission reconciliation evidence | Payment approval |
| 11 | J-10 | Characterize WMP proposal-to-evidence lifecycle | Static trace and synthetic event plan | State transitions, token deny tests, Storage deny tests | Data-write approval |
| 12 | J-04 | Characterize acquisition-to-onboarding handoff | Static lead/funnel trace | Consent, dedupe, notification and conversion evidence | Test destination approval |
| 13 | J-11 | Characterize Ana Madu catalog-to-PIX flow | Static price/order/payment trace | Sandbox payment and duplicate confirmation evidence | Payment approval |
| 14 | J-12 | Characterize RioMed quote-to-service flow | Static state/data trace | Quote authorization, order, warranty/service, and communication evidence | Test-data approval |
| 15 | J-13 | Characterize ticket and incident notification | Static trace and safe subscriber fixture | Abuse, privacy, delivery retry, unsubscribe and closure evidence | Test destination approval |
| 16 | J-14 | Inventory every AI assistant, model, tool, and data source | Static code/config metadata only | Per-assistant policy, tenant boundary, rate/cost, retention and eval plan | Must not implement Phase 6 |

**Task 16 status (2026-08-30):** static inventory written at [`../phase-0/AI-ASSISTANTS-INVENTORY.md`](../phase-0/AI-ASSISTANTS-INVENTORY.md) (8 conversational assistants + related AI surfaces). Completion evidence for characterization (policy, tenant boundary deny tests, rate/cost, retention, evals) remains **open**. J-14 is **not CHARACTERIZED**. Phase 6 still forbidden.

## Required journey record

Each completed characterization must add or link a record containing:

```text
journey ID:
tenant/product:
actor:
owner:
environment:
entry point:
preconditions:
tenant resolution:
identity/session:
authorization allow:
authorization deny:
server entry point:
business behavior owner:
database reads:
database writes:
storage reads/writes:
events/jobs:
external integrations:
idempotency key:
success result:
user-visible result:
failure result:
retry/reconciliation:
audit/log evidence:
SLA/RTO/RPO:
rollback/recovery:
test fixture:
evidence links:
migration decision:
remaining UNKNOWN:
```

## Phase boundary

This backlog authorizes documentation and approved Phase 0 evidence collection only. It does not authorize implementing NestJS, the target workspace, Dokploy, new tenant provisioning, AI actions, production cutover, or legacy cleanup.

