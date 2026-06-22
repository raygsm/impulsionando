# Core Impulsionando — Roadmap de Conclusão Autônoma

> Documento vivo. Cada item, ao ser concluído, é marcado `[x]` com referência ao commit/migration.
> Objetivo: **Core operável sem dependência futura do Lovable**.

## Status global (auditado em 22/06/2026)

- 202 server functions, 382 rotas autenticadas, 121 admin routes, 57 cockpits, 31 endpoints públicos.
- Backend/RLS/observabilidade: ~90% pronto.
- Auto-provisionamento autônomo: ~50%.
- Documentação operacional: ~40%.

## Marcos de fechamento (ordem de prioridade)

### M1 — Consolidação de cockpits duplicados (Fase 106) — EM ANDAMENTO
Eliminar duplicações sem quebrar links em produção. Estratégia: rota canônica + redirecionamento das antigas.

- [ ] Agenda → `/admin/agenda-health` canônico
- [ ] Billing → `/admin/billing-health` canônico
- [ ] Real Estate → `/admin/realestate-health` canônico
- [ ] Marocas → `/admin/marocas-health` canônico
- [ ] Marketplace → `/admin/marketplace-health` canônico
- [ ] CRM → `/admin/crm-health` canônico
- [ ] Eventos, Contab, Trial, EHR, Tenant — idem

### M2 — Self-service de provisionamento de tenant (Fase 107)
Wizard `/admin/tenants/novo` que executa:
1. Cria `companies` (nome, slug, niche, plano inicial).
2. Semeia `company_modules` a partir de `core_niche_plan_modules`.
3. Cria `company_settings` defaults.
4. Cria primeiro `user_roles` (admin do tenant) a partir de e-mail.
5. Aciona seed do cliente-teste `raygsmonnerat@gmail.com` (via trigger existente).
6. Dispara `n8n_workflow_runs` para onboarding (captação → conversão).

### M3 — Catálogo administrável via UI (Fase 108)
CRUD completo de:
- `core_module_catalog`
- `core_niche_modules`
- `core_niche_plan_modules`
- `billing_plans` + `aff_offers`
- `niches` / `core_macro_nichos` / `core_subnichos`
- `setting_definitions`

### M4 — Configurador de regras (Fase 109)
UI editora para:
- `core_funnel_rules` (já parcial)
- `core_fee_rules`
- `core_refund_rules`
- `core_reschedule_rules`
- `core_payout_schedule_rules`
- `core_revshare_rates`
- `admin_dedupe_thresholds`

### M5 — Templates & comunicação (Fase 110)
- CRUD `message_templates` por canal/evento.
- CRUD `core_templates`.
- Preview WhatsApp/E-mail antes de salvar.

### M6 — Cofre de credenciais (Fase 111)
Painel super-only com mascaramento e auditoria de:
- `mpago_credentials`
- `core_whatsapp_credentials`
- `core_fiscal_issuer_config`
- secrets via `add_secret` (com lista das chaves esperadas por integração).

### M7 — Operação de automações (Fase 112)
- Listagem `n8n_workflow_runs` com filtros, re-trigger manual, toggle de fluxo.
- Toggle `core_feature_flags` por tenant.
- Inspetor `webhook_runs` / `webhook_event_log` com replay.

### M8 — Runbook operacional sem Lovable (Fase 113)
Documentar em `docs/RUNBOOK_OPERACIONAL.md`:
- Deploy via GitHub Actions (já existem workflows).
- Variáveis de ambiente obrigatórias.
- Como aplicar migrations sem Lovable (`supabase db push`).
- Como rotacionar secrets.
- Procedimento de incident response.
- Onboarding de novo desenvolvedor.

### M9 — Auditoria final + smoke tests E2E (Fase 114)
- Rodar `tests-gate.yml` cobrindo provisionamento ponta-a-ponta.
- Validar isolamento `tenant-isolation.test.ts`.
- Atualizar `security-baseline.json`.
- Marcar Core como **autossuficiente**.

## Itens fora de escopo (não bloqueiam autossuficiência)
- Novos verticais (brewery v2, talentos v2 etc.) — entram por demanda de cliente.
- Refactor visual — design system já está estável.

## Como continuar
A cada mensagem `siga`, avanço um marco. Marcos M2–M7 podem ser entregues em paralelo onde não há dependência.
