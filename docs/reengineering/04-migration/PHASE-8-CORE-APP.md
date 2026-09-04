# Fase 8 — Impulsionando Core no stack novo

Board: [`phase-8/README.md`](./phase-8/README.md) · Waves: [`phase-8/PARALLEL-SPEED-PLAN.md`](./phase-8/PARALLEL-SPEED-PLAN.md) · Gates: [`phase-8/GATES.md`](./phase-8/GATES.md)
Program SoT: [`../STATUS.md`](../STATUS.md)

**Program state:** Phase 8 **PLANNING — NOT STARTED**. Staging development of Impulsionando on the new stack is already authorized by [`../STATUS.md`](../STATUS.md) ("Próximo gate" #1); Phase 8 turns that authorization into a scoped, gated, evidence-bearing program. **No production cutover of the authenticated product happens in Phase 8** — that stays under Phase 7 authority.

## Objetivo

Rebuild the **Impulsionando core product** — the authenticated SaaS that the platform sells, plus the platform-staff console that operates it — on the target stack (`apps/app-web` + `apps/api` + `apps/worker` + `packages/*`), capability by capability, with the legacy monolith remaining the live system until each capability is proven and its legacy routes are retired.

Phase 8 is a **product re-implementation phase under strangler discipline**. It is not a file move. ADR-001 explicitly forbids mechanically relocating the ~1,083 legacy routes, and nothing in Phase 8 changes that.

## Porque esta fase existe

Phases 3–6 built the backend spine (Nest API, worker, durable queue, contracts, governed AI) and proved it on staging. Phase 7 moves *hostnames* onto the new stack. Neither of them builds the authenticated product: today `apps/app-web` is a raw Node health stub, and all 576 authenticated screens still run from the legacy TanStack monolith at the repo root.

Phase 8 closes that gap. It is the largest remaining body of work in the program.

## Escopo

### In scope

| Bucket | Legacy surface | Phase 8 treatment |
| --- | --- | --- |
| Tenant product (generic SaaS) | 206 authenticated route files | Re-implemented on `app-web` + Nest, capability by capability |
| Platform-staff console | 283 authenticated route files (`admin.*` 189, `core.*` 92, `adm.*` 2) | **Consolidated**, not ported 1:1 — see [`phase-8/CORE-APP-SCOPE.md`](./phase-8/CORE-APP-SCOPE.md) §4 |
| Core spine | Session, membership, RBAC, entitlements, billing gates, shell/navigation | Rebuilt server-authoritative in Nest; UI becomes cosmetic |
| Command Center | 12 `_command.*` route files | Folded into the staff console (A-lane), not kept as a separate surface |
| Legacy retirement | Per-capability | Route-ownership manifest flips prefix from `legacy` to `app-web`; legacy redirects |

### Out of scope (explicit)

| Excluded | Why | Where it belongs |
| --- | --- | --- |
| Production DNS/cutover of the authenticated host | Phase 7 authority | [`PHASE-7-CUTOVER.md`](./PHASE-7-CUTOVER.md) |
| One-tenant bespoke ops surfaces (ChrisMed, WMP, Marocas, RioMed, Revela — 87 route files) | Bound to each tenant's own cutover | V-lane, gated per tenant |
| Vertical packs (imobiliária, contabilidade, EHR, cervejaria, restaurante, eventos, educação, affiliates, marketplace) | Optional modules, sold per plan | V-lane, after the core spine closes |
| Public marketing site and white-label tenant sites | `platform-web` / `tenant-web`, different apps | Separate tracks |
| Impulsionando Payments, revenue share, partner commissions engine, CRM Universal as specified in intake | New product, not migration | Own product gates — [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) |
| Prod schema writes, `db push`, reset | Program-wide prohibition | — |
| Retiring the legacy monolith runtime | Phase 7F, **PARKED** | — |

## Subphases

### 8A — Foundation

Turn the empty scaffolding into a working platform: `apps/app-web` as a real TanStack Start app (ADR-002), `packages/api-client`, `packages/auth`, `packages/config`, `packages/ui`, `packages/observability`, contracts extension, GHCR image + staging deploy + smoke. No product screens yet.

### 8B — Identity spine

Server-authoritative session, membership, active tenant context, and a **single** capability model replacing the legacy dual RBAC (`user_roles` vs `profile_permissions`). Allow **and** deny proven on staging before any write slice opens.

### 8C — Entitlements and access gates

One server-computed `EntitlementSet` per tenant from `company_modules`, plan/contract modules, feature flags and access policy. UI gating becomes a projection of the server answer, never the authority.

### 8D — Read-only product spine

Shell, capability-driven navigation, dashboard, support (extends the Phase 3 Nest pilot), notifications. Proves the whole path — SSR session → Nest → contracts → UI — with **zero domain writes**.

### 8E — Tenant product write slices

CRM, Agenda, Sales/Inventory, Finance, Settings/Users. Ascending blast radius; each slice carries a parity harness against legacy plus allow/deny tests.

### 8F — Self-service commercial

Subscription, plan, invoices, payment method, dunning surfaces. Highest financial blast radius, therefore last in the tenant lane and shadow-read before authority moves.

### 8G — Platform staff console

Tenant registry and Cliente 360, provisioning/factory, module catalog and flags, billing hub, platform observability and release identity, audit and security. Replaces ~60 near-duplicate `admin.*-health` pages with parameterized views.

### 8H — Legacy route retirement

Per capability: flip the route-ownership manifest, redirect legacy paths, remove the legacy route files and their server functions, record evidence. A slice is not done until its legacy owner is gone.

## Critério de saída

Phase 8 closes when, **on staging**:

1. A real tenant operates the core spine (8B–8F capabilities) entirely on `app-web` + Nest, with no legacy authenticated route serving those paths.
2. Every migrated capability has server-enforced authorization with recorded **allow and deny** results — UI-only permission checks are gone from the migrated surface.
3. Every migrated read endpoint has a recorded parity result against the legacy implementation, and every migrated write has an idempotency and audit result.
4. The staff console covers the platform operations actually used (tenant lifecycle, entitlements, billing, observability, audit) without the legacy `admin.*`/`core.*` sprawl.
5. The route-ownership manifest shows `app-web` as sole owner of the migrated prefixes, and rollback to `legacy` has been rehearsed.
6. `app-web` ships as a full-SHA GHCR image with health exposing `gitSha`, deployed by the same promote path as `api`/`worker`.

Phase 8 does **not** close on scaffolding, on green health checks, on a screen that renders, or on any capability whose legacy twin is still serving traffic.

## Explicitly excluded

- Declaring Phase 8 done while any migrated capability still has two owners;
- shipping a write path whose authorization is enforced only in React;
- porting the 283 staff routes one-for-one;
- building the intake product vision (Payments, revenue share, CRM Universal, regulated verticals) under a migration gate;
- prod DNS, prod schema writes, or legacy runtime retirement.

## Documentos

| Doc | Use |
| --- | --- |
| [`phase-8/README.md`](./phase-8/README.md) | Board and subphase states |
| [`phase-8/CORE-APP-SCOPE.md`](./phase-8/CORE-APP-SCOPE.md) | What "core app" is: measured surface, buckets, consolidation budget |
| [`phase-8/CAPABILITY-MAP.md`](./phase-8/CAPABILITY-MAP.md) | Capability → legacy source → target module → app → slice |
| [`phase-8/TARGET-APP-SHAPE.md`](./phase-8/TARGET-APP-SHAPE.md) | How `app-web` and the Nest modules are actually built |
| [`phase-8/FOUNDATION-TRACKS.md`](./phase-8/FOUNDATION-TRACKS.md) | F1–F9 enabling work |
| [`phase-8/SLICE-CATALOG.md`](./phase-8/SLICE-CATALOG.md) | The separated implementation plan — every slice, scope, DoD |
| [`phase-8/DATA-AND-IDENTITY-PLAN.md`](./phase-8/DATA-AND-IDENTITY-PLAN.md) | `company_id`/`tenant_id`, RBAC unification, entitlements, RLS, migrations |
| [`phase-8/STRANGLER-ROUTING.md`](./phase-8/STRANGLER-ROUTING.md) | Route ownership, session continuity, rollback |
| [`phase-8/PARALLEL-SPEED-PLAN.md`](./phase-8/PARALLEL-SPEED-PLAN.md) | Waves, parallel vs serial |
| [`phase-8/GATES.md`](./phase-8/GATES.md) | Human gates |
| [`phase-8/RISKS.md`](./phase-8/RISKS.md) | Risk register and anti-patterns |
| [`phase-8/EVIDENCE-TEMPLATE.md`](./phase-8/EVIDENCE-TEMPLATE.md) | Per-slice evidence skeleton |
