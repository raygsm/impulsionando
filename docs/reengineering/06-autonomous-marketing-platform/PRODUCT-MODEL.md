# Product model

Created: **2026-09-04** · State: **PROPOSED**
Index: [`README.md`](./README.md)

## 1. Product thesis

Impulsionando is autonomous marketing operations software for businesses whose work ultimately happens in the physical world: restaurants, medical practices, clinics, real-estate operations, service providers, stores and similar companies.

These owners rarely need another isolated CRM or another generic chatbot. They need one system that:

1. captures potential customers;
2. preserves identity, consent, source and interaction history;
3. organizes follow-up;
4. helps convert demand into an appointment, order, contract or service;
5. connects delivery and payment state back to the customer;
6. detects retention and reactivation opportunities;
7. recommends or executes allowed actions;
8. shows the owner what requires attention today.

The product therefore combines marketing, customer lifecycle and operational signals. ERP capabilities are present because stock, receivables, agenda capacity and fulfillment determine what marketing should promise and whom the business should contact.

## 2. Primary actors

| Actor | Uses | Goal |
| --- | --- | --- |
| Business owner | Full dashboard and internal business agent | Understand the business, prioritize work, grow revenue |
| Manager | Growth, CRM, operations, team and reports | Coordinate daily execution |
| Operator / seller | Leads, tasks, communication, agenda, sales | Move customers through the lifecycle |
| Finance operator | Finance, billing, documents and reconciliation | Collect and account correctly |
| Specialist / professional | Agenda, assigned customers and tasks | Deliver the service |
| Tenant administrator | Team, roles, modules, integrations and configuration | Configure the company safely |
| Final consumer | Public tenant experience and optional client-facing agent | Discover, ask, schedule, buy or request support |
| Impulsionando staff | Platform console and Impulsionito | Operate tenants, plans, health, support and governance |

One user may hold several roles. Authorization is capability-based and tenant-scoped; actor labels are presets, not security checks.

## 3. One dashboard, one product

Every tenant receives the same dashboard application:

- same page shell;
- same design system;
- same navigation positions;
- same interaction patterns;
- same responsive behavior;
- same release image;
- same API contracts.

The system may change branding tokens (logo, colors, business name), terminology and available modules. It does **not** rearrange the product into a custom application for each customer.

### Stable dashboard regions

| Region | Always present | Dynamic content |
| --- | --- | --- |
| Global header | Tenant identity, search, notifications, agent entry, user menu | Branding and active tenant |
| Primary navigation | Home, Growth, Customers, Operations, Management, Help | Items inside a region depend on capabilities |
| Home | Daily briefing, alerts, action queue, core KPIs | Widgets depend on enabled modules |
| Global agent | Internal business agent | Identity, context and tools are tenant-specific |
| Configuration | Profile, company, team, permissions, modules, integrations | Editable options depend on role and plan |

“The dashboard does not change” means its **information architecture and design do not fork**. A restaurant may show reservations and table flow where a clinic shows appointments and care capacity, but both occupy the Operations region and obey the same widget and detail-page contracts.

## 4. Product layers

| Layer | Meaning | Examples |
| --- | --- | --- |
| Platform foundation | Required for every tenant and invisible as a commercial module | Identity, tenant context, RBAC, audit, notifications, module resolution, observability |
| Mandatory product core | Available to every company | Dashboard home, Growth overview, customer/contact registry, internal AI agent, help/tickets |
| Optional capability modules | Enabled by blueprint, plan and company override | Full CRM, campaigns, agenda, communications, team, finance, sales, inventory, documents, automated billing |
| Niche presets | Recommended module and workflow composition | Restaurant, clinic, real estate |
| Integrations | External transport or provider adapters | WhatsApp, email, payment provider, calendar, accounting |
| Client experience | Public tenant-facing capabilities | Client agent, booking, catalog, checkout, support |

## 5. Source of tenant variation

Effective tenant configuration is computed, never hard-coded:

```text
platform mandatory capabilities
  + niche blueprint defaults
  + commercial plan entitlements
  + explicit company overrides
  + role capabilities
  + integration readiness
  + temporary feature flags / safety policy
  = effective capability set and dashboard manifest
```

Precedence:

1. safety policy and authorization can always deny;
2. company plan limits what may be enabled;
3. company override can disable an allowed optional capability;
4. blueprint supplies defaults but never bypasses plan or policy;
5. UI renders the server-computed result.

## 6. Core lifecycle model

The universal lifecycle must be expressible without niche tables:

```text
Person / Organization
  └─ Contact Point + Consent
      └─ Lead / Opportunity
          ├─ Source / Campaign / Attribution
          ├─ Interaction / Follow-up / Task
          └─ Conversion
              ├─ Appointment
              ├─ Order
              ├─ Contract
              └─ Service request
                  ├─ Fulfillment state
                  ├─ Payment / receivable state
                  └─ Retention signal / next-best action
```

A niche may add a domain object—medical encounter, property, restaurant reservation—but it links to this lifecycle instead of creating a parallel customer identity or CRM.

## 7. Growth as the heart

The Growth area answers:

- Where are customers coming from?
- Which campaigns produce qualified demand?
- Which leads have not been contacted?
- Which follow-ups are overdue?
- Which opportunities are likely to convert?
- Which customers are becoming inactive?
- Which customers should be retained or reactivated?
- Which channel and template performed best?
- What should the team do today?

Minimum metrics:

| Stage | Measures |
| --- | --- |
| Acquisition | New leads, source, campaign, cost/imported spend when available |
| Response | First-response time, contacted rate, overdue follow-ups |
| Conversion | Qualified rate, appointments/orders/contracts, conversion rate and value |
| Delivery | Attendance/fulfillment rate, cancellation/no-show, open operational blockers |
| Revenue | Paid, receivable, overdue, average value |
| Retention | Repeat rate, active/inactive customers, churn-risk signals |
| Reactivation | Eligible audience, attempts, responses, recovered value |

Unknown source or missing integration data must render as **UNKNOWN**, not zero.

## 8. AI is mandatory, autonomy is graduated

Every company gets an internal business agent. This does not mean every company gets unrestricted autonomous actions on day one.

| Level | Agent behavior |
| --- | --- |
| READ / Observe | Read authorized business state and explain it |
| RECOMMEND | Produce priorities, summaries and next-best actions |
| RECOMMEND / Prepare | Return a typed draft without execution |
| AUTO_SAFE | Perform reversible, bounded, idempotent actions |
| APPROVAL_REQUIRED | Request human approval for consequential actions |
| FORBIDDEN / Refuse | Deny forbidden, unscoped or unsupported requests |

The uppercase terms are the accepted Phase 6 risk classes. Dashboard V1 needs READ and RECOMMEND, including typed non-executed drafts (“Prepare”). Execution grows after the automation engine and integration adapters are proven.

## 9. Parent and child relationship

There are no independent tenant software instances connected by AI. All tenants run on one platform.

```text
Impulsionito (platform operations scope)
  ├─ platform catalog, tenant health, plans, aggregate metrics, incidents
  ├─ may request a tenant-scoped tool under explicit staff authorization
  └─ never receives unrestricted bulk tenant rows as standing prompt context

Business Agent (one configuration per tenant)
  ├─ tenant users and tenant data only
  ├─ dashboard helper and operator
  └─ tools constrained by user + tenant + capability + risk policy

Client Agent (optional, one public identity per tenant)
  ├─ final-consumer audience
  ├─ public knowledge and consumer-owned/session-owned data
  └─ booking, catalog, qualification or support tools explicitly allowed
```

Impulsionito is the parent in orchestration and governance, not a security bypass.

## 10. Success criteria

The product model is successful when:

1. a new company can complete onboarding and receive a useful dashboard without custom code;
2. changing the niche or plan recomputes capabilities without deploying a new image;
3. the same CRM/customer identity supports restaurant, clinic and real-estate journeys;
4. every enabled module contributes signals or actions to the daily dashboard;
5. every company has an agent that explains its actual data and refuses unsupported claims;
6. Impulsionito can operate platform health without silently crossing tenant boundaries;
7. adding a future WhatsApp provider requires an adapter, not dashboard or domain rewrites.

## Explicit non-goals for Dashboard V1

- Complete ERP for every niche;
- advanced autonomous campaigns;
- choosing a permanent WhatsApp provider;
- clinical diagnosis or investment advice;
- tenant-specific dashboard layouts;
- a generic workflow builder;
- replacing all existing tenant applications before the core dashboard is proven.
