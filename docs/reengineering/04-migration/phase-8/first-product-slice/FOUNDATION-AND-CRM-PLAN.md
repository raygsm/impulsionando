# Nest foundation and first CRM/Growth slice

Created: **2026-09-04**
State: **PLANNED — not authorized**
Context: [`AGENT-CONTEXT.md`](./AGENT-CONTEXT.md) · Contracts: [`CONTRACTS-AND-DATA.md`](./CONTRACTS-AND-DATA.md)

## Strategy

One agent may own the sequence for continuity, but delivery is split:

```text
Unit A — authority and composition
  contracts → common Nest enforcement → identity session
  → capability/module registry → dashboard manifest
  → Next consumes it → Home/actions/Support/comms/Growth read proof

Unit B — first product loop
  Contact → Lead → Follow-up Task → Opportunity/Stage → Conversion
  → Growth projection → Next pages/widgets → governed AI READ tools
```

Unit A is reviewed and merged before Unit B introduces CRM writes.

# Unit A — Nest foundation and dashboard composition

## A0 — Reconcile the frontend after it lands

After PR #151 lands:

1. inspect actual `apps/app-web`, `packages/api-client`, `packages/auth`, `packages/config` and `packages/contracts/src/dashboard.ts`;
2. compare them with accepted ADR-009 and the product architecture;
3. list transitional components clearly:
   - local module catalog;
   - local fixture manifest;
   - BFF routes;
   - any auth fallback;
4. retain the shell/design; do not rebuild it;
5. plan the smallest changes that replace local authority with Nest responses.

The preview fixtures remain development-only visual evidence. They are not tenant configuration.

## A1 — Contracts first

Add or consolidate runtime Zod contracts:

| Contract | Required contents |
| --- | --- |
| `identity` | Session user, membership, active tenant, role/capability set, staff/observer modes |
| `capability` | `{domain}.{resource}.{action}` keys, role expansion result, deny reason |
| `module-registry` | Key, version, mandatory/optional, dependencies, dashboard contributions, setup/readiness |
| `blueprint` | Niche preset metadata and compiled proposal; fixture-only in Unit A |
| `dashboard` | Manifest, widgets, navigation, action definitions, degraded/unknown states |
| `agent` | Agent kind/summary; internal-agent availability only, no new effects |

Rules:

- extend existing contracts rather than define conflicting types;
- maintain compatibility with PR #151's dashboard contract;
- use a `version` where persisted/configurable shape will evolve;
- one source of truth consumed by API and Next;
- contract tests land in the same commit.

## A1b — Read-only staging schema baseline (F-DATA)

Complete Phase 8 F-DATA during Unit A, before A8 reads any legacy source:

1. regenerate **new-stack** types from staging ref `aamorcqznimmleafavai`;
2. do not replace legacy `src/integrations/supabase/types.ts` in this work;
3. record the delta between generated, migration and observed staging objects;
4. verify tenant columns, primary keys, RLS and relevant functions for every object used by A8;
5. mark unresolved objects UNKNOWN and exclude them from the read projection.

This is read-only schema evidence, not a migration.

## A2 — Nest common enforcement

Introduce shared infrastructure without replacing the app:

```text
apps/api/src/common/
  authz/
  tenant/
  validation/
  errors/
  correlation/
  audit/
  idempotency/
  data/
```

Deliver:

- `@Public()`;
- `@RequireCapability(...)`;
- tenant-scoped route metadata/decorator;
- request-scoped actor and tenant context;
- Zod validation pipe/helper;
- standard success/error envelopes;
- correlation ID interceptor;
- capability/tenant/resource guards;
- audit port/interceptor;
- `apps/api/src/common/tenant-column.registry.ts` plus tenant-scoped repository base.

### Compatibility rollout

Do not suddenly place all existing endpoints behind new rules.

1. new Unit A endpoints use the common layer from day one;
2. existing endpoints are inventoried;
3. guard decisions run in log-only mode where compatibility is uncertain;
4. existing Phase 3–6 smokes run;
5. S2 decisions run in log-only mode and produce the evidence required by Phase 8 G2;
6. enforcement expands only **after G2 explicitly passes**.

An undecorated **new** handler fails an automated policy test.

## A3 — Identity/session composition

Implement:

```http
GET /api/v1/identity/session?host=<request-host>
POST /api/v1/identity/session/active-tenant
GET /api/v1/identity/memberships
```

The session response includes:

- user identity;
- memberships;
- active tenant;
- explicit staff/observer/impersonation mode;
- effective capability keys;
- correlation ID.

Selection algorithm:

```text
authenticated actor
  ∩ requested host tenant (when tenant-bound)
  ∩ membership
  ∩ requested active tenant (if supplied)
  → exactly one validated context or deny
```

No `localStorage` tenant selection authorizes the API. Staff delegation and observer mode are explicit and audited.

During legacy/Next coexistence, implement the session continuity plan from [`../STRANGLER-ROUTING.md`](../STRANGLER-ROUTING.md): shared cookie compatibility, one refresh owner, sign-out clears both session representations, and a staging user can cross route owners without re-authentication. Password-reset canonical host must already be closed at G0.

## A4 — Effective module registry

Create one registry for Dashboard V1 keys:

```text
dashboard growth contacts crm campaigns retention
communications tasks team agenda operations
catalog sales inventory finance documents billing payments
help internal-agent client-agent reports
```

Do not create empty Nest modules for all keys. The registry describes the product; only implemented services route traffic.

Effective state:

```text
mandatory
+ blueprint default
∩ plan entitlement
+ company override
∩ dependency satisfaction
∩ integration readiness
∩ safety policy
→ NOT_ENTITLED | CONFIGURING | READY | ACTIVE | DEGRADED | SUSPENDED | DISABLED
```

Build on `TenantEntitlementsService`; do not create a parallel entitlement authority.

## A5 — Blueprint compiler, pure/dry-run

Implement deterministic fixture compilation for:

- restaurant;
- medical clinic;
- real estate.

Input:

- blueprint version;
- plan entitlements;
- company overrides;
- integration readiness;
- role/capability set.

Output:

- proposed modules/states;
- dashboard contributions;
- missing requirements/conflicts;
- internal-agent proposal;
- no database writes.

Persist/apply is out of Unit A.

## A6 — Dashboard manifest

Implement:

```http
GET /api/v1/dashboard/manifest
```

The manifest includes:

- tenant branding/niche;
- stable primary navigation;
- visible module destinations;
- widget definitions;
- deterministic action definitions;
- module activation/readiness;
- internal-agent summary;
- degraded/unknown reasons;
- version, generated-at and correlation ID.

The endpoint applies both:

- tenant/module/readiness rules;
- requesting-user capabilities.

Forbidden modules/widgets are absent from the payload, not only hidden by Next.

## A7 — Next integration

Replace transitional local authority in `apps/app-web`:

| Transitional frontend element | Unit A destination |
| --- | --- |
| Local fixture manifest | Development preview only |
| Local module catalog used for production composition | Nest manifest |
| Client-computed entitlement/navigation logic | Nest manifest |
| Local tenant selection as authority | Nest identity/session |
| Raw fetch/error handling | `@impulsionando/api-client` contracts |

Preserve:

- imported Next shell and visual components;
- invariant IA;
- loading/empty/configuring/degraded/error states;
- tenant branding tokens;
- thin BFF only where cookie/bearer bridging requires it.

Next route handlers/server actions contain no domain rules.

## A8 — Read-only product proof (8D / P1–P3)

Unit A must close Phase 8's read-only prerequisite before G3 can authorize CRM writes.

Implement/consume:

```http
GET /api/v1/dashboard/home?from=&to=&timezone=
GET /api/v1/dashboard/actions
GET /api/v1/support/tickets               # existing
GET /api/v1/communications/inbox          # new read projection
GET /api/v1/growth/overview               # read-only baseline; no CRM writes yet
```

The first dashboard proof includes:

- Home daily briefing inputs;
- deterministic attention/action queue;
- Help/Tickets UI over the existing Nest `support_tickets` contract;
- notifications/communications delivery projection with no send path;
- read-only Growth/Contacts/CRM summary from characterized legacy sources;
- internal-agent READ tools only where current authorization and source freshness are proven.

Every metric is reconciled against its source and distinguishes zero from UNKNOWN. This step provides the 8D/P1–P3 evidence required by G3; it does not claim the CRM write model is canonical.

## A9 — Existing-write safety proof for G3

Use the existing Support status transition as the non-CRM write required by Phase 8 G3:

```http
PATCH /api/v1/support/tickets/:ticketId/status
```

Harden/verify it through the Unit A common layer:

- authorized staff/capability only;
- repeated idempotency key does not create duplicate transition effects;
- audit record includes actor, resource, before/after and correlation ID;
- cross-tenant/non-staff deny;
- existing Support contract remains compatible.

This is compatibility/safety work on an existing endpoint, not the opening of a new CRM domain write.

## Unit A exit

Unit A is complete when:

1. three niche fixtures produce different manifests from one API implementation;
2. two roles in one tenant produce appropriately different manifests;
3. cross-tenant and unauthorized access return 403;
4. Next renders the manifest with no production reliance on local fixture composition;
5. existing Phase 3–6 API tests/smokes remain compatible;
6. G2 has explicitly authorized and proven capability enforcement;
7. Home/actions, Support, communications and baseline Growth reads satisfy 8D/P1–P3 evidence;
8. the Support status transition supplies G3's idempotency/audit/correlation write proof;
9. `npm run phase8:routes:check` passes before and after the ownership rehearsal;
10. session continuity and sign-out work across legacy/Next route owners;
11. no CRM write or database migration was added;
12. route ownership and rollback are documented.

# C0 — CRM characterization between units (read-only)

## C0.1 — Characterize before modeling

After Unit A/F2, the same agent may perform this read-only characterization **before G3**. This is preparation, not Unit B implementation and creates no CRM writes. Before defining canonical entities:

1. consume/refresh the Unit A F-DATA baseline and inspect CRM-specific staging shapes, constraints, RLS and functions read-only;
2. identify current sources for leads, contacts/customers, opportunities, stages and activities;
3. trace legacy routes/functions for capture, follow-up, stage move and conversion;
4. identify current user-facing behavior, including empty/error states;
5. identify any external writers, webhooks, cron or n8n dependencies;
6. classify every source object:
   - KEEP;
   - ADAPT;
   - MIGRATE;
   - MERGE;
   - RETIRE;
   - UNKNOWN.

No canonical model is chosen by table name alone.

# Unit B — first CRM and Growth vertical

Unit B starts only after the C0 packet is accepted and Phase 8 G3 explicitly authorizes writes.

## B1 — Minimum aggregate boundaries

Implement only:

| Aggregate/module | Unit B scope |
| --- | --- |
| Contacts | Person/organization identity, contact points, consent summary and timeline reference |
| Leads | Source, status, qualification, owner and contact link |
| Tasks | Follow-up action, owner, due date, priority and completion |
| Opportunities | Pipeline, stage, value, owner and conversion/loss |
| Growth projection | Acquisition, uncontacted/overdue, qualification, conversion and freshness |

Do not add campaign dispatch, WhatsApp, agenda, payment or retention automation.

## B2 — Nest CRM endpoints

Implement tenant-scoped application services and endpoints from [`CONTRACTS-AND-DATA.md`](./CONTRACTS-AND-DATA.md). Extract pure transition, deduplication and metric rules into `packages/domain/src/crm/`; Nest orchestrates those rules and repositories.

Required behavior:

- pagination/filter/sort contracts;
- server tenant filter on every query;
- capability checks per action;
- idempotency key on capture/create where replay can occur;
- optimistic concurrency/version check on stage changes;
- audit on assignment, stage, conversion and sensitive edits;
- outbox event in the same mutation boundary;
- no provider calls.

## B3 — Next CRM/Growth experience

Deliver:

```text
/growth
/customers
/customers/:contactId
/crm/leads
/crm/leads/:leadId
/crm/pipeline
/tasks or /operations/tasks
```

`/customers` is the user-facing route name; it consumes the canonical `/contacts` API. It must not create a second Customer aggregate.

Minimum UX:

- capture lead;
- list/filter leads;
- lead detail and linked contact;
- assign owner;
- create/complete follow-up;
- pipeline board/list;
- move stage with conflict feedback;
- convert/lost outcome;
- Growth summary and freshness;
- empty, forbidden, unknown, degraded and error states.

Reuse approved design artifacts when available. Do not invent a second shell.

## B4 — Growth projection

Expose:

```http
GET /api/v1/growth/overview?from=&to=&timezone=
```

Minimum output:

- leads captured;
- leads by source;
- uncontacted;
- overdue follow-ups;
- qualified;
- converted;
- conversion value when trustworthy;
- freshness/source for every metric.

Missing source/value is UNKNOWN, not zero.

## B5 — Agent read tools

Extend the existing governed Nest tool registry:

```text
crm.leads.list
crm.leads.get
crm.followups.overdue
crm.opportunities.summary
growth.overview.get
contacts.get
```

Requirements:

- READ only;
- tenant context comes from server;
- requesting user's capability rechecked inside each tool;
- model-provided tenant ID ignored/rejected;
- minimized output;
- source/freshness surfaced;
- cross-tenant deny and prompt-injection tests.

Do not enable write/effect tools.

## B6 — Route ownership and legacy retirement

Do not leave new and legacy as two write authorities.

Cut over the aggregate boundary together:

1. deploy new code inert;
2. run parity/allow/deny/idempotency tests;
3. flip planned prefixes through the Phase 8 ownership manifest;
4. observe;
5. rehearse rollback;
6. retire corresponding legacy write paths/server functions;
7. retain read compatibility only when explicitly documented.

If legacy or n8n continues writing the same tables, record it as an explicit writer and reconcile before authority moves.

## Unit B exit

Unit B is complete only when the full lifecycle works on staging:

```text
capture lead
  → create/link contact
  → assign follow-up
  → advance opportunity
  → convert
  → Growth summary changes
  → business agent explains the result
```

And:

- allow and cross-tenant/role deny pass;
- replay does not duplicate capture;
- stage concurrency conflict is visible;
- audit and outbox rows exist;
- Growth values reconcile with the underlying records;
- Next contains no direct CRM table access;
- agent tools remain READ-only;
- rollback is rehearsed;
- legacy write ownership is closed or explicitly blocks PASS.
