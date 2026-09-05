# Autonomous Marketing Platform — product architecture

Created: **2026-09-04**
State: **PROPOSED — product direction awaiting explicit acceptance**
Program SoT: [`../STATUS.md`](../STATUS.md) · Technical authority: [`../02-target-architecture/`](../02-target-architecture/) · Delivery plan: [`../04-migration/phase-8/`](../04-migration/phase-8/)

## Purpose

Define Impulsionando as an **autonomous marketing operations platform for physical businesses**.

Every company uses the same authenticated white-label dashboard and the same application image. The dashboard structure and interaction model remain stable; tenant configuration determines:

- enabled capability modules;
- visible navigation, widgets and actions;
- niche-specific fields, terminology and KPIs;
- onboarding questions and required setup;
- campaign, follow-up and retention playbooks;
- integrations and channel availability;
- internal business-agent context and tools;
- optional client-facing agent identity and tools.

The product is not a collection of tenant applications. It is one configurable operating system for acquiring, serving, retaining and reactivating customers.

## Status and authority

This directory captures a **new product formulation**. It does not silently replace accepted ADRs, the target technical architecture, Phase 8 gates, or current runtime evidence.

| Statement | State |
| --- | --- |
| One `app-web`, one dashboard structure, capability-driven composition | **PROPOSED product rule**; consistent with ADR-002/008 |
| Optional capability modules selected by niche/plan/company needs | **PROPOSED product rule**; current entitlements partially support it |
| Internal business agent for every tenant | **PROPOSED mandatory product capability** |
| Optional client-facing agent unique to each business | **PROPOSED optional capability** |
| Impulsionito as parent/platform operations agent | **PROPOSED**, constrained by accepted AI security boundaries |
| Advanced automation/provider implementation | **DEFERRED**; extension contracts are in scope now |
| Production activation | **FORBIDDEN** by this document; existing phase gates remain authoritative |

If accepted, this model becomes the product north star for Phase 8. It changes the **priority and composition** of Phase 8 slices, not the accepted execution topology (`app-web` + Nest API + worker + managed Supabase).

## Product in one sentence

> Impulsionando gives a physical business one configurable dashboard and a tenant-specific AI operator that connects customer acquisition, CRM, communication, daily operations, fulfillment, payment and retention.

## The operating loop

```text
Acquire
  → identify and qualify
  → follow up
  → convert
  → schedule / sell / fulfill
  → collect and reconcile
  → retain
  → reactivate
  → learn and improve
```

CRM, agenda, sales, inventory, finance and billing are not unrelated mini-products. They provide the operational signals and actions that make the marketing loop useful.

## Non-negotiable model

| Concern | Rule |
| --- | --- |
| Dashboard | One stable information architecture and design system |
| Tenant variation | Configuration, entitlements, blueprints and data — never a tenant-specific build |
| Modules | Composable capabilities with explicit contracts and dependencies |
| Niche | A versioned preset, not a fork |
| Company customization | Overrides the preset without forking code |
| AI | A product capability over authorized tools; never tenant connectivity or a security boundary |
| Impulsionito | Platform parent agent with governed platform context and delegated tenant tools |
| Business agent | Mandatory, strictly tenant-scoped |
| Client-facing agent | Optional, public-audience policy, separate identity and toolset |
| Automation | Domain events and action contracts first; provider/workflow depth later |
| Integrations | Adapters behind stable ports; WhatsApp provider intentionally undecided |

## Documents

| Document | Purpose |
| --- | --- |
| [`PRODUCT-MODEL.md`](./PRODUCT-MODEL.md) | Product thesis, actors, operating loop, dashboard invariant and tenancy rules |
| [`STAKEHOLDER-REQUIREMENTS.md`](./STAKEHOLDER-REQUIREMENTS.md) | Product-owner catalogue, safe technical translations, PRD-DB decisions (PROPOSED) |
| [`CURRENT-STATE-AND-GAPS.md`](./CURRENT-STATE-AND-GAPS.md) | Code baseline: retain, reformulate, consolidate, retire and blocking gaps |
| [`CAPABILITY-MODULES.md`](./CAPABILITY-MODULES.md) | Mandatory/optional modules, dependencies, contracts and activation |
| [`DASHBOARD-V1.md`](./DASHBOARD-V1.md) | Dashboard-first scope, navigation, widgets, states and responsive behavior |
| [`NICHE-BLUEPRINTS-AND-ONBOARDING.md`](./NICHE-BLUEPRINTS-AND-ONBOARDING.md) | Presets, compiler inputs/outputs, overrides and versioning |
| [`AI-OPERATING-MODEL.md`](./AI-OPERATING-MODEL.md) | Impulsionito, business agents, client agents, context and safety |
| [`NESTJS-REFORMULATION.md`](./NESTJS-REFORMULATION.md) | What stays, what changes and the target Nest module graph |
| [`DATA-EVENTS-AND-AUTOMATION.md`](./DATA-EVENTS-AND-AUTOMATION.md) | Canonical data, event spine, automation extension points and integrations |
| [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) | Dashboard-first phases, gates, tests, evidence and Phase 8 impact |
| [`database/README.md`](./database/README.md) | Canonical database models, legacy disposition, ERP/operations, execution/AI/analytics, verticals, migration and decisions |
| [`design/README.md`](./design/README.md) | **Impeccable design authority** — App de balcão, IA, UX, tokens, a11y, PT-BR copy, HTML artifacts |
| [`../../PRODUCT.md`](../../PRODUCT.md) · [`../../DESIGN.md`](../../DESIGN.md) | Impeccable product + visual-world summaries (repo root) |

### Design documentation posture (current)

Product and design documentation on `reengineering/program` is the **source of truth for what to build later**.

- **Do** follow [`design/`](./design/) for brand, IA, Home region order, module states, and accessibility when an implementation task is authorized.
- **Do not** treat this folder as permission to rewrite `apps/app-web` layout or invent a second dashboard.
- The authenticated shell already on program (Next.js / shadcn under **ADR-009 Proposed**) stays; future UI work is **restyle** (color, type, components) on that skeleton — not a new IA — and only when explicitly tasked.
- No logo file is shipped yet: binding name **Impulsionando**; commissioned mark is `OPEN` (wordmark until then).

## Current-code conclusion

The repository contains many ingredients, but not this assembled product:

- **Reusable:** tenant resolution, memberships/entitlements endpoints, support API, durable jobs, outbox, webhook ingress, operations metrics and governed AI primitives.
- **Partial:** module catalog, niche taxonomy, onboarding, CRM, agenda, finance, sales, inventory, communications and dashboard screens.
- **Wrong shape:** 576 authenticated route files, 57 near-duplicate health dashboards, direct browser-to-Supabase access, hard-coded navigation and tenant-specific route trees.
- **Missing:** canonical capability registry, versioned niche blueprints, onboarding compiler, universal dashboard composition API, durable agent registry/context policy, unified growth model and stable automation/channel ports.

## Explicit exclusions

- No code, database, infrastructure, DNS or provider mutation from this directory.
- No claim that a legacy screen or table represents a finished capability.
- No unrestricted parent-agent access to tenant rows.
- No per-tenant application instance, route tree or image.
- No decision on WhatsApp provider in Dashboard V1.
- No advanced autonomous side effects before capability authorization, audit, idempotency and approval gates are proven.
