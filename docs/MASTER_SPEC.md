# MASTER_SPEC — Impulsionando Core

Especificação viva do ecossistema. Escopo consolidado ao final da Onda 3.

## Princípios

1. **Core primeiro**: todo cliente é tenant do Impulsionando; nunca sistema isolado.
2. **RLS sempre**: cada tabela pública tem `GRANT` + RLS por `company_id` e/ou `auth.uid()`.
3. **Server logic** em `createServerFn`; edge functions só para webhooks públicos.
4. **Auditoria**: toda ação sensível grava evento (`core_courtesy_events`, `core_ai_brain_events`, `core_integration_logs`, etc.).
5. **Copy voltada ao cliente**: “empresa/cliente” em UI, nunca “tenant”.
6. **Sem disparo real sem credencial**: WhatsApp/e-mail/MP dependem de credenciais válidas.

## Áreas do Core

- **Shell** (`/core`) — menu por grupos, breadcrumbs, busca.
- **Cliente 360** (`/admin/clientes/$slug/*`) — 12 abas oficiais.
- **Cortesia Full** — parâmetro global + estado por cliente.
- **Cérebro IA por Cliente** — configuração + KB + eventos.
- **Hub Cobrança & MP** — visão consolidada financeira.
- **Hub Automações & N8N** — visão consolidada de automações.
- **Governança** — parâmetros, flags, menus, usuários, permissões.

## Modelos de dados (adicionados/mantidos na Onda 3)

- `companies.full_courtesy_status | *_started_at | *_ends_at | *_days | *_plan_id`
- `core_settings.full_courtesy_days_default`
- `core_courtesy_events`
- `core_ai_brains` (única por `company_id`)
- `core_ai_brain_knowledge`
- `core_ai_brain_events`

## RBAC

- Staff Impulsionando via função `is_impulsionando_staff(_user)`.
- Membros por cliente via `user_roles.company_id`.
- Cérebro IA: staff full; membros da empresa leem/editam apenas a própria.
- Cortesia: escrita restrita a staff; leitura idem.

## Integrações canônicas

Ver `docs/INTEGRATIONS.md`.

## Planos e monetização

Ver `docs/PLANS.md` e `docs/MODULES.md`.
