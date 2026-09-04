# Niche blueprints and onboarding compiler

Created: **2026-09-04** · State: **PROPOSED**
Modules: [`CAPABILITY-MODULES.md`](./CAPABILITY-MODULES.md) · Dashboard: [`DASHBOARD-V1.md`](./DASHBOARD-V1.md)

## 1. Principle

A niche is a **versioned preset**, not an application and not an authorization boundary.

Restaurant, medical clinic and real estate share the same dashboard, customer lifecycle and AI runtime. The blueprint selects sensible modules, terminology, fields, KPIs and starter playbooks. The company may then override optional choices within its plan and safety policy.

```text
answers + selected niche + plan
  → validate
  → compile blueprint
  → resolve dependencies
  → produce proposed tenant configuration
  → human review
  → apply idempotently
  → verify readiness
```

## 2. Blueprint contract

```ts
interface NicheBlueprint {
  key: string
  version: number
  lifecycle: 'draft' | 'active' | 'deprecated'
  displayName: string
  terminology: Record<string, string>
  recommendedModules: ModulePreset[]
  requiredOnboardingFields: FieldDefinition[]
  customFields: CustomFieldDefinition[]
  dashboardPreset: DashboardPreset
  rolePresets: RolePreset[]
  lifecyclePresets: LifecyclePreset[]
  campaignTemplates: CampaignTemplateRef[]
  workflowTemplates: WorkflowTemplateRef[]
  agentPreset: AgentPreset
  integrationRecommendations: IntegrationRecommendation[]
  readinessRules: ReadinessRule[]
}
```

Blueprint data is versioned and reviewable. It contains no secrets, provider tokens, tenant UUIDs or executable arbitrary code.

## 3. Initial blueprints

These are starting presets, not complete vertical products.

### Restaurant

| Category | Preset |
| --- | --- |
| Usually enabled | Growth, Contacts, CRM, Campaigns, Retention, Communications, Tasks, Team, Sales, Catalog, Inventory, Finance |
| Optional | Agenda/reservations, delivery, checkout, payments, automated billing, client agent |
| Lifecycle | Lead → inquiry/reservation/order → fulfilled → repeat/inactive/reactivation |
| Core KPIs | New customers, reservations/orders, average value, repeat rate, inactive customers, cancellations/no-shows, low stock |
| Agent context | Menu/service catalog, opening hours, capacity, campaign results, customer history |
| Public agent | Menu/FAQ, reservation/order qualification; no arbitrary refunds or promises |

### Medical clinic

| Category | Preset |
| --- | --- |
| Usually enabled | Growth, Contacts, CRM, Campaigns, Retention, Communications, Agenda, Tasks, Team, Finance, Documents, Billing |
| Optional | Payments, client agent, teleattendance or EHR through separate regulated modules |
| Lifecycle | Lead → qualification → appointment → attended/no-show → follow-up → recall/reactivation |
| Core KPIs | Lead-to-appointment, response time, occupancy, no-show, return/recall, receivables |
| Agent context | Services, professionals, public availability, approved operational/customer data |
| Safety | No diagnosis or unsupported clinical claims; health-record access is a separate regulated capability |

### Real estate

| Category | Preset |
| --- | --- |
| Usually enabled | Growth, Contacts, CRM, Campaigns, Retention, Communications, Agenda, Tasks, Team, Sales, Documents, Finance |
| Optional | Property vertical pack, client agent, payments |
| Lifecycle | Lead → qualification → matching → visit → proposal → contract → post-sale/referral |
| Core KPIs | Source, response time, qualified leads, visits, proposals, conversion, cycle time |
| Agent context | Authorized listing facts, qualification, interactions and visit availability |
| Safety | Never invent property facts, legal status, price or availability |

The future `property`, `clinical` or `restaurant-operations` vertical pack may add domain entities. It does not fork the base dashboard or customer model.

## 4. Onboarding inputs

### Company

- legal and display name;
- niche and optional secondary niche;
- timezone, locale and currency;
- locations/units;
- operating hours;
- products/services summary;
- sales/service model: appointment, order, contract, subscription or combination;
- average lifecycle and return cadence.

### People and access

- owner and administrators;
- team members and role presets;
- sectors/teams;
- who may see finance, customer data and integrations;
- who approves campaigns, billing and agent actions.

### Growth

- acquisition channels;
- current lead sources and import options;
- lifecycle stages;
- qualification fields;
- follow-up expectation;
- retention/inactivity definition;
- campaign goals and consent posture.

### Operations and ERP

- agenda/resources if applicable;
- catalog/products/services;
- inventory/warehouses if applicable;
- finance and billing requirements;
- documents used;
- current payment and accounting providers.

### Communications and AI

- approved sender identities;
- desired email and WhatsApp channels;
- communication consent and quiet hours;
- internal agent name/tone, business knowledge and escalation contacts;
- whether a client-facing agent is enabled;
- client-agent scope and public handoff.

No onboarding answer becomes authorization by itself. Role/capability grants are separately validated.

## 5. Compiler output

The compiler produces a reviewable proposal:

| Output | Purpose |
| --- | --- |
| `TenantProfile` | Canonical business, niche, locale, units and terminology |
| `ModulePlan` | Requested modules, dependencies, entitlement result and unresolved requirements |
| `RolePlan` | Role presets translated into capability grants |
| `DashboardPreset` | Widget/navigation contribution priorities—not a custom layout |
| `LifecycleConfig` | Lead/customer stages, follow-up and retention definitions |
| `IntegrationPlan` | Recommended adapters and setup state; no credentials |
| `AgentPlan` | Internal and optional client-agent identity, knowledge sources, tool policy |
| `TemplatePlan` | Campaign, email and future workflow template references |
| `ReadinessReport` | Ready, configuring, blocked and degraded capabilities |

The output is displayed before it is applied. Applying the same compiled output twice must be idempotent.

### Apply transaction and failure model

The compiler does not perform writes. `onboarding.apply` accepts an approved, versioned proposal and:

1. claims an idempotency key for `(tenantId, proposalVersion)`;
2. revalidates plan, actor capabilities and blueprint version;
3. writes tenant profile, module configuration, role plan and minimal agent definition in one database transaction when they share the same store;
4. records integration setup as `CONFIGURING`—credentials are separate and never part of the transaction;
5. writes one audit record and outbox event in the same transaction;
6. runs asynchronous setup through durable jobs;
7. reports partial asynchronous readiness without rolling back committed tenant identity.

Before the transaction commits, any failure rolls back all writes. After commit, asynchronous steps use retry/idempotency and compensation (disable the incomplete module or remove the generated resource) rather than deleting the tenant. Reapplying a completed proposal returns its existing result.

## 6. Override and precedence model

| Source | Can do | Cannot do |
| --- | --- | --- |
| Blueprint | Recommend modules and defaults | Grant plan entitlement or bypass policy |
| Plan | Allow modules/limits | Force a company to configure every allowed module |
| Company override | Enable entitled or disable optional modules; change business settings | Bypass dependencies, authorization or safety |
| Role preset | Recommend capabilities | Grant capabilities the tenant admin is not allowed to grant |
| Platform safety policy | Deny or constrain risky actions | Silently modify business facts |

## 7. Versioning and change

Existing tenants do not silently receive a changed blueprint.

1. Publish blueprint version N+1.
2. Compile a diff against the tenant's current applied version and overrides.
3. Classify changes as automatic-safe, review-required or incompatible.
4. Present changes to an authorized tenant/platform administrator.
5. Apply with an audit row and rollback record.

Company overrides survive a blueprint upgrade unless explicitly resolved.

## 8. Current-code reuse

| Asset | Reuse |
| --- | --- |
| `src/data/nichos-taxonomy.ts` and `public-niche-catalog.ts` | Candidate niche vocabulary |
| `src/data/moduleCatalog.ts`, `motherModules.ts`, `moduleDependencies.ts` | Inputs to one canonical registry; not authoritative as-is |
| `src/data/moduleSegmentTemplates.ts`, `recommendedBundles.ts`, `nicheRecommendations.ts` | Candidate blueprint seeds |
| `src/data/moduleAssistantSteps.ts` | Candidate onboarding steps |
| `src/routes/onboarding*`, `_authenticated/onboarding.*`, `comecar`, `escolher-nicho` | UX/requirements inputs, not code to copy wholesale |
| Tenant intakes under `product-intake/` | Product inputs for future blueprint versions, never automatic implementation authority |

## 9. Acceptance criteria

- Onboarding the same answers twice yields the same configuration.
- Restaurant, clinic and real-estate fixtures produce different module manifests on the same dashboard code.
- Removing a plan entitlement yields a reviewable conflict, not silent activation.
- Missing integration credentials produce `CONFIGURING`, not `ACTIVE`.
- A blueprint upgrade never overwrites a company override silently.
- Every apply/upgrade has actor, blueprint version, before/after and correlation ID.
- No blueprint contains secrets or tenant-specific code.
