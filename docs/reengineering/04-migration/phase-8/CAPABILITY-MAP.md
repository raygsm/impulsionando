# Phase 8 — capability map

Created: **2026-09-04**
Authority: [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) · Scope: [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) · Slices: [`SLICE-CATALOG.md`](./SLICE-CATALOG.md)

The backbone of the plan. Phase 8 is organized by **capability**, never by file, because ADR-001 forbids a mechanical route move and because the legacy route tree does not match the product.

Read this table as: *this capability exists today here, it will exist tomorrow there, and slice `X` is what moves it.*

## Legend

| Column | Meaning |
| --- | --- |
| **Bucket** | `spine` = every tenant needs it · `product` = sold to tenants · `staff` = Impulsionando operators · `vertical` = optional module · `deferred` = not Phase 8 |
| **Target API** | Nest module in `apps/api/src/`. **new** = does not exist yet; **exists** = shipped in Phase 3–6 |
| **Target app** | Which frontend owns the UI under ADR-008 |
| **Slice** | ID in [`SLICE-CATALOG.md`](./SLICE-CATALOG.md) |

## 1. Core spine

| Capability | Legacy implementation | Target API | Target app | Bucket | Slice |
| --- | --- | --- | --- | --- | --- |
| Login, session, password reset | `src/routes/auth.tsx`, `src/integrations/supabase/client.ts`, `auth-middleware.ts` | `identity` (new) + Supabase Auth | `app-web` (SSR session) | spine | **S1** |
| Current user, memberships, active tenant | `src/lib/auth.ts` `fetchCurrentUser`, `src/hooks/use-active-company.ts` (`localStorage["imp.activeCompanyId"]`) | `identity` (new) + `tenants` (exists) | `app-web` | spine | **S1** |
| Roles and permissions | `user_roles` + `profiles`/`profile_permissions` dual model; `src/hooks/use-user-permissions.ts`; 81 `perm:` keys in `nav-config.tsx` | `identity` (new) — single capability model | `app-web` (cosmetic only) | spine | **S2** |
| Impersonation, staff, master observer | `src/hooks/use-impersonation.ts`, RPC `is_impulsionando_staff`, `is_impulsionando_master_observer` | `identity` (new) | `app-web` | spine | **S2** |
| Module entitlements | `company_modules`, `src/hooks/useCompanyModules.ts`, `src/lib/modules.functions.ts` | `tenants` (exists — `GET /tenants/:id/entitlements`) extended | `app-web` | spine | **S3** |
| Plan/contract modules, feature flags | `billing_contracts`, `billing_plan_modules`, `core_feature_flags`, `src/lib/plan-context.functions.ts`, `flag-overrides.functions.ts` | `tenants` (exists) | `app-web` | spine | **S3** |
| Access policy, suspension, dunning gate | `core_company_access_policy`, `src/lib/access-policy.functions.ts`, `src/components/app/BillingGate.tsx` | `billing` (new) | `app-web` | spine | **S4** |
| Shell, sidebar, audience, module locks | `src/components/app/AppShell.tsx`, `nav-config.tsx`, `navigation-areas.ts` | `identity` (new) — server-computed nav manifest | `app-web` | spine | **S5** |
| Hostname → tenant resolution | `src/lib/subdomain.ts`, `tenant-resolver.functions.ts`, RPC `resolve_tenant_by_host`, `core_tenant_slug_aliases`, `packages/tenant-host` | `tenants` (exists — `GET /tenants/resolve`) | all webs | spine | done (Phase 4) |

## 2. Tenant product

| Capability | Legacy implementation | Target API | Target app | Bucket | Slice |
| --- | --- | --- | --- | --- | --- |
| Dashboard, cockpits, insights | `_authenticated/dashboard*`, `dashboards.*` (6), `insights.*` (3), `cockpits.*`, `radar` | `reports` (new) read-only projections | `app-web` | product | **P1** |
| Support tickets | `_authenticated/support.cockpit`, public `abrir-ticket`, `support_tickets` | `support` (**exists** — Phase 3 pilot) | `app-web` | product | **P2** |
| Notifications & comms inbox | `_authenticated/notifications`, `ops.mensageria`, `message_outbox`, `notifications` | `communications` (new) over Phase 5C/5E outbox | `app-web` | product | **P3** |
| CRM: leads, pipelines, opportunities, activities | `_authenticated/crm.*` (7), `customers`, `marketing.leads`, `src/lib/crm*.functions.ts`, `crm_leads`/`crm_pipelines`/`crm_stages`/`crm_opportunities` | `crm` (new) — reuses Phase 5F `journeys` | `app-web` | product | **P4** |
| Agenda: professionals, appointments, slots, waitlist | `_authenticated/agenda.*` (10), `src/lib/agenda-core.functions.ts` (766 lines), `agenda_*` (21 tables), RPC `agenda_claim_open_slot` | `agenda` (new) | `app-web` | product | **P5** |
| Sales, orders, cash sessions, POS | `_authenticated/sales.*` (6), `sales_orders`/`sales_cash_sessions`/`sales_payments` | `sales` (new) | `app-web` | product | **P6** |
| Inventory: products, movements, suppliers | `_authenticated/inventory.*` (6), `inv_products`/`inv_movements`/`inv_suppliers` | `inventory` (new) | `app-web` | product | **P6** |
| Finance: AP/AR, transactions, cash flow, commissions | `_authenticated/finance.*` (10), `erp-financeiro`, `repasses`, `fin_*` tables | `finance` (new) | `app-web` | product | **P7** |
| Users, invites, access profiles, sectors, units | `_authenticated/users.*`, `permissions`, `access-profiles.*` (2), `sectors`, `units`, `companies` | `identity` (new) | `app-web` | product | **P8** |
| Subscription self-service, invoices, payment method | `_authenticated/minha-assinatura`, `assinatura`, `contrato`, `modules`, `checkout.*`, `useSubscription`, Paddle + Mercado Pago | `billing` (new) | `app-web` | product | **P9** |
| Reports & exports | `_authenticated/reports.*` (7), `bi.*` (5) | `reports` (new) | `app-web` | product | **P10** |
| Tenant onboarding, niche, first-run | `_authenticated/onboarding.*` (3), `comecar`, `meu-projeto`, `saiba-mais.*` | `tenants` (exists) + `identity` | `app-web` | product | **P1** (read) / **P8** (write) |
| Security, privacy, LGPD acceptance, audit view | `_authenticated/seguranca.*` (2), `privacy.*` (2), `legal-aceites`, `audit`/`auditoria`, `audit_logs`, `lgpd_consents` | `audit` (new) | `app-web` | product + staff | **A6** |

## 3. Platform staff console

| Capability | Legacy implementation | Target API | Target app | Bucket | Slice |
| --- | --- | --- | --- | --- | --- |
| Tenant registry, Cliente 360 | `admin.clientes.$slug.*` (~16), `core.cliente.$id.*`, `core.clientes` | `admin` (new, staff-guarded) | `app-web` (staff audience) | staff | **A1** |
| Provisioning / project factory | `core.criar-projeto`, `core.nova-implantacao`, `core.implantacoes`, `src/lib/factory.functions.ts` (798 lines) | `admin` (new) + `worker` jobs | `app-web` | staff | **A2** |
| Domain, publication, releases | `core.dominios`, `core.publicacao`, `core.releases`, `src/lib/tenant-publication.functions.ts` | `admin` (new) | `app-web` | staff | **A2** |
| Module catalog, plans, feature flags | `core.modulos`, `core.parametros`, `admin.catalogo-matriz`, `modules`/`module_versions`, `core_feature_flags` | `tenants` (exists) + `admin` (new) | `app-web` | staff | **A3** |
| Billing hub: contracts, invoices, dunning, cortesia | `core.hub-cobranca`, `admin.billing*` (4), `admin.billing-policy`, `src/lib/billing.functions.ts`, `canonical-billing.functions.ts` | `billing` (new) | `app-web` | staff | **A4** |
| Platform health & observability | **57** `admin.*-health.tsx` + `core.observabilidade`, `admin.uptime`, `admin.reliability*` | `ops` (**exists** — Phase 5G) extended | `app-web` — **one parameterized surface** | staff | **A5** |
| Audit trail, security, governance | `admin.audit-trail`, `admin.auditoria.logs`, `admin.security-*`, `admin.governance-lgpd-health` | `audit` (new) | `app-web` | staff | **A6** |
| Command Center | `_command.*` (12) | folded into A1/A4/A5 | `app-web` | staff | **A1/A4/A5** |
| Impulsionito / AI console | `admin.impulsionito.*`, `adm.agentes`, `core_ai_brains` | `ai` (**exists** — Phase 6) | `app-web` | staff | **A5** |
| Automation hub, n8n, webhooks | `core.automacao.*` (17), `core.hub-automacoes`, `core.integracoes.*`, `n8n_*` | `automations` (new) over Phase 5B/5D | `app-web` | staff | **A5** |

## 4. Deferred lanes

| Capability | Legacy files | Why deferred | Unblocks after |
| --- | --- | --- | --- |
| Imobiliária | `_authenticated/imobiliaria.*` 19, `src/lib/realestate*.functions.ts` (993 lines) | Optional vertical | Core spine closed |
| Contabilidade | `contabilidade.*` 12 | Optional vertical | Core spine closed |
| Affiliates & partner revenue | `affiliates.*` 19, `aff_*` 18 tables | Optional vertical; intake proposes a new commissions engine | Own product gate |
| Cervejaria / bar / restaurante / PDV | `cervejaria.*` 6, `bar.*` 2, `restaurante.*` 5 | Optional verticals | Core spine closed |
| EHR / saúde | `ehr.*` 2, `ehr_*` tables | Regulated; ADR/AI-readiness constraints | Own gate |
| Eventos, educação, talentos | `eventos.*` 2, `educacao.*` 3, `talentos`/`talents` 2 | Optional verticals | Core spine closed |
| Marketplace, vitrine, clube, white-label console | `marketplace-eco`, `area-clube` 2, `white-label` 2, `comunidade` 2 | Optional / partner tier | Core spine closed |
| One-tenant ops (ChrisMed, WMP, Marocas, RioMed, Revela, Torre) | 87 files | Bound to each tenant's Phase 7 cutover | That tenant's cutover |

## 5. Capabilities already delivered by earlier phases

Phase 8 **consumes** these; it does not rebuild them.

| Capability | Where | Phase |
| --- | --- | --- |
| Host → tenant resolution + slug aliases | `GET /api/v1/tenants/resolve`, `packages/tenant-host` | 4 |
| Tenant config, entitlements, flags read | `GET /api/v1/tenants/:id/{config,entitlements,flags/:key}` | 4B |
| Support ticket create/list/status | `/api/v1/support/tickets*` | 3 |
| Durable jobs, idempotency, DLQ | `POST /api/v1/jobs/enqueue` + `apps/worker` | 5A/5B |
| Event outbox | `reengineering_event_outbox` + worker poller | 5C |
| Webhook ingress with HMAC | `POST /api/v1/webhooks/:provider` | 5D |
| Communication dispatch (sink) | worker `communication.dispatch` | 5E |
| CRM invite journey | `/api/v1/journeys/invites*` | 5F |
| Queue/ops metrics | `GET /api/v1/ops/queue-metrics` | 5G |
| Governed AI gateway, tools, policy, effects | `/api/v1/ai/*` | 6 |

## 6. New Nest modules Phase 8 introduces

| Module | Owns | First slice | Notes |
| --- | --- | --- | --- |
| `identity` | Users, memberships, capabilities, active context, invites | S1 | Replaces the dual RBAC model — needs an ADR first |
| `billing` | Access policy, contracts, invoices, subscription state, dunning | S4 | Highest blast radius; read-only until 8F |
| `crm` | Leads, pipelines, opportunities, customers, activities | P4 | Reuses Phase 5F journeys |
| `agenda` | Professionals, appointments, slots, waitlist | P5 | Some logic is genuinely RPC-resident |
| `sales` | Orders, cash sessions, payments | P6 | — |
| `inventory` | Products, movements, suppliers | P6 | Shares contracts with `sales` |
| `finance` | AP/AR, transactions, categories, commissions | P7 | — |
| `communications` | Templates, outbox projection, inbox | P3 | Transport already exists (5C/5E) |
| `reports` | Read-only projections for dashboards and exports | P1 | Read-only by construction |
| `audit` | Audit trail, sensitive-action log, LGPD consents | A6 | Cross-cutting; write path used by all modules |
| `admin` | Tenant registry, Cliente 360, provisioning, publication | A1 | Staff-guarded, deny tests mandatory |
| `automations` | n8n orchestration, workflow registry, webhooks console | A5 | n8n stays auxiliary, never domain SoT |

Target module boundaries follow [`../../02-target-architecture/SYSTEM.md`](../../02-target-architecture/SYSTEM.md). Any module not listed there requires a note in [`../../05-governance/DECISIONS.md`](../../05-governance/DECISIONS.md).
