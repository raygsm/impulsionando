# Dashboard-first implementation plan

Created: **2026-09-04** · State: **PROPOSED — no implementation authorization**
Index: [`README.md`](./README.md) · Phase 8: [`../04-migration/phase-8/README.md`](../04-migration/phase-8/README.md)

Concrete authoritative Phase 8 sequence: [`../04-migration/PHASE-8-CORE-APP.md`](../04-migration/PHASE-8-CORE-APP.md). Detailed first slice: [`../04-migration/phase-8/first-product-slice/README.md`](../04-migration/phase-8/first-product-slice/README.md) — Nest authority/composition first, then one CRM/Growth lifecycle consumed by the accepted frontend.

## 1. Delivery principle

Build one coherent dashboard path before broad module migration:

```text
tenant + session
  → effective capabilities
  → dashboard manifest
  → real growth/operations read model
  → internal business agent explains it
  → one audited prepared action
```

This proves the product thesis. Migrating dozens of disconnected legacy pages does not.

## 2. Relationship to Phase 8

The Phase 8 technical foundations remain valid, independent of the final frontend framework:

- real `apps/app-web` runtime (Next.js if ADR-009 is accepted; otherwise ADR-002's TanStack Start remains authoritative);
- typed API client, auth, config, UI and observability packages;
- Nest common authorization/audit layer;
- server-computed entitlements;
- route-ownership strangler;
- full-SHA images and staging evidence.

Phase 8 has been rebaselined to consume this work as **PROPOSED detail behind explicit gates**:

| Current Phase 8 emphasis | Revised emphasis if this proposal is accepted |
| --- | --- |
| Dashboard, Support and Notifications as first read slices | **Dashboard composition + Growth + Contacts/CRM + Tasks + Agent** as one product proof; Support reused inside it |
| Modules listed mainly as migration slices | Modules implement a formal contribution/activation contract |
| AI as one later staff/platform surface | Internal agent is mandatory in Dashboard V1; client agent optional; Impulsionito remains platform-scoped |
| Niche/verticals deferred | Vertical packs remain deferred, but **niche blueprints** are core configuration implemented early |
| CRM, agenda, sales, finance migrate in route order | Growth loop determines priority; operational modules join as optional signal/action providers |

The Phase 8 plan direction now reflects this sequence so there is no competing implementation path. That documentation change does **not** accept P0, any P-DB/T-DB decision, ADR-009, or any implementation gate.

## 3. Stage plan

### D0 — Product decisions

**Purpose:** accept the model before implementation.

Required decisions:

1. accept autonomous marketing operations as the product center;
2. accept one invariant dashboard and no tenant-specific layouts;
3. accept mandatory internal business agent for every tenant;
4. accept Impulsionito's governed portfolio/delegation boundary;
5. accept optional client-facing agent;
6. approve initial mandatory vs optional module catalog;
7. approve initial niche blueprints: restaurant, medical clinic, real estate;
8. confirm advanced automation and WhatsApp provider are deferred.

Output: accepted product decision/ADR and updated Phase 8 scope.

### D1 — Technical foundation

Reuse Phase 8 F1–F9:

- make `app-web` real using the accepted frontend ADR; draft PR #151 is not authority until ADR-009 is accepted and the PR lands;
- extract `api-client`, `auth`, `config`, `ui`, `observability`;
- add Nest validation, standard errors, correlation, capability/tenant guards and audit;
- deploy a full-SHA app image to staging;
- prove SSR session and rollback.

Additional output: module registry contract and dashboard contribution contract.

**D1 exit:** no product screen required; end-to-end session and authorization proven. The concrete first-product **Unit A** continues through D2 and D3 read-only proof before Phase 8 G3 may open writes.

### D2 — Tenant configuration

Implement:

- canonical module registry;
- module dependencies and activation lifecycle;
- effective entitlement resolver;
- blueprint registry and three fixtures;
- onboarding answer, compile, review and idempotent apply;
- dashboard manifest endpoint;
- a **minimal durable** internal business-agent definition created for every compiled tenant.

**Exit proof:** three fixture companies produce different manifests from the same image; roles filter each manifest; missing integrations show `CONFIGURING`.

### D3 — Dashboard read proof

Implement the shell and Home with real staging data:

- daily briefing data contract;
- attention/action queue;
- Growth overview;
- Contacts summary;
- CRM/follow-up summary;
- Tasks;
- Help/Tickets using existing Nest Support;
- one optional operational signal (Agenda recommended);
- internal agent READ tools over these sources.

No advanced messaging or payment writes.

**Exit proof:** two tenants × two roles, allow and deny, metric parity/freshness, agent source/refusal tests.

### D4 — Growth operations

Implement:

- canonical Contacts;
- lead capture and deduplication;
- CRM leads/opportunities/stages;
- campaigns metadata and outcome linkage;
- retention/inactivity definitions and audiences;
- email template library and prepared messages;
- communication connection/readiness UI;
- deterministic follow-up/reactivation action candidates;
- agent RECOMMEND and PREPARE tools.

Execution stays sink/allowlisted staging.

**Exit proof:** lead→follow-up→conversion→retention lifecycle works on staging, emits events/outbox and is fully audited.

### D5 — Daily business operations

Add optional modules in dependency order:

1. Team management and advanced task workload (D3 already has the minimum daily task lifecycle);
2. Agenda;
3. Catalog and Sales;
4. Inventory;
5. Finance (payables/receivables);
6. Documents;
7. Billing;
8. Payments.

Each contributes widgets/actions to the same dashboard manifest. No module forks the shell.

**Exit proof per module:** entitlement/readiness states, read parity, allow+deny, idempotent writes, events, agent tools and legacy owner retirement.

### D6 — AI productization

Reformulate Phase 6 assets:

- expand the D2 minimal durable agent registry with full versioning and lifecycle;
- three agent kinds and separate policies;
- durable approvals before real effects;
- durable/sampled telemetry;
- knowledge source registry and freshness;
- Impulsionito portfolio tools and audited tenant delegation;
- optional client agent with public/consumer scopes;
- agent management UI.

**Exit proof:** every active tenant has one internal agent; cross-tenant/client denials; portfolio summary does not grant raw tenant access.

### D7 — Automation and communication execution

Only after the event spine and prepared actions are stable:

- accept WhatsApp provider decision;
- implement provider adapter and connection flow;
- enable allowlisted email/WhatsApp dispatch;
- workflow templates from blueprints;
- bounded triggers/conditions/actions;
- retry, DLQ, delivery metrics and operator runbook;
- approval policies for consequential actions.

Advanced visual workflow authoring remains optional.

### D8 — Staff platform operations

Build consolidated staff console:

- tenant registry/Cliente 360;
- onboarding/readiness/support;
- plan/modules/blueprints;
- integrations and agent health;
- billing and operational health;
- Impulsionito.

The 57 legacy health pages become one parameterized surface backed by real health contracts.

## 4. Parallelization

```text
D0 decision
  ↓
D1 foundation
  ↓
D2 configuration
  ↓
D3 dashboard proof
  ├───────────────┐
  ↓               ↓
D4 growth      D5 optional operations (module by module)
  └───────┬───────┘
          ↓
     D6 AI productization
          ↓
     D7 execution adapters

D8 staff console can run after D2, consuming each completed capability.
```

Contracts, UI primitives, test fixtures and read-only projections can run in parallel. Identity→capabilities→entitlements→manifest stays serial.

## 5. First implementation backlog

Ordered, not estimated:

| # | Deliverable | Why first |
| --- | --- | --- |
| 1 | Product decision record | Phase 8 is rebaselined; product acceptance is still pending |
| 2 | Land the runtime selected by the accepted frontend ADR | ADR-002 governs unless ADR-009 is formally accepted and landed; do not assume draft PR #151 |
| 3 | Nest common guard/error/correlation/audit layer | Every later module depends on safe enforcement |
| 4 | Capability/module registry contracts | Defines composition before screens |
| 5 | Session + effective entitlements API | Server authority |
| 6 | Dashboard manifest API | One dashboard, different capabilities |
| 7 | `@impulsionando/ui` shell and widget contracts | Stable design |
| 8 | Restaurant/clinic/real-estate blueprint fixtures | Proves variability without forks |
| 9 | Onboarding compiler dry-run | Produces configuration safely before applying |
| 10 | Growth overview read model | Product heart |
| 11 | Contacts/CRM/Tasks APIs | First actionable lifecycle |
| 12 | Support UI over existing Nest module | Reuses proven vertical slice |
| 13 | Internal agent durable definition and READ tools | Mandatory product capability |
| 14 | Home page end-to-end staging proof | First coherent release candidate |

## 6. Test matrix

| Dimension | Minimum fixtures |
| --- | --- |
| Niche | Restaurant, clinic, real estate |
| Plan | Base, growth, full |
| Role | Owner/admin, manager, operator, finance-limited |
| Module state | Not entitled, configuring, active, degraded, disabled |
| Agent | Platform parent, tenant internal, tenant client |
| Identity | Tenant A member, Tenant B member, no membership, staff |
| Data | Empty, populated, stale, provider unavailable |

Required outcomes:

- allow and deny for every API resource;
- manifest snapshot for fixture combinations;
- forbidden module data absent from payload and SSR HTML;
- onboarding compile/apply idempotency;
- event/job replay safety;
- zero vs UNKNOWN semantics;
- agent tool tampering and cross-tenant refusal;
- app/API correlation;
- route-owner rollback.

## 7. Evidence and gates

| Gate | Opens when |
| --- | --- |
| P0 — Product model accepted | D0 decisions recorded |
| P1 — Foundation | Phase 8 G0 and RBAC decision accepted |
| P2 — Open Dashboard read proof (D3) | D1/D2 allow+deny green |
| P3 — Authorize first product writes (D4) | D3 parity/refusal/rollback green |
| P4 — Communication execution | Provider decision + connection security + sink proof |
| P5 — Billing/payments | Shadow-read/reconciliation/idempotency/rollback proof |
| P6 — Autonomous safe effects | Durable approvals, tools, audit, evals, kill switch |

No stage moves production traffic. Production remains Phase 7 authority.

Gate names describe what they **authorize next**, not what they certify as already complete. Dashboard V1 as a product closes only after the relevant D3 and D4 outcomes satisfy §8.

### Crosswalk to authoritative Phase 8 gates

| Product stage/gate | Required Phase 8 authority |
| --- | --- |
| P0 accepted | Required before Phase 8 rebaseline |
| D1 foundation | G0 + G1/RBAC accepted; S2 enforcement remains log-only |
| P2 / D3 read proof | G2 explicitly authorizes capability enforcement |
| P3 / D4 first CRM writes | 8D/P1–P3 read proof accepted and G3 explicitly passed |
| P4+ effects/providers | Later dedicated gates plus existing Phase 5/6 safety controls |

## 8. Definition of Dashboard V1 done

Dashboard V1 is done on staging when:

1. one `app-web` image serves three blueprint fixtures;
2. module/role/readiness differences come from the server manifest;
3. Growth, Contacts/CRM, Tasks, Tickets and one operational module use real staging data;
4. every company has an internal business agent with audited READ/RECOMMEND/PREPARE tools;
5. client agent and WhatsApp provider may remain disabled without architectural rework;
6. allow/deny, empty/error/degraded, freshness and rollback evidence exist;
7. no privileged browser data/provider access exists;
8. the corresponding legacy route owners are retired per Phase 8 strangler rules.

## 9. What this plan deliberately does not promise

- Every legacy module in Dashboard V1;
- autonomous marketing execution before safety gates;
- a complete ERP rewrite before the growth dashboard;
- one custom UI per niche;
- all-business raw data in Impulsionito;
- a permanent integration provider selected by architecture;
- production deployment as proof of product completion.
