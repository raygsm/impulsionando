# Phase 8 — slice catalog

Created: **2026-09-04** · State: **NOT STARTED** — no slice authorized
Board: [`README.md`](./README.md) · Shape: [`TARGET-APP-SHAPE.md`](./TARGET-APP-SHAPE.md) · Waves: [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md)

The implementation inventory. The authoritative execution path below supersedes the original broad P1–P10 ordering retained later for legacy-source traceability.

Every slice inherits the program's Definition of Done ([`../../05-governance/DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md)). The per-slice tables below record only what is **specific** to that slice.

## Authoritative execution catalog

| Order | Slice | Gate/dependency | Required outcome |
| --- | --- | --- | --- |
| 0 | Frontend dependency | G0 | Runtime selected by accepted ADR lands; presentation/thin BFF only |
| 1 | Nest common foundation | G0/G1 | Typed config, Zod, envelope/correlation, guards, audit/idempotency, tenant registry, in-process tests, Phase 3–6 compatibility |
| 2 | Identity/composition | G1/G2 | Session/tenant/capabilities, modules, quota/plan, blueprint dry-run/onboarding, readiness |
| 3 | Read proof | G2 | Manifest/home/actions, Support, communications inbox and Growth consumed by `app-web` |
| 4 | Canonical DB preparation | DB0–DB6 | Physical/access ADR, F-DATA, classification, expand/backfill/reconcile/shadow-read |
| 5 | First CRM/Growth write | **G3 + P-DB-06 + DB7** | Contact → Lead → Task → Pipeline/Opportunity → Conversion → Growth; agent READ only |
| 6 | Later modules | Per-module gates | Team/Tasks depth → Agenda → Catalog/Sales → Inventory → Finance/Accounting → Documents → Billing → Payments → communications execution → AI durability/effects → staff → verticals |
| 7 | Retirement | DB8/DB9 | One authority, route flip, rollback and writer/adapter retirement |

Endpoint names are governed by [`first-product-slice/CONTRACTS-AND-DATA.md`](./first-product-slice/CONTRACTS-AND-DATA.md). Older S/P/A identifiers below are subordinate and do not create parallel authorization.

## Legacy inventory crosswalk

| ID | Slice | Subphase | Lane | Depends on | Blast radius |
| --- | --- | --- | --- | --- | --- |
| **S1** | Identity and session | 8B | spine | F1–F4, F8 | High — every request |
| **S2** | Capability model (RBAC unification) | 8B | spine | S1 | **Critical** — authorization |
| **S3** | Entitlements and module gating | 8C | spine | S2 | High — access to paid features |
| **S4** | Access policy and billing gate (read) | 8C | spine | S3 | High — can lock out payers |
| **S5** | Shell and navigation manifest | 8C | spine | S2, S3, F5 | Medium |
| **P1** | Dashboard and insights (read-only) | 8D | product | S5 | Low |
| **P2** | Support | 8D | product | S5 | Low |
| **P3** | Notifications and communications inbox | 8D | product | S5 | Low |
| **P4** | CRM | 8E | product | P1 | Medium |
| **P5** | Agenda | 8E | product | P1 | Medium-high — operational |
| **P6** | Sales and inventory | 8E | product | P4 | Medium-high |
| **P7** | Finance | 8E | product | P6 | High — money |
| **P8** | Users and access administration | 8E | product | S2 | High — privilege grants |
| **P9** | Subscription self-service | 8F | product | S4, P7 | **Critical** — revenue |
| **P10** | Reports and exports | 8F | product | P4–P7 | Low |
| **A1** | Tenant registry and Cliente 360 | 8G | staff | S3 | Medium |
| **A2** | Provisioning, domains, publication | 8G | staff | A1 | High — creates tenants |
| **A3** | Module catalog, plans, flags | 8G | staff | A1 | High — grants entitlements |
| **A4** | Billing hub | 8G | staff | A1, S4 | **Critical** — suspends tenants |
| **A5** | Platform health, automations, AI console | 8G | staff | A1 | Low-medium |
| **A6** | Audit, security, compliance | 8G | staff | F8 | Medium |
| **V1–V9** | Vertical packs and one-tenant ops | — | vertical | core spine closed | **DEFERRED** |

---

# S-lane — core spine (8B–8C)

The spine is where the phase is won or lost. It is small in screens and large in risk: it is the only lane where a defect is a cross-tenant data leak rather than a broken page.

## S1 — Identity and session

| Field | Value |
| --- | --- |
| Legacy source | `src/lib/auth.ts` (`fetchCurrentUser`), `src/hooks/use-active-company.ts`, `use-current-user`, `use-impersonation`, `src/routes/_authenticated/route.tsx` `beforeLoad`, `src/integrations/supabase/auth-middleware.ts` |
| Target API | `apps/api/src/identity/` (new) |
| Contracts | `packages/contracts/src/identity.ts` — `SessionContext`, `Membership`, `ActiveContext` |
| Data | `auth.users`, `user_roles`, `companies`; RPCs `is_impulsionando_staff`, `is_impulsionando_master_observer`, `current_user_company_ids` |
| Endpoints | `GET /api/v1/identity/session` · `POST /api/v1/identity/session/active-tenant` · `GET /api/v1/identity/memberships` |
| UI | `app-web` `_app/route.tsx` SSR guard, tenant switcher |

**Scope.** One server call returns user, memberships, active tenant, staff flags and impersonation state. The client may *propose* an active tenant; only membership decides. Replaces the `localStorage["imp.activeCompanyId"]` authority.

**Slice-specific exit.**

| # | Condition |
| --- | --- |
| 1 | Requesting a tenant the user is not a member of returns 403 and is recorded as a **deny** result |
| 2 | The legacy divergence between `useActiveCompany` and `useCompanyModules` (first membership row) cannot reproduce: one server answer, one tenant |
| 3 | Impersonation and master-observer produce a distinguishable, audited context — observer is read-only and never promoted to staff |
| 4 | SSR renders the authenticated shell without a client round-trip for session |

**Risk.** The legacy staff determination mixes `app_metadata`, a master-company membership heuristic and an RPC. Reproducing it wrongly either locks staff out or grants staff to a tenant admin. Enumerate the current rule explicitly in the slice's evidence file before implementing it.

## S2 — Capability model (RBAC unification)

**The single most important slice in Phase 8.** Blocks every write slice.

| Field | Value |
| --- | --- |
| Legacy source | Dual model: `user_roles` + enum `app_role` **and** `profiles` / `permissions` / `profile_permissions` / `user_permission_overrides`; 81 `perm:` keys in `src/components/app/nav-config.tsx`; `src/hooks/use-user-permissions.ts`; RPC `user_has_permission` used by exactly one server function |
| Target API | `apps/api/src/identity/` capability service + `CapabilityGuard` from F8 |
| Contracts | `packages/contracts/src/identity.ts` — `Capability` (`{domain}.{resource}.{action}`), `CapabilitySet` |
| Authority | [`../phase-1/CONTRACT-RBAC.md`](../phase-1/CONTRACT-RBAC.md) |
| Prerequisite | **ADR** on the canonical model — see [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) §3 |

**Scope.** Collapse the two legacy models into one capability set computed server-side per (user, tenant). Roles expand into capabilities through an explicit table; the UI consumes the resulting set and never computes it.

**Slice-specific exit.**

| # | Condition |
| --- | --- |
| 1 | An allow **and** deny result recorded for every capability domain, both intra-tenant (role lacks capability) and cross-tenant (member of A hitting B) |
| 2 | A Nest handler with no capability decorator fails a test — deny by default is mechanical, not cultural |
| 3 | The 81 legacy `perm:` keys are mapped to the new capability set, with every unmapped key explicitly resolved as *keep*, *rename* or *delete* |
| 4 | UI permission checks demonstrably cosmetic: disabling the client check still yields 403 from the API |

**Risk.** The legacy audit found permissions are *primarily UI-gated* with only ad-hoc server checks. This slice is where that becomes real enforcement, which means it can also break working screens for users whose real permissions were never enforced. Ship it read-only first (compute and log the decision without enforcing), compare against actual usage, then enforce.

## S3 — Entitlements and module gating

| Field | Value |
| --- | --- |
| Legacy source | `src/hooks/useCompanyModules.ts`, `src/lib/modules.functions.ts`, `plan-context.functions.ts`, `flag-overrides.functions.ts`, `requiredModuleFor(pathname)` in `AppShell`; `src/data/moduleCatalog.ts` (~30 SKUs) and `motherModules.ts` (14 mothers) |
| Target API | `apps/api/src/tenants/` — extends the existing `GET /tenants/:id/entitlements` |
| Data | `company_modules`, `modules`, `billing_plans.included_modules`, `billing_plan_modules`, `core_feature_flags`, `core_company_feature_values` |
| Endpoints | `GET /api/v1/tenants/:tenantId/entitlements` (extended) · `GET …/flags/:flagKey` (exists) |

**Scope.** One server-computed `EntitlementSet`: effective modules, plan tier, flags. Resolves the `erp` ↔ `financeiro` slug alias and the divergence between the DB module catalog, `moduleCatalog.ts` and the Paddle `PLAN_MODULES` map in `src/routes/api/public/payments/webhook.ts`.

**Slice-specific exit.** Unknown flags default-deny (already the Phase 4B behaviour). A tenant without a module gets 403 from the API, not merely a redirect to `/planos`. The three catalog sources reconcile into one, with the differences listed in the evidence file.

## S4 — Access policy and billing gate (read-only)

| Field | Value |
| --- | --- |
| Legacy source | `src/lib/access-policy.functions.ts`, `src/components/app/BillingGate.tsx`, `useSubscription`, `core_company_access_policy` (referenced in code, **absent from `types.ts`**) |
| Target API | `apps/api/src/billing/` (new) — **read paths only in this slice** |
| Data | `core_company_access_policy`, `billing_contracts`, `billing_suspensions`, `subscriptions`, `trial_subscriptions` |
| Endpoints | `GET /api/v1/billing/tenants/:tenantId/access-policy` |

**Scope.** Serve `accessMode` / `serviceState` / trial state from the server so the shell can gate. No writes: nothing in this slice can suspend, reactivate or charge.

**Slice-specific exit.** A suspended tenant on the new shell reaches exactly the same restricted path set as on legacy, proven by parity. A failure to read the policy **fails closed to the legacy behaviour**, never open.

## S5 — Shell and navigation manifest

| Field | Value |
| --- | --- |
| Legacy source | `src/components/app/AppShell.tsx`, `nav-config.tsx` (audience trees, `perm` keys, plan tiers), `navigation-areas.ts` (5 canonical hubs), `SidebarNav.tsx`, `useAudience` |
| Target API | `apps/api/src/identity/` — `GET /api/v1/identity/navigation` |
| UI | `app-web` `_app` layout with `@impulsionando/ui` shell primitives |

**Scope.** The navigation tree becomes **server-computed** from capabilities (S2) + entitlements (S3) + access policy (S4) + audience. The client renders whatever it is given. This deletes the hardcoded nav tree that today is the widest fan-in file in the authenticated app.

**Slice-specific exit.** Two tenants with different plans and two users with different roles produce four different manifests, all recorded. Staff and impersonation manifests are distinguishable and audited. No navigation item can appear that the API would refuse.

---

# P-lane — tenant product (8D–8F)

## 8D — read-only spine (no domain writes)

The purpose of 8D is to prove the entire path on real staging data with nothing at stake.

### P1 — Dashboard and insights

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/dashboard*`, `dashboards.*` (6), `insights.*` (3), `cockpits.*`, `radar`, `inicio`; `src/lib/audience-dashboards.functions.ts` (406 lines), `ops-cockpits.functions.ts` (682 lines) |
| Target API | `apps/api/src/reports/` (new) — read-only projections |
| Endpoints | `GET /api/v1/reports/tenants/:tenantId/dashboard?view=` |
| Exit specifics | Parity recorded for every KPI against legacy on the same staging tenant; every number either matches or has a documented reason. A KPI that cannot be reproduced is **deleted, not guessed**. |

Consolidation applies here too: 6 dashboards + 3 insights + cockpits + radar target **one parameterized dashboard with named views**.

### P2 — Support

| Field | Value |
| --- | --- |
| Legacy source | `abrir-ticket`, `src/routes/api/public/support/create-ticket.ts`, `src/lib/support-tickets.functions.ts`. **Not** `_authenticated/support.cockpit` (`support_sessions`). **Not** a tenant customer-service desk (PRD-DB-05) |
| Target API | `apps/api/src/support/` — **already exists** (Phase 3 pilot, 3 endpoints) |
| Work | UI in `app-web` + list filters + staff status update. **Nest half:** [`first-product-slice/`](./first-product-slice/) (F8 + S1-min + `caseKind: platform_support` + GET-by-id). |
| Exit specifics | Phase 3 smokes still pass. Help is the **platform support case** (tenant → Impulsionando). Do not retire `support.cockpit` as if it were tickets; do not invent tenant CS. |

### P3 — Notifications and communications inbox

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/notifications`, `ops.mensageria`, `src/lib/comm.functions.ts`, `communication-bulk-email.functions.ts` (521 lines); `message_outbox`, `message_templates`, `notifications` |
| Target API | `apps/api/src/communications/` (new) — read projection over the Phase 5C outbox and 5E delivery ledger |
| Exit specifics | Read-only. **No send path in this slice**; dispatch stays on the worker sink until a channel adapter has its own gate. Delivery state shown must come from `reengineering_communication_delivery`, not from a UI guess. |

## 8E — tenant product writes

### P4 — CRM

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/crm.*` (7), `customers`, `marketing.leads`; `crm_leads`, `crm_pipelines`, `crm_stages`, `crm_opportunities`, `customers` |
| Target API | `apps/api/src/crm/` (new); reuses the Phase 5F `journeys` module for invites |
| Endpoints | leads, pipelines, stages, opportunities, customers, activities — CRUD, tenant-scoped, capability-guarded |
| Exit specifics | Writes emit outbox events (`domainMutationToOutboxRow`) and audit rows. Idempotency key honoured on create. Cross-tenant deny recorded for every collection. |

**Scope discipline.** The intake corpus specifies a "CRM Universal" (unified WhatsApp/email inbox, campaigns, Customer 360, N8N state machines). That is a **new product**, not this migration. P4 moves what exists; the intake vision goes through its own gate.

### P5 — Agenda

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/agenda.*` (10); `src/lib/agenda-core.functions.ts` (766 lines); 21 `agenda_*` tables; RPC `agenda_claim_open_slot` |
| Target API | `apps/api/src/agenda/` (new) |
| Exit specifics | Slot claiming stays an RPC — it is genuinely data-centric and concurrency-sensitive; the API wraps it, it does not reimplement it in TypeScript. Double-booking is proven impossible under concurrent claims, recorded as a test result. |

### P6 — Sales and inventory

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/sales.*` (6), `inventory.*` (6); `sales_orders`, `sales_cash_sessions`, `sales_payments`, `inv_products`, `inv_movements`, `inv_suppliers`; `src/lib/catalogo.functions.ts` (742 lines) |
| Target API | `apps/api/src/sales/`, `apps/api/src/inventory/` (new, shared contracts) |
| Exit specifics | Stock movement is transactional and idempotent; a replayed order create does not double-decrement. Cash session open/close is audited. |

### P7 — Finance

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/finance.*` (10), `erp-financeiro`, `repasses`; `fin_transactions`, `fin_payments`, `fin_commissions` |
| Target API | `apps/api/src/finance/` (new) |
| Exit specifics | Every mutation audited with actor, tenant and before/after. Money values validated at the contract boundary. No provider calls in this slice — finance records, it does not charge. |

### P8 — Users and access administration

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/users.*` (2), `permissions`, `access-profiles.*` (2), `sectors`, `units`, `companies`; `src/lib/rbac-admin.functions.ts` |
| Target API | `apps/api/src/identity/` write paths |
| Exit specifics | **Privilege escalation tests are mandatory**: a tenant admin cannot grant a capability they do not hold, cannot grant staff, cannot invite into another tenant. Every grant and revoke is audited. |

## 8F — self-service commercial

### P9 — Subscription self-service

Highest financial blast radius in the tenant lane; therefore last.

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/minha-assinatura`, `assinatura`, `contrato`, `modules`, `monetizacao`; `checkout.*` public routes; `useSubscription`; Paddle (`src/lib/paddle*.ts`, `api/public/payments/webhook.ts`) and Mercado Pago (`mercadopago.functions.ts`, `mpago_*`) |
| Target API | `apps/api/src/billing/` write paths; provider webhooks land on the Phase 5D ingress |
| Exit specifics | Shadow-read period first: the new UI displays state computed by the new API while legacy remains authoritative for writes, and any divergence is recorded before authority moves. Provider webhooks are idempotent and replay-safe (already proven in 5D). Nothing suspends or charges without an audit row. |

**Rollback for P9 is not "redeploy":** it is a documented procedure that returns billing authority to legacy without leaving orphaned provider state. It ships with the slice.

### P10 — Reports and exports

| Field | Value |
| --- | --- |
| Legacy source | `_authenticated/reports.*` (7), `bi.*` (5) |
| Target API | `apps/api/src/reports/` |
| Exit specifics | Exports are tenant-scoped and audited. A report cannot widen data access beyond the requester's capabilities — proven by a deny test on an export that would otherwise cross tenants. |

---

# A-lane — platform staff console (8G)

Runs in parallel with the P-lane after S3. Different audience, different guard, mostly different data — but **higher privilege**, so every slice here needs a deny test against a non-staff user.

The consolidation budget from [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) §4 applies: ~295 legacy staff routes target ≈35–45 screens.

### A1 — Tenant registry and Cliente 360

| Field | Value |
| --- | --- |
| Legacy source | `admin.clientes.$slug.*` (~16 tabs: dados, plano, módulos, financeiro, CRM, automações, cérebro-IA, domínio, publicação, logs, auditoria, configurações, mercado-pago, painel), `core.clientes`, `core.cliente.$id.*` |
| Target API | `apps/api/src/admin/` (new, staff-guarded) |
| Consolidation | Two legacy surfaces (`admin.clientes.*` and `core.cliente.*`) become **one** Cliente 360 |
| Exit specifics | A non-staff user receives 403 on every endpoint, recorded. Read-only in this slice — mutations belong to A2–A4. |

### A2 — Provisioning, domains, publication

| Field | Value |
| --- | --- |
| Legacy source | `core.criar-projeto`, `core.nova-implantacao`, `core.implantacoes`, `core.dominios`, `core.publicacao`, `core.releases`; `src/lib/factory.functions.ts` (798), `tenant-publication.functions.ts` (350), `tenant-editor.functions.ts` (491) |
| Target API | `apps/api/src/admin/` + `apps/worker` jobs for long-running provisioning |
| Exit specifics | Tenant creation is idempotent and produces an audit trail. Hostname changes go through `core_tenant_slug_aliases` and never select a different commit per tenant (ADR-008). Provisioning runs as a durable job, not an HTTP request. |

### A3 — Module catalog, plans, flags

| Field | Value |
| --- | --- |
| Legacy source | `core.modulos`, `core.parametros`, `admin.catalogo-matriz`, `admin.billing-policy`; `modules`, `module_versions`, `billing_plans`, `core_feature_flags` |
| Target API | `apps/api/src/admin/` + `tenants` |
| Exit specifics | Granting a module to a tenant is audited and immediately reflected in that tenant's `EntitlementSet` (S3). Reconciles the three catalog sources identified in S3. |

### A4 — Billing hub

| Field | Value |
| --- | --- |
| Legacy source | `core.hub-cobranca`, `admin.billing`, `admin.billing-contracts`, `admin.billing-health`, `admin.billing-policy`, `_command.command.financeiro`; `src/lib/billing.functions.ts` (514), `canonical-billing.functions.ts`, `pix-charges.functions.ts`; RPCs `billing_run_cycle`, `subscription_suspend_overdue`, `set_company_courtesy_plan` |
| Target API | `apps/api/src/billing/` staff paths |
| Exit specifics | Suspension and reactivation are **APPROVAL-gated actions with an audit row**, never a side effect of a page load. Dunning cycles run as worker jobs. A staff mistake must be reversible and traceable. |

### A5 — Platform health, automations, AI console

| Field | Value |
| --- | --- |
| Legacy source | **57** `admin.*-health.tsx`, `core.observabilidade`, `admin.uptime`, `admin.reliability*`, `core.automacao.*` (17), `core.hub-automacoes`, `core.integracoes.*`, `admin.impulsionito.*`, `adm.agentes`, `_command.command.ia`, `_command.command.automacoes` |
| Target API | `apps/api/src/ops/` (**exists**, Phase 5G) extended + `automations/` (new) + `ai/` (**exists**, Phase 6) |
| Consolidation | 57 health pages → **one parameterized platform-health surface** over a domain registry; 17 automation routes → one hub |
| Exit specifics | The domain registry is data, not 57 files. Each domain's health derives from real signals (queue metrics, outbox lag, webhook ingress, release SHA), not from a hardcoded mock. Any domain whose health cannot be sourced is shown as **UNKNOWN**, never green. |

### A6 — Audit, security, compliance

| Field | Value |
| --- | --- |
| Legacy source | `admin.audit-trail`, `admin.auditoria.logs`, `admin.security-*`, `admin.governance-lgpd-health`, `_authenticated/seguranca.*`, `privacy.*`, `legal-aceites`; `audit_logs`, `lgpd_consents`; RPCs `log_security_event`, `log_admin_action` |
| Target API | `apps/api/src/audit/` (new) — the write side is the F8 `AuditInterceptor`, used by every other slice |
| Exit specifics | Every sensitive action from S1–A5 appears in the trail. Logs contain no sensitive values. A tenant admin sees only their tenant's trail; staff see the platform's — both proven. |

**Sequencing note.** A6's *write* side (the interceptor) lands in F8, before any other slice. A6 as a slice is the *console* over it. Do not defer the interceptor to 8G.

---

# V-lane — deferred (not Phase 8)

Each of these moves with its tenant or its own product gate, reusing the spine Phase 8 builds. Listed so nothing is lost, not so it is scheduled.

| ID | Scope | Legacy files | Unblocks after |
| --- | --- | --- | --- |
| V1 | Imobiliária | `imobiliaria.*` 19 + `realestate*.functions.ts` (993+494 lines) | core spine closed |
| V2 | Contabilidade | `contabilidade.*` 12 | core spine closed |
| V3 | Affiliates and partner revenue | `affiliates.*` 19, `aff_*` 18 tables | own product gate (intake proposes a new engine) |
| V4 | Cervejaria / bar / restaurante / PDV | 13 files + `brewery.functions.ts` (1,157 lines) | core spine closed |
| V5 | EHR / saúde | `ehr.*` 2 | own gate (regulated) |
| V6 | Eventos, educação, talentos | 7 files | core spine closed |
| V7 | Marketplace, vitrine, clube, white-label console | 8 files + `marketplace.functions.ts` (787) | core spine closed |
| V8 | Fiscal / NF-e | `admin.fiscal*`, `admin-fiscal.functions.ts` (1,342 lines — the largest module in the repo) | own gate |
| V9 | One-tenant ops: ChrisMed 23, WMP 10, Marocas 4, Revela 4, RioMed/Colors ~40, Torre 3 | 87 files | that tenant's Phase 7 cutover |

---

## Cross-cutting rules for every slice

| Rule | Enforcement |
| --- | --- |
| Contracts land before the module | Contract test in `tests/reengineering/` |
| Deny by default | F8 `CapabilityGuard`; a handler without a decorator fails a test |
| Allow **and** deny recorded | [`../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md); result in the slice evidence file |
| Reads carry a parity result | `npm run phase8:parity -- --slice=<id>` |
| Writes are idempotent and audited | Idempotency key + audit row, both tested |
| Exactly one owner per path prefix | `npm run phase8:routes:check` |
| Legacy owner deleted in the same series | Route files **and** their `*.functions.ts` |
| Rollback rehearsed | Manifest flip back to `legacy`, recorded |
| Evidence file exists | [`EVIDENCE-TEMPLATE.md`](./EVIDENCE-TEMPLATE.md) |
| No secrets anywhere | Variable names only |
