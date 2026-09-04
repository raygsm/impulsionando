# Stakeholder product requirements

Created: **2026-09-04**  
Source: “Arquitetura Mestre do Ecossistema Impulsionando” (product owner)  
Interpretation rule: **product and features are authoritative input; code structure, technologies and security mechanisms are not.**

Nothing in this file accepts an ADR, opens a phase gate, or authorizes a deploy. Product decisions below are **PROPOSED** until Cauã + Raygs accept them.

## 1. Preserved product intent

### Two commercial arms

| Arm | Product responsibility |
| --- | --- |
| Impulsionando Tecnologia | SaaS operational platform: CRM, ERP capabilities, agenda, communication, automation, analytics, agents |
| Impulsionando Brasil / Marketing | Strategy and service delivery: growth, paid traffic, content, branding, campaigns, relationships, consulting |

Marketing creates demand and strategy; Technology records, executes, measures, serves and retains. A customer may buy Marketing without adopting every operational module. How the two arms relate in tenant/account/billing data is **PRD-DB-03**, still open.

### Actors and surfaces

| Scope | Examples | Surface |
| --- | --- | --- |
| Platform | Impulsionando staff | Staff console + Impulsionito |
| Tenant business | CHRISMED, WMP, Colors, Dumont, Costeira, CCI | Shared management dashboard + internal agent |
| Final consumer | Patient, buyer, affiliate, employee, guest, student | Public tenant experience + optional client agent |

Each tenant has branding, domains, users, data, capabilities, agent configuration, permissions, integrations and journeys — **never an independent software build**.

### Capability catalogue (preserved)

CRM and customer lifecycle · ERP capabilities · PDV/POS · generic agenda and resource scheduling · finance/accounting · catalog, products/services and SKUs · suppliers and purchasing · inventory · sales/orders · contracts/documents · billing and recurrence · payments/checkout/reconciliation · communications (WhatsApp, email, webchat, optional SMS/VoIP) · workflow automation · BI/reporting · AI agents · affiliates/commissions · events · audit/security/integrations · niche extensions.

### Universal journey

```text
Discovery → Lead → CRM → Qualification → Offer/Proposal → Checkout → Sale
         → Fulfillment/ERP → Post-sale → Relationship → Repurchase → Referral
```

Niches specialize this journey; they never replace it.

## 2. Safe technical translations

Product intent retained; implementation wording corrected.

| Stakeholder wording | Canonical translation |
| --- | --- |
| “ERP — Enterprise Research and Planning” | **Enterprise Resource Planning**. Here it is a *composed area*: Catalog, Purchasing, Sales, POS, Fulfillment, Inventory, Finance, Accounting, Billing, Payments, Fiscal, Documents |
| “A sale generates revenue, stock decrement, receivable, tax, commission, margin and BI” | An authoritative sale transition atomically records local invariants **and** outbox facts. Downstream contexts consume idempotent events. Recognition points and reversals are product decisions (PRD-DB-07/08) |
| “n8n updates CRM/ERP” | n8n coordinates workflows and submits authenticated, typed, idempotent API commands. It never writes canonical domain tables directly |
| “Impulsionito orchestrates everything” | Impulsionito calls **governed** application tools under actor/tenant/capability policy, audit and approval. No unrestricted database or model access |
| “Specialized agent instance” | Versioned agent configuration / skill / tool bundle on **one** governed runtime, unless operational evidence justifies a separate runtime |
| “BI receives all module data” | BI consumes versioned events/projections with lineage and freshness. It is not transactional authority |
| “All tenants inherit Core evolution” | Shared contracts and modules evolve compatibly and are enabled by configuration. **No per-tenant commit or image** |
| “Unlimited users/customers” | A quota policy value plus fair-use and operational protection — not an infinite resource promise |
| “Transparent checkout” | Provider-neutral checkout session and payment intent; redirect vs embedded depends on provider security and compliance |
| “Tenant connects WhatsApp via QR/API” | Provider-neutral channel connection lifecycle. UI and domain never depend on one vendor |

## 3. Already covered by the product model

Modeled/planned (not proven unless marked): one Core and one invariant dashboard · optional capability modules and niche presets · tenant vs final-consumer surfaces · Growth, Contacts, CRM, campaigns, retention, tasks · Agenda, Sales, Catalog, Inventory, Finance, Billing, Payments, Documents · channel readiness and provider-neutral messaging · durable events/jobs/outbox/idempotency · three agent scopes and governed Impulsionito delegation · dashboard BI answering *what happened / what needs action* · shared Core with vertical extensions.

**Staging-proven ingredients:** tenant resolution and entitlement reads · Support API · job queue/ledger/DLQ · event outbox · webhook ingress · communication sink · CRM invite journey · operations metrics · governed AI gateway with cross-tenant refusal.

## 4. Missing or insufficiently modeled

### Commercial packaging and services

Relationship between Technology, Brasil and Marketing engagements · whether Marketing-only customers get a tenant/dashboard and at what depth · exact Essential/Ideal/Full quota definitions · quota counting, reset periods, overage/fair-use, upgrade behavior · hybrid monetization (SaaS, services, commission, affiliate, event, recurring, usage, revenue share).

### CRM depth

B2B account/contact relationships and buying committees · lead score rules, versions, history · dynamic segments and audience versions · campaign membership and attribution models · NPS/survey programs · tenant customer-service cases vs tenant→Impulsionando Support · omnichannel ownership and routing · bot→human and Marketing→Sales handoff · commercial meeting type vs generic agenda · complete lifecycle transition history with reason codes.

### ERP depth

Purchasing (requisition, PO, receipt, supplier invoice) · variants/SKU, units of measure, price books · inventory reservation, transfer, adjustment, costing, valuation · double-entry ledger, chart of accounts, posting periods · DRE derivation and reconciliation · cost centers and allocation · commission accrual, reversal, approval, payout · tax snapshots and fiscal lifecycle · contract obligations, amendments, renewal, termination · bank statement reconciliation · returns, refunds, chargebacks with compensating stock and finance entries.

### Cross-module sale contract

An explicit authoritative **sale state machine** is required, defining: quote vs order vs sale · when stock reserves and decrements · when receivable, revenue, tax, commission and margin are recognized · payment vs fulfillment effects · cancellation, refund, chargeback, reversal · events emitted to CRM, ERP, messaging and analytics.

### Verticals and scheduling

Automotive and commercial-representation blueprints · generic schedule capacity, recurrence, buffers, multi-resource booking · whether a tenant has one internal agent with specialized skills or several named internal agents (PRD-DB-06).

## 5. Recommended reconciliation of contradictions

**PROPOSED**, not accepted.

### Plans vs optional modules

```text
plan                    = quota, support and commercial limits
blueprint               = recommended module preset for the niche
company configuration   = relevant modules enabled/disabled
regulated/add-on        = separate explicit entitlement when legally or commercially required
```

Plans advertise the same universal catalogue while a restaurant does not configure medical features and a clinic does not configure PDV unless needed.

### Mandatory minimum vs full CRM/ERP

Every tenant receives: contact/customer identity · basic lead capture and lifecycle · tasks and follow-up · Growth overview · internal business agent · Support with Impulsionando.

Full CRM depth and ERP components are activated by need. “Every tenant has CRM and ERP” means access to the shared **capability family**, not every table and widget active.

### Two kinds of tickets

| Case type | Relationship |
| --- | --- |
| Platform support case | Tenant/user requests support **from Impulsionando** |
| Customer service case | Final consumer requests support **from the tenant** |

They may share a case engine later; ownership, audience, SLA and data visibility stay explicit. Today only the platform support case exists in Nest (`support_tickets`); the dashboard Help area must say so rather than implying tenant service desk exists.

### Agents

One mandatory tenant-internal agent identity · specialized skills/tool profiles enabled by modules and niche · one optional final-consumer agent · Impulsionito as platform parent. Multiple named internal agents are possible later but must not create separate ungoverned runtimes.

### Public frontend

Institutional, tenant-public and authenticated experiences are required. Whether institutional and tenant-public share one runtime is a technical ADR. There is one configured public experience per tenant, **never one build per tenant**.

### Mercado Pago

Separate the Impulsionando SaaS billing provider from the tenant commerce/payment provider. Mercado Pago may implement both through distinct credential ownership and adapters; it is not hard-coded as the universal domain model.

## 6. Product decisions required

| ID | Decision | Recommended starting position | Status |
| --- | --- | --- | --- |
| PRD-DB-01 | Plan model | Quota-first plans; same catalogue; niche/company activation; regulated add-on exceptions | PROPOSED |
| PRD-DB-02 | Admin/final-customer quota counting | Count active memberships and active authenticated consumer accounts; contacts do not consume “final customer” quota | PROPOSED |
| PRD-DB-03 | Marketing-only customer | Create a tenant with Growth/CRM/service-delivery configuration, not a separate account type | PROPOSED |
| PRD-DB-04 | Minimum universal capabilities | Contacts, lead lifecycle, tasks, Growth, internal agent, platform Support | PROPOSED |
| PRD-DB-05 | Tenant customer-service cases | Separate audience and ownership from platform Support | PROPOSED |
| PRD-DB-06 | Agent specialization | One internal agent + versioned skill/tool bundles initially | PROPOSED |
| PRD-DB-07 | Sale recognition points | Must be defined **before** Sales/Inventory/Finance schema implementation | BLOCKING |
| PRD-DB-08 | Inventory decrement point | Reservation, order confirmation, fulfillment or payment — product-specific and reversible | BLOCKING |
| PRD-DB-09 | ERP accounting depth | Double-entry ledger if DRE/margin/reconciliation are product commitments | PROPOSED |
| PRD-DB-10 | Provider policy | Provider-neutral domains; Mercado Pago and WhatsApp vendors are adapters | PROPOSED |
| PRD-DB-11 | Initial vertical order | After CRM/Growth: restaurant, clinic, real estate planned; automotive and representation need a priority decision | OPEN |
| PRD-DB-12 | Multiple legal entities, currencies, units | Model now if Full plan or representation/automotive requires it | OPEN |

## 7. Data concerns absent from the stakeholder input

Tenant vs legal entity vs brand vs business unit · authenticated user vs CRM contact vs final-consumer account · contact deduplication, merge and source provenance · consent by purpose, channel, legal basis, version and revocation · immutable quota usage evidence and concurrency · currency, rounding and FX snapshots · tax jurisdiction and immutable tax calculation · SKU, UOM, lots, serials, expiry · inventory valuation and reversals · journal balancing and posting periods · commission clawback and payout · contract versions and obligations · timezone, DST, capacity and overlap · event ordering, version and replay · data classification, retention, legal hold, anonymization · import lineage, external IDs and conflicts · historical interpretation when plans, blueprints, prices or workflows change · AI conversation, tool and approval retention · analytics lineage, freshness and privacy thresholds.

These are technical and data requirements needed to deliver the requested features safely. They do not change the feature catalogue.

## 8. What this changes in `app-web` today

Applied in the authenticated dashboard now:

- Management is presented as the **composed ERP area** of §2, not a vague “ERP” label.
- Help states plainly that it is the **platform support case** (Impulsionando), and that the tenant customer-service case is not implemented (PRD-DB-05).
- Home carries the **universal minimum** (contacts/lead lifecycle, tasks/follow-up, Growth, internal agent, Support) regardless of niche; everything else is entitlement-driven.
- Plan and quota surfaces are **not** invented: no counters render until a Nest quota contract exists.
- One internal agent identity per tenant (PRD-DB-06). Impulsionito never appears on a tenant surface.
- No payment or WhatsApp vendor name appears in domain UI (PRD-DB-10).
- Nothing in §4 renders as data. Missing sale, ERP, attribution and quota facts render **Sem dados**, never `0`.
