# Phase 8 — board

Opened: **2026-09-04**
Status: **PLANNING — NOT STARTED** · no slice authorized yet · staging-only when it opens  
**ADR-009** is **Proposed** ([`../../05-governance/adrs/ADR-009-nextjs-authenticated-app-web.md`](../../05-governance/adrs/ADR-009-nextjs-authenticated-app-web.md)): Next.js for authenticated `app-web`. Does not replace ADR-002 until accepted. Product IA: [`../../06-autonomous-marketing-platform/DASHBOARD-V1.md`](../../06-autonomous-marketing-platform/DASHBOARD-V1.md).
Authority: [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) · Program SoT: [`../../STATUS.md`](../../STATUS.md)

Product direction proposal: [`../../06-autonomous-marketing-platform/README.md`](../../06-autonomous-marketing-platform/README.md) — **PROPOSED, awaiting acceptance; no gate moved**

**Implementation direction:** NestJS is product/domain authority; the accepted frontend is presentation/thin BFF only. ADR-002 currently keeps TanStack Start. Draft [PR #151](https://github.com/raygsm/impulsionando/pull/151) proposes ADR-009 + Next.js; as of 2026-09-04T21:53Z it is open, draft, unmerged, and its listed checks are failing. It is not authority until formally accepted and landed.

## Goal

Rebuild the authenticated Impulsionando product and its staff console on `apps/app-web` + `apps/api`, capability by capability, retiring each legacy owner as it goes. **Not** a mechanical route move (ADR-001). **Not** a production cutover (Phase 7).

Phase 8 has one authoritative sequence: accepted frontend dependency → Nest common foundation → identity/session → modules/quotas/blueprints/readiness → dashboard read proof → canonical database gates → first CRM/Growth write vertical → later modules. Product/database documents supply detailed **PROPOSED** models; this sequence does not pre-accept them.

## Docs

| Doc | Use |
| --- | --- |
| [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) | Measured legacy surface, buckets, what is in/out, consolidation budget |
| [`CAPABILITY-MAP.md`](./CAPABILITY-MAP.md) | Capability → legacy source → target Nest module → target app → slice ID |
| [`TARGET-APP-SHAPE.md`](./TARGET-APP-SHAPE.md) | `app-web` structure, Nest module layout, session/tenant/capability flow |
| [`FOUNDATION-TRACKS.md`](./FOUNDATION-TRACKS.md) | F1–F9 enabling work (packages, app bootstrap, CI, parity harness) |
| [`SLICE-CATALOG.md`](./SLICE-CATALOG.md) | **The separated plan** — S/P/A/V slices with scope, endpoints, DoD, deps |
| [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) | Tenant key, RBAC unification, entitlements, RLS posture, migration rules |
| [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) | Route-ownership manifest, session continuity, per-slice rollback |
| [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md) | Wave model, parallel vs serial lanes |
| [`GATES.md`](./GATES.md) | Human gates G0–G5 |
| [`RISKS.md`](./RISKS.md) | Risk register + anti-patterns that would sink this phase |
| [`EVIDENCE-TEMPLATE.md`](./EVIDENCE-TEMPLATE.md) | Skeleton for `EVIDENCE-<slice>.md` |
| [`first-product-slice/README.md`](./first-product-slice/README.md) | Concrete Nest-authority → read proof → first CRM/Growth plan; BLOCKED on frontend/product/DB/Phase 8 gates |

## Subphase board

| ID | Focus | Lane | State |
| --- | --- | --- | --- |
| **Wave 0** | Planning docs (this landing) | paper | **LANDED** |
| **8A** | Accepted frontend dependency + Nest common foundation/compatibility | F | NOT STARTED — G0/frontend decision pending |
| **8B** | Identity/session and tenant/capability authority | S | NOT STARTED |
| **8C** | Modules, quotas/plans, blueprint dry-run/onboarding and readiness | S | NOT STARTED |
| **8D** | Dashboard manifest + Home/actions/Support/comms/Growth read proof | P | NOT STARTED |
| **8E** | Canonical DB program: DB0–DB8, capability-sized | D | NOT STARTED |
| **8F** | Contact→Lead→Task→Opportunity→Conversion→Growth→agent READ | P | NOT STARTED — blocked on G3/P-DB-06/DB gates |
| **8G** | Later modules in dependency order, including staff/vertical work last | P/A/V | NOT STARTED |
| **8H** | Legacy authority retirement | R | NOT STARTED (per capability, not big bang) |
| **V-lane** | Vertical packs + one-tenant bespoke ops | V | **DEFERRED** — bound to each tenant's Phase 7 cutover |

## Measured baseline (2026-09-04, static)

| Surface | Count | Source |
| --- | --- | --- |
| `src/routes/_authenticated/**` | 576 files | repo scan |
| — tenant product (generic SaaS) | 206 | [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) §2 |
| — platform staff only | 283 | idem |
| — one-tenant bespoke | 87 | idem |
| `src/routes/_command.*` | 12 files | repo scan |
| `src/routes/api/**` | 111 files | matches Phase 0 [`API-ENDPOINTS.md`](../../01-current-state/phase-0/API-ENDPOINTS.md) |
| `createServerFn` call sites | 1,476 across 331 files | repo scan |
| `*.functions.ts` modules | 317 files / 57,477 lines | repo scan |
| Nest endpoints today | 27 (incl. 2 health) | [`../../STATUS.md`](../../STATUS.md), Phase 3–6 |
| `apps/app-web` today | raw Node health stub, no UI | `apps/app-web/src/server.ts` |

Evidence level: **STATIC**. Live usage per screen is **UNKNOWN** — see [`RISKS.md`](./RISKS.md) R-11.

## Entry conditions (before 8A may open)

| # | Condition | State |
| --- | --- | --- |
| 1 | STATUS authorizes Impulsionando development on staging | **MET** — [`../../STATUS.md`](../../STATUS.md) Próximo gate #1 |
| 2 | Nest API + worker proven on staging | **MET** — Phase 5/6 verify matrices |
| 3 | Human authorization of Phase 8 scope and consolidation budget | **PENDING** — [`GATES.md`](./GATES.md) G0 |
| 4 | Canonical authenticated staging hostname decided | **PENDING** — [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) §2 |
| 5 | ADR for capability-model RBAC unification | **PENDING** — [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) §3 |
| 6 | Accepted frontend runtime present on the implementation base | **PENDING** — ADR-002 remains authority unless ADR-009 is accepted and landed |

## Detailed subordinate plans

- [`first-product-slice/`](./first-product-slice/README.md) defines Unit A and the first CRM/Growth vertical.
- [`../../06-autonomous-marketing-platform/`](../../06-autonomous-marketing-platform/README.md) defines the proposed product/module/AI formulation.
- [`../../06-autonomous-marketing-platform/database/`](../../06-autonomous-marketing-platform/database/README.md) defines proposed canonical models and DB0–DB9 gates.

Where older S/P/A labels conflict with this board or [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md), this board wins. Local F0/C0/C1 labels are evidence checkpoints subordinate to G0–G3 and DB0–DB9.

## Tooling (to be built in 8A — none of these exist yet)

```bash
# planned, F-lane deliverables
pnpm --filter @impulsionando/app-web dev
npm run phase8:smoke:app-web-health
npm run phase8:parity -- --slice=<id>        # legacy vs new payload diff on staging
npm run phase8:routes:check                  # route-ownership manifest has exactly one owner per prefix
npm run phase8:staging:verify                # aggregated slice matrix
```
