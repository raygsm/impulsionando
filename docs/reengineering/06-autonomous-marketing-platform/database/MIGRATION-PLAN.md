# Canonical database migration plan

Created: **2026-09-04**
State: **PROPOSED — draft expand SQL in packages/database/canonical/; apply not authorized**
Authority: [`../../04-migration/phase-1/CONTRACT-MIGRATIONS.md`](../../04-migration/phase-1/CONTRACT-MIGRATIONS.md) · Program status: [`../../STATUS.md`](../../STATUS.md)

## Goal

Move product authority from a drifted 577-table legacy database into a small, capability-driven canonical model without a reset, big-bang rewrite or unknown data loss.

```text
legacy database
  = observed source + temporary adapters

canonical database
  = new contract and eventual authority
```

“Keep” never means “let legacy shape dictate Nest.” “Retire” never means drop before dependency evidence and rollback close.

## 0. Draft SQL corpus (2026-09-04)

Expand-only draft files live under [`packages/database/canonical/migrations/`](../../../../packages/database/canonical/migrations/).

- Physical draft in SQL: Option A (private schemas) — T-DB-01 still open
- Not registered in `supabase/migrations/`
- Apply policy: [`packages/database/canonical/APPLY-POLICY.md`](../../../../packages/database/canonical/APPLY-POLICY.md)
- **Do not apply** until DB1+DB3+DB4

## 1. Migration unit


The unit is a **capability aggregate**, not a table:

```text
Foundation/session
Module/blueprint composition
Contact identity
CRM lead/pipeline/opportunity/task
Growth projection
Agenda
Sales/inventory
Finance/billing/payments
Communications
Agent registry
Vertical extension
```

Each aggregate moves contracts, reads, writes, events, permissions and route ownership together.

## 2. Physical target decision

Before SQL, choose one:

### Option A — canonical schemas in existing managed Supabase

Pros: keeps Auth/Storage/project integration and simplifies incremental adapters.
Cons: legacy and canonical coexist physically; schema exposure/privileges need care.

### Option B — canonical `public` tables with strict namespace/prefix in existing project

Pros: fits current Supabase JS/PostgREST pattern.
Cons: increases exposed-surface risk and is less structurally clean.

### Option C — new managed Supabase project

Pros: cleanest physical database and migration history.
Cons: Auth user/session, Storage, provider/webhook, environment and data cutover complexity; risks creating a second platform.

**Draft recommendation, not a decision:** Option A if a prototype proves server access can preserve private-by-default schemas without browser exposure. Option B is acceptable only with explicitly reduced PostgREST schema-allowlist evidence, strict RLS, Nest-only access proof, and review of the **combined legacy + canonical exposed surface**—including Phase 8 Q4's anon-callable SECURITY DEFINER functions/grants and the 101 RLS-enabled/zero-policy tables. Option C requires a separate ADR plus restore, Auth/Storage/data cutover and rollback evidence under ADR-004.

No option is executed until the access approach is proven locally/staging.

## 3. Stage D0 — decisions and inventory refresh

Required:

- accept product model and plan/module/quota decisions;
- accept RBAC/capability ADR;
- choose physical target;
- run Phase 8 F-DATA against staging;
- regenerate new-stack types without overwriting legacy types;
- inventory tables/views/functions/triggers/policies and every writer for the first aggregate;
- record row volumes and data classifications;
- establish backup/restore-compatible rollback.

Output: capability-specific source map with KEEP/ADAPT/MIGRATE/MERGE/RETIRE/UNKNOWN.

UNKNOWN tenant ownership blocks migration.

## 4. Stage D1 — migration foundation

Create through approved migration tooling in local/isolated staging first, **split into separate aggregate-sized migrations/SHAs and rollback flags** rather than one foundation mega-migration:

- canonical migrations directory/ownership convention;
- schema/grant/RLS baseline;
- tenant-safe FK helpers/conventions;
- audit/event/outbox/idempotency primitives or adapters to existing reengineering tables;
- migration lineage/control tables;
- data-quality and reconciliation result format;
- test fixtures for tenant A/B and roles.

### Migration control

Recommended:

| Table | Purpose |
| --- | --- |
| `migration.source_objects` | Legacy source identity/classification |
| `migration.runs` | Capability, code/migration SHA, start/end/result |
| `migration.record_links` | Source object/ID → canonical object/ID |
| `migration.errors` | Redacted per-record failure |
| `migration.reconciliation_results` | Counts, sums, hashes and discrepancies |
| `migration.checkpoints` | Resume cursor/watermark |

These are operational evidence, not business truth.

## 5. Per-capability strangler

### Step 1 — Characterize

- exact source shape;
- all writers/readers;
- RLS/functions/triggers;
- state/value semantics;
- duplicates and invalid data;
- required retention.

### Step 2 — Contract

- canonical entities/states/events;
- authorization and tenant ownership;
- migration mapping;
- zero/UNKNOWN;
- rollback compatibility.

### Step 3 — Expand

- additive canonical objects;
- constraints/indexes/RLS;
- no destructive changes;
- code compatible with old and new.

### Step 4 — Backfill

- deterministic, resumable and idempotent;
- source→target lineage;
- invalid records quarantined, not silently dropped;
- no external effects;
- bounded batches.

### Step 5 — Reconcile

At minimum:

- source/target counts by tenant/state;
- required-field completeness;
- orphan and cross-tenant FK checks;
- duplicate/merge decisions;
- financial sums/currencies where relevant;
- event/state histories;
- sample journey replay;
- allow and deny.

### Step 6 — Shadow read

Nest produces canonical output from both adapters and compares normalized results. User response still comes from current authority until discrepancies close.

### Step 7 — Move write authority

- one API command owner;
- legacy/browser/n8n writers disabled or routed through API;
- idempotency/audit/outbox active;
- observation window;
- rollback trigger defined.

Avoid indefinite dual writes. If temporary dual write is unavoidable, use one authoritative write plus transactional outbox/projector—not two independent mutations.

### Step 8 — Move reads

Next/Nest reads canonical output. Legacy route ownership flips per Phase 8.

### Step 9 — Contract/retire

Only after rollback window:

- revoke old writer privileges;
- archive required history/config;
- remove adapters;
- mark legacy objects retired;
- destructive cleanup receives separate authorization and restore evidence.

## 6. Foundation/dashboard migration

Recommended order:

1. tenant/host adapter (`companies`, aliases);
2. accept Phase 8 G1/RBAC ADR and freeze the source→target role/capability mapping;
3. memberships, explicit platform principal and capability/role adapters;
4. effective modules/plan/flags adapter;
5. module/blueprint/onboarding canonical records;
6. quota definitions/usage ledger;
7. minimal agent definitions only after P-DB-09 and the durable Phase 6 agent-registry decision pass; otherwise defer them;
8. dashboard projections.

No legacy identity table is dropped. The first target may adapt existing `companies`/`user_roles` while new authorization and composition become canonical.

## 7. CRM/Growth migration

### Source characterization

Candidates:

```text
customers
communication_contacts / contact identities
crm_leads
crm_pipelines / crm_stages / crm_pipeline_stages
crm_opportunities
crm_activities
crm_touch_queue / rules
marketing_leads
lgpd_consents
funnel/catalog event data
```

### Target order

1. Party/Contact + external identities;
2. contact points/consent;
3. Lead linked to Contact;
4. Pipeline/Stage;
5. Opportunity/history;
6. Task/activity distinction;
7. sources/touchpoints/campaigns;
8. lifecycle links and Growth projection.

### First write transaction

Lead capture:

```text
idempotency claim
  + resolve/create Contact
  + create Lead
  + create initial follow-up if requested
  + audit
  + domain event
  + outbox
  = one transaction/RPC
```

Sequential inserts with cleanup do not qualify.

## 8. ERP migration order

Do not start with accounting breadth. Migrate when product slices need it:

1. Catalog/variants/prices;
2. Sales quote/order;
3. Inventory movement/reservation;
4. Fulfillment;
5. Receivable/payable;
6. Payment normalization;
7. Accounting journal/posting;
8. Billing/recurrence/dunning;
9. Fiscal;
10. commissions/affiliates;
11. POS;
12. vertical extensions.

Sale recognition and reversal decisions precede steps 2–9.

## 9. Schema/RLS security gate

Every new exposed table:

- RLS enabled before data;
- direct tenant ownership;
- explicit SELECT/INSERT/UPDATE/DELETE policy as applicable;
- UPDATE has necessary SELECT visibility;
- no `USING (true)` without documented public/catalog reason;
- no user-editable metadata authorization;
- verify the managed Postgres/Supabase project supports `security_invoker`; views use it where exposed/supported or remain private/Nest-only;
- privileged functions live outside exposed schema where feasible;
- `search_path` fixed and execute grants minimized;
- allow and deny tests for tenant A/B and roles;
- service-role Nest route guard tested separately.

Storage documents need INSERT/SELECT/UPDATE policies for upsert and domain ownership.

## 10. Data quality policy

No silent coercion:

| Legacy issue | Treatment |
| --- | --- |
| Missing tenant | Quarantine/block |
| Invalid email/phone | Preserve source raw under protected migration evidence; canonical point marked invalid |
| Duplicate contact | Suspected duplicate + review/merge rule |
| Unknown status | Mapping error/quarantine; never map to active |
| Missing currency | UNKNOWN; do not assume BRL unless source contract guarantees it |
| Orphan FK | Reconciliation failure |
| Hard-coded tenant policy | Remove only through separate RLS migration and deny proof |

## 11. Backfill safety

- isolated/staging first;
- no workers/external dispatch during backfill;
- deterministic ordering/checkpoint;
- bounded transaction batches;
- no trigger-generated external effects;
- idempotent resume;
- metrics and redacted errors;
- source remains untouched unless separate remediation approved;
- exact code/migration SHA recorded.

## 12. Rollback

Rollback uses:

- capability/route flag to return reads/writes to prior adapter;
- previous API/app image SHA;
- additive canonical records retained;
- outbox/jobs paused/reconciled;
- no destructive down migration;
- source→target links preserved.

Before moving writes, prove the prior owner can read or safely ignore records written by the new owner. If not, use forward-fix/cutover completion rather than false rollback.

This compatibility result is a mandatory DB7 gate. If new canonical rows cannot be represented by the prior owner, rollback is **forward-fix only**: disable further writes, preserve evidence, correct/complete the canonical path, and never pretend a route flip restores data compatibility.

## 13. Completion per aggregate

An aggregate is migrated only when:

1. canonical contract/model accepted;
2. source/writer inventory complete;
3. migration and RLS tests pass;
4. backfill reconciles;
5. shadow reads match or differences are accepted;
6. API allow/deny passes;
7. writes are idempotent/audited/evented;
8. old writer authority is removed;
9. Next/agent consume canonical API;
10. rollback rehearsed;
11. evidence records exact SHAs and UNKNOWNs.

## 14. What “database remodeled” means

It does **not** mean all old tables deleted.

It means:

- new product contracts point to canonical contexts;
- Nest owns reads/writes;
- required historical data is linked/migrated;
- old tables no longer dictate product design;
- duplicate writer authority is closed;
- legacy objects can be archived/retired independently.

## Explicit prohibitions

- `supabase db push`/reset against production;
- copying all legacy migrations into a clean target;
- ORM generation over all 577 tables as the new model;
- big-bang `company_id`→`tenant_id` rename;
- cross-tenant global Contact dedupe;
- direct n8n/browser domain writes;
- dual writes without reconciliation;
- migrations that dispatch real communications/payments;
- dropping legacy objects because no current TypeScript reference was found;
- phase completion on counts alone without journey/reconciliation proof.
