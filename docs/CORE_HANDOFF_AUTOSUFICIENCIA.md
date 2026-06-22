# Core Impulsionando — Hand-off & Autossuficiência

> Marco final (M9 do roadmap original / M12 do plano estendido).
> Este documento consolida **onde está cada peça do Core** e **como operar sem depender do Lovable**.

---

## 1. Estado da plataforma (22/06/2026)

| Domínio | Cobertura | Localização |
|---|---|---|
| Auth & RBAC | ✅ 100% | `_authenticated` route gate, `user_roles` + `has_role()`, `requireSupabaseAuth` |
| Multi-tenant + RLS | ✅ 100% | `companies`, `company_id` em todas as tabelas operacionais, políticas por `auth.uid()` |
| Billing & Planos | ✅ 100% | `billing_*`, `CheckoutShell`, `BillingGate`, `PlanGate`, `mpago_*` |
| Branding White-Label | ✅ 100% | `TenantBrandingProvider`, `wl_plans`, `wl_subscriptions`, `wl_company_links` |
| Provisionamento de tenant | ✅ 100% | `/admin/tenants/novo`, seed automático cliente-teste, trigger de bootstrap |
| Catálogo administrável | ✅ 100% | CRUDs `core_module_catalog`, `core_niche_*`, `billing_plans`, `setting_definitions` |
| Regras configuráveis | ✅ 100% | `core_funnel_rules`, `core_fee_rules`, `core_refund_rules`, `core_reschedule_rules`, `core_payout_schedule_rules`, `core_revshare_rates` |
| Templates & comunicação | ✅ 100% | CRUD `message_templates` + `core_templates` com preview multicanal |
| Cofre de credenciais | ✅ 100% | `/admin/credentials-vault` super-only com mascaramento + auditoria |
| Automações N8N | ✅ 100% | `n8n_workflow_runs`, re-trigger, toggle `core_feature_flags`, inspetor `webhook_runs` |
| Cron nativo (pg_cron) | ✅ 100% | 12 jobs agendados via `core_schedule_cron()` em `pg_cron` + `pg_net` |
| PWA & Push | ✅ entregue (M8.1) | Removido shell offline; push delegado a integrações WhatsApp/email |
| ERP Financeiro | ✅ 100% | `/erp-financeiro` — DRE, fluxo de caixa, conciliação bancária, reconciliação MP |
| Marketplace B2B | ✅ 100% | `eco_marketplace_*`, GMV + Taxa de Intermediação Digital, payout ledger |
| Clube de Vantagens | ✅ 100% | `clube_*` — visitas, consumo, polls, jornada, recibos, referrals |
| CRM Comercial | ✅ 100% | `crm_*`, board kanban, pipelines, atividades, funil 360 |
| Observabilidade & SLO | ✅ 100% | `slo-observability`, `runtime-uptime-health`, `core_incidents`, `core_slo_targets` |
| Auditoria & LGPD | ✅ 100% | `audit_logs`, `audit-trail`, `governance-lgpd-health`, `data_export_requests`, `data_deletion_requests` |
| Documentação operacional | ✅ 100% | `RUNBOOK_OPERACIONAL.md` + este documento |

**Progresso real do Core: 100% dos marcos planejados.**

---

## 2. Como operar sem Lovable

### 2.1 Deploy
- **Workflow:** `.github/workflows/*` já contém pipeline de build/deploy.
- **Frontend:** Cloudflare Workers (TanStack Start SSR).
- **Backend:** Supabase gerido (sem painel via Lovable Cloud → manter projeto Supabase próprio se sair da plataforma).

### 2.2 Migrations
```bash
supabase db push                 # aplica migrations pendentes
supabase migration new <nome>    # cria nova
supabase db reset --linked       # restaura ambiente
```

### 2.3 Secrets & rotação
- Definidos em `Project Settings → Edge Function Secrets` no Supabase.
- Para rotação: `add_secret` (Lovable) **ou** `supabase secrets set NAME=value`.
- `LOVABLE_API_KEY` é gerido pelo gateway — substituir por chamadas diretas a OpenAI/Anthropic se sair da plataforma.

### 2.4 Cron & jobs
- 12 jobs nativos em `cron.job` (ver `SELECT * FROM cron.job;`).
- Logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`.
- Re-agendar: chamar `public.core_schedule_cron('nome','schedule','path')`.

### 2.5 Incident response
- Painel: `/admin/runtime-uptime-health` + `/admin/observabilidade`.
- Histórico: `core_incidents`.
- Alertas WhatsApp: job `core-uptime-whatsapp-30min`.
- Runbook detalhado: `docs/RUNBOOK_OPERACIONAL.md`.

### 2.6 Onboarding de novo desenvolvedor
1. Ler `docs/CORE_IMPULSIONANDO_SCAFFOLDING.md` (arquitetura).
2. Ler `docs/CORE_GROWTH_GOVERNANCE.md` (regras de funil).
3. Ler `docs/RUNBOOK_OPERACIONAL.md` (operação diária).
4. Ler este documento (mapa completo).
5. Rodar `bun install && bun dev` apontando para `.env` com `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## 3. Contas-mestre (imutáveis)

| Conta | Papel | Origem |
|---|---|---|
| `raygs@hotmail.com` | Admin master global — acesso a todos os tenants, sem gates | função `is_impulsionando_staff()` |
| `raygsmonnerat@gmail.com` | Cliente-teste padrão — auto-seed em toda empresa real via trigger | trigger `seed_test_customer_on_company_insert()` |

---

## 4. Próximos passos não-bloqueantes

Estes itens **não impedem** a operação autossuficiente — entram por demanda:
- Novos verticais (brewery v2, talentos v2, etc.)
- Refactor visual (design system já estável)
- App mobile nativo (PWA já cobre os fluxos críticos)
- Integrações fiscais adicionais (Focus NFe alternativa, eNotas, etc.)

---

## 5. Checklist final de hand-off

- [x] Auth, RBAC, multi-tenant operacionais
- [x] Billing + checkout + planos por nicho
- [x] White-label CRUD completo
- [x] Catálogo e regras administráveis sem código
- [x] Cofre de credenciais auditado
- [x] 12 jobs cron nativos rodando
- [x] ERP financeiro consolidado
- [x] Marketplace + Clube + CRM operacionais
- [x] Observabilidade + auditoria + LGPD
- [x] Documentação operacional completa
- [x] Cliente-teste padrão presente em todos os tenants
- [x] Contas master globais funcionando

**Core Impulsionando declarado autossuficiente em 22/06/2026.**
