# P5 — Consolidação Visual Global do Core Administrativo

## Escopo executado

Passe focado de padronização visual e de copy sobre as telas administrativas
de maior tráfego, mantendo integralmente arquitetura, backend, Supabase,
RLS, migrations, server functions, integrações e contratos de dados.
Nenhuma rota removida.

Esta fase é um **primeiro passe de consolidação**. A área administrativa
tem mais de 100 rotas — o critério foi atacar os pontos com maior impacto
de UX e as violações objetivas (copy "tenant", "Em breve", formatadores
duplicados, cores hardcoded, KPIs sem hierarquia). O restante segue no
plano de continuidade abaixo.

## Telas auditadas e refinadas nesta fase

| Rota | Ação principal |
|------|----------------|
| `/adm/master` | Padrão de referência (já consolidado em P4). |
| `/admin/command-center` | Migração completa para primitivos + copy. |
| `/admin/tenant-360` | Migração completa + copy "Tenant" → "Cliente". |
| `/admin/executivo` | Formatadores centralizados + copy + cores semânticas. |
| `/admin/niche-plans` | Removida a única badge "Em breve" do admin. |

## Componentes migrados para os primitivos compartilhados

Adotados em todas as telas desta fase:

- `CoreSection` — cabeçalho + descrição + actions padronizados.
- `LoadingState` — substitui `Skeleton` genérico + "Sem dados.".
- `EmptyState` — substitui `<Card>Sem dados</Card>` e mensagens ad-hoc,
  respeitando a regra de plataforma madura (nada de "em breve").
- `ErrorState` — substitui `<Card border-destructive>` manuais, com
  `role="alert"` e `<details>` para detalhes técnicos.
- `formatBRL`, `formatInt`, `formatPct`, `formatDateTime` — substituem
  `Intl.NumberFormat` e `toLocaleString` locais.

## Duplicações eliminadas

- 4 formatadores locais `fmtBRL` / `fmtNum` / `fmtDate` reduzidos a
  chamadas de `src/lib/format.ts` (mantida a assinatura interna onde
  a conversão de centavos é necessária, apenas delegando o formato).
- Cards de erro manuais (`border-destructive/40 bg-destructive/5` +
  ícone + texto) unificados no `ErrorState`.
- Mensagens de vazio unificadas no `EmptyState`.
- Skeleton genérico substituído por `LoadingState` (a11y-friendly).

## Melhorias de copy

- "Tenant" / "tenants" na UI visível → "Cliente" / "clientes" nas telas
  desta fase (título, seletor, KPIs, atalhos, breadcrumbs implícitos).
- Título `/admin/tenant-360` → "Cliente 360°" (rota preservada,
  apenas o metadado e H1 mudaram).
- Título `/admin/command-center` mantido, atalho "Tenant 360°" →
  "Cliente 360°" no card de shortcuts.
- Título `/admin/executivo`: "Cockpit de Tenants" → "Cockpit de Clientes",
  "Tenants ativos" → "Clientes ativos", "Top tenants" → "Top clientes".
- Badge "Em breve" em `/admin/niche-plans` → "Não configurado" com
  `title` explicativo. Zera a incidência de "Em breve" no admin
  (varredura `rg -n 'Em breve|em breve'` em `src/routes/_authenticated/`
  agora só devolve strings contextuais legítimas em rotas de consumidor).

## Melhorias mobile

- Cabeçalhos com botões: mantida a wrap semântica; nenhum novo
  header quebrado.
- Grids `grid-cols-2 md:grid-cols-4` preservam legibilidade em tablet.
- Listas em `divide-y` / `border-b` com `truncate` + `min-w-0` para
  evitar overflow em telas estreitas (Tenant 360°).
- Insights de IA: `flex-wrap` + `gap-2` no header do card evita
  botão empurrando o título para fora em mobile.

## Melhorias de acessibilidade

- Ícones decorativos marcados com `aria-hidden="true"` em todas as
  telas desta fase.
- `LoadingState` (`role="status" aria-live="polite"`) e `ErrorState`
  (`role="alert" aria-live="assertive"`) padronizam o anúncio de estado.
- `Select` do Cliente 360° recebeu `<label>` associado por `htmlFor`
  + `aria-label` no `SelectTrigger`.
- Botões de ação recebem `aria-label` dinâmico (ex.: "Analisar cliente"
  / "Reanalisar cliente").
- Links dentro de listas recebem `focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-ring`.
- Números em KPIs receberam `tabular-nums` — alinhamento estável.

## Melhorias visuais

- Removidos accents multicoloridos "arco-íris" (`text-emerald-600`,
  `text-blue-600`, `text-violet-600`, `text-pink-600`, `text-indigo-600`,
  `text-orange-600`, `text-cyan-600`) do Dashboard Executivo. Passam a
  `text-primary` (design system) exceto sinalização de alerta
  (`text-amber-600 dark:text-amber-400` para churn/faturas vencidas
  quando `alert=true`).
- Semântica de estado nunca depende só de cor: continua acompanhada de
  ícone, texto ou badge.

## Estados padronizados

| Estado | Antes | Depois |
|--------|-------|--------|
| Carregando | `Skeleton` genérico ou nada | `LoadingState` acessível |
| Vazio | `<Card>Sem dados.</Card>` | `EmptyState` com descrição orientativa |
| Erro | Card vermelho manual | `ErrorState` com retry opcional + detalhes técnicos |
| Falha parcial | Bloqueio total da página | Bloco individual em `ErrorState`, restante segue |

## Pendências para Codex

Nenhuma. Todas as alterações são exclusivamente de UI e copy.

## Plano de continuidade (P5+)

Telas que continuam funcionais mas ainda usam Skeleton local, formatadores
ad-hoc ou copy "tenant" — candidatas naturais para as próximas ondas de
consolidação (sem urgência, ordenadas por tráfego):

- `admin.action-center.tsx` — parcialmente OK; falta `CoreSection`, `formatBRL`
  para o preview de fatura, e ajuste de aria em icon-buttons.
- `admin.executive-briefing.tsx` — briefing IA, revisar layout narrativo.
- `admin.churn-radar.tsx` / `admin.churn-risk.tsx` / `admin.expansion-radar.tsx`
  / `admin.attribution.tsx` / `admin.peer-benchmark.tsx` / `admin.cohort-retention.tsx`
  — grupo de radares/benchmarks; podem compartilhar um shell comum
  (`RadarShell`) em uma futura P6.
- `admin.health.tsx` + `admin.*-health.tsx` (12 rotas) — família Health
  Score; consolidar num shell paramétrico é o candidato mais óbvio
  para redução de duplicação real.
- `admin.master-hub.tsx` — hub por vertente; migrar para `CoreSection`.
- `admin.clientes.$slug.*` (tabs) — Cliente 360 do tenant específico
  (já consolidado em P2). Aguardando pass fino de tabelas e formulários.
- Rotas `core.*` (>80 rotas): não tocadas nesta fase por escala.
  Recomendação: onda dedicada P7 focada apenas em `core.*` com um
  script de codemod para as três substituições mais frequentes
  (`toLocaleString("pt-BR"…)` → `formatBRL/Int`, `<Skeleton>` +
  bloco "Sem dados" → primitivos).

O script `scripts/audit-a11y.mjs` continua a ser a fonte de verdade
para priorizar próximas ondas — 30 icon-buttons sem `aria-label` e
103 `min-h-screen`/`h-screen` restantes, avaliados caso a caso.

## Nota de maturidade do Core Administrativo

**8,3 / 10.**

Antes de P5: Dashboard executivo com 7 accents multicoloridos, copy
"tenant" espalhada, formatadores duplicados em cada rota, cards de erro
manuais, "Em breve" no admin.

Depois de P5: telas de referência (cockpit, command center, cliente
360°, executivo) 100% sobre primitivos, copy "cliente" consistente, zero
"Em breve" no admin, formatadores centralizados, cores semânticas do
design system, KPIs com tipografia tabular.

Deltas para 10: (1) consolidar a família Health Score num shell único,
(2) codemod amplo em `core.*` para adotar `format.ts` e primitivos,
(3) segundo passe fino nas tabelas administrativas para versão card
consistente no mobile.
