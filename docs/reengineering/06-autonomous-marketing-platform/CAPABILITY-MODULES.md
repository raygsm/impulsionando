# Capability modules

Created: **2026-09-04** · State: **PROPOSED**
Product model: [`PRODUCT-MODEL.md`](./PRODUCT-MODEL.md)

## 1. Module contract

A capability module is not a menu item. It is a versioned product unit that declares:

| Contract member | Required content |
| --- | --- |
| Identity | Stable key, name, version, lifecycle state |
| Purpose | Business outcome it owns |
| Dependencies | Foundation or other modules it requires |
| Capabilities | Server authorization keys it introduces |
| Data | Entities it owns and entities it may reference |
| API | Commands, queries and errors |
| Events | Events it emits and consumes |
| Jobs | Asynchronous work it may request |
| Dashboard | Widgets, navigation items and daily actions it contributes |
| Agent tools | Read/recommend/prepare/execute tools and risk classes |
| Setup | Required onboarding fields and integration prerequisites |
| Health | Readiness and degraded-state signals |
| Audit | Sensitive actions and required audit facts |

The registry lives in code and contracts. Tenant activation lives in data. No module may mutate another module's tables directly.

## 2. Mandatory foundation

Not commercial toggles; every tenant needs them.

| Module | Owns | Current basis | Required change |
| --- | --- | --- | --- |
| Identity & Access | Session, users, memberships, roles/capabilities | Supabase Auth, `user_roles`, Phase 4 tenant context | Unify dual RBAC and enforce in Nest |
| Tenant Configuration | Company profile, branding, niche, locale, settings | `companies`, settings, tenant resolve | Produce one versioned tenant configuration |
| Entitlements | Plan, module state, feature policy | `company_modules`, billing modules, flags | One server-computed effective set |
| Audit & Compliance | Actor/action trail, consent, sensitive access | `audit_logs`, scattered RPCs | Shared audit interceptor and query API |
| Notifications | In-product alerts and action queue | `notifications`, outbox | Canonical notification contract |
| Files & Documents Foundation | Metadata, ownership, access policy | Supabase Storage and domain tables | Shared file references; domain-specific semantics stay in modules |
| AI Runtime | Agent registry, context assembly, tool policy, telemetry | Phase 6 `ai` module | Add durable agent kinds/configuration |
| Support Service Foundation | Ticket records, status, authorization and audit | Phase 3 `support` module | Retained API foundation; the product surface is Help & Tickets below |

## 3. Mandatory product core

Enabled for every company, although depth may vary by plan.

| Module | Minimum for all | Optional depth |
| --- | --- | --- |
| Dashboard Home | Daily briefing, action queue, core lifecycle KPIs, agent entry | Module widgets and custom report views |
| Growth | Lead/campaign/retention overview and daily opportunities | Attribution, segments, experiments and advanced forecasting |
| Contacts | Canonical person/organization, contact points, consent, timeline | Enrichment, deduplication and customer 360 |
| Internal Business Agent | READ/explain, RECOMMEND and PREPARE | Safe execution and gated actions |
| Help & Tickets | Open, view and follow a ticket | SLA, knowledge base and advanced support module |

## 4. Optional capability catalog

These are activated by blueprint + plan + company override. “Usually enabled” is a commercial default, not a hard dependency.

### Marketing and customer lifecycle

| Key | Capability | Provides | Depends on | Usually enabled |
| --- | --- | --- | --- | --- |
| `crm` | CRM | Leads, opportunities, pipelines, stages, activities, follow-ups, customer timeline | Contacts | Yes |
| `campaigns` | Campaigns | Campaign metadata, audience, objectives, status and results | Growth, Contacts | Yes |
| `retention` | Retention | Lifecycle state, churn signals, reactivation audiences and outcomes | Contacts, CRM | Yes |
| `communications` | Communications | Channel identities, conversations, templates, delivery state | Contacts + Phase 5 outbox infrastructure | Yes |
| `email-automation` | Email templates and journeys | Versioned templates, trigger-ready sends, delivery/engagement signals | Communications | Common |
| `whatsapp` | WhatsApp channel | Connection state and messaging port | Communications | Common; provider undecided |

### Operations and people

| Key | Capability | Provides | Depends on | Usually enabled |
| --- | --- | --- | --- | --- |
| `agenda` | Agenda | Resources/professionals, availability, appointments, waitlist, no-show | Contacts | Niche-dependent |
| `tasks` | Daily work | Assigned actions, due dates, priorities, completion | Identity | Yes |
| `team` | Team management | Members, teams/sectors, schedules, workload and role assignment | Identity | Yes |
| `operations` | Operational overview | Capacity, blockers, service/order status, daily follow-up | Tasks + enabled domain modules | Yes |

### ERP composition

ERP is a dashboard area composed from modules, not one indivisible entitlement.

| Key | Capability | Provides | Depends on | Usually enabled |
| --- | --- | --- | --- | --- |
| `finance` | Finance | Accounts payable/receivable, cash flow, categories, reconciliation | Contacts | Yes |
| `sales` | Sales | Quotes/orders, line items, status, seller, value | Contacts | Common |
| `catalog` | Products and services | Sellable items, price, availability metadata | — | Common |
| `inventory` | Inventory/storage | Warehouses, stock, movements, suppliers | Catalog | Product businesses |
| `documents` | Business documents | Contracts, receipts, fiscal/supporting files | Files foundation | Common |
| `billing` | Automated billing | Contracts, invoices, receivables, dunning, suspension/reactivation policy | Finance, payments | Subscription/service businesses |
| `payments` | Payment collection | Payment intents, provider state, settlement and refunds | Finance, Sales/Billing | Niche-dependent |

### Public/client experience

| Key | Capability | Provides | Depends on |
| --- | --- | --- | --- |
| `client-agent` | Client-facing AI | Business-specific public assistant | AI Runtime + public policy |
| `booking` | Public booking | Availability and appointment request | Agenda |
| `catalog-public` | Public catalog | Products/services discovery | Catalog |
| `checkout` | Public checkout | Cart/order/payment initiation | Catalog/Sales + Payments |
| `client-support` | Public support | Qualification, FAQ and ticket creation | Help/Tickets |

## 5. Dashboard contribution contract

Each active module may contribute:

```ts
interface DashboardContribution {
  moduleKey: string
  navigation: NavigationItem[]
  widgets: WidgetDefinition[]
  dailyActions: ActionDefinition[]
  searchProviders: SearchProvider[]
  agentTools: ToolDescriptor[]
  healthRequirements: HealthRequirement[]
}
```

The server filters contributions using tenant entitlements, user capabilities and integration readiness, then returns a `DashboardManifest`. The browser never assembles authority from local constants.

### Widget requirements

Every widget declares:

- stable key and version;
- dashboard region and supported sizes;
- query contract and refresh policy;
- required module and capability;
- empty, loading, degraded, forbidden and error states;
- date range and timezone behavior;
- whether a missing data source means zero or **UNKNOWN**;
- click-through destination;
- optional agent action entry.

## 6. Activation lifecycle

```text
AVAILABLE
  → ENTITLED
  → CONFIGURING
  → READY
  → ACTIVE
  → DEGRADED
  → SUSPENDED
  → DISABLED
```

| State | Dashboard behavior |
| --- | --- |
| Available but not entitled | Not rendered; optional upgrade discovery outside normal navigation |
| Entitled but configuring | Setup card with missing requirements |
| Ready/active | Normal navigation and widgets |
| Degraded | Visible with a clear degraded state and remediation |
| Suspended | Read-only or hidden according to policy; never silently active |
| Disabled | Removed from effective manifest, historical data retained |

Module activation is not “insert a `company_modules` row.” It is complete only when prerequisites and health are satisfied.

## 7. Dependency rules

1. Dependencies are explicit and acyclic.
2. Disabling a dependency computes impact before applying the change.
3. A plan grants a maximum set; it does not force every optional module on.
4. Niche presets recommend a starting set.
5. Company overrides can disable optional modules.
6. Safety policy may disable actions without disabling read access.
7. An integration-backed capability can be active in degraded/read-only mode.

## 8. Current-code mapping

| Target module | Current assets | Problem to resolve |
| --- | --- | --- |
| Entitlements | `company_modules`, `modules`, `billing_plan_modules`, `core_feature_flags`, `moduleCatalog.ts`, `motherModules.ts` | Multiple conflicting catalogs and slug aliases |
| CRM/Growth | `crm_*`, `_authenticated/crm.*`, marketing leads, Phase 5F journey | No canonical lifecycle/attribution model |
| Agenda | 21 `agenda_*` tables, 10 routes, `agenda-core.functions.ts` | Business logic in server functions |
| Finance | `fin_*`, 10 routes | Separate from billing/sales lifecycle |
| Sales/Inventory | `sales_*`, `inv_*`, 12 routes | Needs transactional module boundaries |
| Communications | outbox, templates, notifications, Phase 5E sink | Transport incomplete; provider concerns leak into features |
| AI | Phase 6 policy/tools/agents/effects | Tenant agent seed is not durable product configuration |
| Support | Phase 3 Nest module | Closest existing complete vertical slice |

## 9. Explicitly not a module

- A tenant name (`riomed`, `chrismed`, `wmp`);
- a screen;
- a dashboard widget by itself;
- a provider (`n8n`, `OpenAI`, a WhatsApp vendor);
- a niche;
- a deployment unit.

If a capability is useful to only one current company but could be sold independently, it may become a module. If it encodes one company's private process, it stays configuration or a future explicitly governed extension—not a tenant fork.
