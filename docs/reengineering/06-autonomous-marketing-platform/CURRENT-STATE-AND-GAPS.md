# Current state and gaps

Created: **2026-09-04** · Evidence level: **STATIC**, except where linked Phase 3–6 staging evidence says PASS
Source detail: [`../01-current-state/`](../01-current-state/) · Phase 8 inventory: [`../04-migration/phase-8/CORE-APP-SCOPE.md`](../04-migration/phase-8/CORE-APP-SCOPE.md)

## 1. Executive finding

The current repository contains many desired ingredients, but they are organized as a broad multi-product monolith rather than one autonomous marketing dashboard.

| Layer | Current state | Fit with proposed product |
| --- | --- | --- |
| Legacy authenticated UI | 576 routes in one client-only TanStack area | Rich ingredients, wrong composition and too much duplication |
| New `app-web` | Raw Node health/ready stub | Must become the universal dashboard |
| New Nest API | 27 routes across Support, Tenants, Jobs, Webhooks, Journeys, Ops and AI | Strong reusable spine, incomplete product domains |
| Worker | Durable queue, idempotency, DLQ, outbox and sink handlers | Reusable automation execution foundation |
| Contracts | Mature Phase 3–6 Zod contracts | Extend with dashboard, modules, growth and agent kinds |
| Modules/entitlements | Several catalogs and gating paths | Concept exists, no single authoritative result |
| AI | Governed gateway/tool/policy MVP | Correct safety direction, not durable product configuration |
| Tenant sites | Many named route trees and bespoke data | Must become blueprints/modules over shared apps over time |

## 2. Measured legacy surface

| Surface | Count | Consequence |
| --- | --- | --- |
| `_authenticated/**` | 576 route files | Never migrate mechanically |
| Generic tenant product | 206 routes | Source material for capability modules |
| Platform staff | 283 routes | Consolidate into a staff console |
| One-tenant bespoke authenticated | 87 routes | Defer to tenant/vertical migration |
| `_command.*` | 12 routes | Fold into staff console |
| `routes/api/**` | 111 endpoints | Mostly webhook/cron/public-token surface, not a product API |
| `createServerFn` | 1,476 call sites across 331 files | Business logic extraction is larger than UI work |
| `*.functions.ts` | 317 files / 57,477 lines | Slice by capability, not route |
| `admin.*-health.tsx` | 57 files | Replace with one parameterized health model |

Live per-screen usage remains **UNKNOWN**; no 30/90-day usage export exists.

## 3. What already supports the new model

### Tenancy and composition

- `resolve_tenant_by_host`, `core_tenant_slug_aliases`, `packages/tenant-host`;
- `GET /api/v1/tenants/{resolve,context}`;
- tenant config, entitlements, aliases and default-deny flag reads;
- `company_modules`, `modules`, plan-module tables and feature flags;
- niche/module inputs in `src/data/`.

### Product capabilities

- CRM tables/routes/functions and a Phase 5 CRM invite journey;
- agenda tables, booking/slot RPCs and authenticated screens;
- sales/orders, catalog and inventory namespaces;
- finance, billing, subscriptions and provider integrations;
- notifications, message templates, outbox and communication delivery records;
- support ticket API proven through the [`Phase 3 pilot`](../04-migration/phase-3/PHASE-3-EXIT-REPORT.md);
- dashboard, BI, insight, operations and health screens as UX/data-source inputs.

### Execution and AI

- job enqueue, ledger, duplicate handling and poison/DLQ PASS on staging;
- event outbox, webhook ingress, communication sink and operations metrics;
- AI capability/policy/tool registry, tenant agent seed, READ chat and gated-effect request path;
- allow/deny proof for the Phase 6 tenant agent and cross-tenant chat refusal.

These should be retained and adapted rather than rewritten.

## 4. Current structural problems

### Product fragmentation

The legacy product is organized by accumulated route prefixes and named tenants. Similar concepts appear several times:

- dashboard / dashboards / insights / cockpits / radar;
- admin / core / command;
- generic modules plus tenant-specific versions;
- separate customer-like records inside vertical namespaces.

This obscures the universal lifecycle and encourages bespoke work.

### Client-side authority

- authenticated routes are `ssr: false`;
- active company is persisted in `localStorage`;
- module/navigation/permission checks happen primarily in React;
- roughly 32% of authenticated screens call Supabase directly;
- server enforcement is inconsistent.

The new dashboard must receive session, capabilities, entitlements and manifest from Nest.

### Entitlement fragmentation

At least these sources participate:

- `company_modules` + `modules`;
- `billing_plans.included_modules`;
- `billing_plan_modules`;
- hard-coded Paddle `PLAN_MODULES`;
- `core_feature_flags` and company overrides;
- `moduleCatalog.ts`, `motherModules.ts`, recommendations and bundles.

They are inputs, not yet one capability registry.

### Data/schema drift

| Object | Typed snapshot | Phase 0 live audit |
| --- | --- | --- |
| Public tables | 465 | 577 |
| Public functions | 158 | 603 |
| Tenant columns | `company_id` in 300 typed tables; `tenant_id` in 1 | `tenant_id` found in 131 live tables |

The new product cannot infer schema truth from generated types. Existing adapters and staging observation are required.

### AI MVP limitations

- tenant agent is seeded rather than a durable per-tenant product record;
- provider is a deterministic stub by default;
- approval and telemetry state are in memory;
- effect worker is a sink;
- no distinct internal/client/platform agent-kind contract;
- no durable knowledge-source/readiness registry.

The safety shape is good; product persistence and scopes are missing.

### Communications limitations

- outbox and sink prove the execution seam;
- email/WhatsApp/provider surfaces exist in legacy code;
- there is no single connection/readiness model;
- provider decisions and business logic are coupled in places;
- a delivery sink is not a real channel.

Dashboard V1 therefore includes connection states/templates/prepared actions, not a false “connected” claim.

## 5. Retain, reformulate, retire

| Decision | Assets |
| --- | --- |
| **Retain** | Nest/Fastify, Supabase Auth/Postgres, tenant resolution, Support API, jobs/worker, outbox, webhook ingress, operations metrics, AI policy/tools/effects |
| **Reformulate** | Tenants→module/blueprint/onboarding composition; Journeys→lifecycle automation; AI→three durable agent kinds; entitlements→one effective set; dashboard routes→one manifest |
| **Extract** | CRM, Agenda, Sales, Inventory, Finance, Billing, Communications and Audit business rules from `*.functions.ts` into Nest/domain modules |
| **Consolidate** | Dashboards/insights/cockpits; admin/core/command; health pages; duplicate customer representations |
| **Retire per slice** | Direct browser Supabase access, UI-only authority, named tenant route trees after their replacement is proven |
| **Defer** | Advanced automation, permanent WhatsApp provider, regulated effects, full vertical migrations |

## 6. Gaps that block Dashboard V1

| Priority | Gap | Required output |
| --- | --- | --- |
| 1 | `app-web` has no UI | Real TanStack Start app and design-system shell |
| 2 | No unified server authorization | Capability and tenant guards, audit, standard errors |
| 3 | No canonical module registry | Module contract, dependencies and activation states |
| 4 | No dashboard composition API | Server-generated manifest |
| 5 | No canonical Growth read model | Acquisition/follow-up/conversion/retention with freshness |
| 6 | No onboarding compiler | Versioned blueprint→configuration proposal/apply |
| 7 | No durable per-tenant agent | Agent registry and internal-agent creation on onboarding |
| 8 | No communication connection port | Provider-neutral status and prepared-message contract |
| 9 | No in-process Nest tests | Guard/controller/repository integration harness |
| 10 | Schema uncertainty | Staging-first verification and per-table tenant mapping |

## 7. Claims intentionally left UNKNOWN

- Which legacy dashboard metrics are operationally trusted;
- which screens are used by real users;
- which legacy customer representation is canonical for every niche;
- current production existence/shape of `user_profiles` and some untyped tables;
- permanent WhatsApp provider;
- complete live module catalog;
- whether every tenant needs every “usually enabled” module.

These require observation or product decisions. They are not resolved by this proposal.
