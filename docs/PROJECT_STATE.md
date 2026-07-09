# PROJECT_STATE — Impulsionando Core

Estado consolidado ao final da **Onda 3**.

## Camada-mãe

Todos os projetos e clientes vivem sob o **Core Impulsionando**:
autenticação (`_authenticated`), RBAC (`user_roles` + `has_role`),
multi-tenant (`companies` + RLS por `company_id`/`auth.uid()`), billing
(`CheckoutShell`/`BillingGate`/`PlanGate`), branding
(`TenantBrandingProvider`), lógica server em `createServerFn`.

Clientes conhecidos como tenants/marcas: **CHRISMED, Garrido, Marocas,
Molartesanal, RIOMED, WMP**, além dos ambientes DQA/preview.

## Ondas concluídas

- **Onda 1** — Estruturas iniciais do Core e primeiros clientes.
- **Onda 2** — Seis clientes robustos (RIOMED, CHRISMED, Garrido,
  Marocas, Molartesanal, WMP).
- **Onda 2.9** — Design System + primitivos compartilhados em
  `src/components/impulsionando/`.
- **Onda 3** — Cliente 360, Cortesia Full 30 dias, Cérebro IA por
  Cliente, Hub Cobrança & MP, Hub Automações & N8N, documentação final.

## Estado atual (pós-Onda 3)

### Core Manager (`/core`)
Menu consolidado por grupos: Visão Geral, Clientes, Comercial & CRM,
Produtos & Planos, Cérebro IA, Automação & N8N (com **Hub**), Marketplace,
Cobrança & Mercado Pago (com **Hub**), Observabilidade & Suporte,
Governança.

### Cliente 360 (`/admin/clientes/$slug/*`)
12 abas oficiais: Painel · Dados · Plano e cortesia · Módulos · Cérebro
IA · Automações · Financeiro · Mercado Pago · Domínios · Publicação ·
Logs · Configurações.

### Recursos com backend real
- **Cortesia Full 30 dias** com auditoria (`core_courtesy_events`).
- **Cérebro IA por Cliente** — `core_ai_brains`,
  `core_ai_brain_knowledge`, `core_ai_brain_events` com RLS por
  `company_id`.
- Ambos governados por `is_impulsionando_staff` para escrita sensível.

### Hubs somente-leitura
- `/core/hub-cobranca` — MRR, contratos ativos, cortesias, saúde MP.
- `/core/hub-automacoes` — N8N 30d, credenciais pendentes, canais,
  runtime.

## Contas globais

- `raygs@hotmail.com` — **admin master** (acesso total, sem gates).
- `raygsmonnerat@gmail.com` — **cliente-teste padrão** (auto-seed via
  trigger em toda empresa real).

## Regras de UI e copy

- Copy visível usa “cliente” / “empresa”. Nunca “tenant”.
- Marketplace B2B usa “Taxa de Intermediação Digital”, nunca
  “comissão”.
- Consumidor Final segue default-deny no menu (itens sem `audiences`
  ficam ocultos).

## Próximas ondas

Planejamento em `docs/PLANS.md`. Prioridade Onda 4 sugerida: dispatcher
do Cérebro IA, analytics unificado, cortesia → cobrança em lote,
alertas proativos, governança de credenciais.
