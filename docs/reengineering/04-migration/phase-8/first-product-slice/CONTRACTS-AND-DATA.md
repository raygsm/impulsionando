# First product slice — contracts and data

Created: **2026-09-04**
State: **PROPOSED — schemas below are planning contracts, not implemented facts**
Plan: [`FOUNDATION-AND-CRM-PLAN.md`](./FOUNDATION-AND-CRM-PLAN.md)

## 1. Contract principles

- Zod runtime schema is the shared truth.
- Next imports contracts/API client, never Nest implementation.
- Public API vocabulary uses `tenantId`; physical `company_id`/`tenant_id` stays inside repositories.
- IDs are UUIDs unless an observed legacy object proves otherwise.
- Timestamps are ISO UTC; reporting requests carry an explicit business timezone.
- Monetary values use integer minor units plus currency.
- Unknown/degraded data has an explicit shape.
- Every list is paginated.
- Writes return the authoritative resulting resource and metadata.
- Error envelopes carry stable code and correlation ID.

## 2. Unit A contracts

### Session context

```ts
type SessionContextV1 = {
  version: 1
  user: {
    id: string
    email?: string
  }
  memberships: Array<{
    id: string
    tenantId: string
    tenantName: string
    roles: string[]
  }>
  activeTenant: {
    id: string
    name: string
    slug: string
    nicheKey?: string
    branding: {
      logoUrl?: string
      primaryColor?: string
      accentColor?: string
    }
  }
  capabilities: string[]
  mode: 'tenant' | 'platform_staff' | 'observer' | 'impersonation'
  agent?: {
    id: string
    kind: 'tenant_internal'
    displayName: string
    status: 'active' | 'configuring' | 'degraded' | 'suspended'
  }
}
```

The authenticated identity cannot submit `mode` or `capabilities`.

### Module definition

```ts
type ModuleDefinitionV1 = {
  key: string
  version: number
  required: boolean
  dependencies: string[]
  dashboardRegion: 'home' | 'growth' | 'customers' | 'operations' | 'management' | 'help' | 'settings'
  capabilities: string[]
  setupRequirements: string[]
  integrationRequirements: string[]
  agentToolFamilies: string[]
}
```

### Effective module

```ts
type EffectiveModuleV1 = {
  key: string
  state:
    | 'NOT_ENTITLED'
    | 'CONFIGURING'
    | 'READY'
    | 'ACTIVE'
    | 'DEGRADED'
    | 'SUSPENDED'
    | 'DISABLED'
  enabledBy: Array<'mandatory' | 'blueprint' | 'plan' | 'company_override'>
  missingRequirements: string[]
  degradedReasons: Array<{ code: string; message: string }>
}
```

### Dashboard manifest

Use/extend `packages/contracts/src/dashboard.ts` from the final merged Next frontend. This file is **not present on `reengineering/program` at this plan's timestamp** and is an explicit PR #151 landing dependency. Required semantics:

- stable primary regions;
- contributions filtered server-side;
- module state, not a boolean;
- agent summary;
- no private data values in the manifest;
- explicit version and correlation ID.

## 3. Unit B entities

These are API concepts. They may adapt legacy rows rather than immediately create new physical tables.

### Contact

```ts
type ContactV1 = {
  id: string
  tenantId: string
  kind: 'person' | 'organization'
  displayName: string
  email?: string
  phone?: string
  consent: {
    email?: 'unknown' | 'granted' | 'denied'
    whatsapp?: 'unknown' | 'granted' | 'denied'
    updatedAt?: string
  }
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
}
```

Do not expose sensitive vertical fields in this base contract.

### Lead

```ts
type LeadV1 = {
  id: string
  tenantId: string
  contactId: string
  source: {
    channel: string
    campaignId?: string
    externalRef?: string
  }
  status: 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted'
  ownerUserId?: string
  qualification: Record<string, string | number | boolean | null>
  nextFollowUpAt?: string
  createdAt: string
  updatedAt: string
  version: number
}
```

Qualification keys must come from validated tenant/niche configuration, not arbitrary persistence without limits.

### Follow-up task

```ts
type FollowUpTaskV1 = {
  id: string
  tenantId: string
  contactId?: string
  leadId?: string
  opportunityId?: string
  title: string
  assignedUserId?: string
  dueAt?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  completedAt?: string
  createdAt: string
  updatedAt: string
  version: number
}
```

### Pipeline/stage

```ts
type PipelineV1 = {
  id: string
  tenantId: string
  name: string
  active: boolean
  stages: Array<{
    id: string
    name: string
    order: number
    kind: 'open' | 'won' | 'lost'
  }>
}
```

### Opportunity

```ts
type OpportunityV1 = {
  id: string
  tenantId: string
  contactId: string
  leadId?: string
  pipelineId: string
  stageId: string
  title: string
  ownerUserId?: string
  value?: { amountMinor: number; currency: string }
  status: 'open' | 'won' | 'lost'
  outcomeReason?: string
  expectedCloseAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  version: number
}
```

## 4. Planned endpoint surface

Exact naming may adapt to existing conventions, but one resource must not get competing endpoint families.

### Read-only dashboard proof (Unit A)

```http
GET /api/v1/dashboard/manifest
GET /api/v1/dashboard/home
GET /api/v1/dashboard/actions
GET /api/v1/support/tickets
GET /api/v1/communications/inbox
GET /api/v1/growth/overview
```

Unit A's Growth endpoint is a characterized read projection. Unit B may enrich it but must preserve its contract/version.

### Contacts

```http
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:contactId
PATCH  /api/v1/contacts/:contactId
GET    /api/v1/contacts/:contactId/timeline
```

### Leads

```http
GET    /api/v1/crm/leads
POST   /api/v1/crm/leads
GET    /api/v1/crm/leads/:leadId
PATCH  /api/v1/crm/leads/:leadId
POST   /api/v1/crm/leads/:leadId/assign
POST   /api/v1/crm/leads/:leadId/qualify
POST   /api/v1/crm/leads/:leadId/disqualify
POST   /api/v1/crm/leads/:leadId/convert
```

Capture must accept an idempotency key and either link an existing contact safely or create one inside the mutation boundary.

### Tasks

```http
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/:taskId
PATCH  /api/v1/tasks/:taskId
POST   /api/v1/tasks/:taskId/complete
POST   /api/v1/tasks/:taskId/cancel
```

### Pipeline/opportunities

```http
GET    /api/v1/crm/pipelines
GET    /api/v1/crm/opportunities
POST   /api/v1/crm/opportunities
GET    /api/v1/crm/opportunities/:opportunityId
PATCH  /api/v1/crm/opportunities/:opportunityId
POST   /api/v1/crm/opportunities/:opportunityId/move-stage
POST   /api/v1/crm/opportunities/:opportunityId/win
POST   /api/v1/crm/opportunities/:opportunityId/lose
```

Stage commands include `expectedVersion`; stale changes return 409.

### Growth

```http
GET /api/v1/growth/overview?from=<date>&to=<date>&timezone=<iana>
```

No mutation endpoint belongs to the Growth projection.

## 5. Initial capability keys

Use the Phase 1 `{domain}.{resource}.{action}` shape:

```text
dashboard.home.read
dashboard.actions.read
growth.overview.read
support.ticket.read
support.ticket.status
communications.inbox.read

contacts.contact.read
contacts.contact.create
contacts.contact.update

crm.lead.read
crm.lead.create
crm.lead.update
crm.lead.assign
crm.lead.qualify
crm.lead.convert

tasks.task.read
tasks.task.create
tasks.task.update
tasks.task.complete

crm.pipeline.read
crm.opportunity.read
crm.opportunity.create
crm.opportunity.update
crm.opportunity.stage
crm.opportunity.close
```

The RBAC ADR must determine role expansion. Do not seed grants by assumption.

## 6. Event contracts

Unit B events:

```text
contact.created
contact.updated
contact.consent_changed
lead.captured
lead.assigned
lead.qualified
lead.disqualified
lead.converted
follow_up.created
follow_up.completed
opportunity.created
opportunity.stage_changed
opportunity.won
opportunity.lost
```

Use the existing versioned event envelope:

- event ID/type/version;
- tenant ID;
- aggregate type/ID;
- actor kind/ID;
- correlation and causation IDs;
- occurred-at;
- minimized payload.

Do not include full contact records in events.

## 7. Repository and database mapping

Before implementing a repository, record:

| Field | Required evidence |
| --- | --- |
| Physical object | Observed staging table/view/function |
| Tenant column | `company_id`, `tenant_id`, other or none |
| Primary key/version | Exact columns |
| RLS | Enabled, policy names/intent |
| Service-role guard | Nest capability/tenant/resource check |
| Existing writers | Legacy UI/functions, n8n, webhooks, cron |
| Adapter decision | KEEP/ADAPT/MIGRATE/MERGE/RETIRE/UNKNOWN |
| Backfill/reconciliation | Method and rollback |

No generic repository may infer tenant column from a naming convention.

## 8. Migration options

Choose per aggregate after characterization:

### Adapter-first

Use existing tables behind a clean Nest repository contract. Preferred when shape and isolation are adequate.

### Additive canonical table

Create a new table in staging when existing representations cannot safely support the contract. Requires an accepted migration, RLS, backfill and reconciliation.

### Projection

Create a read model for Growth from existing canonical mutation sources. It has freshness and rebuild semantics and owns no business writes.

### Merge later

If several legacy tables represent contacts/leads, adapt them initially and plan a separate merge. Do not combine identity migration with the first UI delivery unless unavoidable.

## 9. Transaction boundaries

| Command | Atomic requirement |
| --- | --- |
| Capture lead | Idempotency claim + contact link/create + lead + audit + outbox |
| Assign lead | Lead owner/version + audit + outbox |
| Create follow-up | Task + related entity reference + audit + outbox |
| Move stage | Opportunity version/stage + audit + outbox |
| Convert | Lead status + opportunity won/created outcome + audit + outbox |

Prefer a database RPC/private transaction where multi-table atomicity is required. Sequential service-role inserts with “best effort” cleanup do not qualify as PASS.

## 10. Growth semantics

Every metric declares:

- exact source objects/events;
- tenant filter;
- status mapping;
- period field used;
- timezone;
- freshness;
- zero versus UNKNOWN;
- reconciliation query.

Minimum definitions must be approved before implementation:

| Metric | Proposed definition |
| --- | --- |
| Captured | Leads with `createdAt` in period |
| Uncontacted | New leads with no qualifying interaction/follow-up completion |
| Overdue follow-up | Open follow-up task with `dueAt < now` |
| Qualified | Leads whose qualification transition occurred in period |
| Converted | Leads converted/opportunities won in period—choose one canonical event and avoid double count |
| Conversion value | Sum of trustworthy won opportunity values; UNKNOWN when currency/source is incomplete |

## 11. Error codes

At minimum:

```text
AUTH_REQUIRED
TENANT_CONTEXT_REQUIRED
TENANT_MEMBERSHIP_DENIED
CAPABILITY_DENIED
RESOURCE_NOT_FOUND
RESOURCE_VERSION_CONFLICT
IDEMPOTENCY_CONFLICT
VALIDATION_FAILED
MODULE_NOT_ACTIVE
DATA_SOURCE_DEGRADED
DATA_UNKNOWN
```

Every response includes a correlation ID. 404 must not reveal whether another tenant owns a resource.

## Explicit exclusions

- Provider-specific messaging/payment contracts;
- arbitrary custom qualification schema;
- campaign dispatch;
- automatic retention actions;
- client-agent tools;
- full database remodel;
- production migrations.
