# Nest modular API — exploratory domain paper design

> **EXPLORATORY — Nest implementation still NOT authorized.**
>
> Status: Phase 0 **CLOSED** (2026-08-30). Phase 1 is in execution (contracts/foundation only). Support pilot (J-13) is **formalized** in [`../phase-1/PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md) — contract + test plan + legacy STATIC map; **no Nest code**. Related ADRs remain **Proposed** until acceptance. This document does **not** authorize Nest bootstrap, monorepo scaffolding, package creation, Dokploy/VPS work, database changes, dependency installs, or rewriting of server functions.

Authority: [`docs/reengineering/`](../../README.md). Conflict order per program rules. Stakeholder vision is input only.

Companion (optional paper layout): [`IMAGE-AND-RUNTIME-LAYOUT.md`](IMAGE-AND-RUNTIME-LAYOUT.md). Pilot track: [`../phase-1/PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md).

---

## 1. Proposed Nest modules (responsibilities only)

Modules match [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md). They start inside one modular API monolith; extract to separate services only with operational evidence. Owners and RBAC names remain Phase 1 decisions.

| Module | Owns | Does not own |
| --- | --- | --- |
| **Identity & Access** | Session attestation against Supabase Auth; actor resolution; capability checks at use-case entry; password-reset policy hooks; machine identities for webhooks/schedulers (contracts only) | Rendering login UI; issuing JWTs as a second IdP; deciding UI navigation alone |
| **Tenants & Memberships** | Canonical tenant identity translation (`company_id` ↔ target `tenant`); membership; roles; module activation grants; hostname → tenant resolution used by API | Branding assets; white-label CSS; DNS/TLS; Nginx/Traefik routing |
| **Billing & Subscriptions** | Plans, entitlements, checkout intents, webhook-driven paid-state transitions, refund/reconciliation commands | Payment provider SDKs in the browser; Edge Function lifecycle; price trust from client payloads |
| **CRM & Customer Lifecycle** | Leads, contacts, funnel/opportunity state, assignment, dedupe keys, consent retention metadata | Outbound channel transport (WhatsApp/e-mail); n8n as source of truth |
| **Communications** | Message intent, template/recipient/consent resolution, outbox records, delivery-status aggregation | Evolution/Meta/SMTP transport adapters (live in Integrations/worker); AI-authored free-form sends without policy |
| **Automations** | Schedule/outbox claims, idempotent handlers for product automations, dead-letter policy at domain level | Worker process bootstrap; co-starting with SSR; arbitrary HTTP cron without machine auth |
| **Integrations** | Adapter interfaces, signed webhook intake contracts, provider credential references (server-side), replay/idempotency envelopes | Domain state machines belonging to Billing/CRM/Support; privileged browser calls |
| **Support** | Tickets, ticket messages/events, SLA policy application, operator assignment, public-to-authenticated handoff, status/incident subscriber preferences (product side) | Public SSR status pages as HTML; monitoring infrastructure; clinical or payment disputes |
| **Audit & Compliance** | Append-only audit events for sensitive actions; correlation/idempotency fields; retention classification hooks | Application logs as the only trail; storing secrets or full PII dumps |
| **AI Runtime** | Model gateway contracts, registered tools, policy gates, streaming vs durable job split, cost/eval hooks | Arbitrary SQL/HTTP; service-role in prompts; Phase 6 platform build before gates |

Cross-cutting expectations (all modules, when implemented later):

- Tenant active context derived on the server (session + hostname), never from client-supplied IDs as authorization.
- Use cases publish durable jobs; workers execute them outside the web lifecycle.
- RLS remains defense in depth; application policy remains primary for complex rules ([`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)).

---

## 2. What stays in TanStack temporarily

Aligned with [`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md) and ADR-002 (Proposed).

| Concern | Temporary TanStack home | Exit condition (later phases) |
| --- | --- | --- |
| Public SSR / marketing / white-label pages | `platform-web` / `tenant-web` surfaces (today: single Start app) | Traffic split by app image; still no domain rules in UI |
| Authenticated UI shells and forms | Current `_authenticated` routes → future `app-web` | Screens call typed API client; no privileged DB imports in components |
| Thin BFF / `createServerFn` adapters | Existing ~331 server-fn files and route handlers | Adapter delegates to Nest use case; then removed after evidence window |
| Hostname helpers for rendering | `src/lib/subdomain.ts`, client maps | API owns authoritative tenant resolution for mutations; web may cache display config |
| Release markers / public version GET | Public smoke routes | Operational health moves to api/worker readiness without owning product domain |
| Legacy HTTP surface (~111 `src/routes/api/*`) | Strangler facade | One contract at a time compared and cut over ([`PHASE-3-API.md`](../PHASE-3-API.md)) |
| Co-started workers (Pulsonitor, Colors) | Observed legacy coupling | Independent `worker` images only after Phase 5 gate — **do not “fix” by starting workers under Nest** |

React components must not import privileged database access. New domain use cases must not be invented in TanStack after the Phase 1/3 gates; until then, legacy behavior stays characterized in place.

---

## 3. Suggested first pilot vertical slice

> **Formalized:** Phase 1 track P1-H chose this slice in [`../phase-1/PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md). Below remains the paper rationale; executable scope/test plan live in that file.

### Recommendation: Support — create ticket + operator list/update (J-13 core path)

**Pilot name (paper):** `support.ticket.create` → `support.ticket.list` → `support.ticket.update-status` (authenticated operator), with audit event on mutation.

**In scope (conceptual):**

1. Untrusted or lightly trusted submission of a support ticket (validation, abuse limits as contract, tenant/platform attribution without trusting client `company_id` as auth).
2. Authenticated support/operator membership check.
3. List tickets visible to the actor’s tenant (or platform scope if proven).
4. Status transition with audit trail fields (actor, tenant, correlation id, decision).
5. Contract tests: allow tenant A / deny tenant B; deny missing membership; deny inadequate role.

**Explicitly out of pilot scope:** payment disputes, clinical records, AI triage, WhatsApp/e-mail delivery, status-page webhooks/RSS, SLA engine completeness, n8n dispatch.

### Why this slice (product-map rationale)

| Criterion | Evidence |
| --- | --- |
| Non-payment / non-clinical / non-AI | J-05, J-08, J-14 excluded by Phase 1 rule ([`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)) |
| Real product surface | J-13 registered; Impulsionando surfaces include support/status ([`TENANTS-AND-SURFACES.md`](../../01-current-state/product-map/TENANTS-AND-SURFACES.md)); STATIC files exist |
| Crosses required layers | Public or form UI → validation → authz → DB → audit → (later) deploy observability — without requiring provider ownership |
| Bounded module | Maps cleanly to **Support**; avoids early Billing/AI Runtime |
| Lower coupling than J-04 | Acquisition (J-04) quickly pulls Communications/CRM notifications and eventual checkout; Support ticket core can stay write+read+policy first |
| Aligns with Impulsionando sequencing | Clarifications place J-13 on the Impulsionando track after foundations ([`CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)); pilot is the *API extraction* candidate, not a claim that J-13 is the next live characterization |

### Alternatives considered (not first)

| Candidate | Why not first |
| --- | --- |
| J-04 lead create (CRM) | Platform-priority attractive, but notification/dedupe ownership `UNKNOWN` and handoff toward J-05 |
| J-02/J-03 identity+membership alone | Foundational contracts are prerequisites, not a full vertical product slice; must be defined before pilot code, but pilot should exercise a business module |
| Status subscribe/webhooks only | Heavier Integrations/Automations surface; consumer/retry ownership largely `UNKNOWN` |
| Colors/WMP/Chrismed verticals | Tenant-specific; clinical or money adjacent; contradicts “first vertical” guidance |

**Prerequisite paper work before any future implementation:** Phase 1 identity/membership naming, RBAC vocabulary, and Support system-of-record confirmation from Phase 0 evidence (today many J-13 proofs remain `UNKNOWN`).

---

## 4. Contract / versioning sketch (Zod / OpenAPI — sketch only)

> Sketch for Phase 1 discussion. Not executable contracts. No package layout is authorized.

### Placement (target, Proposed)

- Shared schemas live later in `packages/contracts` ([`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md)).
- Nest exposes OpenAPI generated from the same Zod (or Zod→OpenAPI) sources.
- Frontends consume a typed client generated from the published contract — never from Nest internals.

### Versioning sketch

```text
/api/v1/...          # first public Nest surface
/api/v1/support/...  # module-prefixed resources
```

- **URL major version** (`v1`) for breaking HTTP shapes.
- **Schema version** field optional on events/jobs (`schemaVersion: 1`).
- Additive fields preferred; removals require a new major or a dated deprecation window.
- Legacy TanStack routes may remain unversioned facades that *delegate* to v1 use cases during strangler coexistence ([`PHASE-3-API.md`](../PHASE-3-API.md)).

### Envelope sketch (illustrative)

```text
Request:
  headers: Authorization | cookie session, X-Correlation-Id, Idempotency-Key (mutations)
  body: Zod-validated DTO (no privileged fields from client)

Success:
  { data: T, meta?: { correlationId, requestId } }

Error:
  { error: { code, message, details?, correlationId } }
  // stable machine codes: UNAUTHENTICATED, FORBIDDEN, VALIDATION_FAILED,
  // NOT_FOUND, CONFLICT, IDEMPOTENCY_REPLAY, INTERNAL
```

### Pagination / filtering sketch

```text
GET /api/v1/support/tickets?cursor=&limit=&status=
→ { data: Ticket[], meta: { nextCursor?, correlationId } }
```

### Job / event sketch (domain → queue)

```text
SupportTicketCreatedV1 {
  schemaVersion: 1
  eventId, occurredAt, tenantId, actorId?, correlationId
  ticketId, source
}
```

Workers consume envelopes; domain modules own transition rules. Queue technology remains ADR-005 Proposed (Supabase Queues / pgmq).

### Compatibility rule

No dual-write without an explicit reconciliation plan. Characterization tests of legacy behavior precede cutover.

---

## 5. Mapping examples (STATIC filenames → future module)

Evidence level: **STATIC** (repo paths). Not proof of production traffic, auth correctness, or system of record.

| Legacy surface (STATIC path) | Likely future module | Notes |
| --- | --- | --- |
| `src/routes/api/public/support/create-ticket.ts` | Support | Public ticket create candidate for pilot facade |
| `src/lib/support-tickets.functions.ts` | Support | Server-fn / domain logic today; future adapter → Nest use case |
| `src/routes/abrir-ticket.tsx` | Support (UI stays TanStack) | Form UI remains web; submit via BFF→API later |
| `src/routes/_authenticated/support.cockpit.tsx` | Support (UI) | Operator UI; list/update calls move to API |
| `src/routes/_authenticated/admin.support-ticketing-health.tsx` | Support + Audit | Health/admin; audit of privileged reads later |
| `src/routes/api/public/cron/support-tick.ts` | Automations (+ Support) | Cron/tick → durable job; not Nest HTTP forever |
| `src/routes/api/public/status.ts` | Support (status read) / later tenant-web SSR | Public status JSON; keep SSR/HTML in web |
| `src/routes/api/public/status-subscribe.ts` | Support + Integrations | Subscriber prefs + webhook delivery boundary |
| `src/routes/api/public/hooks/status-webhooks.ts` | Integrations | Signed outbound/inbound machine path |
| `src/routes/api/public/demo/feira-lead.ts` | CRM | Lead intake example — **not** pilot |
| `src/routes/api/public/hooks/marketing-lead-notify.ts` | CRM → Communications | Notify side effect; keep out of first slice |
| `src/routes/api/public/cron/crm-touch-dispatch.ts` | Automations + CRM | Job coupling; Phase 5 territory |
| `src/integrations/supabase/auth-middleware.ts` | Identity (consumed by all) | Session attach; Nest will re-validate per request |
| `src/lib/subdomain.ts` | Tenants (resolution) + web rendering | Display vs authoritative mutation context |
| Edge: `billing-create-payment`, `mpago-*`, `core-initial-checkout-*` | Billing | Explicit non-pilot; Edge stays until Phase 5 strategy |
| Edge: `chrismed-communication-worker` | Communications / clinical vertical | Non-pilot; health-adjacent |
| Workers: `pulsonitor-worker.mjs`, `colors-automation-worker.mjs` | Automations / Integrations | Must not share Nest or SSR lifecycle |

---

## 6. Non-goals and do-not-implement banner

### Banner

```text
DO NOT IMPLEMENT NEST YET
────────────────────────────────────────────────────────────
Phase 0 CLOSED. Phase 1 contracts/foundation only.
Support pilot formalized: docs/reengineering/04-migration/phase-1/PILOT-SUPPORT.md
(still contract + test plan — NOT Nest implementation).

Forbidden until Phase 1+2 gates (+ accepted ADRs where required)
and Phase 3 authorization:

  • NestJS app bootstrap (apps/api)
  • pnpm workspace / packages/* creation for Nest
  • Installing Nest/Fastify/OpenAPI dependencies for this design
  • Dokploy, Traefik, Cloudflare, or VPS changes
  • DB schema renames (company_id → tenant_id) or migrations
  • Rewriting createServerFn / route handlers to “match” this paper
  • Re-enabling contained workflows without a recorded decision
  • Treating Proposed ADRs as implementation license
────────────────────────────────────────────────────────────
```

### Non-goals of this paper

- Selecting final REST paths, status codes, or OpenAPI files.
- Approving module owners or RBAC matrices (Phase 1 work item).
- Proving `company_id` ≡ tenant for every table.
- Designing Chrismed, Colors money webhooks, or AI tool registries.
- Specifying Dockerfiles, GHCR tags, or staging topology beyond the companion paper sketch.
- Declaring J-13 characterization complete.

---

## 7. Dependencies (Phase 0 exit done; Phase 1 contracts open)

Phase 0 exit is recorded ([`STATUS.md`](../../STATUS.md)). Remaining gaps below still constrain Nest implementation and full J-13 characterization; the Support **pilot choice** is formalized in [`PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md).

| Dependency | Why Nest still needs it | Current signal |
| --- | --- | --- |
| Inventories / critical owners | Module ownership and strangler order | Many owners still `UNKNOWN` |
| Support system of record + PII/abuse posture | Pilot SoT tables and retention | J-13 missing proof ([`JOURNEYS.md`](../../01-current-state/product-map/JOURNEYS.md)); pilot SoT hypothesis in PILOT-SUPPORT |
| Auth/session allow+deny (J-02) | Identity contracts; pilot authz tests | `STATIC` plan in AUTH-SESSION-TRACE; execution pending non-prod fixtures |
| Membership / role / module model (J-03) | Tenant canonical naming before Nest policies | Belief `company_id` ≈ tenant; P1-C/D contracts in flight |
| Job/webhook consumer map (incl. `support-tick`, status hooks) | HTTP facade vs Automations/Integrations | Consumers largely `UNKNOWN`; status/* out of pilot scope |
| Publish authority + rollback (J-15) | Later deploy of api/worker | Operational proof still open |
| Backup + isolated restore (J-16) | No schema/API migration without recovery | Backup confirmed; restore isolated pending (P1-I) |
| Data classification for support messages | Audit retention hooks | Treat all data as real ([clarifications](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)) |

Phase 1 exit: ADRs accepted, executable contracts, pilot module chosen (Support / PILOT-SUPPORT), base auth/tenant tests in non-prod ([`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)). Phase 3 implements the Nest pilot — not this paper and not Phase 1 alone.

### Definition of Done reminder

Any future migrated Support slice must satisfy [`DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md): contract validation, allow/deny multi-tenant tests, audit on sensitive actions, correlation IDs, staging smoke, SHA-identified image, rollback — not “Nest boots locally.”

---

## Related documents

- [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md)
- [`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)
- [`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md)
- [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)
- [`TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md)
- [`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)
- [`../phase-1/PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md) (P1-H formal pilot)
- [`PHASE-3-API.md`](../PHASE-3-API.md)
- [`API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md)
- Product map: [`SYSTEM-AND-ACTORS.md`](../../01-current-state/product-map/SYSTEM-AND-ACTORS.md), [`JOURNEYS.md`](../../01-current-state/product-map/JOURNEYS.md), [`CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)
- [`PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md)
