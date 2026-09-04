# Canonical database reengineering

Created: **2026-09-04**
Updated: **2026-09-04**
State: **PROPOSED — logical models + draft expand SQL in-repo; no staging/prod apply authorized**
Product architecture: [`../README.md`](../README.md) · Phase 8 data authority: [`../../04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md`](../../04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md) · SQL drafts: [`../../../../packages/database/canonical/`](../../../../packages/database/canonical/)

## Purpose

Define a clean canonical data model for the autonomous marketing platform from product requirements—not from the shape of the legacy database.

The legacy database is a **migration source and evidence corpus**, not the target domain model:

| Evidence | Current fact |
| --- | --- |
| Live public tables | **577** at Phase 0 audit |
| Live public functions | **603** |
| Live RLS policies | **680** across 455 tables |
| Generated-type tables | 465 |
| Generated-type functions | 158 |
| Live/type table-name intersection | **142** |
| Live-only / types-only tables | 435 / 323 |
| Live tenant keys | 267 tables with `company_id`; 131 with `tenant_id` |

No responsible redesign maps all 577 tables into a new ORM and calls that reengineering. This plan keeps the few proven platform primitives, adapts useful generic domain data, creates missing canonical concepts, migrates only the capabilities being delivered, and retires legacy/vertical duplicates after reconciliation.

## Principle

```text
Stakeholder input = products, capabilities, journeys and commercial rules
Accepted ADRs = technical boundaries
Observed database = migration evidence
Canonical model = new product authority
Legacy objects = adapters until migrated or retired
```

The stakeholder does not choose schemas, table layouts, frameworks or provider coupling. Technical names and flows are corrected where necessary while preserving product intent.

## Target shape

```text
Foundation
  Identity · Tenancy · Capabilities · Entitlements · Blueprints · Compliance

Customer lifecycle
  Contacts · Growth · CRM · Tasks · Campaigns · Retention · Support

Operations / ERP
  Catalog · Purchasing · Sales · POS · Fulfillment · Inventory
  Agenda · Finance · Accounting · Billing · Payments · Contracts · Documents

Execution
  Communications · Integrations · Events · Outbox · Jobs · Automation

Intelligence
  Analytics · Reporting · Agent Registry · Tools · Approvals · Telemetry

Extensions
  Health · Automotive · Representation · Brewery · Restaurant/Bar
  Events · Tourism · Retail · Education · Services
```

Shared contexts never depend on vertical extensions. Verticals reference shared Contact, Agenda, Order, Document and financial concepts rather than duplicating them.

## Documents

| Document | Purpose |
| --- | --- |
| [`STAKEHOLDER-REQUIREMENTS.md`](./STAKEHOLDER-REQUIREMENTS.md) | Product requirements extracted, technical translations, missing features and decisions |
| [`CURRENT-ASSET-DISPOSITION.md`](./CURRENT-ASSET-DISPOSITION.md) | What current data is KEEP/ADAPT/MIGRATE/MERGE/RETIRE/UNKNOWN |
| [`CANONICAL-DATA-MODEL.md`](./CANONICAL-DATA-MODEL.md) | Global rules, bounded contexts and foundation/customer-lifecycle tables |
| [`ERP-OPERATIONS-MODEL.md`](./ERP-OPERATIONS-MODEL.md) | Catalog, purchasing, sales, POS, inventory, agenda, finance, accounting, billing and payments |
| [`EXECUTION-AI-ANALYTICS-MODEL.md`](./EXECUTION-AI-ANALYTICS-MODEL.md) | Communications, integrations, automation, events, agents and analytics |
| [`VERTICAL-EXTENSION-MODEL.md`](./VERTICAL-EXTENSION-MODEL.md) | How niches extend the core without tenant-specific schemas |
| [`MIGRATION-PLAN.md`](./MIGRATION-PLAN.md) | Adapter-first strangler from legacy data to canonical authority |
| [`DECISIONS-AND-GATES.md`](./DECISIONS-AND-GATES.md) | Unresolved product/technical decisions and authorization gates |

## Global modeling rules

1. Public/domain vocabulary is `tenantId`; new canonical physical storage proposes `tenant_id`, while legacy `company_id`/`tenant_id` keys stay behind reviewed adapters—see Phase 8 [`DATA-AND-IDENTITY-PLAN.md`](../../04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md).
2. Every private row has direct tenant ownership, even if ownership could be inferred.
3. Composite tenant-aware foreign keys prevent cross-tenant relationships at the database boundary.
4. Global/platform data uses explicit scope; nullable tenant never means “all tenants.”
5. Browser applications do not query canonical domain tables directly.
6. Nest authorization is primary; RLS is mandatory defense in depth.
7. Domain contexts communicate through application services and events, not cross-context table updates.
8. Transactional truth, append-only facts and rebuildable projections are separate.
9. Money uses integer minor units plus ISO currency—never floating point.
10. Instants are UTC; business commitments also preserve IANA timezone and local date/time when required.
11. Mutable aggregates use optimistic versions and explicit state machines.
12. Financial, inventory, consent, audit and execution facts are append-only or corrected by reversals.
13. Provider IDs are external mappings, never domain primary keys.
14. Events and commands are versioned; outbox/audit share the domain transaction.
15. UNKNOWN is a first-class state. Missing facts are not converted to zero.

## Logical versus physical schemas

Documents use logical names such as `crm.leads` and `finance.journal_entries`.

Physical Postgres organization is an explicit pending technical decision:

| Option | Benefit | Cost/risk |
| --- | --- | --- |
| Dedicated Postgres schemas, private by default | Strong boundaries and smaller exposed surface | Current Supabase JS/PostgREST access may require schema exposure/grants or a direct server DB adapter |
| Canonical tables in `public` with strict prefixes/RLS | Fits current Supabase service pattern | Larger exposed schema and weaker namespace boundary |
| New managed Supabase project | Cleanest physical start | Auth/storage/data migration and parallel environment complexity |

This plan does not choose silently. See [`DECISIONS-AND-GATES.md`](./DECISIONS-AND-GATES.md).

## First delivery sets

### Foundation/dashboard

Tenant, domain, unit, membership/capability, module/plan/quota, blueprint/onboarding, audit/event/outbox/idempotency and projection records. Minimal durable agent records join this set only after P-DB-09 and the durable Phase 6 agent-registry decision are accepted.

### CRM/Growth

Party/contact, contact points, consent, customer account, lead, pipeline/stage, opportunity, task, interaction, campaign/source/touchpoint and Growth projections.

ERP/vertical tables are not prerequisites for the first CRM slice.

## SQL migration files

**Yes — when authorized, the redesign ships as controlled expand/contract SQL**, not ORM sync and not a big-bang replace of the 577-table legacy database.

| Artifact | Location | Apply status |
| --- | --- | --- |
| Logical models | this folder | paper authority |
| Draft expand SQL | [`packages/database/canonical/migrations/`](../../../../packages/database/canonical/migrations/) | **draft only** — separate from `supabase/migrations/` |
| Apply policy | [`packages/database/canonical/APPLY-POLICY.md`](../../../../packages/database/canonical/APPLY-POLICY.md) | DB0→DB4 before any shared DB |

Draft physical choice in SQL: **Option A** (private schemas). T-DB-01 remains open; Option B/C would require adapting the corpus before apply.

## Hard safety

- No production writes, `db push`, reset or destructive cleanup.
- Draft SQL in git ≠ applied schema. Do not treat file presence as live proof.
- No table is considered safe because its name appears in generated types.
- No vertical namespace is copied into the canonical core.
- No n8n/provider/model receives direct domain-table write authority.
- No legacy object is retired before writers, backfill, reconciliation and rollback close.
