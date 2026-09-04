# Phase 8 — risks and anti-patterns

Created: **2026-09-04**
Extends: [`../../05-governance/RISKS.md`](../../05-governance/RISKS.md) (program register) · Board: [`README.md`](./README.md)

Only risks **specific to rebuilding the core app** are listed. The program-level register still applies.

## Risk register

| # | Risk | Impact | Mitigation | Gate |
| --- | --- | --- | --- | --- |
| **R-01** | **Two owners for one route.** A prefix served by both legacy and `app-web` produces divergent writes, two audit trails, and no way to say which implementation a user hit. | Data corruption; unfalsifiable incidents | Route-ownership manifest with exactly one owner per prefix, enforced by `npm run phase8:routes:check` in CI; legacy 308-redirects anything it does not own | 8A |
| **R-02** | **UI-only permissions carried forward.** The legacy model is primarily UI-gated with ad-hoc server checks. Rebuilding the UI without server enforcement reproduces the hole in a new codebase. | Cross-tenant or privilege-escalation exposure | `CapabilityGuard` with deny-by-default in F8, before any write slice; a handler without a decorator fails a test | G2 |
| **R-03** | **Enforcing authorization locks out working users.** Because legacy never enforced consistently, real usage may depend on permissions nobody was granted. | Production-shaped outage on staging users; loss of trust | S2 ships log-only first; every denial classified before enforcement | G2 |
| **R-04** | **`company_id` / `tenant_id` mismatch.** 300 typed tables use `company_id`; 131 live tables use `tenant_id` for the same concept. A wrong mapping filters on the wrong column. | **Cross-tenant leak** | One `tenantId` in contracts; a reviewed per-table column registry; a table without a registry entry cannot be queried; deny tests per collection | S1 |
| **R-05** | **Session split during coexistence.** Legacy stores the session in `localStorage`; `app-web` needs a cookie for SSR. A user crossing between them is logged out, or worse, has two sessions. | Broken login; sign-out that clears only one side is a security defect | One canonical host; dual-write cookie behind a flag; sign-out clears both, tested as a security case | 8A |
| **R-06** | **Porting the staff sprawl 1:1.** 283 staff routes including 57 near-duplicate health dashboards. Migrating them all consumes the phase and ships nothing users want. | Phase never closes | Explicit consolidation budget accepted at G0; a screen without a named operator is a deletion candidate | G0 |
| **R-07** | **Schema drift breaks contracts.** `types.ts` shows 465 tables and 158 functions; live has 577 and 603. Building against the repo snapshot builds against a fiction. | Runtime failures on data that "should" exist | Regenerate types from staging in 8A; verify `core_company_access_policy`, `billing_plan_modules`, `communication_tenant_members` before the slices that use them | 8A |
| **R-08** | **Billing regression suspends paying tenants.** The access-policy and dunning stack cross-cuts the shell, checkout, webhooks and subscription hooks. | Revenue loss; customer trust | S4 is read-only and fails **closed to legacy behaviour**; P9 shadow-reads before authority moves; A4 suspension is approval-gated and audited | G4 |
| **R-09** | **Silent behavioural divergence.** 57,477 lines of server functions with only `STATIC` documentation. A reimplementation that looks right can compute different numbers. | Wrong invoices, wrong KPIs, wrong stock | Parity harness on every read slice; a KPI that cannot be reproduced is deleted, not guessed | per slice |
| **R-10** | **Service role becomes the new bypass.** The API uses the service role and therefore bypasses RLS entirely; `FORCE ROW LEVEL SECURITY` is set nowhere. The Nest layer *is* the tenant boundary. | Total isolation failure if a guard is missed | Deny-by-default; `TenantScopeGuard` on every `:tenantId` route; allow+deny recorded per slice; no hand-written `.eq('company_id', …)` in services | G2 |
| **R-11** | **Migrating screens nobody uses.** No 30/90-day usage export exists. Effort may go to dead surface while used surface waits. | Wasted phase capacity | Request the usage export before G0; absent it, record the consolidation budget as an explicit judgement call with an owner | G0 |
| **R-12** | **Scope creep from the intake corpus.** Impulsionando Payments, revenue share, partner commissions, CRM Universal and regulated verticals are specified in `product-intake/` and are genuinely wanted. | Phase 8 becomes an open-ended product build | These are **new products** with their own gates ([`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md)); Phase 8 migrates what exists | G0 |
| **R-13** | **Business logic leaks back into `createServerFn`.** ADR-002 keeps TanStack Start; the easy path is to move a server function into `app-web` instead of into Nest. | The monolith is recreated, one app over | Review rule: a server function in `app-web` may only shape an `api` response; the F8 pipeline makes the Nest path the path of least resistance | per slice |
| **R-14** | **Vertical packs pulled forward.** A tenant cutover under Phase 7 will create pressure to migrate its vertical (imobiliária, EHR, fiscal) before the spine is ready. | Rebuilding the vertical twice | V-lane is deferred by design; a vertical moves after the spine, on the spine | G0 |
| **R-15** | **`routeTree.gen.ts` hazard.** The legacy router depends on generated route codegen; retirement steps delete route files. | Broken legacy build during coexistence | Per workspace rule: never stage, revert or regenerate `routeTree.gen.ts` without dedicated investigation and approval. Deletion PRs handle it explicitly, not incidentally |
| **R-16** | **Slices that migrate reads but leave writes on legacy.** Tempting for large aggregates. | Split-brain on the same entity | Either migrate the aggregate or do not start the slice — recorded in [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) §6 |

## Anti-patterns — things that would look like progress

| Anti-pattern | Why it is not progress |
| --- | --- |
| "`app-web` is deployed and `/healthz` is green" | HTTP 200 ≠ release proof. It proves a container started. |
| "The CRM screen renders with real data" | Renders ≠ migrated. No allow/deny, no parity, no retirement, no audit. |
| "We ported 40 admin routes this week" | Route count is the wrong unit. Capabilities are the unit, and 40 of those routes were probably four capabilities. |
| "Permissions work — the sidebar hides the item" | That is the legacy defect, restated. |
| "We'll add the deny tests after the slice ships" | Then the slice shipped without knowing whether it leaks. |
| "The legacy route is still there as a fallback" | Then there are two owners (R-01). |
| "Phase 8 is closed, only the verticals remain" | Say **V-lane DEFERRED**, the way Phase 7 says **7F PARKED**. |
| "We regenerated `types.ts` and everything compiles" | Compiling against a stale snapshot of a drifted schema proves nothing. |

## Residual unknowns carried into the phase

| # | Unknown | Consequence if it stays unknown |
| --- | --- | --- |
| Q1 | Does `user_profiles` exist in production? | The RBAC ADR is written on a guess |
| Q2 | Precedence among the three "staff" signals | S1 either locks staff out or over-grants |
| Q3 | Shape of `core_company_access_policy` in staging | S4 cannot fail closed correctly |
| Q4 | Which of the 47 anon SECURITY DEFINER functions back authenticated screens | A slice may wrap a publicly callable privileged function |
| Q5 | Which authenticated screens are used in production | The consolidation budget is unvalidated |
| Q6 | Whether the three module catalog sources encode one product or three | S3 may unify things that were deliberately different |

Each is answered by a read-only observation recorded in a slice evidence file. None is answered by inference. Anything still unknown at G5 is stated as **UNKNOWN** in the exit report rather than assumed benign.
