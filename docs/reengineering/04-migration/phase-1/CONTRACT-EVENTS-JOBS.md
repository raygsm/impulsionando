# Contract — Events, jobs, idempotency, audit

Track: **P1-F**  
Opened: 2026-08-30  
Status: **CONTRACT (Phase 1)** — defines limits before scaffolding.  
Does **not** authorize worker implementation, Supabase Queues / pgmq provision, n8n changes, or re-enablement of contained workflows.

## Authority

| Source | Role |
| --- | --- |
| [`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md) | Phase 1 exit: idempotency, audit, correlation IDs, event/job contracts |
| [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md) | `api` publishes jobs; `worker` consumes; SSR must not spawn workers |
| [`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md) | Queues store/retry; Realtime ≠ work queue; worker ≠ public traffic |
| [`PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md) | Later: visibility timeout, retry, DLQ, webhook validation, outbox, dashboards |
| [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md) | Sensitive-action audit field set |
| [`ADR-005`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md) | Initial durable queue **Proposed** — not implementation license |
| Phase 0 [`API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md), [`INTEGRATIONS.md`](../../01-current-state/phase-0/INTEGRATIONS.md) | Legacy surface evidence (STATIC / partial LIVE) |

Conflict order: accepted ADRs → target architecture → `STATUS.md` → observed evidence → legacy docs.

---

## 1. Purpose

Unify how domain **events**, durable **jobs**, **idempotency**, **audit**, and **webhook intake** are shaped so later Nest modules, workers, and adapters share one contract.

This file is the Phase 1 executable contract. Runtime brokers, worker processes, and queue DDL are **out of scope** until ADR-005 is accepted and Phase 3–5 gates open.

---

## 2. ADR-005 status (binding note)

[`ADR-005 — Supabase Queues initially`](../../05-governance/adrs/ADR-005-supabase-queues-initially.md) remains **Proposed** until a human-signed acceptance (or explicit Defer) via the Phase 1 ADR acceptance packet.

While Proposed:

- design assumes a durable queue between `api` (publish) and independent `worker` (consume);
- do **not** install Supabase Queues / pgmq, create queue tables, or ship a new worker binary;
- do **not** treat Proposed ADR text as permission to change production schedulers or re-enable contained GitHub workflows;
- if acceptance chooses Defer / alternate broker, this contract’s **envelope and semantics** stay; only the transport binding changes under a successor ADR.

---

## 3. Event envelope

Every domain event that crosses process boundaries (API → queue, API → outbox, webhook → domain handler, worker → follow-on job) MUST use this envelope. Payload bodies are versioned schemas referenced by name; they are not free-form JSON bags.

### 3.1 Required fields

| Field | Type | Rules |
| --- | --- | --- |
| `type` | string | Stable event name, past-tense domain verb preferred (`support.ticket.created`). Dot-namespaced by module. |
| `schemaVersion` | positive int | Version of **this envelope + named payload schema**. Breaking payload changes bump version or introduce a new `type`. |
| `eventId` | UUID / ULID | Globally unique per emission. Used for dedupe and audit linkage. Never reused. |
| `tenantId` | canonical tenant id | Always set for tenant-scoped work. Platform-only system jobs use an explicit platform sentinel documented by Identity/Tenants contract — never omit silently. |
| `actor` | object | Who/what caused the event (see §3.2). |
| `correlationId` | string | Propagates across HTTP → use case → job → webhook follow-ups. Generated at the edge if absent; never dropped on republish. |
| `occurredAt` | ISO-8601 UTC | Business time of the occurrence (not dequeue time). |
| `payloadSchemaRef` | string | Pointer to the validated payload contract (e.g. `support.ticket.created.v1` in `packages/contracts`). |
| `payload` | object | Instance conforming to `payloadSchemaRef`. No secrets, no raw provider credentials, no unbounded PII dumps. |

### 3.2 Actor object

| Field | Required | Notes |
| --- | --- | --- |
| `actorType` | yes | `user` \| `system` \| `service` \| `integration` \| `anonymous` |
| `actorId` | when known | User id, service name, or integration principal. |
| `membershipId` | when user-in-tenant | Links to membership used for authorization. |
| `role` / `capabilities` | when user/service | Snapshot of decision context for audit; not a substitute for re-auth on consume. |

### 3.3 Optional but recommended

| Field | Notes |
| --- | --- |
| `causationId` | Parent `eventId` or request id that caused this emission. |
| `idempotencyKey` | Business key for “same logical action” (see §5). |
| `requestId` | Immediate HTTP/request id when different from `correlationId`. |
| `source` | Emitting module (`support`, `billing`, `automations`, …). |

### 3.4 Illustrative shape

```text
{
  "type": "support.ticket.created",
  "schemaVersion": 1,
  "eventId": "…",
  "tenantId": "…",
  "actor": { "actorType": "user", "actorId": "…", "membershipId": "…" },
  "correlationId": "…",
  "occurredAt": "2026-08-30T21:00:00.000Z",
  "payloadSchemaRef": "support.ticket.created.v1",
  "payload": { "ticketId": "…", "source": "public_form" },
  "idempotencyKey": "support.ticket.create:tenant:…:clientKey:…"
}
```

Workers and subscribers validate envelope + payload schema before side effects. Unknown `type` / `schemaVersion` → reject to dead-letter (or safe no-op with audit), never partial apply.

---

## 4. Job publication boundary

### 4.1 Who may publish

| Allowed | Forbidden |
| --- | --- |
| Nest (target) `api` use cases after commit / outbox flush | Browser / public clients publishing directly to the queue |
| Temporary strangler adapters that **delegate** to the same API use case | TanStack SSR / `createServerFn` starting worker **child processes** |
| Explicit machine callers into `api` (signed internal routes) that then publish | n8n writing domain state or enqueueing domain jobs as source of truth |
| | Realtime channels used as a work queue |
| | Edge Functions as long-term job bus (legacy only until migrated) |

Per [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md): **`api` owns job publication**; **`worker` owns consumption**; worker must not share lifecycle with SSR/API.

### 4.2 Publication rules

1. Publish only after the authoritative domain write is durable (transaction commit or transactional outbox row).
2. Job body is the **event envelope** (or a thin job wrapper that embeds it) — not an opaque script name with ambient globals.
3. Every job carries `correlationId`, `tenantId`, `type`, `eventId`, and `idempotencyKey` (or a derived key — §5).
4. SSR/BFF may call `api` over HTTP; it must **not** fork `pulsonitor-worker`, Colors automation, or any future worker as a child of the web process (legacy coupling documented in Phase 0 is technical debt, not target).

### 4.3 Consumption (contract only)

- Independent Node worker process(es); no public general traffic.
- Claim with lease / visibility timeout (§6); handler must be idempotent.
- Domain modules own transition rules; queue technology only stores and releases messages ([`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)).

Implementation of consumers is Phase 5 (and related API work in Phase 3+), not Phase 1.

---

## 5. Idempotency

### 5.1 Keys

| Context | Key construction | Scope |
| --- | --- | --- |
| HTTP mutations | Client `Idempotency-Key` header (or body field where already legacy) + tenant + route/use-case | API request dedupe window |
| Domain jobs | `idempotencyKey` on envelope, stable for the business action | At-least-once delivery |
| Webhooks | Provider event id + tenant + integration + action | Replay / duplicate delivery |
| Cron / schedule ticks (legacy → target) | Schedule name + tenant (if any) + logical period bucket | Overlapping tick callers |

Keys MUST be deterministic for the same logical action and MUST NOT include secrets.

### 5.2 Semantics

- **At-least-once** delivery is assumed for jobs and webhooks.
- Handlers MUST treat duplicate keys as safe: return the original success outcome (or a documented conflict) without duplicating side effects.
- Store an idempotency record: key, tenant, use-case/job type, request/event hash summary, result reference, `createdAt`, `expiresAt`.
- Concurrent duplicates: one winner; loser observes the stored result or waits under a short lock — never double-apply external side effects (payments, WhatsApp sends, fiscal emits).

### 5.3 HTTP surface alignment

Align with HTTP API conventions (P1-E): mutations accept `Idempotency-Key`; success/error bodies expose `correlationId`; stable machine code for replay (e.g. `IDEMPOTENCY_REPLAY`) when returning a prior result is insufficiently signaled by HTTP status alone.

---

## 6. Queue semantics (contract-level)

Transport binding (pgmq vs alternate) waits on ADR-005 acceptance. Semantics below are **required** of whatever broker is chosen.

| Concern | Contract |
| --- | --- |
| **Visibility timeout (lease)** | Message invisible to other consumers while leased. Lease duration ≥ expected handler time + skew; heartbeat/extend allowed for long jobs. Expiry returns message to ready state for retry. |
| **Retry** | Bounded attempts with documented backoff (constant or exponential + jitter). Retry only on transient / explicitly retryable failures. Poison messages must not infinite-loop. |
| **Dead-letter** | After max attempts or non-retryable error, move to DLQ / dead-letter store with last error, attempt count, envelope, `correlationId`, `tenantId`. Manual replay is an audited operator action (Phase 5 runbooks). |
| **Ordering** | No global order guarantee unless a future ADR adds per-key FIFO. Handlers must tolerate out-of-order siblings via domain versioning/state checks. |
| **Retention** | Successful ack retention and DLQ retention are environment policies — document per env in Phase 5; do not rely on “forever”. |
| **Outbox** | Preferred pattern: domain transaction writes outbox row → publisher drains to queue. Avoid dual-write without reconciliation. |

### 6.1 Job wrapper (when distinct from event)

```text
JobMessage {
  jobId, queue, enqueuedAt, attempt, visibilityTimeoutSeconds,
  envelope: EventEnvelope   // §3
}
```

`attempt` starts at 1 on first delivery; increments on each lease after failure/timeout.

---

## 7. Audit trail (sensitive actions)

Per [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md) and Definition of Done: sensitive actions leave an append-oriented audit record. Application logs alone are **not** the audit trail.

### 7.1 Required audit fields

| Field | Notes |
| --- | --- |
| `auditId` | Unique id for the audit row. |
| `occurredAt` | When the decision/action completed. |
| `tenantId` | Tenant scope (or platform sentinel). |
| `actor` | Same shape as event actor (§3.2). |
| `role` | Role used for the decision, when applicable. |
| `capability` | Capability checked (align with P1-D RBAC contract). |
| `action` | Stable verb (`support.ticket.assign`, `billing.refund.approve`, …). |
| `resourceType` / `resourceId` | Target entity. |
| `correlationId` | Links HTTP, job, webhook chain. |
| `idempotencyKey` | When the action was keyed. |
| `policyDecision` | `allow` \| `deny` (denies of sensitive attempts are auditable where product requires). |
| `result` | `success` \| `failure` \| `rejected` (+ stable error code, no secret material). |
| `inputSummary` | Redacted/minimal summary of inputs — never full card data, tokens, or clinical free-text dumps by default. |
| `eventId` / `jobId` | Optional links to envelope / job. |

### 7.2 Classification

Clinical, financial, credential, and message bodies require explicit retention/classification before migration of those flows. Pilot (Support) still emits audit for privileged operator actions with redaction defaults.

### 7.3 Privileged services

`service_role` / machine principals MUST leave audit when mutating tenant data. Missing audit on a privileged path is a contract defect.

---

## 8. Webhook intake contract

Inbound provider webhooks (payments, Meta, e-mail, fiscal, n8n callbacks, etc.) enter through **Integrations** (or a thin HTTP facade that delegates there), not through browser-trusted paths.

### 8.1 Signature

1. Verify provider signature / shared secret **before** parsing into domain commands.
2. Secrets live only in server-side env / secret stores — never in docs, git, or frontend bundles.
3. Failed signature → `401`/`403`, no domain writes, metric + security log (not full body dump).

### 8.2 Replay protection

1. Reject timestamps outside an allowed skew window (provider-specific; document per adapter).
2. Persist provider delivery id (or hash of canonical payload + event id) under the idempotency store (§5).
3. Replays return the prior processing outcome without re-applying side effects.

### 8.3 Idempotency & ack

1. Acknowledge to the provider only after durable record of receipt **or** after durable domain apply — adapter documents which; prefer “record then apply” with idempotent apply.
2. Heavy work: validate → enqueue job with envelope → return success quickly; worker performs side effects.
3. No integration endpoint becomes source of truth for domain invariants without API validation ([`SYSTEM.md`](../../02-target-architecture/SYSTEM.md) forbidden flow: n8n altering critical state without API validation).

### 8.4 Minimum intake audit

Record: integration name, tenant resolution method, provider event id, signature result, `correlationId`, idempotency key, and enqueue/apply result.

---

## 9. Legacy mapping — HTTP cron/hooks → queue + worker

Phase 0 evidence ([`API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md), [`INTEGRATIONS.md`](../../01-current-state/phase-0/INTEGRATIONS.md)):

- ~41 HTTP cron/tick candidates, ~42 webhook/callback candidates;
- workers (`pulsonitor-worker`, `colors-automation-worker`) started with the web runtime via `scripts/start-core-runtime.mjs`;
- Edge Functions and n8n as additional asynchronous surfaces;
- auth/idempotency often **UNKNOWN** live.

### 9.1 Target

```text
schedule or domain commit
  → api (authz + outbox / publish)
  → durable queue
  → independent worker
  → idempotent handler + audit
  → DLQ / metrics on failure
```

### 9.2 Temporary coexistence

| Legacy pattern | Phase 1 stance | Target |
| --- | --- | --- |
| `src/routes/api/public/cron/*`, `…/hooks/*`, `…/webhooks/*` | Inventory + contract only; do not widen without gate | Thin authenticated trigger **or** remove in favor of queue publish from `api` |
| Workers as children of core/SSR | Documented hazard; no new child workers | Separate `worker` deployable |
| HTTP tick as both trigger and executor | Temporary | Trigger may remain briefly; **execution** moves to worker |
| Edge payment/comm workers | Stay until Phase 5 strategy per integration | Adapter + queue where durable work is required |
| n8n schedules/callbacks | Auxiliary; not domain SoT | Callbacks validated by `api`; domain jobs via queue |

**Rule:** legacy HTTP cron/hooks are **temporary strangler surfaces**. New product automations MUST NOT be designed as “public cron route executes the work.” Prefer `api` publish → queue → worker.

No endpoint migration without coexistence, observation, idempotency key, dead-letter/replay path, and rollback ([`INTEGRATIONS.md`](../../01-current-state/phase-0/INTEGRATIONS.md)).

---

## 10. Correlation propagation

| Hop | Requirement |
| --- | --- |
| Inbound HTTP | Accept `X-Correlation-Id` or generate; echo on responses. |
| Use case → event/job | Copy into envelope. |
| Worker → outbound HTTP / n8n / provider | Forward as header or metadata where supported. |
| Webhook intake | Create or continue correlation; store on idempotency + audit rows. |
| Logs / metrics | Structured field `correlationId` on all related lines. |

Missing correlation on a new code path is a contract defect for Phase 3+ reviews.

---

## 11. Explicit non-goals (this track)

- Implementing or deploying workers.
- Provisioning Supabase Queues / pgmq or any broker.
- Changing production cron/webhook auth.
- Re-enabling contained workflows.
- Choosing payment/clinical/AI as first queue pilot.
- Replacing ADR-005 text; acceptance happens via governance packet + human sign-off.

---

## 12. Exit checklist (P1-F)

- [x] Event envelope fields defined (`type`, tenant, actor, `correlationId`, `occurredAt`, `payloadSchemaRef`, …).
- [x] Job publication restricted to `api` (not SSR children).
- [x] Idempotency, visibility timeout, retry, dead-letter specified at contract level.
- [x] Audit fields for sensitive actions listed.
- [x] Webhook intake: signature, replay protection, idempotency.
- [x] Legacy HTTP cron/hooks marked temporary; target = queue + worker.
- [x] ADR-005 called out as **Proposed** until acceptance packet.

Downstream: Phase 5 implements queue ops, adapters, dashboards, and safe manual replay runbooks against this contract; Phase 3 wires Nest publication; ADR acceptance unlocks transport.
