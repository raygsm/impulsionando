# P1-H — Support pilot (J-13) contract + test plan

Opened: 2026-08-30  
Status: **FORMALIZED + ACCEPTED** (2026-08-30 — Cauã + Raygs; Support = Phase 1/3 pilot)  
Evidence level for legacy map: **STATIC**  
Nest implementation: **NOT AUTHORIZED** (Phase 3 after Phase 1 residual exit + Phase 2 staging healthy)

Authority: [`docs/reengineering/`](../../README.md). Conflict order per program rules. Companion paper: [`../exploratory/NEST-DOMAIN-PAPER-DESIGN.md`](../exploratory/NEST-DOMAIN-PAPER-DESIGN.md). HTTP envelope conventions: [`CONTRACT-HTTP-API.md`](CONTRACT-HTTP-API.md) (P1-E; this sketch must stay compatible).

---

## 1. Why Support is the pilot

Selected per Phase 1 rule — first vertical must be **non-payment, non-clinical, non-AI** ([`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)) — and formalized from the exploratory recommendation:

> **Pilot name (paper):** `support.ticket.create` → `support.ticket.list` → `support.ticket.update-status` (authenticated operator), with audit event on mutation.  
> — [`NEST-DOMAIN-PAPER-DESIGN.md`](../exploratory/NEST-DOMAIN-PAPER-DESIGN.md) §3

| Criterion | Why Support wins |
| --- | --- |
| Safety class | Avoids J-05 payments, clinical surfaces, and J-14 AI |
| Real product surface | J-13 registered; Impulsionando support/status surfaces exist ([`JOURNEYS.md`](../../01-current-state/product-map/JOURNEYS.md)) |
| Layer coverage | Form/API → validation → AuthZ → DB → audit → (later) deploy observability |
| Bounded module | Maps to **Support**; does not force Billing or AI Runtime |
| Lower coupling than J-04 | Lead create pulls Communications/CRM/checkout; ticket core stays write+read+policy first |

This document **chooses** Support formally for Phase 1 exit (“módulo piloto escolhido”). It does **not** authorize Nest bootstrap, schema changes, or production cutover.

---

## 2. In scope (pilot use cases)

Three use cases only. Names are stable for contracts and tests; HTTP paths are the Phase 3 target sketch.

| Use case | Actor | Behavior |
| --- | --- | --- |
| `support.ticket.create` | Public (unauthenticated) **or** authenticated requester | Validate payload; attribute tenant/platform **without** trusting client `company_id` as authorization; persist ticket; return opaque id/protocol; emit audit on success |
| `support.ticket.list` | Authenticated support/operator (or proven platform staff) | List tickets visible to actor’s tenant scope (or platform scope if capability proven); cursor pagination; no cross-tenant rows |
| `support.ticket.update-status` | Authenticated operator with capability | Allowed status transition; write audit event (actor, tenant, correlation id, from→to, decision); reject illegal transitions |

**Cross-cutting (required on every mutation):**

- Runtime contract validation (Zod / equivalent shared schema).
- `X-Correlation-Id` (or server-generated) on request/response/error.
- Append-only audit record for create and update-status (not “log line only”).
- Idempotency-Key on create and update-status when clients retry (envelope per P1-E / P1-F).

**System-of-record hypothesis (STATIC, unproven):** primary tables `support_tickets`, `support_ticket_events` (and messages later). Tenant key belief `company_id` — canonical naming deferred to [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md). Treat ticket body/contact fields as real PII ([clarifications](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)).

---

## 3. Out of scope

Explicit exclusions (paper §3 + journey surfaces beyond the core path):

| Area | Examples | Deferred to |
| --- | --- | --- |
| Payment / financial disputes | Checkout, MP webhooks, invoice close | Billing / Phase 5 |
| Clinical / RioMed niche tickets | `riomed_support_tickets`, Medicito ticket tools | Tenant verticals |
| AI triage / categorization | `support-tick` AI topic/summary, Impulsionito tools | Phase 6 / Automations |
| Omnichannel auto-open | `meta-colors` Iris → `support_tickets` | Communications + Integrations |
| Status page ecosystem | Public status JSON/RSS/badges, subscribe/unsubscribe, status webhooks/retries | Support status + Integrations (not first slice) |
| SLA engine completeness | `support_sla_policies` full application | Later Support |
| Messaging thread UX | Full `support_ticket_messages` product surface beyond audit of status change | Later Support |
| Cron tick / auto-close | `support-tick` waiting_customer auto-close | Automations |
| CSAT / email inbox | `support_csat_responses`, `support_email_inbox` | Later Support |
| Nest/Dokploy/monorepo | Any `apps/api` bootstrap | Phase 3 after Phase 1+2 |
| Prod writes / PII export | Characterization against live prod data | Forbidden |

---

## 4. Legacy entry points (STATIC)

Evidence: repo paths only. Not proof of production traffic, AuthZ correctness, or SoT completeness.

### 4.1 API routes (`src/routes/api`)

| Path | Role for pilot |
| --- | --- |
| `src/routes/api/public/support/create-ticket.ts` | **Pilot facade candidate** — public create |
| `src/routes/api/public/cron/support-tick.ts` | Out of scope (Automations + AI) |
| `src/routes/api/public/hooks/meta-colors.ts` | Out of scope (omnichannel ticket side effect) |
| `src/routes/api/public/hooks/impulsionito-train.ts` | Reads `support_tickets` counts — not pilot write path |
| `src/routes/api/public/status.ts` (+ `status.$slug*`, RSS, badge) | Out of scope (status publication) |
| `src/routes/api/public/status-subscribe.ts`, `status-unsubscribe.ts`, `status-preferences.ts`, `status-confirm.ts` | Out of scope |
| `src/routes/api/public/hooks/status-webhooks.ts`, `status-webhook-retries.ts`, `status-webhook-auto-disable.ts`, `status-subscribers*.ts` | Out of scope (Integrations) |

### 4.2 Server functions / libs

| Path | Role for pilot |
| --- | --- |
| `src/lib/support-tickets.functions.ts` | **Core legacy logic** — `createTicket`, `listTickets`, `updateTicketStatus` (+ messages/detail; messages not pilot) |
| `src/lib/support-ticketing-health.functions.ts` | Admin health — out of pilot mutate path |
| `src/lib/support-pro.functions.ts` | Adjacent / legacy contract drift — characterize before any adapter |
| `src/integrations/supabase/auth-middleware.ts` | Session attach for authenticated list/update |

### 4.3 UI surfaces (remain TanStack)

| Path | Role |
| --- | --- |
| `src/routes/abrir-ticket.tsx` | Public/form create UI |
| `src/components/support/SupportPage.tsx` | Shared support UI |
| `src/routes/_authenticated/support.cockpit.tsx` | Operator list/update UI |
| `src/routes/_authenticated/admin.support-ticketing-health.tsx` | Health admin (not pilot) |
| `src/routes/_authenticated/admin.suporte-pro.tsx`, `core.suporte.tsx`, `ajuda.tsx` | Adjacent support UX — not required for pilot contract |

### 4.4 Related tables (names only — STATIC)

Pilot SoT candidates: `support_tickets`, `support_ticket_events`.

Adjacent (not pilot mutate surface): `support_ticket_messages`, `support_ticket_topics_daily`, `support_sla_policies`, `support_sessions`, `support_csat_responses`, `support_email_inbox`, `riomed_support_tickets`.

RPCs observed in migrations/types (names only): `support_reopen_ticket` (and related ticket helper functions in support operational migrations).

---

## 5. Target API sketch (OpenAPI-ish)

Align with P1-E [`CONTRACT-HTTP-API.md`](CONTRACT-HTTP-API.md) and paper §4. Paths are **target** for Phase 3 Nest; legacy routes stay until strangler.

### Envelope

```text
Request headers:
  Authorization | cookie session   # required for list / update-status
  X-Correlation-Id                 # optional; server echoes or generates
  Idempotency-Key                  # required for create + update-status retries

Success:
  { "data": T, "meta": { "correlationId": "...", "requestId": "..." } }

Error:
  { "error": { "code": "...", "message": "...", "details"?: ..., "correlationId": "..." } }

Stable codes: UNAUTHENTICATED | FORBIDDEN | VALIDATION_FAILED |
  NOT_FOUND | CONFLICT | IDEMPOTENCY_REPLAY | INTERNAL
```

### Endpoints

```text
POST /api/v1/support/tickets
  Use case: support.ticket.create
  Auth: optional (public create) OR session (authenticated requester)
  Body (illustrative):
    {
      "subject": string,
      "description": string,
      "type"?: "question"|"technical"|...,
      "priority"?: "low"|"medium"|"high"|"critical",
      "requester"?: { "name": string, "email": string, "phone"?: string },
      "source"?: string,
      "page"?: string
    }
  Notes:
    - Do not accept client company_id / tenantId as authorization.
    - Tenant attribution from hostname + server policy (or null platform ticket).
  Response 201:
    { "data": { "id": uuid, "protocol": string, "status": "new" }, "meta": {...} }

GET /api/v1/support/tickets?cursor=&limit=&status=&priority=
  Use case: support.ticket.list
  Auth: required; capability support.ticket.read (name TBD in CONTRACT-RBAC)
  Response 200:
    { "data": TicketSummary[], "meta": { "nextCursor"?: string, "correlationId": "..." } }

PATCH /api/v1/support/tickets/{ticketId}/status
  Use case: support.ticket.update-status
  Auth: required; capability support.ticket.update_status
  Body:
    { "status": SupportTicketStatus, "reason"?: string }
  Response 200:
    { "data": { "id": uuid, "status": "...", "updatedAt": iso }, "meta": {...} }
  Side effect: audit event support.ticket.status_changed
```

### Ticket summary shape (sketch)

```text
TicketSummary {
  id, protocol, companyId?, subject, type, priority, status,
  createdAt, updatedAt, slaDueAt?
}
```

Status enum compatibility with legacy STATIC values in `support-tickets.functions.ts` / DB enums — freeze in shared contract when P1-E packages land; do not invent a second status vocabulary without an expand/contract plan ([`CONTRACT-MIGRATIONS.md`](CONTRACT-MIGRATIONS.md)).

### Audit event (mutation)

```text
SupportTicketAuditV1 {
  schemaVersion: 1
  eventId, occurredAt, tenantId?, actorId?, correlationId
  action: "support.ticket.created" | "support.ticket.status_changed"
  resourceType: "support_tickets"
  resourceId: string
  payload: { fromStatus?, toStatus?, source? }  # no full PII dump
}
```

Job fan-out (`SupportTicketCreatedV1` → queue) is **optional** for pilot readiness; if emitted, follow [`CONTRACT-EVENTS-JOBS.md`](CONTRACT-EVENTS-JOBS.md). Delivery to WhatsApp/e-mail remains out of scope.

---

## 6. AuthZ allow / deny matrix

Capabilities are provisional names pending [`CONTRACT-RBAC.md`](CONTRACT-RBAC.md). Session model per [`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md) (STATIC).

| # | Case | Expected |
| --- | --- | --- |
| A1 | Public create with valid payload | **allow** create; no session required |
| A2 | Public create with invalid/missing fields | **deny** `VALIDATION_FAILED` |
| A3 | Create with forged `company_id` / tenant in body | **deny** or ignore field — never authorize from client id |
| A4 | List without session | **deny** `UNAUTHENTICATED` |
| A5 | List with session + membership + `support.ticket.read` on tenant A | **allow** only tenant A rows |
| A6 | List with session on tenant A, filter/query aiming at tenant B | **deny** empty/`FORBIDDEN` — zero B rows |
| A7 | List with session, no membership / no capability | **deny** `FORBIDDEN` |
| A8 | Update-status as operator with capability on own-tenant ticket | **allow** + audit |
| A9 | Update-status on other tenant’s ticket | **deny** `FORBIDDEN` or `NOT_FOUND` (no leak) |
| A10 | Update-status as authenticated user without operator capability | **deny** `FORBIDDEN` |
| A11 | Update-status illegal transition | **deny** `CONFLICT` or `VALIDATION_FAILED` |
| A12 | Platform staff capability (if proven) listing cross-tenant | **allow** only if capability explicitly grants platform scope; otherwise deny |

RLS remains defense in depth; application policy is primary for complex rules ([`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)).

Executable Phase 1 baseline (T + RBAC + A1–A12 how-to / pass-fail): [`AUTH-TENANT-BASELINE-TESTS.md`](AUTH-TENANT-BASELINE-TESTS.md).

---

## 7. Test plan (non-prod only)

Aligned with [`DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md) and validation backlog item 15 ([`VALIDATION-BACKLOG.md`](../../01-current-state/product-map/VALIDATION-BACKLOG.md)).

### Fixture rules (hard)

- **No production PII export.** No dump of prod `support_tickets` / messages / requester emails.
- Use dedicated staging/local fixtures and synthetic emails (`+support-pilot@…` test domains).
- Two tenants minimum (A/B) with distinct `company_id` (or future tenant id) and operator accounts owned by Cauã/Raygs.
- Writes only against **non-prod** Supabase project / approved staging restore clone ([`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md)).
- Logs/assertions must not print full ticket descriptions or contact fields.

### Layers

| Layer | What | Pass criteria |
| --- | --- | --- |
| **Unit** | Validators, status transition table, tenant attribution helpers | Invalid payloads fail; illegal transitions rejected; client tenant id ignored |
| **Contract** | HTTP/OpenAPI or shared Zod fixtures for the three endpoints | Envelope + error codes match P1-E; request/response golden files for happy path |
| **RLS / DB policy** | As authenticated roles A/B against staging policies | A cannot SELECT/UPDATE B tickets; public insert path characterized without service-role in Nest (legacy may differ — document gap) |
| **AuthZ integration** | Cases A1–A12 against non-prod API or temporary characterization harness | Allow and deny both proven; evidence attached (timestamps, account ids — not secrets) |
| **E2E (non-prod)** | UI or HTTP: create → operator list sees ticket → update-status → audit row present | Correlation id visible; audit action codes match; no cross-tenant bleed |

### Characterization vs future Nest

Until Phase 3, tests may characterize **legacy** `create-ticket` route + `support-tickets.functions.ts` behavior as the baseline. Contract tests for `/api/v1/support/...` become binding when Nest exists; until then they are **executable fixtures against the agreed schema**, not a license to implement Nest.

### Open proof (keep UNKNOWN until closed)

- Support SoT confirmation and abuse limits (J-13 missing proof).
- Exact operator role/capability mapping in live RBAC.
- Whether platform staff cross-tenant list is intentional product behavior.

---

## 8. Strangler steps (later — not Phase 1 code)

Order from [`PHASE-3-API.md`](../PHASE-3-API.md) and paper §2. Phase 1 only records the plan.

1. **Freeze contract** — shared schemas for the three use cases (packages/contracts when authorized).
2. **Characterize legacy** — golden responses for `create-ticket` + serverFn list/update; note service-role vs RLS gaps.
3. **Nest use cases** (Phase 3) — implement Support module handlers behind `/api/v1/support/...`; no dual-write without reconciliation plan.
4. **serverFn / route adapter** — `support-tickets.functions.ts` and `create-ticket.ts` become thin facades that call Nest (or typed client) with the same correlation/idempotency headers.
5. **UI switch** — `support.cockpit` / `abrir-ticket` consume typed client; no privileged DB in components.
6. **Compare window** — parity + telemetry; then retire facade after evidence window.
7. **Leave out-of-scope routes** (status/*, support-tick, meta-colors) on legacy until their own strangler tickets.

---

## 9. Exit criteria — pilot **readiness** (still not “ship Nest”)

Phase 1 pilot track is ready when **all** below are true. Satisfaction does **not** mean Nest boots or traffic moves.

| # | Criterion | Evidence |
| --- | --- | --- |
| R1 | Support chosen as first vertical in writing | This file + Phase 1 workboard P1-H |
| R2 | Scope / out-of-scope frozen | §§2–3 |
| R3 | Legacy STATIC map attached | §4 |
| R4 | HTTP sketch compatible with P1-E | §5 ↔ `CONTRACT-HTTP-API.md` |
| R5 | AuthZ allow/deny cases listed | §6 |
| R6 | Non-prod test plan + fixture rules | §7 |
| R7 | Strangler sequence recorded | §8 |
| R8 | Dependencies acknowledged | Tenant identity + RBAC + events/audit contracts (P1-C/D/F); staging restore plan (P1-I) |
| R9 | No Nest / monorepo / Dokploy / schema rename performed under this track | Working tree / PR review |

**Not exit criteria for P1-H:** Nest app exists; GHCR image; production smoke; full J-13 characterization (status subscribe, webhooks, SLA); Definition of Done for a *migrated* feature (that is Phase 3+ DoD).

When Phase 3 starts, migrated Support slice must still meet full [`DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md): contract validation, allow/deny multi-tenant tests, audit on sensitive actions, correlation IDs, staging smoke, SHA image, rollback — not “Nest boots locally.”

---

## Related

- [`../PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)
- [`README.md`](README.md) (workboard)
- [`../exploratory/NEST-DOMAIN-PAPER-DESIGN.md`](../exploratory/NEST-DOMAIN-PAPER-DESIGN.md)
- [`../../01-current-state/product-map/JOURNEYS.md`](../../01-current-state/product-map/JOURNEYS.md) (J-13)
- [`../../01-current-state/product-map/VALIDATION-BACKLOG.md`](../../01-current-state/product-map/VALIDATION-BACKLOG.md)
- [`../../01-current-state/phase-0/AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md)
- [`../../05-governance/DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md)
- [`../PHASE-3-API.md`](../PHASE-3-API.md)
