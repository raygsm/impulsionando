# Stakeholder product requirements

Created: **2026-09-04**
Source: “Arquitetura Mestre do Ecossistema Impulsionando” supplied by the product owner
Interpretation rule: **product/features are authoritative input; code structure, technologies and security mechanisms are not**

## 1. Preserved product intent

### Business model

Impulsionando has two collaborating commercial arms:

| Arm | Product responsibility |
| --- | --- |
| Impulsionando Tecnologia | SaaS operational platform: CRM, ERP capabilities, agenda, communication, automation, analytics and agents |
| Impulsionando Brasil / Marketing | Strategy/service delivery: growth, paid traffic, content, branding, campaigns, relationships and consulting |

Marketing creates demand and strategy; Technology records, executes, measures, serves and retains. A customer may buy Marketing without adopting every operational module.

The relationship between these arms in tenant/account/billing data is still a product decision (§6).

### Actors and surfaces

| Scope | Examples | Surface |
| --- | --- | --- |
| Platform | Impulsionando staff | Staff console + Impulsionito |
| Tenant business | CHRISMED, WMP, Colors, Dumont, Costeira, CCI | Shared management dashboard + internal agent |
| Final consumer | Patient, buyer, affiliate, employee, guest, student | Public tenant experience + optional client agent |

Each tenant has branding, domains, users, data, capabilities, agent configuration, permissions, integrations and journeys—but not an independent software build.

### Product capabilities

Preserved feature catalogue:

- CRM and customer lifecycle;
- ERP capabilities;
- PDV/POS;
- generic agenda/resource scheduling;
- finance/accounting;
- catalog, products/services and SKUs;
- suppliers and purchasing;
- inventory;
- sales/orders;
- contracts/documents;
- billing and recurrence;
- payments/checkout/reconciliation;
- communications: WhatsApp, email, webchat, optional SMS/VoIP;
- workflow automation;
- BI/reporting;
- AI agents;
- affiliates/commissions;
- events;
- audit/security/integrations;
- niche extensions.

### Universal journey

```text
Discovery
  → Lead
  → CRM
  → Qualification
  → Offer / Proposal
  → Checkout
  → Sale
  → Fulfillment / ERP
  → Post-sale
  → Relationship
  → Repurchase
  → Referral
```

Niches specialize this journey; they do not replace it.

## 2. Safe technical translations

Product intent is retained; implementation wording is corrected:

| Stakeholder wording | Canonical technical translation |
| --- | --- |
| “ERP — Enterprise Research and Planning” | Standard term is **Enterprise Resource Planning**. In this product it is a composed area: Catalog, Purchasing, Sales, POS, Fulfillment, Inventory, Finance, Accounting, Billing, Payments, Fiscal and Documents. |
| “A sale generates revenue, stock decrement, receivable, tax, commission, margin and BI” | “Atomic” means one authoritative command records its local invariants + outbox, then downstream contexts consume idempotent events. It does **not** mean one row/transaction directly mutates CRM, stock, tax, commission and BI. Recognition points/reversals remain product decisions; see [`ERP-OPERATIONS-MODEL.md`](./ERP-OPERATIONS-MODEL.md) §5. |
| “n8n updates CRM/ERP” | n8n coordinates workflows and submits authenticated, typed, idempotent API commands. It never writes canonical domain tables directly. |
| “Impulsionito orchestrates everything” | Impulsionito calls governed application tools under actor/tenant/capability policy, audit and approval. It receives no unrestricted database/model access. |
| “Specialized agent instance” | Versioned agent configuration/skill/tool bundle on one governed runtime, unless operational evidence later justifies a separate runtime. |
| “BI receives all module data” | BI consumes versioned events/projections with lineage and freshness; it is not transactional authority. |
| “All tenants inherit Core evolution” | Shared contracts/modules evolve compatibly and are enabled by configuration; no per-tenant commit/image. |
| “Unlimited users/customers” | A quota policy value plus fair-use/operational protection—not an infinite resource promise. |
| “Transparent checkout” | Provider-neutral checkout session and payment intent; redirect/embedded experience depends on provider security and compliance. |
| “Tenant connects WhatsApp via QR/API” | Provider-neutral channel connection lifecycle; UI and domain do not depend on one vendor. |

## 3. Requirements already covered by the proposed product model

| Requirement | State | Meaning |
| --- | --- | --- |
| One Core/invariant dashboard; optional modules/niche presets | **PLANNED** | Product/database models only |
| Tenant/private vs final-consumer surfaces | **PLANNED** | Product architecture; frontend decision still gated |
| Growth, Contacts, CRM, campaigns, retention, tasks | **PLANNED** | First CRM slice narrower than full catalogue |
| Agenda, Sales, Catalog, Inventory, Finance, Billing, Payments, Documents | **PLANNED** | Logical target; ERP decisions open |
| Channel readiness/provider-neutral messaging | **PARTIAL** | Existing legacy + communication sink; canonical model planned |
| Shared Core + vertical extensions | **PLANNED** | Logical model only |
| Tenant resolution/entitlement reads | **PROVEN (staging)** | Phase 4 evidence; UI consumption still missing |
| Support API | **PROVEN (staging)** | Phase 3 vertical pilot |
| Job queue/ledger/DLQ, event outbox, webhook ingress | **PROVEN (staging)** | Phase 5 evidence |
| Communication | **PROVEN sink only** | Not a real provider delivery claim |
| CRM invite journey | **PROVEN (staging)** | Narrow invite lifecycle, not full CRM |
| Operations metrics | **PROVEN (staging)** | Phase 5G |
| Governed AI/cross-tenant refusal | **PROVEN pilot** | Narrow deterministic pilot; not durable product agents |

## 4. Missing or insufficiently modeled product features

### Commercial packaging and services

- relationship between Technology, Brasil and Marketing service engagements;
- whether Marketing-only customers receive a tenant/dashboard and at what depth;
- exact Essential/Ideal/Full quota definitions;
- quota counting, reset periods, overage/fair-use and upgrade behavior;
- hybrid monetization: SaaS, services, commission, affiliate, event, recurring, usage or revenue share.

### CRM depth

- B2B account/contact relationships and buying committees;
- lead score rules, versions and history;
- dynamic segments/audience versions;
- campaign membership and attribution models;
- NPS/survey programs;
- tenant customer-service cases versus tenant→Impulsionando Support;
- omnichannel ownership/routing;
- bot→human and Marketing→Sales handoff;
- commercial meeting type versus generic agenda;
- complete lifecycle transition history/reason codes.

### ERP depth

- purchasing: requisition, purchase order, receipt and supplier invoice;
- variants/SKU, units of measure and price books;
- inventory reservation, transfer, adjustment, costing and valuation;
- double-entry ledger, chart of accounts and posting periods;
- DRE derivation/reconciliation;
- cost centers/allocation;
- commission accrual, reversal, approval and payout;
- tax snapshots/fiscal lifecycle;
- contract obligations, amendments, renewal and termination;
- bank statement/reconciliation workflow;
- returns/refunds/chargebacks and compensating stock/finance entries.

### Cross-module sale contract

The product needs an explicit authoritative sale state machine defining:

- quote/order/sale distinction;
- when stock reserves/decrements;
- when receivable/revenue/tax/commission/margin is recognized;
- payment versus fulfillment effects;
- cancellation/refund/chargeback/reversal behavior;
- events emitted to CRM, ERP, messaging and analytics.

### Verticals and scheduling

- automotive and commercial-representation blueprints;
- generic schedule capacity, recurrence, buffers and multi-resource booking;
- whether tenants have one general internal agent with specialized skills or several named internal agents.

## 5. Recommended reconciliation of apparent contradictions

These remain **PROPOSED product decisions** until explicitly accepted.

### Plans versus optional modules

Stakeholder input says Essential/Ideal/Full share features and differ by quotas. Earlier product direction says capabilities activate by niche/company need.

Recommended model:

```text
plan = quota/support/commercial limits
blueprint = recommended module preset
company configuration = relevant modules enabled/disabled
regulated/add-on capability = separate explicit entitlement when legally or commercially required
```

Thus plans can advertise the same universal capability catalogue while a restaurant does not configure medical features and a clinic does not configure PDV unless needed.

### Mandatory minimum versus full CRM/ERP

Every tenant receives:

- Contact/customer identity;
- basic lead capture/lifecycle;
- tasks/follow-up;
- Growth overview;
- internal business agent;
- Support with Impulsionando.

Full CRM depth and ERP components are activated by need. “Every tenant has CRM and ERP” means access to the shared capability family, not every table/widget active.

### Two kinds of tickets

Model separately:

| Case type | Relationship |
| --- | --- |
| Platform support case | Tenant/user requests support from Impulsionando |
| Customer service case | Final consumer requests support from the tenant |

They may share a case engine later, but ownership/audience/SLA/data visibility remain explicit.

### Agents

Recommended:

- one mandatory tenant-internal agent identity;
- specialized skills/tool profiles enabled by modules/niche;
- one optional final-consumer agent;
- Impulsionito as platform parent.

Multiple named internal agents are possible later but should not create separate ungoverned runtimes.

### Public frontend

Product requires institutional, tenant-public and authenticated experiences. Whether institutional + tenant-public share one runtime is a technical ADR; there is still one configured public experience per tenant, never one build per tenant.

### Mercado Pago

Separate:

- Impulsionando SaaS billing provider;
- tenant commerce/payment provider.

Mercado Pago may implement both through distinct credential ownership and adapters, but it is not hard-coded as the universal domain model.

## 6. Product decisions required

| ID | Decision | Recommended starting position |
| --- | --- | --- |
| PRD-DB-01 | Plan model | Quota-first plans; same catalogue, niche/company activation; regulated/add-on exceptions |
| PRD-DB-02 | Admin/final-customer quota counting | Count active memberships and active authenticated consumer accounts; contacts do not automatically consume “final customer” quota |
| PRD-DB-03 | Marketing-only customer | Create a tenant with Growth/CRM/service-delivery configuration, not a separate account type |
| PRD-DB-04 | Minimum universal capabilities | Contacts, lead lifecycle, tasks, Growth, internal agent and platform Support |
| PRD-DB-05 | Tenant customer-service cases | Separate audience/ownership from platform Support |
| PRD-DB-06 | Agent specialization | One internal agent + versioned skill/tool bundles initially |
| PRD-DB-07 | Sale recognition points | Must be defined before Sales/Inventory/Finance schema implementation |
| PRD-DB-08 | Inventory decrement point | Reservation, order confirmation, fulfillment or payment—product-specific and reversible |
| PRD-DB-09 | ERP accounting depth | Double-entry ledger recommended if DRE/margin/reconciliation are product commitments |
| PRD-DB-10 | Provider policy | Provider-neutral domains; Mercado Pago/WhatsApp vendors are adapters |
| PRD-DB-11 | Initial vertical order | After CRM/Growth: restaurant/clinic/real-estate currently planned; automotive/representation need priority decision |
| PRD-DB-12 | Multiple legal entities/currencies/units | Model now if Full plan or representation/automotive requires it |

## 7. Data concerns missing from the stakeholder input

- tenant versus legal entity versus brand versus business unit;
- authenticated user versus CRM contact versus final-consumer account;
- contact deduplication/merge/source provenance;
- consent by purpose/channel/legal basis/version/revocation;
- immutable quota usage evidence and concurrency;
- currency/rounding/FX snapshots;
- tax jurisdiction and immutable tax calculation;
- SKU/UOM/lots/serials/expiry;
- inventory valuation and reversals;
- journal balancing and posting periods;
- commission clawback/payout;
- contract versions/obligations;
- timezone/DST/capacity/overlap;
- event ordering/version/replay;
- data classification/retention/legal hold/anonymization;
- import lineage/external IDs/conflicts;
- historical interpretation when plans, blueprints, prices or workflows change;
- AI conversation/tool/approval retention;
- analytics lineage, freshness and privacy thresholds.

These are technical/data requirements needed to safely deliver the requested product features; they do not change the feature catalogue.
