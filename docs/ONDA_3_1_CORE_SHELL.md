# Onda 3.1 — Consolidação do Shell Core (frontend-only)

> Marco: 09/07/2026. Reorganização do menu do Core Impulsionando (`/core/*`) para reduzir fragmentação, incorporar rotas órfãs e preparar as próximas fases (Cliente 360, Cortesia Full 30d, Cérebro IA, Cobrança/MPago, Automações/N8N, Observabilidade, Marketplace).

## Escopo desta fase

Somente `src/routes/_authenticated/core.tsx` (shell do Core Manager). Nenhuma
alteração em backend, schema, RLS, RPCs, edge functions, integrações reais
ou copies fora do shell. Todas as rotas técnicas internas permanecem
preservadas — o que muda é a **navegação visível**.

## Grupos consolidados (10 grupos)

| # | Grupo | Foco |
|---|-------|------|
| 1 | Visão Geral | Dashboard Master, Dashboard Macro, BI, Saúde, Dashboards salvos |
| 2 | Clientes conectados ao Core | 360, implantações (IA/Fábrica), CSV, testes, domínios, publicação DEV→PROD, releases, consumidores premium |
| 3 | Comercial & CRM | Hub comercial, Kanban, leads /marketing, CMS, feira, briefings, demos, insights, finalização, eventos |
| 4 | Produtos & Planos | Planos, módulos, instalar módulo, templates, nichos, Estúdio Visual, monetização |
| 5 | Cérebro IA | Prompts, réguas & métricas IA, IA de implantação |
| 6 | Automação & N8N | Hub, fluxos, templates, modelos (nicho/plano/cliente), canais, webhooks, aprovações, monitoramento, erros, histórico, logs, fallback humano, demonstrações, produção, integração N8N |
| 7 | Marketplace | Hub, fornecedores, compradores, pedidos, financeiro B2B |
| 8 | Cobrança & Mercado Pago | ERP financeiro, Financeiro Master, Consolidado, contratos, repasses, Billing/contratos, régua, Mercado Pago |
| 9 | Observabilidade & Suporte | Observabilidade, diagnóstico geral, diagnóstico de integrações, suporte, auditoria |
| 10 | Governança | Administração Master, parâmetros globais, configurações do Core, feature flags, menus dinâmicos, usuários, permissões, configurações gerais, integrações |

## Copy: "tenant/tenants" → cliente

Rótulos visíveis ajustados dentro do shell:

- "Domínios dos Tenants" → **"Domínios dos Clientes"**
- "Tenants" (grupo Core Impulsionando legado) → agora consumido pelo grupo **"Clientes conectados ao Core"**
- "Modelos por Tenant" (automação) → **"Modelos por Cliente"**

> Nota: rotas técnicas com `tenant` no path (ex.: `/core/tenants/…`,
> `/core/automacao/modelos-tenant`, `/core/publicacao/$tenantId`)
> permanecem inalteradas — troca apenas de copy. Renomear paths fica para
> Fase 3.2 (Cliente 360 + redirects).

## Rotas órfãs incorporadas ao menu

Antes só acessíveis por URL direta:

- `/core/dashboard-macro`, `/core/bi-ecossistema`, `/core/dashboards`
- `/core/publicacao`, `/core/releases`, `/core/consumidor-premium`
- `/core/briefings`, `/core/demos`, `/core/demo-insights`, `/core/feira-leads`, `/core/eventos`
- `/core/nichos`, `/core/estudio-visual`, `/core/monetizacao`
- `/core/metricas-reguas`
- Toda a árvore `/core/automacao/*` (15 rotas)
- `/core/integracoes/n8n`, `/core/integracoes/mercadopago`, `/core/integracoes/diagnostico`
- `/core/contratos`, `/core/repasses`, `/admin/billing-contracts`, `/admin/billing-policy`
- `/core/observabilidade`, `/core/diagnostico-geral`, `/core/suporte`
- `/core/administracao`, `/core/configuracoes`, `/core/flags`, `/core/menus`

## Melhorias de UX

- Barra horizontal de grupos com `scroll-contrast` (scrollbar visível contra o fundo).
- Sheet mobile com `scroll-contrast` na lista de grupos (mais navegável em telas longas).
- Nomes explícitos ("Dashboard Master", "IA de Implantação") reduzem ambiguidade.
- Ordem dos grupos segue a jornada do time Core: **entender → operar clientes → vender → produtizar → automatizar → cobrar → observar → governar**.
- Busca (`Buscar seção…`) continua funcionando; agora cobre 10× mais itens.

## Riscos

- Nenhuma rota removida — se algum bookmark deixar de aparecer no menu, ele ainda funciona por URL.
- Alguns itens repetem intencionalmente (ex.: `/core/nova-implantacao` aparece em "Clientes conectados" e "Cérebro IA") por servirem a jornadas diferentes.
- Copy "tenant" em paths técnicos permanece — troca completa exige Fase 3.2.

## Pendências para Fase 3.2 (Cliente 360)

- Unificar `/core/cliente/$id/*` com `/admin/clientes/$slug/*` em uma única jornada.
- Adicionar tab de "Cortesia Full 30 dias" no perfil do cliente (mock até destravar backend).
- Redirects 301 dos paths com `tenant` para paths com `cliente`.
- Cockpit do cliente com widgets: assinatura, módulos ativos, automações, cobrança MPago, cérebro IA, observabilidade.

## Destravamento backend necessário (Fases 3.3 e 3.4)

- **3.3 Cortesia Full 30 dias**: campo em `billing_plans` ou tabela `core_settings.trial_full_days` (default 30, override por plano/cliente); `trial_kind = 'full_courtesy'` em `trial_states`; RPC de conversão automática.
- **3.4 Cérebro IA por Cliente**: schema `client_ai_brain` (contexto, ferramentas, agentes, custos, permissões), RLS por `company_id`, endpoint que consolida prompts + réguas + histórico.
- Integrações reais Mercado Pago (webhook + reconciliação) e N8N (execução, retry, logs) permanecem congeladas até liberação explícita.

## Arquivos alterados

- `src/routes/_authenticated/core.tsx` — GROUPS reescrito, scroll-contrast nas duas áreas de navegação, imports de ícones atualizados.
- `docs/ONDA_3_1_CORE_SHELL.md` — este documento (Cérebro do Projeto).
