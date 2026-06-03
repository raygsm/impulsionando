# Impulsionando Sistemas — Plano Mestre (Prompt 0)

Plataforma SaaS multiempresa, multinicho, modular, parametrizável, white label e segura. Este documento define a arquitetura antes de qualquer linha de código. Sem implementação nesta fase.

---

## 1. Arquitetura Geral

**Modelo:** SaaS multi-tenant com isolamento lógico por `company_id` (single database, shared schema, RLS forte). Tenant raiz = "Impulsionando" (super admin), tenants filhos = empresas clientes.

**Camadas:**

```text
┌─────────────────────────────────────────────────────────┐
│  Frontend — React + Tailwind (TanStack Start / Router)  │
│  - Layout white label dinâmico por company              │
│  - Menu lateral fixo + topbar + cards/tabelas           │
│  - Sem chaves sensíveis, sem regra crítica              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Server Functions (TanStack createServerFn)             │
│  - CRUD autenticado via requireSupabaseAuth             │
│  - Respeita RLS como o usuário logado                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase (Lovable Cloud)                               │
│  - Postgres + RLS em todas as tabelas                   │
│  - Auth (email/senha + Google)                          │
│  - Storage (logos, anexos, fotos de produto)            │
│  - Realtime (conversas WhatsApp, agenda)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Edge Functions (regras sensíveis)                      │
│  - Pagamentos (Mercado Pago)                            │
│  - Webhooks (pagamento, WhatsApp)                       │
│  - Envio WhatsApp Business API                          │
│  - Comissões / repasses                                 │
│  - Integrações n8n / Python / Looker                    │
└─────────────────────────────────────────────────────────┘
```

**Princípios:**
- Toda regra crítica (pagamento, comissão, webhook, envio WhatsApp) roda em Edge Function com service role.
- Frontend nunca recebe secrets nem confia em validação local.
- Toda tabela com dado de empresa tem `company_id` + política RLS via função `security definer`.
- Roles vivem em tabela separada (`user_profiles` + `profiles` + `profile_permissions`) — nunca em `auth.users` ou em coluna de perfil do usuário.
- Auditoria centralizada em `audit_logs` para qualquer ação sensível.
- White label: cores, logo, domínio e visibilidade do "by Impulsionando" controlados por `company_settings`.

---

## 2. Modelo de Dados (visão macro)

**Núcleo multi-tenant (Sprint 1):**
- `niches` — segmentos (saúde, bar, cervejaria, serviços, e-commerce).
- `companies` — empresa cliente; pertence a um `niche_id`; flag `is_master` para Impulsionando.
- `company_units` — filiais/unidades de uma empresa.
- `sectors` — setores internos (recepção, financeiro, cozinha, etc.).
- `profiles` — perfis de acesso (Super Admin, Gestor, Recepção, etc.).
- `permissions` — permissões atômicas (`crm.lead.create`, `agenda.appointment.cancel`...).
- `profile_permissions` — N:N perfil ↔ permissão.
- `user_profiles` — vínculo usuário ↔ empresa ↔ unidade ↔ perfil (um usuário pode ter múltiplos vínculos).
- `modules` — catálogo de módulos do SaaS.
- `company_modules` — quais módulos cada empresa tem ativos.
- `company_settings` — parametrização chave/valor por empresa.
- `audit_logs` — quem fez o quê, quando, em qual empresa, payload antes/depois.

**Expansões previstas (sprints seguintes, fora do MVP da fundação):**
- CRM: `crm_leads`, `crm_pipelines`, `crm_stages`, `crm_opportunities`...
- Agenda: `professionals`, `services`, `appointments`, `schedule_*`...
- Pagamentos: `payments`, `financial_transactions`, `commissions`...
- WhatsApp: `whatsapp_*`, `message_queue`...
- Automações: `automation_*`, `webhook_endpoints`...
- Afiliados/Fidelidade: `affiliates`, `loyalty_*`...
- Fornecedores B2B: `suppliers`, `supplier_products`, `b2b_orders`...
- Bares/PDV: `restaurant_tables`, `tabs`, `menu_items`...
- BI: views materializadas `company_kpis`, `niche_kpis`, `master_kpis`.

---

## 3. Tabelas da Sprint 1 (Fundação — Prompt 1)

1. `niches`
2. `companies`
3. `company_units`
4. `sectors`
5. `profiles`
6. `permissions`
7. `profile_permissions`
8. `user_profiles`
9. `modules`
10. `company_modules`
11. `company_settings`
12. `audit_logs`

Mais o enum `app_role` apenas para distinguir `super_admin` / `company_user` no nível de plataforma (a granularidade real fica em `profiles`).

---

## 4. Regras de RLS (padrão obrigatório)

**Funções `security definer` (evitam recursão):**
- `public.is_super_admin(_user uuid)` — true se usuário tem perfil Super Admin Impulsionando.
- `public.user_belongs_to_company(_user uuid, _company uuid)` — true se existe `user_profiles` ativo.
- `public.user_has_permission(_user uuid, _company uuid, _perm text)` — true se algum perfil do usuário na empresa concede a permissão.

**Padrões aplicados a toda tabela com `company_id`:**
- SELECT: `is_super_admin(auth.uid()) OR user_belongs_to_company(auth.uid(), company_id)`
- INSERT: `is_super_admin(...) OR user_has_permission(auth.uid(), company_id, '<modulo>.<recurso>.create')`
- UPDATE/DELETE: análogo com `.update` / `.delete`, sempre validando `company_id` antigo e novo.
- `audit_logs`: SELECT restrito a perfis com `audit.read`; INSERT permitido a service role (via trigger) e a `audit.write`.

**Tabelas de catálogo global** (`niches`, `modules`, `permissions`, `profiles` padrão): SELECT liberado para `authenticated`; INSERT/UPDATE/DELETE só `is_super_admin`.

**GRANTs obrigatórios** em toda tabela `public.*`:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO authenticated;
GRANT ALL ON public.<t> TO service_role;
```

---

## 5. Perfis e Permissões Iniciais

**Perfis (seed):**
- Super Admin Impulsionando, Admin Impulsionando, Suporte Impulsionando
- Gestor da Empresa, Administrador da Unidade
- Financeiro, Recepção, Operador, Profissional
- Afiliado, Fornecedor, Cliente Final, Auditor

**Permissões (atômicas, namespace por módulo):**
- `admin.*`, `companies.*`, `units.*`, `users.*`, `profiles.*`, `permissions.*`
- `settings.read`, `settings.write`
- `audit.read`, `audit.write`
- (módulos futuros adicionam seus próprios: `crm.*`, `agenda.*`, `payments.*`, `whatsapp.*`, etc.)

Seed associa cada perfil às permissões mínimas necessárias. Super Admin recebe wildcard implícito via `is_super_admin`.

---

## 6. Estrutura de Navegação

**Menu lateral fixo (visibilidade por permissão + módulo ativo):**

```text
[Logo da empresa / Impulsionando]
─────────────────────────────────
Dashboard
Empresas              (super admin)
Nichos                (super admin)
Unidades
Setores
Usuários
Perfis e Permissões
Módulos               (super admin / gestor)
Configurações
Auditoria
─────────────────────────────────
[Módulos do cliente — aparecem conforme ativados]
  CRM
  Agenda
  Financeiro
  WhatsApp
  Automações
  Afiliados
  Fornecedores
  Bar / PDV
  BI
─────────────────────────────────
[Footer] Empresa atual · trocar
```

**Topbar:** busca global, seletor de empresa/unidade ativa, notificações, avatar com logout.

---

## 7. Ordem de Implementação

| Etapa | Escopo | Resultado validável |
|---|---|---|
| Prompt 1 | Fundação SaaS multiempresa | Login, CRUD empresa/unidade/usuário/perfil/módulo, RLS, dashboard real |
| Prompt 2 | Central de configurações + permissionamento avançado | Toggles SIM/NÃO por empresa/unidade/módulo/perfil + overrides |
| Prompt 3 | CRM (leads, funis, follow-up) | Kanban funcional, conversão medida, sem WhatsApp real |
| Prompt 4 | Agenda online | Slots, status, fila, bloqueios, sem pagamento real |
| Prompt 5 | Financeiro + Pagamentos | Edge Functions preparadas, baixa manual, integração futura MP |
| Prompt 6 | WhatsApp Business + Central de Comunicação | Estrutura, templates, opt-in, Edge Functions preparadas |
| Prompt 7 | Automações + n8n + Python | Motor evento/condição/ação + webhooks |
| Prompt 8 | Afiliados + Clube de vantagens | Links, cupons, comissões, fidelidade |
| Prompt 9 | Fornecedores / Cervejarias / B2B | Catálogo, estoque, pedidos B2B |
| Prompt 10 | Bares / Restaurantes / PDV base | Mesas, comandas, eventos, reservas |
| Prompt 11 | Dashboards Master / Nicho / Cliente + BI | KPIs reais, inteligência anonimizada por nicho |

Cada etapa só avança após validação funcional + revisão de RLS, permissões, relacionamentos e logs.

---

## 8. Riscos Técnicos

- **Recursão de RLS** se políticas consultarem a própria tabela → mitigado com `security definer functions`.
- **Vazamento entre tenants** por esquecer `company_id` em algum INSERT/UPDATE → mitigado com policies de WITH CHECK + auditoria + testes.
- **Privilege escalation** se roles forem armazenadas no profile do usuário → roles ficam em `user_profiles` + `profile_permissions`.
- **Webhook spoofing** (pagamento, WhatsApp) → assinatura HMAC verificada em Edge Function antes de qualquer escrita.
- **Custo de RLS** em queries massivas (BI) → usar views materializadas + jobs agendados, não consultas ad-hoc no dashboard master.
- **Complexidade de configurações** crescer sem governança → `settings_definitions` versionado com tipo e escopo.
- **White label** quebrar SEO/branding → tokens CSS dinâmicos por empresa, fallback Impulsionando.
- **Volume de mensagens WhatsApp** estourar limite da API oficial → fila (`message_queue`) com rate-limit por número.
- **Acoplamento entre módulos** (agenda↔pagamento↔CRM↔WhatsApp) → eventos internos (`automation_triggers`) como contrato.

---

## 9. Fora do MVP da Fundação (Prompt 1)

Explicitamente **não** entram na fundação:
- CRM, funis, kanban
- Agenda, profissionais, serviços
- Pagamentos reais, Mercado Pago, baixa automática
- WhatsApp real (apenas estrutura nos prompts seguintes)
- Automações, n8n, Python
- Afiliados, clube de vantagens, fidelidade
- Fornecedores, estoque, B2B
- PDV, comandas, eventos de bar
- BI consolidado e dashboards de nicho
- Faturamento fiscal / NF-e
- App mobile nativo
- Marketplace público
- Integração Looker Studio
- Domínio customizado por cliente (white label avançado) — fica como flag, não como provisionamento automático

---

## 10. Próximo passo

Aprovando este plano, ativo o Lovable Cloud e sigo para o **Prompt 1 — Fundação SaaS Multiempresa**: tabelas, RLS, seeds de perfis/módulos/permissões, telas de login, dashboard master e CRUDs das 12 entidades-base, com validação ao final.
