# AUDITORIA TÉCNICA DE SEGURANÇA E ESCALABILIDADE — CORE IMPULSIONANDO

**Data:** 22/06/2026
**Escopo:** auditoria completa do Core Impulsionando (multi-tenant SaaS).
**Status:** correções críticas aplicadas; riscos remanescentes catalogados.

---

## 1. RESUMO EXECUTIVO

| Eixo | Status |
|---|---|
| GitHub / versionamento | ✅ Integrado (Lovable ↔ GitHub bidirecional) |
| Supabase / banco | ✅ Controlado via Lovable Cloud, migrations versionadas |
| RLS crítico (PII, fiscal, credenciais WhatsApp) | ✅ **Corrigido nesta auditoria** |
| RLS demais tabelas (USING true não-crítico) | ⚠️ Triagem em andamento (catalogado) |
| Autenticação | ✅ Supabase Auth + `_authenticated` gate gerenciado |
| RBAC | ✅ `user_roles` + `has_role()` + `is_impulsionando_staff()` |
| Pagamentos (Mercado Pago) | ✅ Backend-only; webhook secret em Secrets; idempotência via `mpago_webhook_events` |
| Edge Functions / server fns | ✅ Lógica sensível no backend; nenhum service-role no frontend |
| Webhooks | ✅ Assinatura HMAC + log + dedupe |
| Backup | ⚠️ Backup gerenciado pelo Supabase (PITR); rotina manual documentada abaixo |
| Logs / Auditoria | ✅ `audit_logs` + `runtime_events` + `n8n_workflow_runs` |
| Performance | ✅ Índices em colunas tenant-scope adicionados nesta migração |
| Staging | ⚠️ Pipeline previsto (ver §10) |

---

## 2. CORREÇÕES APLICADAS NESTA AUDITORIA

### 2.1 RLS hardening (12 tabelas)
Substituídas políticas `USING (true)` por regras escopadas via
`is_impulsionando_staff(auth.uid())` + `user_belongs_to_company(auth.uid(), company_id)`:

| Tabela | Risco corrigido |
|---|---|
| `core_fiscal_invoices` | Vazamento de CNPJ + valores fiscais entre tenants |
| `core_fiscal_invoice_events` | Histórico fiscal cross-tenant |
| `core_fiscal_issuer_config` | CNPJ + alíquota ISS expostos |
| `core_compliance_requirements` | Config compliance por empresa exposta |
| `core_funnel_dispatch_queue` | **PII (e-mail/telefone) cross-tenant** |
| `core_funnel_rules` | Lógica interna de automação exposta |
| `core_incidents` | Postmortems / severidade cross-tenant |
| `core_tenant_email_aliases` | Forwards de e-mail cross-tenant |
| `core_tenant_identity` | DNS/SSL/subdomínio cross-tenant |
| `core_whatsapp_credentials` | **Tokens criptografados + webhook secret cross-tenant** |
| `core_whatsapp_fallback_config` | Config restrita a staff/admin |
| `core_whatsapp_routing_rules` | Routing cross-tenant |

### 2.2 Índices adicionados
`beneficiary_company_id`, `invoice_id`, `company_id` nas tabelas acima — busca multi-tenant deixa de fazer seq-scan.

### 2.3 Camada de administração governada
- Tabela `core_admin_menu` (parametrização do menu master).
- Hub canônico `/admin/master-hub` (2 vertentes × 13 grupos).
- CRUD `/admin/menu-manager` (super-only, audit log).
- Política: novas telas admin entram via tabela, nunca hardcode.

---

## 3. ARQUITETURA MULTI-TENANT

```
Impulsionando (core)
 ├── White Label (revendedor)
 │    └── Cliente PJ (tenant)
 │         ├── Usuários do cliente (roles: owner/admin/operator)
 │         ├── Profissionais
 │         ├── Afiliados
 │         └── Consumidores finais
 └── Cliente PJ direto
```

**Tabela-chave:** `companies` (tenant), `user_profiles` (vínculo user↔company), `user_roles` (RBAC), `wl_company_links` (WL↔cliente).

**Função canônica de isolamento:**
- `public.user_belongs_to_company(_user uuid, _company uuid) returns boolean` — SECURITY DEFINER, usada em toda política multi-tenant.
- `public.is_impulsionando_staff(_user uuid) returns boolean` — bypass para equipe core.
- `public.has_role(_user uuid, _role app_role) returns boolean` — RBAC.

---

## 4. MATRIZ DE PERMISSÕES

| Role | Escopo | Pode |
|---|---|---|
| `super_admin` (`raygs@hotmail.com`) | Global | Tudo (todos os tenants, todas as tabelas via staff bypass) |
| `admin` Impulsionando | Global | Operação core, exceto rotação de segredos |
| `white_label_owner` | WL + clientes vinculados | Tudo dos seus clientes |
| `client_owner` | 1 company | Tudo do tenant |
| `client_admin` | 1 company | CRUD operacional + financeiro |
| `client_operator` | 1 company | Operação diária (sem financeiro) |
| `professional` | 1 company | Agenda + tarefas próprias |
| `affiliate` | Próprio escopo | Suas indicações/comissões |
| `consumer` | Próprio user | Próprios dados + memberships |

Tudo aplicado via RLS (não confiar em frontend).

---

## 5. SECRETS NECESSÁRIOS (já configurados)

Todos via Lovable Cloud Secrets (nunca em código ou banco visível):

| Secret | Uso |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Checkout / repasses MP (core) |
| `MERCADOPAGO_PUBLIC_KEY` | Frontend (publishable) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validação HMAC de webhook MP |
| `MPAGO_CHRISMED_ACCESS_TOKEN` | Tenant CHRISMED — token isolado |
| `MPAGO_CHRISMED_WEBHOOK_SECRET` | Tenant CHRISMED — webhook isolado |
| `ZAPI_INSTANCE_ID` / `ZAPI_INSTANCE_TOKEN` / `ZAPI_CLIENT_TOKEN` | WhatsApp Z-API |
| `IMPULSIONANDO_CORE_SECRET` | Tokens internos entre serviços |
| `IMPULSIONANDO_WEBHOOK_SECRET` | Webhooks internos |
| `OUTBOX_PROCESS_SECRET` | Cron processamento outbox |
| `LOVABLE_API_KEY` | Lovable AI Gateway |
| `E2E_EMAIL` / `E2E_PASSWORD` | Smoke tests automatizados |

**Política inviolável:** nenhum desses valores em `.env` versionado, código, frontend, migrations públicas ou docs.

---

## 6. PAGAMENTOS — GARANTIAS

- Comissão e repasse calculados **server-side** (`payout-consolidation`, `marketplace-intermediation`).
- Webhooks MP validam HMAC + registram em `mpago_webhook_events` + dedupe por `event_id`.
- Cada transação gera linha em `mpago_payments` + ledger `core_payout_ledger`.
- Reembolso via `mpago_refunds` respeita titularidade (RLS).
- Assinaturas: `mp_subscriptions` + `billing_invoices` + `billing_suspensions` (inadimplência → suspensão automática via cron).
- Nota fiscal: `core_fiscal_invoices` (RLS corrigido) + eventos em `core_fiscal_invoice_events`.

---

## 7. WEBHOOKS — PADRÃO

Toda integração webhook segue:
1. `/api/public/<provider>` (Lovable bypassa auth no prefixo).
2. **Validar assinatura HMAC** com `timingSafeEqual` antes de qualquer parse.
3. Registrar em `webhook_event_log` (raw payload + headers + status).
4. Dedupe por `event_id` natural do provider.
5. Marcar `webhook_runs` com `status` (received/processing/done/error).
6. Erro → fila de reprocessamento + alerta em `core_incidents`.

Aplicado: Mercado Pago, Z-API, agenda, fiscal.

---

## 8. BACKUP E CONTINUIDADE

- **Lovable Cloud:** backup diário automático + PITR (point-in-time recovery) gerenciado.
- **Exportação manual:** Backend → Database → Tables → Export CSV.
- **Antes de migration crítica:** snapshot manual + tag git.
- **Storage:** buckets versionados.
- **Restauração:** via suporte Lovable + replay de migrations.
- **Teste:** trimestral em projeto staging.

Status visível na página `/admin/seguranca-continuidade` (criada nesta auditoria).

---

## 9. LOGS E AUDITORIA

| Evento | Tabela |
|---|---|
| Login / falha | `audit_logs` (action=`auth.*`) |
| CRUD operacional | `audit_logs` por entidade |
| Pagamento | `mpago_payments` + `mpago_webhook_events` |
| Repasse | `core_payout_events` + `core_payout_ledger` |
| Webhook | `webhook_event_log` + `webhook_runs` |
| Alteração permissão | `audit_logs` (action=`role.*`) |
| Erro runtime | `runtime_events` + `core_incidents` |
| Workflow n8n | `n8n_workflow_runs` |
| Menu admin | `audit_logs` (action=`admin_menu.*`) |

---

## 10. STAGING vs PRODUÇÃO

**Estado atual:** projeto único em Lovable Cloud (produção).

**Recomendação imediata:**
1. Branch `staging` no GitHub conectado a clone do projeto Lovable.
2. Mesmo schema, secrets sandbox (Mercado Pago sandbox; Z-API teste).
3. Checklist obrigatório antes de promover para `main`:
   - [ ] Migration testada em staging
   - [ ] Smoke tests E2E verdes
   - [ ] RLS linter sem novos ERRORs
   - [ ] Backup recente confirmado
   - [ ] CHANGELOG atualizado
   - [ ] Versão SemVer incrementada

---

## 11. RISCOS REMANESCENTES (catalogados)

### 11.1 ERROR — Security Definer Views (4)
Investigar e converter para `security invoker` ou substituir por funções RPC com escopo claro. Identificar via:
```sql
SELECT schemaname, viewname FROM pg_views
WHERE schemaname='public';
```

### 11.2 WARN — RLS Policy Always True (~150 restantes)
A correção desta auditoria mirou as **12 tabelas com PII/segredos/fiscal**. As demais (~150 ocorrências) são em tabelas de catálogo público, demo, ou READ-only por design. **Plano:** triagem em ondas (10 tabelas/semana), priorizando aquelas com `*_id` ou colunas de PII.

### 11.3 WARN — Extension in Public (2)
Mover extensões para schema `extensions` em janela de manutenção (requer testes — algumas funções podem depender do search_path).

### 11.4 WARN — Function Search Path Mutable
Adicionar `SET search_path = public` em todas as funções SECURITY DEFINER restantes (script gerável via pg_proc).

---

## 12. CHECKLISTS OPERACIONAIS

### 12.1 Onboarding de novo cliente
1. Criar `companies` (trigger auto-cria `customers` para `raygsmonnerat@gmail.com`).
2. Vincular `user_profiles` com `company_id` + `role`.
3. Selecionar plano em `billing_plans` → `core_company_plans`.
4. Configurar módulos via `company_modules`.
5. White-label (se aplicável): `wl_company_links`.
6. Smoke test: login do owner + acesso a 1 módulo.

### 12.2 Instalação de novo módulo
1. Registrar em `modules` (catálogo).
2. Ativar para empresa em `company_modules`.
3. Adicionar rota em `core_admin_menu` via `/admin/menu-manager`.
4. RLS: cada nova tabela do módulo precisa de `GRANT` + policy tenant-scoped.

### 12.3 Deploy para produção
1. PR `dev` → `staging` (revisão).
2. Smoke E2E em staging.
3. PR `staging` → `main`.
4. Lovable publica automaticamente.
5. Verificar `runtime_uptime_health` por 30 min.
6. Tag `vX.Y.Z` no GitHub + CHANGELOG.

### 12.4 Rollback
1. GitHub → reverter PR (commit `git revert`).
2. Lovable detecta push e republica.
3. Migration de rollback se schema afetado.
4. Restaurar dump específico via suporte Lovable se necessário.

---

## 13. PRÓXIMOS PASSOS TÉCNICOS

1. Investigar e corrigir 4 views SECURITY DEFINER.
2. Triagem das ~150 policies USING(true) restantes.
3. Promover staging dedicado em Lovable.
4. Pipeline CI no GitHub: lint + typecheck + supabase linter.
5. Painel público `/status` (uptime + last incident).
6. Auto-rotação de `OUTBOX_PROCESS_SECRET` e `IMPULSIONANDO_CORE_SECRET` a cada 90 dias.

---

**FIM DO RELATÓRIO**
