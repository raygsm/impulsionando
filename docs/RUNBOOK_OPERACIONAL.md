# Runbook Operacional — Core Impulsionando

> Documento factual gerado a partir do código real (auditoria 2026-06).
> Cobre: agendamento de jobs, secrets, webhooks externos, fluxo de incidentes,
> deploy/rollback, e checklist de autossuficiência sem Lovable.

---

## 1. Endpoints públicos (sem auth Supabase, com auth própria)

Todos sob `src/routes/api/`. Auth via `apikey` (anon Supabase) **ou** HMAC
(`x-impulsionando-signature`, `x-mp-signature`, `x-focus-signature` etc.).

### 1.1 Webhooks de entrada (chamados por terceiros)

| Endpoint | Origem | Auth |
|---|---|---|
| `POST /api/mercadopago/webhook` | MercadoPago | HMAC `MERCADOPAGO_WEBHOOK_SECRET` |
| `POST /api/public/payments/webhook` | Gateways genéricos | HMAC + idempotência |
| `POST /api/public/hooks/n8n-log` | N8N (cada step) | HMAC `IMPULSIONANDO_WEBHOOK_SECRET` |
| `POST /api/public/hooks/focus-nfe` | Focus NFe | HMAC + `FOCUS_NFE_TOKEN` |
| `POST /api/public/hooks/zapi-status` | Z-API delivery | HMAC `ZAPI_CLIENT_TOKEN` |
| `POST /api/public/hooks/core-notification-event` | N8N (legado) | `INTERNAL_WEBHOOK_SECRET` |
| `POST /api/public/hooks/core-pull-chrismed` | CHRISMED | `IMPULSIONANDO_CORE_SECRET` |
| `POST /api/public/realestate/interest` | Vitrine externa | público + rate-limit |
| `POST /api/public/realestate/saved-search` | Vitrine externa | público + rate-limit |
| `POST /api/public/demo/feira-lead` | Vitrines de feiras | público + captcha |

### 1.2 Cron / Tick (chamados por scheduler externo)

| Endpoint | Frequência recomendada | O que faz |
|---|---|---|
| `POST /api/public/outbox/process` | **a cada 1 min** | Drena `message_outbox` (50/lote) |
| `POST /api/public/cron/agenda-tick` | **a cada 1 min** | Expira ofertas Pega-Horário, vagas, plantões |
| `POST /api/public/cron/funnel-dispatch` | **a cada 1 min** | Dispara régua `core_funnel_dispatch_queue` |
| `POST /api/public/cron/payouts-consolidate` | **diário 02:00** | Consolida lotes de repasses afiliados |
| `POST /api/public/hooks/billing-tick` | **a cada 5 min** | Marca faturas vencidas, dispara cobranças |
| `POST /api/public/hooks/clube-journey-tick` | **a cada 5 min** | Avança jornada de clube/loyalty |
| `POST /api/public/hooks/aff-advance-commissions` | **diário 03:00** | Libera comissões fora do hold-back |
| `POST /api/public/hooks/dispatch-fiscal` | **horário** | Reemite NFe presas em retry |
| `POST /api/public/hooks/fiscal-monthly-email` | **mensal dia 5 09:00** | Envia DRE/relatório fiscal por e-mail |
| `POST /api/public/hooks/marketing-lead-notify` | **a cada 15 min** | Notifica novos leads |
| `POST /api/public/hooks/marocas-report` | **mensal dia 1 06:00** | Gera relatórios Marocas |
| `POST /api/public/hooks/mp-pending-reminders` | **diário 10:00** | Lembretes de pagamentos pendentes |
| `POST /api/public/hooks/notification-log-cleanup` | **diário 04:00** | Limpa logs antigos (>90d) |
| `POST /api/public/hooks/retention-sweep` | **diário 04:30** | Aplica políticas LGPD de retenção |
| `POST /api/public/hooks/uptime-check` | **a cada 5 min** | Coleta uptime de integrações |
| `POST /api/public/hooks/uptime-whatsapp-test` | **a cada 30 min** | Ping de saúde Z-API |
| `POST /api/public/hooks/comms-self-test` | **diário 06:00** | Auto-teste de e-mail + WhatsApp |

### 1.3 Healthcheck

- `GET /api/public/health` — liveness (status + git SHA + Sentry release)
- `GET /api/public/health/monetization` — readiness comercial (billing + MP + payouts)

---

## 2. Como agendar os crons (3 opções suportadas)

### Opção A — pg_cron (recomendada; já no Supabase)

```sql
-- 1. Habilita extensão (uma vez)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Outbox a cada minuto
select cron.schedule(
  'outbox-process-1min',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://app.impulsionando.com/api/public/outbox/process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', current_setting('app.settings.anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. Agenda-tick a cada minuto (mesmo padrão)
select cron.schedule('agenda-tick-1min',     '* * * * *',     $$ ... $$);
select cron.schedule('funnel-dispatch-1min', '* * * * *',     $$ ... $$);
select cron.schedule('billing-tick-5min',    '*/5 * * * *',   $$ ... $$);
select cron.schedule('clube-tick-5min',      '*/5 * * * *',   $$ ... $$);
select cron.schedule('payouts-daily',        '0 2 * * *',     $$ ... $$);
select cron.schedule('aff-commissions',      '0 3 * * *',     $$ ... $$);
-- ... etc (uma linha por endpoint da seção 1.2)
```

Guarde a anon key em GUC: `alter database postgres set app.settings.anon_key = '<KEY>';`

### Opção B — N8N (já há 7 workflows em `docs/n8n/`)

Importar workflows do diretório `docs/n8n/*.json` e configurar:
- Cron trigger no schedule da seção 1.2
- HTTP Request → endpoint
- Header `x-impulsionando-signature` calculado via Function node (HMAC-SHA256 com `IMPULSIONANDO_WEBHOOK_SECRET`)

### Opção C — GitHub Actions / cron externo

```yaml
# .github/workflows/cron-outbox.yml
on:
  schedule: [{ cron: "* * * * *" }]
jobs:
  flush:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://app.impulsionando.com/api/public/outbox/process \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 3. Secrets obrigatórios (production)

| Variável | Onde se usa | Obrigatório |
|---|---|---|
| `SUPABASE_URL` | client.server | ✅ |
| `SUPABASE_PUBLISHABLE_KEY` (ou `_ANON_KEY`) | auth de crons + RLS | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | server fns / edge fns | ✅ |
| `DATABASE_URL` | migrations | ✅ |
| `MERCADOPAGO_ACCESS_TOKEN` | criar pagamentos | ✅ |
| `MERCADOPAGO_WEBHOOK_SECRET` | validar webhook MP | ✅ |
| `IMPULSIONANDO_WEBHOOK_SECRET` | HMAC N8N → Plataforma | ✅ |
| `INTERNAL_WEBHOOK_SECRET` | hooks internos legados | ✅ |
| `IMPULSIONANDO_CORE_SECRET` | pull CHRISMED | quando CHRISMED ativo |
| `FOCUS_NFE_TOKEN` | emissão NFe | quando fiscal ativo |
| `ZAPI_INSTANCE_ID` + `ZAPI_INSTANCE_TOKEN` + `ZAPI_CLIENT_TOKEN` | WhatsApp | ✅ |
| `RESEND_API_KEY` | e-mail transacional | ✅ |
| `TWILIO_API_KEY` + `TWILIO_FROM_PHONE` | SMS (opcional) | opcional |
| `SMS_SIMULATE=true` | dev sem Twilio | dev |
| `LOVABLE_API_KEY` | AI Gateway (talentos, IA) | quando IA ativa |
| `SENTRY_DSN` + `SENTRY_ENVIRONMENT` + `SENTRY_RELEASE` | observabilidade | recomendado |
| `GIT_SHA` | exposto no /health | recomendado |
| `APP_BASE_URL` + `PUBLIC_APP_URL` + `PUBLIC_SITE_URL` | links em e-mails | ✅ |
| `OUTBOX_PROCESS_SECRET` | alt-secret p/ flush outbox | opcional |

Cofre interno de credenciais por tenant: tabela `core_credentials_vault` +
rota admin `/admin/cofre-credenciais` (gerencia integrações por cliente sem
mexer em ENV).

---

## 4. Fluxo de auto-provisionamento (já implantado)

```
Cliente paga checkout MercadoPago
      ↓
POST /api/mercadopago/webhook   (HMAC validado)
      ↓
mpago_payments UPSERT (status=approved, provisioning_status=pending)
      ↓
auto-provisioning.server.ts → provisionFromMpagoPayment()
      ↓ (idempotente via mpago_payments.provisioning_status)
   ├─ INSERT companies (slug derivado do nicho + CNPJ)
   ├─ INSERT user_profiles + user_roles (owner)
   ├─ INSERT billing_contracts (plano comprado)
   ├─ INSERT company_modules (módulos do plano)
   ├─ INSERT onboarding_checklist (passos do nicho)
   ├─ INSERT message_outbox (boas-vindas e-mail + WhatsApp)
   └─ INSERT audit_logs (rastro)
      ↓
mpago_payments.provisioning_status = 'completed'
```

**Reprocessar manualmente:** UI admin → `/admin/cobrancas` → menu de ação
"Reprovisionar" (chama `provisioning.functions.ts:reprovisionPayment`).

---

## 5. Incidentes

### 5.1 Cron parou
1. Cheque `/admin/jobs-queues-reliability-health` — mostra `clube_cron_log`,
   `marocas_report_runs`, `core_funnel_dispatch_queue` lag, `core_incidents`.
2. Cheque `/admin/runtime-uptime-health` — uptime por endpoint.
3. Re-execute manualmente:
   ```bash
   curl -X POST https://app.impulsionando.com/api/public/outbox/process \
     -H "apikey: $ANON_KEY"
   ```

### 5.2 Webhook MercadoPago falhando
1. `/admin/mercadopago-billing-health` mostra últimas 100 chamadas.
2. Replay manual: `/admin/cobrancas` → "Replay webhook".
3. Reprocesso direto: `POST /api/public/payments/close-invoice.replay`.

### 5.3 Z-API offline
1. `/admin/whatsapp-metrics` mostra estado da instância.
2. `core_whatsapp_alerts` recebe insert automático via `uptime-whatsapp-test`.
3. Fallback: outbox segura mensagens; quando voltar, drena.

### 5.4 N8N falhou (workflow)
1. `/admin/integracoes/n8n` mostra trilha `n8n_workflow_runs` (todas steps).
2. Step `status=failed` gera `notify_user` para staff.
3. Re-trigger via N8N UI ou re-emit do evento na plataforma.

---

## 6. Deploy / Rollback

```bash
# Deploy: push para main (Lovable publica automaticamente)
# Rollback: na UI Lovable → Histórico → "Revert to this version"
# Ou via git: identificar SHA bom em /api/public/health → revert
```

Migrations Supabase rodam automaticamente no push.
**Antes de migration destrutiva:** snapshot via Supabase Dashboard → Database → Backups.

---

## 7. Checklist de autossuficiência (sem Lovable)

- [x] Auto-provisionamento de tenants pós-pagamento (sem ação humana)
- [x] CRUD de planos/módulos/nichos via UI admin (`/admin/niche-plans`, `/admin/catalogo-matriz`)
- [x] CRUD de tenants via UI admin (`/admin/cockpit-tenants`, `/core/clientes`)
- [x] Cofre de credenciais por tenant (sem mexer em ENV)
- [x] White-label por tenant (`/white-label/cockpit`)
- [x] Domínios custom por tenant (`/core/tenants/dominios`)
- [x] 60 cockpits de health observando todos os domínios
- [x] Outbox + retry + DLQ para todas as comunicações
- [x] Auditoria (`audit_logs`) em todas as mutações sensíveis
- [x] RLS ativa em 100% das tabelas (ver `docs/security/rls-audit-2026-06-18.md`)
- [x] Webhooks idempotentes com HMAC
- [x] Healthcheck público `/api/public/health` para uptime externo
- [ ] **AÇÃO OPERADOR:** Schedules da seção 2 implantados em pg_cron/N8N/GHA
- [ ] **AÇÃO OPERADOR:** Secrets da seção 3 configurados em production
- [ ] **AÇÃO OPERADOR:** Monitor externo (UptimeRobot/BetterStack) apontando para `/api/public/health`
- [ ] **AÇÃO OPERADOR:** Sentry DSN configurado para captura de erros server-side
- [ ] **AÇÃO OPERADOR:** Backup diário Supabase ativado no plano Pro

---

## 8. Roadmap residual conhecido (não bloqueia operação)

| Item | Impacto | Prioridade |
|---|---|---|
| CHRISMED EHR — UI de prontuário ao paciente final | Vertical médica completa | Média |
| Educação — rotas de aluno/curso/polo end-to-end | Vertical educacional completa | Média |
| Eventos — fluxo de ticketing ao comprador final | Vertical eventos completa | Baixa |
| Paddle gateway — UI admin | Alternativa ao MP em LATAM/EUR | Baixa |
| SMS — UI de configuração (Twilio já server-side) | Notificação alternativa | Baixa |

Nenhum item acima impede a operação dos 14 verticais ativos nem o
auto-provisionamento de novos clientes.

---

**Status real do Core: ~82% (operacional e autossuficiente para os verticais
ativos). Os 18% remanescentes são verticais incompletos (CHRISMED clínico,
Educação, Eventos) e gateways alternativos, sem bloqueio do fluxo principal.**
