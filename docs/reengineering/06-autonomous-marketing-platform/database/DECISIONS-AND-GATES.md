# Database decisions and gates

Created: **2026-09-04**
State: **OPEN — no canonical schema implementation authorized**
Index: [`README.md`](./README.md) · Migration: [`MIGRATION-PLAN.md`](./MIGRATION-PLAN.md)

## Decision authority

| Decision type | Owner/input |
| --- | --- |
| Product capabilities, journeys, commercial packaging | Product owner, with Cauã implementation review |
| Technical architecture, schemas, boundaries, migration mechanism | Cauã + accepted ADR process |
| Phase/gate movement | Existing program approvers and `STATUS.md` |
| Observed current data behavior | Evidence/tests, not stakeholder memory |

The stakeholder requirements document cannot authorize a code/database structure.

## Product decisions

### P-DB-01 — Plans and optional modules

Question: Are Essential/Ideal/Full quota-only, feature-tiered or hybrid?

Recommended:

- same universal catalogue;
- plan controls user/consumer and operational quotas;
- niche/company controls relevant activation;
- regulated/high-cost add-ons may require explicit entitlement.

Needs exact definitions for admin, final customer, counting period, overage and “unlimited.”

### P-DB-02 — Mandatory minimum

**PROPOSED mandatory minimum pending product P0/G0 acceptance.** Recommended every tenant receives:

- Contact/customer identity;
- lead capture/basic lifecycle;
- tasks/follow-up;
- Growth overview;
- internal business agent;
- platform Support.

Full CRM depth and ERP components remain optional by need.

### P-DB-03 — Technology/Marketing customer model

Decide whether a Marketing-only engagement creates:

- a normal tenant with a reduced module set (recommended);
- an internal project;
- or another account type.

Do not create a second customer identity system for the services arm.

### P-DB-04 — Quota subjects

Recommended:

- administrator quota counts active staff memberships with admin-equivalent role;
- final-customer quota counts active authenticated consumer accounts;
- CRM Contacts alone do not count unless product explicitly chooses it;
- fair-use/provider safeguards still apply to “unlimited.”

### P-DB-05 — Customer-service versus platform Support

Decide two case scopes and SLA/visibility. Do not merge tenant→Impulsionando tickets with final-consumer→tenant tickets by accident. Platform Support remains on `support_tickets` and the Nest Support API until an accepted `support_tickets` → future `cases.cases` bridge/backfill/authority plan is recorded; never run two platform-case authorities.

### P-DB-06 — Conversion

Choose the canonical Growth conversion event:

- lead converted;
- opportunity won;
- order confirmed;
- payment successful;
- niche-configured milestone.

Recommended: distinguish lifecycle conversion stages and select one primary reporting definition per blueprint/version.

### P-DB-07 — Sale/stock/revenue/commission/fiscal recognition

Must define recognition points and reversal behavior before ERP implementation. Different business models may configure policy, but policies are versioned and constrained.

### P-DB-08 — Accounting depth

If DRE, real margin and reconciliation are promised, approve double-entry accounting and posting-period rules. A mutable finance transaction list is insufficient.

### P-DB-09 — Agent specialization

Recommended starting policy: one active tenant-internal agent plus specialized skill/tool bundles. Decide whether the product truly needs several named internal agents per tenant before enforcing database cardinality.

### P-DB-10 — Legal entities, units and currencies

Decide whether Full/multi-unit tenants may have:

- multiple legal entities;
- multiple base currencies;
- unit-scoped roles/modules/pipelines/inventory.

Designing this later is expensive.

### P-DB-11 — Vertical priority

Current dashboard proposal starts restaurant, clinic and real estate. Stakeholder adds automotive and representation. Approve ordering; no vertical blocks Core CRM/Growth.

### P-DB-12 — Provider scope

Decide Mercado Pago defaults separately for:

- Impulsionando SaaS billing;
- tenant commerce.

WhatsApp and other providers remain adapter decisions.

## Technical decisions

### T-DB-01 — Physical database target

Choose:

- existing Supabase + canonical private schemas;
- existing Supabase + prefixed public/RLS tables;
- new managed Supabase project.

Requires prototype proof of Nest access, migration, RLS, Auth and rollback.

### T-DB-02 — Server database adapter

If canonical schemas remain private, decide whether Nest:

- uses Supabase/PostgREST with intentionally exposed schemas/grants;
- uses a direct Postgres driver/query layer;
- or uses carefully bounded RPCs.

No browser exposure follows from this choice.

### T-DB-03 — Canonical tenant column

New canonical storage should use `tenant_id`; legacy `company_id` stays behind adapters. Confirm composite tenant-aware FK convention.

### T-DB-04 — Capability/RBAC model

Blocked on Phase 8 RBAC ADR. Decide storage of role templates, tenant roles, unit/resource scopes and platform principals.

### T-DB-05 — Event/audit/outbox storage

Decide whether existing `reengineering_*` tables become canonical names, remain adapters, or migrate later. Do not duplicate active queues/outbox without an authority plan.

### T-DB-06 — Contact migration

After F-DATA, choose source precedence among `customers`, `communication_contacts`, `crm_leads` identity fields and vertical identities. Define merge/external-ID policy.

### T-DB-07 — Projection technology

Choose query/view/materialized projection/event-built tables per metric based on freshness/volume. Every choice needs rebuild and lineage.

### T-DB-08 — Migration tooling

Define controlled migration generation/apply path, schema tests, local/isolated environment and evidence. Production remains forbidden until its own gate.

## Gate model

```text
DB0 requirements accepted
  → DB1 physical/access ADR
  → DB2 F-DATA + source/writer characterization
  → DB3 canonical contract/schema review
  → DB4 isolated/staging expand + RLS tests
  → DB5 backfill + reconciliation
  → DB6 shadow read
  → DB7 write-authority move
  → DB8 read/route move
  → DB9 adapter/legacy retirement later
```

These gates are subordinate to Phase 8 G0–G3 and capability-specific gates.

## DB0 — Product requirements

Requires P-DB-01 through the decisions needed by the target slice.

For first CRM/Growth:

- P-DB-01/02/04/05/06;
- P-DB-09 for agent tools;
- no ERP recognition decision required yet.

## DB1 — Physical/access architecture

Requires T-DB-01/02/03/05/08 accepted. Output is an ADR or accepted technical decision packet.

## DB2 — Characterization

Requires:

- new-stack staging types;
- exact object shape;
- policies/triggers/functions;
- row volumes;
- writer/reader inventory;
- classification and retention;
- source→target mapping.

UNKNOWN tenant ownership or hidden writer blocks.

## DB3 — Model review

Review:

- aggregate/state/event contracts;
- tenant-safe FKs;
- RLS;
- idempotency and transaction boundary;
- backfill/reconciliation;
- rollback;
- compatibility.

## DB4 — Staging expand

Only additive objects in isolated/local then staging. No production.

Proof:

- migration lint/apply;
- constraints/indexes;
- RLS allow and deny;
- service-role API guard;
- rollback does not require destructive down migration.

## DB5 — Backfill/reconciliation

Requires deterministic resumable backfill and accepted discrepancy report. No external effects/workers during data load.

## DB6 — Shadow read

Normalized old/new comparison; no user authority change.

## DB7 — Write authority

Requires Phase 8 authorization for the product write slice:

- all writers enumerated/routed/disabled;
- audit/outbox/idempotency;
- observation/rollback;
- prior owner compatibility.

## DB8 — Read/route authority

Next/Nest consumes canonical source; route manifest flips; deny tests and metric freshness pass.

## DB9 — Retirement

Separate later decision after rollback window and restore evidence. Retire credentials/writers/adapters first; physical drops last.

## First CRM/Growth decision packet

Before implementation, record:

| Item | Required answer |
| --- | --- |
| Contact source | Canonical adapter/source precedence |
| Lead identity | How `crm_leads` links to Contact |
| Pipeline stage duplicate | `crm_stages` versus `crm_pipeline_stages` |
| Follow-up source | `crm_activities`, `crm_touch_queue` or canonical Task |
| Conversion | Approved reporting event |
| Consent | Purpose/channel behavior in first slice |
| Support/cases | Keep `support_tickets` authority or accepted bridge to future case engine; no duplicate platform cases |
| Writes | Existing browser/n8n/cron writer shutdown |
| Physical target | Chosen schema/access |
| Transaction | Lead capture atomicity |
| Reconciliation | Counts/states/orphans/duplicates/metrics |

## Explicit non-decisions

This planning set does not:

- accept product requirements;
- accept the physical database target;
- create schema;
- choose an ORM;
- choose providers;
- authorize migration;
- mark current data disposable;
- move Phase 8.
