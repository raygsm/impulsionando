# Current data asset disposition

Created: **2026-09-04**
Evidence level: **STATIC + Phase 0 LIVE snapshot (2026-08-28)**; requires staging F-DATA refresh before implementation
Source detail: [`../../01-current-state/phase-0/`](../../01-current-state/phase-0/)

## Classification

| State | Meaning |
| --- | --- |
| KEEP | Already matches a target responsibility closely enough to retain |
| ADAPT | Useful data/behavior behind a canonical repository/contract |
| MIGRATE | Target concept needs additive canonical storage/backfill |
| MERGE | Several conflicting representations need one authority |
| RETIRE | Not part of the canonical model after dependencies close |
| UNKNOWN | Shape, ownership, writers or use not proven |

Classification is a migration decision, not an instruction to drop anything.

**KEEP never means safe-to-query with the service role.** Every KEEP/ADAPT object still requires an F-DATA record covering current shape, RLS/policies, triggers, privileged functions, writers and tenant ownership before a slice uses it.

## 1. Platform foundation

| Capability | Current objects | Decision | Reason |
| --- | --- | --- | --- |
| Tenant identity | `companies`, `core_tenant_identity`, `core_tenant_slug_aliases`, `resolve_tenant_by_host` | **ADAPT pending F-DATA** | Host/tenant path is staging-proven, but current shape is not the target tenant/domain model |
| Domains/publication | `core_tenant_email_aliases`, `core_tenant_publication_state`, `tenant_subdomain_probes` | ADAPT | Keep operational history; split domain verification from deploy state |
| Units/settings | `company_units`, `company_settings`, `sectors`, `sector_members` | ADAPT | Useful but must clarify unit/team semantics |
| Membership | `user_roles` | **ADAPT pending RBAC ADR/F-DATA** | Candidate source; current semantics compete with the profile-permission model |
| Profiles/permissions | `profiles`, `permissions`, `profile_permissions`, `user_profiles`, `user_permission_overrides` | **MERGE / UNKNOWN** | Competes with `user_roles`; `user_profiles` production presence unproven |
| Staff/super-admin | metadata + `is_impulsionando_staff`, `is_super_admin`, master-company heuristics | MERGE | Needs explicit platform-principal authority |
| Impersonation | `core_impersonation_audit` | KEEP + ADAPT | Preserve evidence; model time-bound delegation |

## 2. Plans, modules and onboarding

| Capability | Current objects | Decision |
| --- | --- | --- |
| Module catalog | `modules`, `module_versions`, `core_module_catalog`, TS `moduleCatalog`/`motherModules` | **MERGE** |
| Tenant activation | `company_modules` | ADAPT |
| Plan/modules | `billing_plans`, `billing_plan_modules`, `billing_contracts`, hard-coded provider maps | **MERGE** |
| Feature flags | `core_feature_flags`, `core_company_feature_values` | ADAPT; safety/release flags remain distinct from commercial modules |
| Niche presets | `niches`, `core_macro_nichos`, `core_subnichos`, `core_niche_modules`, `core_niche_plan_modules`, `apply_niche_template` | ADAPT → versioned blueprints |
| Onboarding | `onboarding_checklist`, domain/email requests, `core_implantation_tasks`, factory functions | ADAPT |
| Trials | `trial_settings`, `trial_events`, `trial_subscriptions`, `trial_abuse_index` | ADAPT |
| White-label plans | `wl_plans`, `wl_subscriptions`, `wl_company_links`, `core_whitelabel_tiers` | UNKNOWN; reconcile with canonical plans |
| Quotas | No canonical immutable quota ledger found | **MIGRATE** |

## 3. Contact/customer identity

No current object is a safe universal Contact authority.

| Representation | Current role | Decision |
| --- | --- | --- |
| `crm_leads` | Acquisition record containing duplicated PII | ADAPT as Lead; migrate contact link |
| `customers` | Post-conversion customer, optional lead link | ADAPT as customer-account source |
| `communication_contacts` | Omnichannel contact/merge model, live/migration-only | ADAPT candidate; verify staging |
| `communication_contact_identities` | Channel identities | KEEP + ADAPT if observed |
| `marketing_leads` / `demo_leads` | Separate capture sources | MIGRATE into canonical Lead/source |
| `colors_contacts`, `contab_clients`, `mp_buyers`, `educ_leads`, `riomed_*` contacts/candidates/accounts | Vertical identities | MIGRATE/link during vertical wave |
| `lgpd_consents` | Consent evidence | ADAPT; clarify purpose/channel/legal basis |
| `core_field_definitions/options/values` | Custom fields | ADAPT under schema/version limits |

Target: tenant-owned Party/Contact + ContactPoint + CustomerAccount. No global cross-tenant person registry.

## 4. CRM and Growth

| Capability | Current objects | Decision |
| --- | --- | --- |
| Leads | `crm_leads` | KEEP through adapter, then migrate embedded identity |
| Pipelines/stages | `crm_pipelines`, `crm_stages`, migration-only `crm_pipeline_stages` | ADAPT; duplicate stage model UNKNOWN |
| Opportunities | `crm_opportunities` | KEEP + ADAPT |
| Activities/follow-ups | `crm_activities`, `crm_touch_queue`, `crm_touch_rules` | MIGRATE selectively: occurred history → Activity; future work → Task; rules → automation policy |
| Routing | `crm_lead_routing_rules` | ADAPT |
| Invitation journey | `reengineering_crm_journey`, `reengineering_crm_invite` | KEEP as the proven invite-journey adapter only, not full CRM lifecycle |
| Campaigns | Vertical `riomed_campaigns`, `brewery_campaigns`, `realestate_blasts`, `aff_crm_flows` | **MIGRATE** canonical Campaign; do not pick a vertical authority |
| Segments/audiences | Tags/arrays and scattered fields | MIGRATE |
| Scoring | `crm_leads.score` only | ADAPT + add score history/rule version |
| Retention | Cron/hooks/health data | MIGRATE canonical policy/signal |
| NPS/CSAT | `support_csat_responses`, niche ratings | ADAPT but keep survey ownership explicit |
| Attribution | `painel_funnel_events`, `catalog_events/intents`, UTM columns, funnel views | ADAPT as touchpoints/claims/projections |

## 5. Support and communications

| Capability | Current objects | Decision |
| --- | --- | --- |
| Platform Support | `support_tickets`, messages/events/SLA/CSAT; Nest Support API | **KEEP** |
| Legacy cockpit | `support_sessions` | RETIRE from product UI; retain only if valid support/delegation evidence |
| Tenant customer service | `communication_conversation_tickets`, vertical tickets | MIGRATE explicit customer-service case scope |
| Legacy outbox | `message_outbox`, `core_comm_*`, notification/email logs | ADAPT → consolidate |
| Omnichannel | `communication_conversations`, channels/messages/participants/handoffs/endpoints | ADAPT candidate after staging verification |
| Reengineering delivery | `reengineering_communication_delivery` | KEEP |
| Templates | `message_templates`, `core_comm_templates`, React email registry | MERGE under versioned template contract |
| WhatsApp | `core_whatsapp_credentials/routing/fallback`, receipts/events | ADAPT behind channel connection and adapter |

Provider credentials become secret references, never copied into canonical business tables.

## 6. Catalog, Sales, POS and Inventory

| Capability | Current objects | Decision |
| --- | --- | --- |
| Generic catalog/inventory | `inv_products`, `inv_categories`, `inv_movements`, `inv_suppliers` | ADAPT candidate; F-DATA must choose against `core_*` precursors |
| Core catalog candidate | `core_products`, `core_product_variants`, `core_inventory_*` | UNKNOWN until staging; possible target precursor |
| Vertical catalogs | `riomed_*`, `brewery_products`, `restaurant_menu_*`, `mp_catalog_items`, `aff_products`, `agenda_services` | MIGRATE/link per vertical |
| Generic sales | `sales_orders`, `sales_order_items`, `sales_payments`, `sales_cash_sessions` | ADAPT |
| Quotes/service orders | `quotes`, `service_orders`, events | ADAPT |
| Marketplace orders | `mp_orders`, lines/events | Vertical/marketplace adapter |
| POS | `riomed_pos_*`, restaurant table invoices/sessions, brewery links | MIGRATE into optional POS extension |
| Warehouses/stock | `riomed_warehouses/stock_*`, `core_inventory_*`, `inv_*` | MERGE selectively; canonical immutable movements + balance projection |

The target does not treat mutable quantity columns as inventory truth.

## 7. Agenda

Current generic `agenda_*` is comparatively coherent:

```text
agenda_appointments
agenda_professionals
agenda_professional_availability
agenda_professional_services
agenda_services
agenda_locations
agenda_rooms
agenda_schedules
agenda_shifts
agenda_open_slots
agenda_waitlist
agenda_blocks
agenda_rules
agenda_settings
agenda_no_show_events
agenda_audit_log
```

Decision: **ADAPT pending F-DATA** behind a generic Resource/Availability/Appointment contract. Preserve `agenda_claim_open_slot` transaction semantics only after its body, grants and writers are reviewed. Vertical appointment/visit tables migrate gradually.

## 8. Finance, billing and payments

| Capability | Current objects | Decision |
| --- | --- | --- |
| Generic finance | `fin_accounts`, `fin_categories`, `fin_transactions`, `fin_payments`, `fin_payment_methods`, `fin_commissions` | ADAPT as operational finance only; do not expose ledger-backed DRE/margin claims from it |
| Accounting ledger/DRE | No complete platform chart/journal/period model found | **MIGRATE** |
| Platform billing | `billing_plans`, `billing_contracts`, `billing_invoices`, Pix charges, dunning, suspension, checkout sessions | KEEP + ADAPT |
| SaaS subscription/trial | `subscriptions`, `trial_subscriptions` | MERGE with canonical tenant subscription |
| Mercado Pago | `mpago_credentials/payments/subscriptions/refunds/webhook_events` | KEEP as provider adapter data |
| Revenue share/payout | `core_payout_*`, revenue calculations/rates/fees/refund rules | ADAPT after separate product gate |
| RioMed AP/AR/reconciliation | `riomed_ar_invoices`, `riomed_ap_invoices`, bank reconciliation, forecasts | Vertical migration input—not core authority |
| Fiscal | `core_fiscal_*`, RioMed/EVR/ChrisMed fiscal tables | Separately governed module |

Posted financial facts need immutable balanced entries and reversals; current generic `fin_*` alone does not satisfy that commitment.

## 9. Contracts and documents

Current:

- `contract_documents`, `contract_signatures`;
- `billing_contracts`;
- `contab_contracts/documents`;
- `realestate_contracts/documents`;
- `ehr_documents`;
- `core_commercial_contract_documents`;
- WMP/rental contracts.

Decision: ADAPT generic document/signature primitives; create canonical contract versions/parties/obligations only when product decisions are accepted. Vertical legal documents retain their specialized context.

## 10. Affiliates, events and other optional modules

| Domain | Current evidence | Decision |
| --- | --- | --- |
| Affiliates | 18 `aff_*` tables with links, sales, commissions, payouts, coupons, coproducers/managers | ADAPT as optional transverse module |
| Events | `evt_*`, WMP events and ticket/check-in flows | ADAPT into optional Events context |
| Marketplace | `mp_*` 13+ tables | Separate optional context |
| Loyalty/club | `clube_*` 18 tables | Optional vertical/module, not Core identity |

Commission accrual/payout must integrate through Sales/Payments/Finance events without CRM directly editing payout rows.

## 11. Eventing, jobs and automation

KEEP the reengineering spine as the **current runtime adapter**, not necessarily as final canonical table names:

```text
reengineering_event_outbox
reengineering_job_idempotency
reengineering_job_effects
reengineering_webhook_ingress
reengineering_communication_delivery
```

KEEP/adapt existing RPCs for enqueue/read/claim/complete/fail/DLQ/effects/metrics.

ADAPT:

- `n8n_workflows`, `n8n_workflow_runs`, `n8n_dispatch_log`;
- legacy runtime/webhook/order/catalog event tables;
- `automation_approvals`, funnel rules/dispatch queues.

n8n becomes an auxiliary binding/runner; canonical automation state remains in the platform.

## 12. AI and analytics

| Capability | Current objects | Decision |
| --- | --- | --- |
| AI configuration | `core_ai_brains`, knowledge/events, prompt library | ADAPT into versioned agent registry |
| Phase 6 AI | In-memory approvals/telemetry; seeded tenant agent; effect sink | KEEP policy/tool spine; MIGRATE durable state |
| Omnichannel agent runtime | `communication_agent_runtime` | ADAPT |
| Vertical agent tables | `riomed_ai_*`, embeddings | Vertical migration input |
| Funnel analytics | `painel_funnel_events`, views | ADAPT |
| Health/SLO | core monitoring/reliability tables/views | KEEP platform operations, separate from tenant BI |
| Dashboard widget persistence | `core_dashboard_widgets` | RETIRE/reframe; target manifest is computed, not user-authored authority |

## 13. Vertical and legacy disposition

Namespaces such as `riomed_*`, `chrismed_*`, `wmp_*`, `evr_*`, `marocas_*`, `contab_*`, `realestate_*`, `brewery_*`, `restaurant_*`, `colors_*`, `clube_*`, `demo_*` do **not** enter the canonical Core wholesale.

They are:

- migration sources for a shared capability;
- retained vertical-specific facts behind an extension contract;
- or retired after their tenant wave.

Particularly:

- 21 EVR live tables lacked RLS at the audit and cannot receive data before remediation;
- demo/smoke tables are not product authority;
- RioMed's 76 typed tables do not define the universal ERP.

## 14. First CRM/Growth slice minimum

Required adapter evidence:

| Layer | Candidate objects |
| --- | --- |
| Tenant/membership | `companies`, `user_roles`, tenant resolve/aliases |
| Entitlements | `company_modules`, `modules`, one reconciled plan source |
| Contact | choose after evidence: `customers` and/or `communication_contacts` |
| Lead | `crm_leads` |
| Pipeline | `crm_pipelines`, `crm_stages` |
| Opportunity | `crm_opportunities` |
| Follow-up | `crm_activities` and/or `crm_touch_queue` |
| Consent | `lgpd_consents` if surfaced |
| Support proof | `support_tickets` |
| Eventing | reengineering outbox/idempotency |

Everything requires staging verification of shape, tenant column, RLS, triggers and writers.

## 15. Dangerous assumptions

- Generated types describe live reality.
- A table named `customers` is canonical Contact.
- A vertical table is a reusable Core model.
- Existing RLS protects service-role Nest calls.
- A direct browser writer can coexist indefinitely with Nest.
- A trigger/RPC has no hidden effect because code does not show it.
- `company_id` and `tenant_id` can be renamed mechanically.
- Billing/payment status can be recomputed from mutable current rows without an immutable event trail.
- A 200 response means a migration reconciled.

## 16. Required F-DATA output

Before each capability:

1. regenerate new-stack types from staging;
2. inventory exact tables/views/functions/triggers;
3. record tenant columns and RLS;
4. inventory every writer;
5. classify objects;
6. select adapter/additive target;
7. define backfill/reconciliation/rollback;
8. exclude UNKNOWN objects from authority.
