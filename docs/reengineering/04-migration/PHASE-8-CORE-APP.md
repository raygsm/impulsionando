# Fase 8 — Impulsionando Core no stack novo

Board: [`phase-8/README.md`](./phase-8/README.md) · Waves: [`phase-8/PARALLEL-SPEED-PLAN.md`](./phase-8/PARALLEL-SPEED-PLAN.md) · Gates: [`phase-8/GATES.md`](./phase-8/GATES.md)
Program SoT: [`../STATUS.md`](../STATUS.md)

**Program state:** Phase 8 **PLANNING — NOT STARTED**. Staging development of Impulsionando on the new stack is already authorized by [`../STATUS.md`](../STATUS.md) ("Próximo gate" #1); Phase 8 turns that authorization into a scoped, gated, evidence-bearing program. **No production cutover of the authenticated product happens in Phase 8** — that stays under Phase 7 authority.

**Phase 8 implementation direction (rebaselined 2026-09-04):** NestJS is the product/domain authority. The accepted `app-web` runtime is presentation and, where necessary, a thin BFF; it never decides tenant, capability, module, quota, readiness or domain truth and never reads canonical domain tables directly. This follows accepted ADR-003 and does not accept any still-PROPOSED product/database choice.

Frontend dependency remains conditional: ADR-002 currently accepts TanStack Start. Draft [ADR-009 / PR #151](https://github.com/raygsm/impulsionando/pull/151) proposes Next.js, but is open, draft, unmerged and has failing listed checks as of 2026-09-04T21:53Z. If ADR-009 is formally accepted and lands, Phase 8 consumes Next.js; otherwise it implements ADR-002. There is one backend/product sequence either way.

The autonomous-marketing formulation and canonical database models under [`../06-autonomous-marketing-platform/`](../06-autonomous-marketing-platform/README.md) remain **PROPOSED detailed inputs**. Phase 8 links their latest model and sequences the gates needed to decide it; planning landed does not authorize implementation and no gate moved.

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

### 8A — Accepted frontend dependency + Nest common foundation

First close the frontend decision/landing dependency. Then build typed config, correlation, the standard error envelope, Zod validation, deny-by-default `CapabilityGuard` and `TenantScopeGuard`, audit/idempotency seams, a reviewed per-table tenant-column registry, and in-process Nest tests. Preserve and rerun existing Phase 3–6 auth, tenants, Support, jobs, outbox, webhooks, CRM invite journeys, ops and AI contracts/smokes.

### 8B — Identity/session authority

`GET /api/v1/identity/session` composes authenticated identity, memberships, server-validated active tenant, staff/observer/delegation mode and effective capabilities. Browser-selected tenant IDs are requests, never grants.

### 8C — Product composition authority

Nest owns the effective module registry, plan/quota rules, niche blueprint/onboarding compilation (pure/dry-run first), dependencies and readiness. Product decisions remain gated; the frontend only renders the response.

### 8D — Dashboard manifest and read-only proof

Nest serves `/api/v1/dashboard/manifest`, `/api/v1/dashboard/home`, `/api/v1/dashboard/actions`, the existing Support contract, `/api/v1/communications/inbox`, and `/api/v1/growth/overview`. `app-web` consumes those contracts. Home/actions/Support/comms/Growth prove the path with no new domain write.

### 8E — Canonical database program

Before product writes: accept the physical target/access ADR; run F-DATA staging characterization; classify legacy objects KEEP/ADAPT/MIGRATE/MERGE/RETIRE/UNKNOWN; and move each capability through expand → backfill → reconcile → shadow-read → write authority → read authority → retire. Detailed source: [`../06-autonomous-marketing-platform/database/`](../06-autonomous-marketing-platform/database/README.md). No big bang or automatic mapping of 577 legacy tables.

### 8F — First write vertical

Only after authoritative G3 and applicable DB0–DB7 gates: Contact → Lead → Follow-up Task → Pipeline/Opportunity → Conversion → Growth summary → governed tenant-agent **READ** tools. P-DB-06 must be accepted before conversion metric or write acceptance. No new AI effect or provider dispatch belongs here.

### 8G — Later capability modules

After the first vertical: Team/Tasks depth → Agenda → Catalog/Sales → Inventory → Finance/Accounting → Documents → Billing → Payments → Communications execution → AI durability/effects → staff console → vertical extensions. Each module has its own product/DB/safety gate and retires its legacy owner capability by capability.

### 8H — Legacy authority retirement

Retirement runs inside every capability migration after parity, writer shutdown, authority transfer and rollback evidence. n8n and provider adapters remain auxiliary; neither becomes domain authority.

## Critério de saída

Phase 8 closes when, **on staging**:

1. A real tenant operates the accepted Phase 8 scope through `app-web` + Nest on staging, with Nest as domain authority and no legacy authenticated route serving the migrated paths.
2. Every migrated capability has server-enforced authorization with recorded **allow and deny** results — UI-only permission checks are gone from the migrated surface.
3. Every migrated read endpoint has a recorded parity result against the legacy implementation, and every migrated write has an idempotency and audit result.
4. Every canonical aggregate that moved has passed its applicable DB0–DB8 evidence; DB9 retirement remains separately authorized where physical cleanup is deferred.
5. The route-ownership manifest shows `app-web` as sole owner of the migrated prefixes, and rollback to `legacy` has been rehearsed.
6. `app-web` ships as a full-SHA GHCR image with health exposing `gitSha`, deployed by the same promote path as `api`/`worker`.

Phase 8 does **not** close on scaffolding, on green health checks, on a screen that renders, or on any capability whose legacy twin is still serving traffic.

## Explicitly excluded

- Declaring Phase 8 done while any migrated capability still has two owners;
- shipping a write path whose authorization is enforced only in React;
- porting the 283 staff routes one-for-one;
- treating the PROPOSED product/database catalogue as accepted or building later modules under the first CRM gate;
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
