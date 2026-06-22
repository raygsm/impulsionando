# Core Admin Menu v2 — Administração Master parametrizável

> Implementado em 22/06/2026. Substitui o menu admin inflado (123 rotas em 7+ grupos sobrepostos) por uma navegação master única, agrupada em **2 vertentes × 13 grupos** dirigida por tabela.

## Arquitetura

- **Tabela:** `public.core_admin_menu` (vertente, grupo, item, rota, ícone, ordem, enabled).
- **RLS:** leitura/escrita restritas a `is_impulsionando_staff(auth.uid())`.
- **Server fns:** `listAdminMenu` (lê árvore filtrada) e `toggleAdminMenuItem` (liga/desliga item com audit).
- **Página-hub:** `/admin/master-hub` — única rota canônica que renderiza a matriz visual completa.
- **Entrada no menu:** "★ Administração Master" dentro de `Administração → Central Impulsionando`.

## Vertentes e grupos

### 1. GESTÃO IMPULSIONANDO (7 grupos)
1. **Visão Master** — Overview executivo, Cohort & Retention, Unit Economics, Health Score
2. **Plataforma & Infra** — Observabilidade, Uptime, Domínios, Diagnóstico
3. **Integrações & Credenciais** — Cofre, MP, n8n, Webhooks
4. **Segurança & Governança** — Audit Trail, LGPD, Security & Compliance, SLA
5. **ERP Impulsionando** — ERP Financeiro, Billing, Contratos, PIX, Repasses, Treasury
6. **Catálogo & Produto** — Módulos, Planos, Templates, Flags, Releases
7. **Comercial & Crescimento** — Leads, Funil 360°, Marketplace Master, Demos, Briefings

### 2. GESTÃO DE CLIENTES (6 grupos)
1. **Diretório de Tenants** — Lista, Cockpit, White-Label
2. **Ciclo de Vida** — Novo, Importar, Implantações, Trials
3. **Operação por Tenant** — Módulos, Usuários, Permissões, Automações
4. **Financeiro do Cliente** — Consolidado, Comissões, Churn, Expansion
5. **Conteúdo & Personalização** — Menus, Páginas, Parâmetros, Réguas
6. **Inteligência de Público** — Conversion Funnel, Feira, Pricing, Data Quality

## Política de credenciais (obrigatória)

Toda tela de integração DEVE seguir:
- ✅ Status (configurado / não configurado / com erro)
- ✅ Link externo seguro
- ✅ Última verificação + botão "Testar agora"
- ✅ Botão "Configurar Secret" via `add_secret`
- ❌ NUNCA exibir valor de token, service_role, password, JWT
- ❌ NUNCA gravar secret em frontend ou `core_settings`
- ❌ NUNCA logar valor em `audit_logs`

## Como adicionar/remover itens (sem código)

Insert/update direto em `core_admin_menu` via SQL ou via futura UI super-only. Nenhum redeploy necessário. Itens com `enabled = false` somem do hub sem perder histórico.

## Próximas iterações (não-bloqueantes)

- UI super-only para CRUD da tabela com drag-and-drop de ordem.
- Redirects 301-equivalentes das URLs legadas para as canônicas.
- Hubs internos (`/admin/master`, `/admin/erp`, `/admin/integrations`, etc.) com abas próprias.
- Migração de `nav-config.tsx` estático → dinâmico consumindo `listAdminMenu`.
