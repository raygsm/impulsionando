# Canonical data model — foundation and customer lifecycle

Created: **2026-09-04**
State: **PROPOSED logical model — not migration SQL**
Rules/index: [`README.md`](./README.md) · Legacy mapping: [`CURRENT-ASSET-DISPOSITION.md`](./CURRENT-ASSET-DISPOSITION.md)

## 1. Context map

```text
Supabase Auth
    ↓
Identity ──→ Tenancy ──→ Entitlements / Modules / Plans
    │             └────→ Blueprints / Onboarding
    └──────────────────→ Compliance / Audit

Contacts
    ├──→ Growth / Attribution
    ├──→ CRM ──→ Tasks
    ├──→ Communications
    ├──→ Agenda
    ├──→ Sales
    └──→ Finance

All domains → Events/Outbox → Jobs/Worker → Integrations
Analytics consumes events/read models
AI invokes registered application tools
Verticals depend inward; Core never depends on a vertical
```

Logical contexts are module ownership, not necessarily physical Postgres schemas.

## 2. Common conventions

### Mutable tenant-owned aggregate

```text
id uuid
tenant_id uuid
created_at timestamptz
created_by uuid/null
updated_at timestamptz
updated_by uuid/null
row_version bigint
deleted_at timestamptz/null
deleted_by uuid/null
delete_reason text/null
```

Use soft delete only for recoverable master data. Financial, inventory, consent, event, audit and execution facts are never soft-deleted.

### Tenant-safe relationship

Every **new canonical** private parent has `UNIQUE (tenant_id, id)`. A canonical child references `(tenant_id, parent_id)`, preventing a child in tenant A from linking to a parent in tenant B even if application authorization fails. Legacy adapters cannot assume these constraints; the tenant-column registry and application guard remain mandatory until an expand migration adds them.

### State

States use constrained values and append-only transition history where business meaning matters. Free-form status strings are not accepted.

### Time and money

- event/creation timestamps are UTC;
- scheduling preserves UTC bounds + IANA timezone + local date/time;
- money is `{ amount_minor bigint, currency char(3) }`;
- converted money stores rate, source and rate date;
- no floating-point values.

## 3. Tenancy

### `tenancy.tenants`

One business workspace.

| Field | Purpose |
| --- | --- |
| `id` | Canonical tenant UUID |
| `slug` | Normalized stable application slug |
| `display_name` | Product-facing name |
| `legal_name` | Optional legal identity shortcut; full legal entities separate |
| `default_locale` | e.g. `pt-BR` |
| `default_timezone` | IANA timezone |
| `default_currency` | ISO 4217 |
| `state` | `provisioning`, `active`, `suspended`, `closing`, `closed` |
| `row_version` | Optimistic concurrency |

Unique normalized slug. Tenant closure never cascades through all data.

### `tenancy.tenant_domains`

| Field | Purpose |
| --- | --- |
| `tenant_id` | Owner |
| `hostname` | Normalized globally unique host |
| `kind` | `platform_subdomain`, `custom`, `staging` |
| `verification_method/value_hash` | Verification evidence without exposing secret value |
| `state` | `pending`, `verified`, `active`, `retired` |
| `verified_at`, `activated_at`, `retired_at` | History |

### `tenancy.legal_entities`

Supports businesses with more than one registered company.

Fields: tenant, legal/trade name, tax identifier, jurisdiction, base currency, address reference, state. Tax identifier uniqueness is scoped by jurisdiction and policy.

### `tenancy.business_units`

Location/branch/department boundary.

Fields: tenant, parent unit, legal entity, code, name, timezone, address, state. Unique `(tenant_id, code)`.

### `tenancy.unit_hours`

Business-unit regular hours and date exceptions. Stores local weekday/date/time plus timezone; never assumes server timezone.

### `tenancy.tenant_settings`

Typed, versioned settings by namespace/key. Not a dumping ground for permissions, money, workflow code or secrets.

## 4. Identity and access

### `iam.user_profiles`

One-to-one with `auth.users`, containing display metadata only. Never authorization authority.

### `iam.memberships`

| Field | Purpose |
| --- | --- |
| `tenant_id`, `user_id` | Relationship |
| `state` | `invited`, `active`, `suspended`, `ended` |
| `invited_at`, `activated_at`, `ended_at` | Lifecycle |

Unique active `(tenant_id, user_id)`.

### `iam.capabilities`

Global stable registry using `{domain}.{resource}.{action}`.

Fields: key, description, risk, lifecycle. Capability removal/deprecation is versioned.

### `iam.roles`, `iam.role_capabilities`, `iam.membership_roles`

- roles can be global templates or tenant-owned;
- role versions map to capability keys;
- membership-role assignment records grantor and validity interval;
- a tenant admin cannot grant a capability outside their grant boundary.

### `iam.invitations`

Tenant, normalized email, intended role references, token hash, expiry and `pending/accepted/expired/revoked`. Raw invite tokens are never stored.

### `iam.platform_principals`

Explicit platform-staff authority. No synthetic “master tenant” as the only proof of platform role.

### `iam.consumer_accounts`

Links a final-consumer auth user to a tenant-owned Contact/Party. It does not make the consumer a staff membership.

### `iam.delegations`

Time-bound platform-staff access to a tenant, with reason, allowed capability scope, expiry and audit. Required for Impulsionito tenant-detail delegation.

## 5. Modules, plans and quotas

The tables in this section are illustrative logical shapes. P-DB-01 and related DB0 product decisions in [`DECISIONS-AND-GATES.md`](./DECISIONS-AND-GATES.md) must be accepted before physical implementation. The default recommendation is quota-first plans with blueprint/company module activation; `plan_modules` is conditional and must not be created merely because it appears below.

### Module registry

| Table | Purpose |
| --- | --- |
| `entitlements.module_definitions` | Stable global module key/category/owner context/lifecycle |
| `entitlements.module_versions` | Immutable contract/contribution version after publication |
| `entitlements.module_dependencies` | Versioned dependency graph; must remain acyclic |

### Commercial plans

| Table | Purpose |
| --- | --- |
| `entitlements.plan_definitions` | Stable commercial plan identity; exact Essential/Ideal/Full taxonomy only after P-DB-01 acceptance |
| `entitlements.plan_versions` | Effective interval, price/commercial metadata and state |
| `entitlements.plan_modules` | Module availability/depth only if product decision permits feature-tiering |
| `entitlements.tenant_subscriptions` | Tenant plan and `trialing/active/past_due/suspended/cancelled` state |

Plans are immutable by version after activation. Existing subscriptions point to their contracted version.

### Quotas

| Table | Purpose |
| --- | --- |
| `entitlements.quota_definitions` | Key, measured subject, unit, reset policy |
| `entitlements.plan_quota_limits` | Hard/soft limit, overage policy by plan version |
| `entitlements.quota_usage_events` | Append-only usage delta with idempotency key |
| `entitlements.quota_balances` | Rebuildable period projection |

Proposed quota keys:

```text
active_admin_memberships
active_consumer_accounts
business_units
monthly_messages
monthly_ai_tokens
storage_bytes
```

Contacts are not automatically “final customer quota”; the product must accept the counting rule.

### Tenant module state

| Table | Purpose |
| --- | --- |
| `entitlements.tenant_module_states` | Desired/effective state, version, source, readiness |
| `entitlements.tenant_module_overrides` | Enable/disable request, reason, actor and validity |

Effective dashboard manifest is computed, not stored as editable truth.

## 6. Blueprints and onboarding

Illustrative only until the product accepts blueprint/onboarding scope and transaction behavior at DB0.

| Table | Purpose |
| --- | --- |
| `entitlements.blueprints` | Stable niche key |
| `entitlements.blueprint_versions` | Immutable terminology, module preset and rule version |
| `entitlements.blueprint_module_presets` | Recommended module/config defaults |
| `entitlements.tenant_blueprint_applications` | Applied version and override snapshot |
| `entitlements.onboarding_runs` | `draft → compiled → approved → applying → applied/failed` |
| `entitlements.onboarding_answers` | Typed/redacted answer keyed by field/schema version |
| `entitlements.onboarding_proposals` | Input hash, compiled output and conflicts |
| `entitlements.onboarding_applications` | Idempotency key, result and correlation |

The compiler is pure. Apply revalidates plan, actor, blueprint and dependencies; commits Core state/audit/outbox atomically; integration setup continues through durable jobs.

## 6.1 Commercial/service engagements (conditional)

P-DB-03 remains open. If Marketing-only and consulting engagements require operational delivery beyond normal tenant subscription, the logical placeholders are:

| Table | Purpose |
| --- | --- |
| `commercial.service_engagements` | Tenant/customer, service type, commercial terms reference, owner, period and state |
| `commercial.engagement_deliverables` | Versioned promised deliverable, owner, due/status/evidence |
| `commercial.engagement_assignments` | Internal team/partner assignment |
| `commercial.engagement_events` | Append-only transition/delivery history |

Recommendation: a Marketing-only customer is still a normal tenant with a reduced module set. Do not implement these tables until P-DB-03 defines whether generic Contracts/Tasks already suffice.

## 7. Canonical customer identity

The same physical person in two tenants is two separately governed tenant records. No global person graph.

### `contacts.parties`

Tenant-owned supertype:

| Field | Purpose |
| --- | --- |
| `kind` | `person` or `organization` |
| `display_name` | Search/display |
| `lifecycle_state` | Party-record state only (`active/merged/anonymized` recommended); commercial prospect/customer lifecycle belongs to CustomerAccount and remains a product decision |
| `dedupe_state` | `clean`, `suspected_duplicate`, `merged` |

### `contacts.persons` / `contacts.organizations`

One-to-one subtypes. Person holds justified identity fields only; no clinical data. Organization holds legal/trade identifiers. Sensitive fields are classified and minimized.

### `contacts.contact_points`

Party, type (`email`, `phone`, etc.), normalized value, verification state, primary flag and validity. Controlled uniqueness `(tenant_id, type, normalized_value)` with merge policy.

### `contacts.addresses`

Party/unit address with purpose, validity and source.

### `contacts.party_relationships`

Person↔organization or party↔party relationship with role and validity—supports B2B buying committees and household/representative relationships without copying contacts.

### `contacts.customer_accounts`

The tenant's commercial relationship with a party. A Party can exist before becoming a customer. Stores lifecycle/account owner and activation/closure, not CRM pipeline state.

### `contacts.external_identities`

Unique `(tenant_id, source_system, external_id)` mapping to Party. Required for imports, providers and legacy reconciliation.

### `contacts.merge_records`

Immutable duplicate→survivor decision, evidence and actor. Merge is auditable and, when possible, reversible.

### Tags/custom fields

`contacts.tags`, `contacts.party_tags`, versioned field definitions and typed field values. No unconstrained JSON permissions/statuses.

## 8. Consent and privacy

### `compliance.consent_events`

Append-only:

- tenant/party/contact point;
- purpose;
- channel;
- decision (`granted`, `denied`, `revoked`);
- lawful basis;
- policy/version;
- evidence/source;
- occurred/expiry.

### `compliance.consent_current`

Rebuildable projection. Sending decisions use current policy and purpose, not a single generic “opt-in” boolean.

Additional:

- data classification;
- retention policies;
- legal holds;
- export/erasure requests;
- erasure actions and evidence.

Anonymization preserves legally required finance/audit facts while removing/detaching PII.

## 9. Growth

### `growth.sources`

Tenant acquisition-source vocabulary: channel, platform/source and active state.

### `growth.campaigns`

Objective, owner, period, budget metadata, status `draft/planned/active/paused/completed/cancelled`, and external mappings. It does not claim dispatch.

### `growth.campaign_memberships`

Versioned audience membership snapshot/reason. Needed to explain who was targeted at the time.

### `growth.touchpoints`

Append-only interaction/acquisition facts with party/session, source, campaign, UTM/external evidence, occurred-at and confidence.

### `growth.attribution_claims`

Outcome, model/version, source/touchpoint, weight and confidence. New models create new claims; they do not overwrite historical evidence.

### Segments

| Table | Purpose |
| --- | --- |
| `growth.segment_definitions` | Versioned rule/config, state and owner |
| `growth.segment_versions` | Immutable rule version |
| `growth.segment_snapshots` | Evaluated membership, as-of time and source freshness |

### Retention

| Table | Purpose |
| --- | --- |
| `growth.retention_policies` | Tenant/niche active→risk→inactive→reactivation definitions |
| `growth.retention_signals` | Append-only evidence/classification, policy version, score and provenance |

No automated action follows a signal without workflow/tool policy.

## 10. CRM

### `crm.leads`

Tenant, party/customer account, source/touchpoint, campaign, owner, qualification schema version, current state and version.

State:

```text
new → contacted → qualified → converted
                 └→ disqualified
```

### `crm.lead_transitions`

Append-only from/to, reason, actor, timestamp and correlation. Lead does not own name/email/phone.

### `crm.pipelines` / `crm.stages`

Pipeline scope (tenant/unit/team), version/state; ordered stages with semantic kind `open/won/lost`. Unique code/order within pipeline.

### `crm.opportunities`

Party/account, lead link, pipeline/stage, owner, expected amount/currency, close date, state `open/won/lost/cancelled` and optimistic version.

### `crm.opportunity_stage_history`

Append-only prior/new stage and versions.

### `crm.activities`

Completed/occurred interaction facts linked to party/lead/opportunity. Activities are history; future work belongs to Tasks.

### Lead scoring

| Table | Purpose |
| --- | --- |
| `crm.scoring_models` | Versioned factor/rule model |
| `crm.score_results` | Lead, model version, score, factors and calculated-at |

Scoring does not authorize actions and must show freshness.

### Lifecycle links

`growth.lifecycle_links` correlates lead/opportunity with downstream appointment, quote, order, contract or payment outcome IDs. CRM does not own those records.

## 11. Tasks and handoff

### `tasks.tasks`

Tenant/unit, assignee/team, title, due-at, priority, state `open/in_progress/completed/cancelled`, version and completion metadata.

### `tasks.task_links`

Links task to typed domain resource; API validates same-tenant ownership.

### `tasks.assignment_history`

Append-only assignment/reassignment.

### `crm.handoffs`

Marketing→Sales, agent→human or team handoff with source/target actor/team, context reference, reason, SLA and accepted/completed state.

## 12. Surveys and cases

### Surveys/NPS

`growth.survey_programs`, `survey_requests`, `survey_responses` with program/version, party, order/appointment/case context, score and consent/channel evidence.

### Case engine

Use explicit ownership:

| Case scope | Relationship |
| --- | --- |
| `platform_support` | Tenant/user → Impulsionando |
| `tenant_customer_service` | Final consumer/contact → tenant |

Tables may share an engine only with `owning_tenant_id`, `provider_scope`, audience, visibility and SLA clocks explicit. Existing Support remains platform Support until migration says otherwise.

`support_tickets` and the Nest Support API remain the sole active platform-Support authority until P-DB-05 accepts a bridge, backfill, reconciliation and ownership cutover into any future shared case engine.

## 13. Audit

### `compliance.audit_records`

Append-only:

- actor kind/ID;
- effective tenant and platform delegation;
- capability/action;
- resource type/ID;
- before/after hashes or minimized diff;
- result;
- correlation/request ID;
- occurred-at;
- data classification.

No secret, raw token or unnecessarily duplicated PII.

## 14. Foundation/dashboard minimum

First durable set may adapt current objects initially:

```text
tenants, domains, units/settings
memberships, roles, capabilities, role bindings, delegations
module definitions/versions/dependencies/states
plans/versions/quotas/subscription
blueprints/versions/onboarding proposal/apply
audit, events/outbox/idempotency
projection metadata
agent definition/version/activation
```

## 15. CRM/Growth minimum

```text
parties/persons/organizations/contact points
customer accounts/external identities/merge records
consent events/current
sources/campaigns/touchpoints
leads/transitions
pipelines/stages
opportunities/stage history
activities
tasks/task links
lifecycle links
Growth projection/checkpoint
```

The first transaction must atomically cover idempotency, contact link/create, lead/opportunity mutation, audit, domain event and outbox.
