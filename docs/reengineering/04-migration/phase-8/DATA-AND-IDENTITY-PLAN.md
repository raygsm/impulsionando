# Phase 8 — data and identity plan

Created: **2026-09-04** · Evidence level: **STATIC** (repo + Phase 0 audit; no live re-audit this session)
Authority: [`../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md) · [`../phase-1/CONTRACT-TENANT-IDENTITY.md`](../phase-1/CONTRACT-TENANT-IDENTITY.md) · [`../phase-1/CONTRACT-RBAC.md`](../phase-1/CONTRACT-RBAC.md) · [`../phase-1/CONTRACT-MIGRATIONS.md`](../phase-1/CONTRACT-MIGRATIONS.md) · ADR-004

The data layer is the part of Phase 8 where a mistake is a cross-tenant leak rather than a broken page. This document fixes the rules before any slice opens.

## 1. The schema is not what the repository says

| Object | Repo typed snapshot | Live (Phase 0 audit, 2026-08-28) | Gap |
| --- | --- | --- | --- |
| Public tables | 465 (`src/integrations/supabase/types.ts`) | **577** | 112 tables invisible to types |
| Table-name intersection | — | **142** | 435 live-only, 323 types-only |
| Public functions | 158 typed | **603** | types cover ~26% |
| Migration versions | 587 files in `supabase/migrations/` | 559 applied | histories barely intersect |

Consequences, non-negotiable for Phase 8:

- `types.ts` is **not** a schema contract. Any slice that relies on it must first regenerate types against the **staging** project (`aamorcqznimmleafavai`) and record the diff.
- Live Supabase remains the observational source of truth ([`../../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md`](../../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md)). No `db push`, no reset, no corrective migration against production.
- Tables referenced in code but absent from types — `core_company_access_policy`, `billing_plan_modules`, `communication_tenant_members`, `core_tenant_slug_aliases` — must be verified against staging before the slices that use them (S4, S3, P3, done in Phase 4B respectively).

**Track F-DATA (read-only characterization):** regenerate new-stack types from staging; record generated/migration/observed drift; inventory exact objects, keys, RLS, functions, triggers, volumes and all writers for the capability. Do not regenerate legacy `types.ts`. UNKNOWN tenant ownership or hidden writers block authority.

## 2. Tenant key: API canonical, physical mapping explicit

| Signal | Value |
| --- | --- |
| Typed tables with `company_id` | **300 / 465** |
| Typed tables with `tenant_id` | **1** (`n8n_workflow_runs`) |
| Live tables with `company_id` | 267 |
| Live tables with `tenant_id` | **131** |
| Tables with both | 0 (typed) |

Public contracts use `tenantId`. Legacy `company_id`/`tenant_id` remain behind reviewed adapters. T-DB-01/02/03 and DB1 must select the new physical target/access pattern before SQL.

### Rules

| # | Rule |
| --- | --- |
| 1 | Contracts expose exactly one identifier: **`tenantId`**. No contract ever names `company_id`. |
| 2 | The mapping from `tenantId` to the physical column is a **registry**, not a convention: `apps/api/src/common/tenant-column.registry.ts`, one entry per table, reviewed. |
| 3 | **No mechanical column rename.** ADR-004 and the Phase 1 identity contract both forbid it; a rename against 400+ live tables with 680 RLS policies is not a Phase 8 action. |
| 4 | A table with no registry entry cannot be queried by a Nest service. Missing entry = compile-time failure, not a runtime `undefined`. |
| 5 | Every tenant-scoped query goes through a helper that applies the registry filter. Hand-written `.eq('company_id', …)` is banned in services. |

## 3. RBAC: one model, decided by ADR before S2

The legacy application runs **two** permission models simultaneously:

| Model | Tables | Used by | Status in code |
| --- | --- | --- | --- |
| Role-based | `user_roles` + enum `app_role` (`admin`, `white_label`, `gestor`, `operador`, `profissional`, `consumidor`) | `src/lib/auth.ts`, `rbac-admin.functions.ts`, RLS helpers, WMP gate | Comments call this the **production** path |
| Profile-permission | `profiles`, `permissions`, `profile_permissions`, `user_profiles`, `user_permission_overrides` | `use-user-permissions.ts`, `SidebarNav`, `plan-context.functions.ts` | Comments call this **legacy**; whether `user_profiles` exists in production is **UNKNOWN** |

Plus a third path: RPC `user_has_permission(user, company, perm)`, called by exactly one server function.

### Required decision (ADR candidate, blocks S2)

> **Proposal for the ADR:** the canonical model is a **capability set** keyed `{domain}.{resource}.{action}` (the shape the 81 `perm:` keys in `nav-config.tsx` and `permissions.code` already use). Roles expand into capabilities through an explicit, versioned mapping. `user_roles` remains the storage of record for role assignment; the profile-permission tables are read-only during transition and removed only after their production existence is verified.

This must be written up using [`../../templates/ADR-TEMPLATE.md`](../../templates/ADR-TEMPLATE.md) and accepted before slice S2 implements a guard. Choosing wrongly here is the most expensive mistake available in Phase 8.

### Enforcement rules

| # | Rule |
| --- | --- |
| 1 | Authorization is decided **server-side**, in Nest, by `CapabilityGuard` (F8). |
| 2 | UI checks are cosmetic. Removing a client check must still yield 403. |
| 3 | Deny by default: no capability decorator and no explicit `@Public()` means the handler does not route. |
| 4 | Client-supplied identifiers never authorize. A `tenantId` in a path is a request, not a grant. |
| 5 | S2 ships in **log-only mode first**: compute and record the decision without enforcing, compare against real usage on staging, then enforce. |

## 4. Entitlements: three sources, one answer

| Source | Holds |
| --- | --- |
| `company_modules` ⋈ `modules` | Per-tenant enabled modules (with the `erp` ↔ `financeiro` alias) |
| `billing_contracts` → `billing_plans.included_modules`, `billing_plan_modules` | Plan-derived modules |
| `PLAN_MODULES` in `src/routes/api/public/payments/webhook.ts` | Paddle plan → module map, hardcoded in the webhook |
| `core_feature_flags`, `core_company_feature_values` | Flags and per-tenant overrides |
| `core_company_access_policy` | Access mode / service state |
| `src/data/moduleCatalog.ts`, `motherModules.ts` | Commercial catalog, ~30 SKUs over 14 mother modules |

These disagree. Slice S3 resolves them into a single server-computed `EntitlementSet` and records the disagreements it found. Unknown flags default-deny (existing Phase 4B behaviour, preserved).

## 5. RLS posture and what Phase 8 owes it

From [`../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md`](../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md) (2026-08-28):

| Metric | Value | Phase 8 obligation |
| --- | --- | --- |
| Tables with RLS enabled | 556 / 577 | — |
| Tables **without** RLS | **21** (EVR module, currently empty) | Any slice touching them must enable RLS first |
| Policies | 680 across 455 tables | — |
| RLS on, zero policies | 101 | Default-deny for clients; fine, but the API must not become the accidental bypass |
| SECURITY DEFINER functions | 363, of which **47 callable by `anon`** | A slice wrapping one of these must review its body and record the review |
| Policies with `USING true` | 15 | Reviewed per slice; catalog reads may be legitimate, data reads are not |
| Hardcoded tenant UUIDs in policies | 9 (mostly ChrisMed) | Flagged, not fixed by Phase 8 — belongs to that tenant's cutover |
| `FORCE ROW LEVEL SECURITY` | not set anywhere | Service-role bypasses RLS: the Nest authorization layer is the real boundary, so F8 is load-bearing |

The API uses the service role and therefore **bypasses RLS entirely**. RLS is defense in depth; it is not the control that protects tenants in the new stack. That is why deny tests are mandatory per slice and why a handler without a capability decorator must fail a test rather than a review.

## 6. Migration rules

| # | Rule | Source |
| --- | --- | --- |
| 1 | Expand/contract only; never a destructive change in the same release as the code that needs it | [`../phase-1/CONTRACT-MIGRATIONS.md`](../phase-1/CONTRACT-MIGRATIONS.md) |
| 2 | Staging first, always. No production schema writes in Phase 8, at all | Program-wide |
| 3 | New Phase 8 tables are additive and namespaced; legacy columns are not mutated in place | ADR-004 |
| 4 | Rollback must not depend on reverting a destructive migration | [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md) |
| 5 | A migration that changes an RLS policy ships with the allow **and** deny test that proves it | SECURITY-MULTITENANCY |
| 6 | The 21 RLS-less tables get RLS before they get data, not after | Phase 0 risk register |

Complete sequence: DB0 requirements → DB1 physical/access ADR → DB2 F-DATA → DB3 model review → DB4 staging expand/RLS → DB5 backfill/reconcile → DB6 shadow read → DB7 write authority → DB8 read/route authority → DB9 later retirement. See [`../../06-autonomous-marketing-platform/database/DECISIONS-AND-GATES.md`](../../06-autonomous-marketing-platform/database/DECISIONS-AND-GATES.md).

## 7. Open questions that must be closed before the slices that need them

| # | Question | Blocks | Current state |
| --- | --- | --- | --- |
| Q1 | Does `user_profiles` exist in the production database? | S2 ADR | **UNKNOWN** — code comment only |
| Q2 | What exactly determines "Impulsionando staff" today (metadata vs master-company membership heuristic vs RPC)? | S1 | Three signals in code; precedence **UNKNOWN** |
| Q3 | Does `core_company_access_policy` exist in staging, and with what shape? | S4 | Referenced in code, absent from types |
| Q4 | Which of the 47 anon-callable SECURITY DEFINER functions back authenticated screens? | any slice wrapping one | **UNKNOWN** |
| Q5 | Which authenticated screens are actually used in production? | G0 consolidation budget | **UNKNOWN** — no usage export exists |
| Q6 | Are the three module catalog sources reconcilable, or do they encode different products? | S3 | **UNKNOWN** until compared |

Each question is answered by a **read-only** staging or production observation, recorded in the relevant slice's evidence file. None of them is answered by inference.
