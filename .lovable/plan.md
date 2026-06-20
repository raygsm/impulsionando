# Core Impulsionando — Status de Auditoria

> Princípio: a Impulsionando é a matriz. Clientes, consumidores, White Labels e parceiros são tenants subordinados. Tudo que aparece nos painéis filhos deriva de permissão, plano, módulos, nicho e contrato registrados no Core.

## Blocos auditados e prontos

| Bloco | Onde vive | Status |
| --- | --- | --- |
| Autenticação + RBAC | `_authenticated/route.tsx` (managed), `user_roles`, `has_role` | ✅ |
| Multi-tenant + RLS | `companies`, `user_profiles`, `mp_user_in_company`, `is_impulsionando_staff` | ✅ |
| Planos / Billing / Checkout | `billing_*`, `CheckoutShell`, `BillingGate`, `PlanGate` | ✅ |
| Branding por tenant | `TenantBrandingProvider`, `whitelabel_*` | ✅ |
| Menu dinâmico por audiência | `core_menu_items` + `_seed_menu_item`, `audience` por papel | ✅ |
| Catálogo de módulos + permissões | `core_module_catalog`, `company_modules`, `permissions` | ✅ |
| Marketplace + Clube | `mp_*`, `clube_*`, `consumer_*`, `vitrine_*` | ✅ |
| Demonstrações por nicho | `demo_*`, `niches`, `core_niche_modules` | ✅ |
| Financeiro + Mercado Pago | `billing_invoices`, `mpago_*`, `infinitepay_payments` | ✅ |
| Comissões + Repasses | `core_monetization_models`, `core_payout_events`, `core_payout_ledger` | ✅ |
| Repasses: consolidação automática | cron diário `payouts-consolidate-daily` (pg_cron) → `/api/public/cron/payouts-consolidate` | ✅ |
| Repasses: comprovantes PDF | `getPayoutReceiptUrl`, bucket privado `payout-receipts`, RLS por empresa | ✅ |
| Contratos digitais | `contract_documents`, `contract_signatures`, `contractPdf.ts`, hash + IP + audit | ✅ |
| LGPD / Consentimentos | `lgpd_consents`, `data_deletion_requests`, `data_export_requests` | ✅ |
| WhatsApp + E-mail | `message_templates`, `message_outbox`, `whatsapp_message_events`, email infra | ✅ |
| Observabilidade | `instrumentation.ts`, Sentry, `health/monetization`, `n8n_workflow_runs` | ✅ |
| Auditoria | `audit_logs` (8 policies), `mpago_webhook_events`, `core_export_logs` | ✅ |
| **Suporte / Tickets (NOVO)** | `support_tickets`, `support_ticket_messages`, `support_email_inbox` | ✅ |

## Suporte / Tickets — entregue agora

Tabela base + thread + caixa de e-mails recebidos + 3 rotas + 5 server fns + testes RLS isolados.

**Tabelas**
- `support_tickets` — protocolo único auto-gerado (`TK-YYYYMMDD-XXXXXX`), tipo (financial/payment/payout/commission/contract/access/technical/whatsapp/email/mercadopago/dashboard/permission/registration/marketplace/clube/consumer/lgpd/suggestion/question/commercial/other), prioridade (low/medium/high/critical), status (11 estados conforme prompt), origem (form/email/whatsapp/manual/system_error/payment_failure/integration_failure/webhook_failure), SLA auto-calculado por prioridade, rating 1-5.
- `support_ticket_messages` — thread com `author_role` (customer/consumer/staff/system) e flag `is_internal` (mensagens internas escondidas de cliente/consumidor por RLS).
- `support_email_inbox` — staging dos e-mails recebidos (gancho para webhook futuro de inbox).

**Triggers**
- `support_tickets_touch` — `updated_at`, `resolved_at`, `closed_at` automáticos.
- `support_msg_first_response` — marca `first_response_at` e move status `new`/`received` → `in_review` quando staff responde.

**Server functions** (`src/lib/support-tickets.functions.ts`)
- `createTicket` — abre, deriva company OR consumer scope, calcula SLA.
- `listTickets` — RLS filtra.
- `getTicket` — detalhe + mensagens (RLS oculta `is_internal` para não-staff).
- `addTicketMessage` — staff pode marcar nota interna; cliente/consumidor sempre pública.
- `updateTicketStatus` — staff muda status/prioridade/assignee; requester pode reabrir/avaliar.
- `supportDashboard` — KPIs 30d (total/abertos/vencidos SLA/1ª resposta/resolução) + breakdown.

**Rotas**
- `/suporte` (cliente) — `audience=customer`
- `/ajuda` (consumidor) — `audience=consumer`
- `/core/suporte` (staff) — fila completa, KPIs, mudança de status inline, notas internas

**RLS testada** (`tests/rls-support-tickets-isolation.test.ts` 4/4): cliente A vê só A, não vê B, consumidor só vê o próprio, mensagens internas invisíveis para cliente.

**Menu** registrado via `_seed_menu_item` com audiences `customer`/`consumer`/`staff`.

## Estado final

- **51 arquivos de teste / 483 testes verdes**
- pg_cron ativo para repasses; cron de e-mails de fila ativo via integração de email
- Bucket privado `payout-receipts` com policies por empresa
- Próximos refinamentos opcionais (não bloqueantes): webhook de inbox de e-mail → ticket automático; auto-criação de ticket em falhas de webhook de pagamento; export CSV/PDF do dashboard de suporte.
