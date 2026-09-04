# Canonical database SQL drafts

**State:** DRAFT expand SQL — **not applied** to staging or production  
**Authority:** [`docs/reengineering/06-autonomous-marketing-platform/database/`](../../../docs/reengineering/06-autonomous-marketing-platform/database/)  
**Contract:** [`docs/reengineering/04-migration/phase-1/CONTRACT-MIGRATIONS.md`](../../../docs/reengineering/04-migration/phase-1/CONTRACT-MIGRATIONS.md)

## Answers

| Question | Answer |
| --- | --- |
| Was the redesign already implemented? | **No.** Until this corpus, only logical markdown models existed. |
| Will it use SQL migration files? | **Yes.** Controlled expand/contract SQL under this directory — **not** `db push`, not a 577-table rewrite, not auto-applied with legacy `supabase/migrations/`. |

## Why this is not in `supabase/migrations/`

Repo `supabase/migrations/` is the historical/live-adjacent corpus. Putting un-gated canonical DDL there risks accidental apply. This package holds a **separate forward-only draft corpus** until DB1/DB3/DB4 authorize promotion into the controlled apply path.

## Physical draft (T-DB-01 still open)

These files assume **Option A**: dedicated private Postgres schemas in the existing managed Supabase project (`tenancy`, `iam`, `crm`, …). Nest/`service_role` only. Browser PostgREST must not expose these schemas by default.

Accepting T-DB-01 as Option B/C requires regenerating or adapting this corpus before apply.

## Apply policy

See [`APPLY-POLICY.md`](./APPLY-POLICY.md). Short version:

1. Product DB0 + physical DB1 ADR accepted  
2. F-DATA characterization (DB2)  
3. Schema review (DB3)  
4. Isolated/staging expand + RLS allow+deny (DB4)  
5. Never prod until its own gate  

**This change set does not apply anything.**

## Migration order

| File | Scope |
| --- | --- |
| `20260904100000_*` | Schemas + helpers |
| `20260904100100_*` | Migration control / lineage |
| `20260904100200_*` | Tenancy |
| `20260904100300_*` | IAM (RBAC storage pending T-DB-04 ADR) |
| `20260904100400_*` | Entitlements / plans / quotas / blueprints (no `plan_modules` until P-DB-01) |
| `20260904100500_*`–`00900_*` | Contacts, compliance, growth, CRM, tasks |
| `20260904101000_*` | Eventing target shapes (Phase 5 `reengineering_*` remain adapters) |
| `20260904101100_*`–`01200_*` | ERP expand DDL (write authority blocked on P-DB-07/08) |
| `20260904101300_*` | Communications, cases (future), integrations, automation, AI, analytics |
| `20260904101400_*` | Vertical extension stubs |
| `20260904101500_*` | RLS force + `service_role` grants |

## First delivery vs deferred

**Authorized product path after gates:** foundation + contacts/CRM/growth/tasks.  
**Present as expand DDL only:** ERP, fiscal, commissions, verticals, future `cases.*`.  
Do not move write authority for deferred aggregates without their product decisions.

## Files on disk

- `20260904100000_canonical_schemas_and_helpers.sql`
- `20260904100100_canonical_migration_control.sql`
- `20260904100200_canonical_tenancy.sql`
- `20260904100300_canonical_iam.sql`
- `20260904100400_canonical_entitlements.sql`
- `20260904100500_canonical_contacts.sql`
- `20260904100600_canonical_compliance.sql`
- `20260904100700_canonical_growth.sql`
- `20260904100800_canonical_crm.sql`
- `20260904100900_canonical_tasks.sql`
- `20260904101000_canonical_eventing.sql`
- `20260904101100_canonical_erp_catalog_sales.sql`
- `20260904101200_canonical_erp_ops_finance.sql`
- `20260904101300_canonical_execution_ai.sql`
- `20260904101400_canonical_vertical_extensions.sql`
- `20260904101500_canonical_rls_and_grants.sql`
