# Phase 8 — board

Opened: **2026-09-04**
Status: **PLANNING — NOT STARTED** · no slice authorized yet · staging-only when it opens
Authority: [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) · Program SoT: [`../../STATUS.md`](../../STATUS.md)

Product direction proposal: [`../../06-autonomous-marketing-platform/README.md`](../../06-autonomous-marketing-platform/README.md) — **PROPOSED, awaiting acceptance; no gate moved**

## Goal

Rebuild the authenticated Impulsionando product and its staff console on `apps/app-web` + `apps/api`, capability by capability, retiring each legacy owner as it goes. **Not** a mechanical route move (ADR-001). **Not** a production cutover (Phase 7).

If the autonomous-marketing product proposal is accepted, Phase 8 keeps its technical foundation, strangler and safety gates but reorders the first product proof around **Dashboard + Growth + Contacts/CRM + Tasks + mandatory tenant business agent**. Detailed impact: [`../../06-autonomous-marketing-platform/IMPLEMENTATION-PLAN.md`](../../06-autonomous-marketing-platform/IMPLEMENTATION-PLAN.md) §2.

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

## Subphase board

| ID | Focus | Lane | State |
| --- | --- | --- | --- |
| **Wave 0** | Planning docs (this landing) | paper | **LANDED** |
| **8A** | Foundation — app-web real, packages, CI, parity harness | F | NOT STARTED |
| **8B** | Identity spine — session, membership, capabilities | S | NOT STARTED |
| **8C** | Entitlements and access gates | S | NOT STARTED |
| **8D** | Read-only product spine — shell, nav, dashboard, support | P | NOT STARTED |
| **8E** | Tenant product write slices — CRM, agenda, sales, finance, settings | P | NOT STARTED |
| **8F** | Self-service commercial — subscription, invoices, dunning | P | NOT STARTED |
| **8G** | Platform staff console — Cliente 360, factory, catalog, billing hub, obs, audit | A | NOT STARTED |
| **8H** | Legacy route retirement | R | NOT STARTED (runs per slice, not at the end) |
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

## Tooling (to be built in 8A — none of these exist yet)

```bash
# planned, F-lane deliverables
pnpm --filter @impulsionando/app-web dev
npm run phase8:smoke:app-web-health
npm run phase8:parity -- --slice=<id>        # legacy vs new payload diff on staging
npm run phase8:routes:check                  # route-ownership manifest has exactly one owner per prefix
npm run phase8:staging:verify                # aggregated slice matrix
```
