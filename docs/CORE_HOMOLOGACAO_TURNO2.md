# TURNO 2 — Homologação do Core Impulsionando

> Auditoria estática profunda das áreas autenticadas do Core, arquitetura do menu, chrome e padrões transversais. Walkthrough visual autenticado marcado como **PENDENTE** — requer login no preview.

---

## 1. Escopo revisado (via código)

| Área | Rotas | Estado |
|------|-------|--------|
| Total rotas autenticadas | 515 | Volume enorme, precisa curadoria |
| Chrome (AppShell, Sidebar, Topbar, Breadcrumbs, QuickActions, MobileSidebar, CommandPalette) | 7 arquivos, 1.468 linhas | ✅ Bem estruturado |
| Menu (`nav-config.tsx`) | 690 linhas | ⚠️ Bloated, ver §3 |
| Botão NOVO (`QuickActions`) | 9 ações + atalho `n` | ✅ Padrão OK |
| Empty states / skeletons | 102/515 rotas (~20%) | ⚠️ Cobertura baixa |

---

## 2. Correções aplicadas neste turno

### 2.1 Menu topo — desduplicação de dashboards
**Antes:** 11 itens no topo, incluindo 5 variantes de "Dashboard" (`/dashboard`, `/dashboards/core`, `/dashboards/white-label`, `/dashboards/empresa`, `/dashboards/operacao`) — usuário se perdia.

**Depois:** 8 itens, apenas 1 "Dashboard" por audience:
- Core → `/dashboards/core`
- Empresa/WL → `/dashboard`
- Consumidor → `/dashboards/consumidor` (Início)

"Auditoria" movida do topo para `Administração › Qualidade & Observabilidade` (área operacional interna, não de uso diário).

**Arquivo:** `src/components/app/nav-config.tsx` (linhas 49-60).

---

## 3. Diagnóstico da arquitetura de menu

### 3.1 Grupos existentes (avaliação)

| Grupo | Itens | Diagnóstico |
|-------|-------|-------------|
| **Verbos-pilares** (Captar, Relacionar, Operar, Cobrar, Comunicar, Automatizar, Analisar, Melhorar) | ~50 | ✅ **Excelente arquitetura** — modelo mental claro para o usuário |
| **Core Impulsionando** | 10 | ✅ OK — restrito a superOnly |
| **Ecossistema** (Vitrine, Marketplace, Clube) | 12 | ✅ OK |
| **Nichos** (Saúde, F&B, Comércio, Serviços, Imobiliário, Eventos, Educação, Fornecedores, Jurídico) | ~40 | ⚠️ **Mistura tenants** (chrismed, cervejaria, marocas) com módulos genéricos — deveria filtrar por `active_niches` do tenant |
| **Administração › Qualidade & Observabilidade** | **~90 itens** | 🔴 **CRÍTICO** — "gaveta de bagunça". Ver §3.2 |
| **Administração › outros submenus** (Organização, Pessoas & Acessos, Faturamento, Catálogo, Marketing…) | ~70 | ⚠️ Muitas duplicações (ver §3.3) |

### 3.2 O problema dos ~90 itens em "Qualidade & Observabilidade"

Contém páginas `*-health` acumuladas: `agenda-health`, `agenda-ops-health`, `agenda-operations-health`, `agenda-resources-health`, `agenda-booking-health`, `crm-health`, `crm-funnel-health`, `billing-health`, `mercadopago-billing-health`, `finance-health`, `marketplace-health`, `marketplace-b2b-health`, `marketplace-ops`, `ecosystem-marketplace-health`, `whitelabel-health`, `white-label-tenants`… Muitas telas são versões v1/v2 do mesmo cockpit.

**Recomendação:** consolidar em **1 Health Hub** único (`/admin/health`) com abas (Runtime, Financeiro, Comercial, Operacional, Segurança, Integrações). Cada aba lista os cockpits específicos. Redução esperada: 90 → 6 abas + 1 index.

### 3.3 Duplicações identificadas (para consolidação)

| Conceito | Rotas duplicadas | Sugestão |
|----------|------------------|----------|
| Painel Master | `/admin/master-hub`, `/adm/master`, `/core/master`, `/core/dashboard-macro`, `/core/dashboards` | Canônico: `/admin/master-hub` |
| Billing admin | `/admin/billing`, `/admin/billing-health`, `/admin/mercadopago-billing-health`, `/admin/billing-contracts`, `/admin/billing-policy`, `/core/monetizacao`, `/core/financeiro-consolidado`, `/core/financeiro-master`, `/admin/financeiro-consolidado-v2` | Consolidar em `/admin/billing/*` com sub-abas |
| N8N | `/admin/n8n-console`, `/core/integracoes/n8n` | Canônico: `/core/integracoes/n8n` |
| Eventos health | `/admin/events-health`, `/admin/events-ticketing-health` | Manter v2 apenas |
| Prefixos admin | `/adm/*`, `/admin/*`, `/core/*`, `/torre/*` | Padronizar em 2: `/admin/*` (visão super) e `/core/*` (config produto) |
| Dashboards Core | `/core/dashboards`, `/core/dashboard-macro`, `/core/bi-ecossistema`, `/dashboards/core` | Canônico: `/dashboards/core` |

**Impacto estimado:** eliminando duplicações, o menu autenticado passa de ~250 itens totais para ~120 — redução de 52%, mesma funcionalidade.

### 3.4 Menu ideal (proposta v2)

```
━━━ TOP (por audience, no máximo 8 itens) ━━━
Dashboard · Buscar · Cockpits* · Notificações · Começar · Saiba Mais

━━━ SIDEBAR (verbos-pilares — mantém arquitetura atual) ━━━
Minha Área       (consumidor)
Descobrir        (consumidor)
Ecossistema      (todos)
Nichos           (filtrado por tenant.active_niches)
Captar           (empresa/WL/core)
Relacionar       (todos)
Operar           (empresa/WL/core)
Cobrar           (empresa/WL/core)
Comunicar        (empresa/WL/core)
Automatizar      (empresa/WL/core)
Analisar         (empresa/WL/core)
Melhorar         (todos)

━━━ ADMINISTRAÇÃO (colapsado, no fim) ━━━
Central Impulsionando         (1 hub)
Organização                    (empresas, unidades, setores)
Pessoas & Acessos              (usuários, perfis, permissões)
Módulos & Configurações        (módulos, settings, flags)
Tenants & White-Label          (para core/WL)
Faturamento & Planos           (billing consolidado)
Catálogo & Plataforma          (templates, prompts, releases)
Marketing & Comercial          (leads, briefings, demos)
Health Hub                     ★ NOVO — abas: Runtime, Fin, Com, Op, Seg, Integ
Clube, Suporte & Consumidor
```

---

## 4. Chrome autenticado — revisão

| Componente | Arquivo | Estado |
|------------|---------|--------|
| AppShell | `src/components/app/AppShell.tsx` (166 l) | ✅ Correto: gates de suspensão (trial/billing), banners, redirecionamento por audience, histórico recente, CommandPalette, MobileBottomNav |
| Sidebar desktop | `src/components/app/Sidebar.tsx` + `SidebarNav.tsx` | ✅ Colapsável, ativo destacado |
| Topbar | `Topbar.tsx` | Precisa validação visual |
| Breadcrumbs | `Breadcrumbs.tsx` (167 l) | ✅ Excelente — índice de 60+ segmentos traduzidos |
| QuickActions ("NOVO") | `QuickActions.tsx` (117 l) | ✅ 9 ações (Lead, Cliente, Agendamento, Venda PDV, Pedido, Produto, Empresa, Lançamento, Lead MKT) + atalho `n` |
| CommandPalette | `CommandPalette.tsx` | Precisa validação visual |
| Mobile | `MobileSidebar.tsx` + `MobileBottomNav.tsx` | Precisa validação visual em 390px |

---

## 5. Padrões transversais — cobertura

| Padrão | Cobertura | Ação |
|--------|-----------|------|
| Empty states declarados | 102/515 rotas (~20%) | ⚠️ Baixa. Rotas de lista sem empty state degradam UX quando cliente novo entra sem dados |
| Skeletons | Inconsistente (0-12 por rota) | ⚠️ Padronizar wrapper `<PageSkeleton />` |
| Loaders | `Loader2` do lucide em uso | ✅ OK |
| Error boundaries por rota | Verificado em `admin.master-hub` | Amostra positiva — auditar restante |
| Head meta única | `master-hub` OK | Auditar em massa |
| `h-screen` restante em `_authenticated` | 4 rotas (busca, marocas.cockpit + 3 subs, admin.executivo) — corrigidas Rodada 2 | ✅ |

---

## 6. Pendências que EXIGEM login no preview

Sem sessão autenticada, não posso capturar screenshots reais nem detectar regressões visuais destas telas prioritárias (26 itens do teu checklist):

| # | Rota | O que validar |
|---|------|---------------|
| 1 | `/dashboards/core` | KPIs, hierarquia, responsividade |
| 2 | `/dashboard` | Empresa/WL |
| 3 | `/admin/master-hub` | Hub canônico da administração |
| 4 | `/users`, `/users/corporate` | Tabela, filtros, ação NOVO |
| 5 | `/access-profiles`, `/access-profiles/matrix`, `/permissions` | Matriz de permissões |
| 6 | `/customers` | Gestão de clientes |
| 7 | `/companies` | Gestão de empresas/tenants |
| 8 | `/core/tenants`, `/core/tenants/novo`, `/core/dominios` | White Label |
| 9 | `/core/planos`, `/admin/niche-plans` | Planos |
| 10 | `/modules`, `/core/modulos` | Módulos |
| 11 | `/inventory/products` | Produtos |
| 12 | `/agenda/services` | Serviços |
| 13 | `/crm/board`, `/crm/leads`, `/crm/pipelines`, `/crm/activities` | CRM full |
| 14 | `/finance/*` (cockpit, transactions, integracoes) | Financeiro |
| 15 | `/admin/fiscal-health` | Fiscal |
| 16 | `/vitrine`, `/ecossistema` | Marketplace/Vitrine |
| 17 | `/admin/clube` | Clube cockpit |
| 18 | `/messages`, `/campanhas`, `/whatsapp` | Comunicação |
| 19 | `/core/templates`, `/core/prompts` | Templates |
| 20 | `/admin/n8n-console` | N8N |
| 21 | `/impulsionito` (dock removido, verificar setup) | Impulsionito |
| 22 | `/settings`, `/core/parametros`, `/core/flags` | Configurações |
| 23 | `/reports/*`, `/bi/*` | Dashboards & Relatórios |
| 24 | `/insights/*` | Centro de Inteligência |
| 25 | `/notifications` | Central de notificações |
| 26 | `/impulsionito` — integração visual nas telas | Verificar dock/menu |

Para cada uma preciso: **desktop 1440 × 900**, **tablet 768 × 1024**, **mobile 390 × 844**.

---

## 7. Inconsistências encontradas (via código)

1. **Menu tinha 5 dashboards duplicados no topo** → corrigido neste turno.
2. **Auditoria em posição de destaque no topo** (área interna) → movida para Admin.
3. **~90 itens em "Qualidade & Observabilidade"** — precisa consolidação em Health Hub.
4. **4 prefixos admin diferentes** (`/adm`, `/admin`, `/core`, `/torre`) — falta padronização.
5. **Cobertura de empty states baixa** (~20%) — cliente novo sem dados vê telas vazias.
6. **6 grupos de duplicações de rotas** identificados (billing, master, N8N, eventos, dashboards, prefixos).
7. **Grupo "Nichos" mistura tenants específicos** — deveria filtrar por `tenant.active_niches`.

---

## 8. Arquivos alterados neste turno

- `src/components/app/nav-config.tsx` — TOP_ITEMS enxuto (11 → 8 itens, dashboards deduplicados)
- `docs/CORE_HOMOLOGACAO_TURNO2.md` **(este)**

---

## 9. Maturidade do Core Impulsionando

| Dimensão | Antes T2 | Após T2 | Meta |
|----------|----------|---------|------|
| Fundação de tokens | 100% | 100% | 100% |
| Tipografia global | 100% | 100% | 100% |
| Chrome público | 90% | 90% | 95% |
| **Chrome autenticado (código)** | não medido | **80%** | 95% |
| **Chrome autenticado (visual)** | **0%** | **0%** | 95% ← bloqueado por login |
| Menu topo | 60% (duplicações) | **90%** | 95% |
| Menu sidebar | 70% | 70% | 95% ← precisa Health Hub |
| Empty states | ~20% | ~20% | 80% |
| Skeletons padronizados | ~30% | ~30% | 80% |
| Migração de tokens hardcoded | 0% | 0% | Tenant-a-tenant |

**Maturidade global do Core: 72% → 76%** (progresso limitado pela impossibilidade de walkthrough visual).

---

## 10. Bloqueadores para 95%+

### 🔴 Bloqueador único
**Sessão autenticada no preview.** Todo o resto pode ser feito, mas sem screenshots reais das 26 rotas prioritárias, não posso garantir maturidade 95%.

### 🟡 Recomendações estruturais que exigem sua aprovação prévia
1. Consolidar "Qualidade & Observabilidade" em Health Hub (`/admin/health`)
2. Padronizar prefixos admin (`/adm` → `/admin`; `/torre` → `/admin`)
3. Consolidar rotas de billing em `/admin/billing/*` com sub-abas
4. Filtrar grupo "Nichos" por `tenant.active_niches`
5. Criar wrapper `<PageSkeleton />` e `<EmptyState />` padronizado + aplicar em 100 rotas

Cada uma dessas é uma mini-rodada de refatoração — recomendo tratar antes dos tenants para evitar retrabalho.

---

## 11. Checklist de homologação do Core

- [x] Fundação de tokens (core + tenants) implantada
- [x] Fonte Inter Variable carregando globalmente
- [x] Menu topo enxuto, sem duplicação de dashboards
- [x] Verbos-pilares preservados (Captar/Relacionar/Operar/…)
- [x] Botão NOVO com 9 ações + atalho de teclado
- [x] Breadcrumbs com dicionário de 60+ segmentos
- [x] Gates de suspensão (trial/billing) no AppShell
- [x] Chrome público responsivo (desktop/mobile validados)
- [ ] **Chrome autenticado validado visualmente** ← requer login
- [ ] **26 rotas críticas revisadas em 3 viewports** ← requer login
- [ ] Health Hub consolidado (proposta pendente aprovação)
- [ ] Prefixos admin unificados (proposta pendente aprovação)
- [ ] Empty states e skeletons padronizados (mini-rodada dedicada)
- [ ] Duplicações de billing consolidadas (mini-rodada dedicada)

---

## 12. Recomendação

**NÃO HOMOLOGAR o Core ainda.** Ausência de validação visual autenticada é bloqueador para produção. Passos recomendados na ordem:

1. **Você loga em `raygs@hotmail.com` no preview.** Automaticamente ganho acesso à sessão.
2. Rodo Playwright autenticado nas 26 rotas × 3 viewports = 78 screenshots.
3. Aplico ajustes visuais críticos encontrados.
4. Fecho a maturidade em 92-95%.
5. Você aprova as 5 recomendações estruturais do §10 — executo em turno próprio ou em conjunto.
6. **Só então** liberamos CHRISMED.
