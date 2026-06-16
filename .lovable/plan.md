## Princípio
**Não recriar nada.** O projeto já tem ~120 tabelas, RLS, perfis (Super Admin / Staff Impulsionando / PJ / Operador / PF), módulos (CRM, Agenda, EHR, Finance, Sales, Inventory, Afiliados, Marketing, Trial, Billing, Agentes IA), webhooks InfinitePay, fila de mensagens multicanal e dashboards. O trabalho é **mapear → conectar → consolidar → expor no CORE**, não reconstruir.

## Fase 0 — Auditoria (entrega antes de qualquer código)

Gerar um documento `docs/CORE-AUDIT.md` listando, por área:
- Tabelas existentes vs. tabelas pedidas no prompt → mapa de equivalência (ex: `companies` = `empresas`, `user_profiles` = `usuarios`, `billing_plans` = `planos`, `company_modules` = `empresa_modulos`, `trial_subscriptions` já cobre demo/trial, `infinitepay_payments` + `billing_invoices` cobrem cobrança).
- Rotas/telas existentes em `src/routes/_authenticated/admin.*` (billing-contracts, trials, agentes, etc.) e o que falta.
- Gaps reais (não duplicações): hub CORE unificado, CRUD visual de nichos/módulos/planos, gerador de demo por nicho, dashboard consolidado por nicho.

Sem essa fase, qualquer migration nova arrisca colidir com schema existente.

## Fase 1 — Hub CORE (somente UI, zero schema novo)

Rota única `/_authenticated/core` (Super Admin apenas) com navegação para telas que **já existem**:
- Empresas (`companies`) — criar/editar/suspender
- Nichos (`niches`)
- Módulos (`modules` + `company_modules`)
- Planos (`billing_plans`)
- Contratos & Faturas (`billing_contracts`, `billing_invoices`) — já existe em `/admin/billing-contracts`
- Trials/Demos (`trial_subscriptions`) — já existe em `/admin/trials`
- Templates de e-mail (`message_templates`)
- Logs & auditoria (`audit_logs`)
- Agentes IA (`/adm/agentes`) — já existe

Entrega: 1 página índice + sidebar. Nenhuma tabela criada.

## Fase 2 — Gaps de CRUD no CORE

Construir só o que **não tem tela ainda**, sempre lendo tabelas existentes:
1. CRUD de **nichos** com associação de módulos padrão.
2. CRUD de **módulos** (slug, nome, descrição, ícone, categoria).
3. CRUD de **planos** com seleção visual de módulos incluídos + setup + recorrência + vencimento default dia 5.
4. Wizard "Criar cliente" — 1 fluxo que: cria `company` → vincula `niche` → ativa `company_modules` do plano → cria `billing_contract` → envia welcome via `enqueue_message`. Tudo via `createServerFn` com `requireSupabaseAuth` + `is_super_admin`.

## Fase 3 — Dashboard CORE consolidado

View SQL `core_dashboard_stats` (somente leitura) agregando:
- `companies` ativos/suspensos por nicho
- `billing_invoices` MRR/inadimplência
- `company_modules` adesão por módulo
- `trial_subscriptions` conversão

Tela `/core/dashboard` consumindo a view via server function. Sem schema novo além da view.

## Fase 4 — Régua de cobrança (validar, não recriar)

A função `billing_run_cycle()` **já implementa** D-7, D-1, D0, suspensão automática e `enqueue_message`. Ações:
- Confirmar cron pg_cron rodando diariamente.
- Revisar `message_templates` para `billing_*` com identidade Impulsionando.
- Tela CORE para editar templates inline.

## Fase 5 — Demo por nicho

Função `core_provision_demo(_niche, _plan)` que:
- Cria company `is_demo=true` (adicionar coluna se não existir)
- Aplica módulos do plano
- Seeda dados fictícios por nicho (clínica, bar, imobiliária, veículos)
- Retorna URL de acesso

Reaproveita `trial_subscriptions` para expiração.

## Fase 6 — Dashboards por nicho

Templates de dashboard por `niche.slug` em `src/components/dashboards/by-niche/*`. Renderizados condicionalmente no dashboard PJ existente, lendo dados que **já são gravados** pelos módulos atuais.

## Detalhes técnicos

- **Stack**: TanStack Start + Supabase (Lovable Cloud). Não usar Edge Functions para lógica interna — `createServerFn` em `src/lib/core.functions.ts`.
- **Permissão**: toda rota CORE sob `_authenticated/core/` com `beforeLoad` checando `is_super_admin`.
- **RLS**: usar `is_super_admin(auth.uid())` já existente. Não criar novas policies amplas.
- **Migrations**: apenas (a) view de dashboard, (b) flag `is_demo` em `companies` se faltar, (c) seeds de nichos/módulos se faltarem. Nenhum CREATE TABLE redundante.
- **Webhook InfinitePay**: já existe — não tocar.
- **Salário mínimo configurável**: linha em `setting_definitions` (tabela já existe).

## Próximo passo concreto

Aprovando o plano, eu começo pela **Fase 0 (auditoria)** e entrego o documento + a tela índice do CORE (Fase 1) na próxima rodada — sem migrations, sem risco de regressão. Depois validamos juntos antes de avançar para Fase 2.

## O que NÃO será feito agora

- Reescrever autenticação, dashboards CHRISMED, módulo financeiro, InfinitePay, webhooks, fila de mensagens, RLS existente.
- Migrar Mercado Pago (não está no schema atual — InfinitePay é o gateway ativo). Se Mercado Pago é requisito, tratamos em fase própria.
- Construir tudo das seções 6–14 do prompt num único passo. Cada módulo "novo" pedido (vaquinha, sorteios, fidelidade, marketplace) vira fase própria depois do CORE estar sólido.
