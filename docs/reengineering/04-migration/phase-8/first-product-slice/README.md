# Phase 8 — first product slice

Created: **2026-09-04T21:25Z**
State: **PLANNED — BLOCKED on accepted frontend landing, product/database decisions and Phase 8 gates**
Phase board: [`../README.md`](../README.md) · Product model: [`../../../06-autonomous-marketing-platform/README.md`](../../../06-autonomous-marketing-platform/README.md)

## Goal

Deliver the first coherent product loop with **NestJS as product/domain authority** and accepted `app-web` as presentation/thin BFF:

```text
authenticated user
  → validated tenant
  → server capabilities and modules
  → dashboard manifest
  → capture lead
  → assign follow-up task
  → move opportunity through pipeline
  → convert
  → update Growth dashboard
```

This is not “build the CRM frontend” followed by “make the backend work.” It is one vertical capability delivered contract-first through the API and consumed by the dashboard.

## Current dependency state

As observed on 2026-09-04T21:53Z:

| Dependency | State | Evidence / consequence |
| --- | --- | --- |
| Product architecture | **PROPOSED** | `docs/reengineering/06-autonomous-marketing-platform/`; acceptance gate P0 pending |
| Phase 8 | **PLANNING — NOT STARTED** | G0 and RBAC decision pending |
| Accepted frontend | ADR-002/TanStack is current authority; planned product runtime dependency not landed | ADR-009/Next.js exists only in draft [PR #151](https://github.com/raygsm/impulsionando/pull/151) |
| ADR-009 (Next.js `app-web`) | **PROPOSED** in PR #151 | Does not replace ADR-002 until accepted |
| Frontend local verification | 16 tests, typecheck and build reported PASS in PR #151 | Useful, but not merge authority |
| PR #151 CI | **FAILING** across current listed checks | Must be characterized; do not call the frontend landed or ready |
| Nest Phase 3–6 spine | **PROVEN on staging** | Preserve Support, Tenants, Jobs, Outbox, Webhooks, Journeys, Ops and governed AI |
| First CRM API | **NOT BUILT** | Legacy CRM exists; Nest only owns the invite journey |

Do not start implementation from `reengineering/program` until the intended frontend dependency is present there. If an authorized operator explicitly chooses to stack work on `feat/phase8-nextjs-app-web`, record that branch dependency and do not merge the child before #151.

## Delivery units

One features agent may execute both units, but they remain separate review/merge decisions.

| Unit | Output | May start when |
| --- | --- | --- |
| **A — Nest foundation and read-only dashboard composition** | Common Nest authority, identity/session, modules/quotas/blueprints/readiness, manifest and read proof consumed by `app-web` | Accepted frontend landed + **G0/G1**; enforcement waits for **G2** |
| **B — First CRM/Growth vertical slice** | Contact, Lead, Task, Pipeline/Opportunity, Conversion, Growth and governed agent READ tools | Unit A/C0 proven, P-DB-06 and applicable DB gates passed, and **G3 explicitly passed** |

Unit B must not be hidden inside a large Unit A PR. Security and composition foundations need their own review before product writes begin.

### Relationship to authoritative Phase 8

This plan does not create an alternative gate system and does not yet supersede [`../SLICE-CATALOG.md`](../SLICE-CATALOG.md) or [`../PARALLEL-SPEED-PLAN.md`](../PARALLEL-SPEED-PLAN.md).

| This plan | Phase 8 authority |
| --- | --- |
| Frontend/product prerequisite F0 | Product P0 + G0 + G1 |
| Unit A log-only authorization work | 8A + S1 + S2 log-only + S3–S5 |
| G2 evidence checkpoint | G2 authorizes S2 enforcement |
| Unit A read-only proof | 8D / P1–P3 |
| CRM characterization C0 | Preparation for P4; accepted by Phase 8 technical approvers |
| Unit B authorization | **G3**, not a local C gate |
| Unit B | P4 first write slice |

The parent Phase 8 plan is rebaselined around Nest authority. This remains **BLOCKED planning guidance** until named frontend, product, G and DB decisions pass; planning is not authorization.

## Documents

| Document | Purpose |
| --- | --- |
| [`AGENT-CONTEXT.md`](./AGENT-CONTEXT.md) | The feature agent's exact place, repository reality, authority and boundaries |
| [`FOUNDATION-AND-CRM-PLAN.md`](./FOUNDATION-AND-CRM-PLAN.md) | Ordered implementation plan for Units A and B |
| [`CONTRACTS-AND-DATA.md`](./CONTRACTS-AND-DATA.md) | API contracts, entities, events, repository and migration rules |
| [`GATES-TESTS-AND-EVIDENCE.md`](./GATES-TESTS-AND-EVIDENCE.md) | Entry/exit gates, test matrix, evidence and rollback |

## Success definition

This slice is complete on staging only when:

1. `app-web` obtains session, tenant, capabilities, effective modules and dashboard composition from Nest.
2. A tenant member can capture a lead, assign a follow-up, move an opportunity and convert it.
3. The Growth summary reflects that lifecycle from canonical server data.
4. A different tenant and an unauthorized role are denied at the API, not merely hidden in the UI.
5. Writes are idempotent where replay is possible, audited and emit outbox events.
6. The internal tenant agent can read and explain the new CRM/Growth state through governed tools; it cannot cross tenants.
7. No legacy CRM path remains a second writer for the migrated ownership boundary.
8. Rollback to the prior route owner is rehearsed.

## Explicit exclusions

- Full CRM Universal intake scope;
- campaign execution, WhatsApp dispatch and visual workflows;
- agenda, sales, inventory, finance, billing or payments implementation;
- client-facing agent implementation;
- Impulsionito portfolio implementation;
- physical database big-bang remodel;
- production deploy, DNS, schema writes or legacy VPS mutation;
- empty module scaffolds presented as completed features.
