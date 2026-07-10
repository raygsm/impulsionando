# P4 — Consolidação Premium do Dashboard Admin (`/adm/master`)

## Escopo executado

Refino visual e de hierarquia do cockpit executivo `/adm/master`, sem alterar
backend, RLS, migrations, server functions, autenticação, permissões ou
contratos de dados. Nenhuma rota foi removida.

## Rotas auditadas

- `/_authenticated/adm/master` — cockpit executivo (esta fase).
- `/_authenticated/adm` — layout mínimo com `<Outlet />` (mantido).
- `/_authenticated/adm/agentes` — mantido, linkado no bloco Automação e IA.
- `/_authenticated/admin/master-hub` — hub parametrizável por tabela
  `core_admin_menu` (mantido; papel distinto: navegação por área/vertente).
- `/_authenticated/admin/action-center` — fonte da fila priorizada
  (reutilizada via `getActionCenter` no novo bloco "Atenção imediata").
- `/_authenticated/admin/command-center`, `/admin/executive-briefing`,
  `/admin/tenant-360`, `/admin/funil-360`, `/admin/health`,
  `/admin/cobrancas`, `/admin/billing*`, `/admin/expansion-radar`,
  `/admin/churn-risk`, `/admin/cohort-retention`, `/admin/peer-benchmark`,
  `/admin/attribution`, `/admin/uptime`, `/admin/niche-matrix`,
  `/admin/audit-trail`, `/admin/ai-automation-health`,
  `/admin/revenue-forecast` — permanecem como views especializadas,
  agora agrupadas em "Ações rápidas" por domínio.
- `/_authenticated/core*` (>80 rotas) — permanecem como cockpit
  operacional do Core; entrada oficial via `/core` (Cockpit Core) no
  bloco Automação e IA e via `/core/dominios`, `/core/publicacao`,
  `/core/releases`, `/core/marketing-leads`, `/core/clientes` nas seções
  correspondentes.
- `/_authenticated/dashboards.core` — mantido, não linkado no novo
  layout (candidato a redirect futuro; ver "Recomendações P5").

## Dashboards paralelos mapeados

| Rota | Papel definido nesta fase | Ação sugerida (P5+) |
|------|---------------------------|---------------------|
| `/adm/master` | **Cockpit executivo canônico** — KPIs, atenção, aquisição, comunicação, análises, ações rápidas. | Manter como entrada única. |
| `/admin/master-hub` | Navegação parametrizável (menu × vertente). | Manter como *directory*, não competir com `/adm/master`. |
| `/admin/command-center` | Visão tática operacional profunda. | Continuar como view especializada. |
| `/admin/executive-briefing` | Briefing narrativo gerado por IA. | View especializada. |
| `/admin/action-center` | Fila priorizada completa. | Fonte oficial — cockpit consome 8 primeiras via `getActionCenter`. |
| `/core/master` | Console legado do Core. | Avaliar redirect → `/adm/master` em P5. |
| `/core` (index) | Cockpit operacional cross-nicho. | Manter; complementar ao executivo. |
| `/dashboards/core` | Dashboard pré-refactor. | Candidato a redirect → `/adm/master` em P5. |

Não removido nesta fase para preservar links externos, favoritos internos
e migrations em andamento.

## Arquivos alterados

- `src/routes/_authenticated/adm.master.tsx` — reescrita completa da UI
  preservando 100% das queries originais. Adicionada integração com
  `getActionCenter` (server function existente, sem novas fontes).
- `docs/CORE_HOMOLOGACAO_P4.md` — este relatório.

## KPIs consolidados

**Resumo executivo** (primeira dobra):
Clientes ativos · Planos configurados · Módulos publicados · Nichos ativos.

**Atenção imediata**:
Fila `getActionCenter` — tickets urgentes, faturas vencidas, suspensões e
leads sem follow-up, ordenadas por prioridade real (0–100) já calculada
no backend. Chips semânticos (Crítico ≥80 / Atenção ≥60 / Informativo),
com badge de categoria e link direto ao contexto. Truncada em 8 itens
com link "Ver todas as N pendências".

**Aquisição · últimos 7 dias**:
Visitas demo · Demos liberadas · Novos leads · Orçamentos — com contexto
histórico (`X no histórico`) apenas quando o dado real está disponível.

**Comunicação**:
E-mails entregues · Falhas de envio (com tom `danger` só quando > 0).

**Análises**:
Top 5 nichos e origens com barra proporcional e `formatInt`.

Removidos os cards mock antigos ("WhatsApp pendente —", "Integrações —")
que exibiam apenas travessão e violavam a regra de produto (nada de
"aguardando integração" sem dado real).

## Duplicações eliminadas

- Skeleton loader ad-hoc → substituído pelo estado interno do `KpiCard`
  (placeholder tabular) e por `LoadingState` nas listas.
- Card de erro manual (`border-destructive/40 bg-destructive/5` + ícone)
  → substituído por `ErrorState` (a11y `role="alert" aria-live="assertive"`
  e `<details>` com detalhes técnicos).
- Grid único de 25 atalhos sem hierarquia → 6 `QuickGroup` por domínio
  (Financeiro, Clientes, Crescimento, Automação/IA, Publicação,
  Governança). Redução de ruído visual e escaneabilidade instantânea.
- Formatadores locais de números → `formatInt` de `src/lib/format.ts`.
- Sub-título/label ad-hoc → `CoreSection` (título + descrição + actions).

## Componentes migrados para primitivos compartilhados

- `CoreSection` — todas as 6 seções principais.
- `LoadingState` — carregamento da fila de atenção e listas de nichos/origens.
- `EmptyState` — fila de atenção sem pendências.
- `ErrorState` — erro global de métricas e erro específico da fila
  (falha parcial não derruba os demais blocos).
- `formatInt` — todos os KPIs numéricos e barras.

## Icon-buttons corrigidos

- Botão "Atualizar" — adicionado `aria-label="Atualizar métricas"` e
  ícone com `aria-hidden`.
- Todos os ícones decorativos das seções, KPIs, chips e links marcados
  com `aria-hidden="true"`.
- Badge de status do cabeçalho recebeu `aria-live="polite"`.

## Melhorias mobile

- `max-w-7xl` com paddings responsivos `px-4 sm:px-6 lg:px-8` mantidos.
- Grids `sm:grid-cols-2 lg:grid-cols-4` preservam legibilidade em
  tablet e evitam KPIs comprimidos.
- Fila de atenção usa `divide-y` em vez de tabela, com chip de
  categoria escondido em telas pequenas (`hidden sm:inline-flex`)
  e título/subtítulo com `truncate`.
- QuickGroups em `md:grid-cols-2 lg:grid-cols-3` — nunca cortam no
  mobile e não geram scroll horizontal.
- Nenhum uso novo de `min-h-screen` / `h-screen` (o cockpit vive
  dentro do shell `_authenticated` já corrigido em P1).

## Melhorias de acessibilidade

- Hierarquia de títulos: `h1` (cockpit) → `h2` via `CoreSection` (seções)
  → `h3` (cards internos e grupos de atalhos). Sem saltos.
- `focus-visible:ring-2 focus-visible:ring-ring` em todos os links
  clicáveis (KPIs, fila de atenção, QuickGroups).
- Status do cabeçalho com `aria-live="polite"`; fila com `role="alert"`
  no `ErrorState`.
- Semântica de estado nunca depende só de cor: chips combinam ícone
  (`ShieldAlert`), texto ("Crítico / Atenção / Informativo") e valor
  numérico da prioridade.
- `formatInt` garante números com separador pt-BR.

## Copy

Substituídas as expressões técnicas por linguagem executiva:

- "tenant" → "cliente" / "conta conectada ao Core".
- "Configure integração", "Ver /core" e "—" (placeholders) → cards
  removidos ou substituídos por hints reais.
- "Sem dados ainda" → "Sem dados suficientes para o período".
- "Nada urgente. 🎉" → "Nenhuma ação pendente no momento" + orientação
  de plataforma madura, sem "em breve" / "próxima versão".

## Estados padronizados

| Estado | Tratamento |
|--------|------------|
| Carregando (métricas) | Placeholder tabular dentro do próprio `KpiCard`. |
| Carregando (fila) | `LoadingState` compacto. |
| Vazio (fila) | `EmptyState` compacto com copy de plataforma madura. |
| Erro global métricas | `ErrorState` no topo, não bloqueia demais blocos. |
| Erro fila (sem staff) | `ErrorState` compacto apenas no bloco; restante segue. |
| Zero absoluto de nichos/origens | Mensagem inline "Sem dados suficientes…". |

Falha parcial: se `getActionCenter` falhar (usuário sem `is_impulsionando_staff`),
o cockpit continua exibindo métricas, aquisição, comunicação, análises e
ações rápidas. Nenhum bloco derruba outro.

## Performance

- Continua com `refetchInterval: 60_000` em ambas as queries (métricas
  e fila) — mesmo comportamento pré-refactor.
- `retry: false` na fila para evitar loop quando o usuário não é staff.
- Nenhuma consulta adicional criada; apenas reuso de `getActionCenter`.
- Sem gráficos pesados: barras CSS puras.

## Riscos

- **Nome da rota `/core/marketing-leads`**: linkado no KPI "Novos leads".
  Rota existe (`core.marketing-leads.tsx`), mas depende da checagem
  `is_impulsionando_staff`; usuários fora do time verão o mesmo bloqueio
  de sempre. Sem impacto no cockpit.
- **`getActionCenter` restrito a staff**: intencional e coberto pelo
  `ErrorState` compacto. Documentado.
- **QuickGroups linkam apenas rotas já existentes** — nada novo,
  nada quebrado.

## Pendências técnicas para Codex

Nenhuma. Todas as fontes utilizadas já existem no repositório.

## Recomendações para P5

1. **Consolidar `/dashboards/core` e `/core/master`** — avaliar redirect
   para `/adm/master` mantendo o slug para SEO interno de bookmarks.
2. **Sinergia com `/admin/master-hub`** — expor no cockpit um link
   contextual "Ver todas as áreas" apontando ao hub parametrizável,
   sem competir por espaço.
3. **KPI financeiro real** — plugar `fetchMacroDashboard` ou
   `getBillingHealth` como fonte de MRR / faturas em aberto no
   próximo passe (dado disponível, apenas não introduzido nesta fase
   para não expandir escopo P4).
4. **`getExecutiveBriefing`** — considerar bloco resumo narrativo IA
   entre "Resumo executivo" e "Atenção imediata".
5. **Auditoria de duplicidade** entre `command-center`,
   `action-center`, `executive-briefing` e o cockpit — definir se são
   *drill-downs* ou candidatos a unificação.

## Nota de maturidade UX

**Dashboard Admin: 8,7 / 10.**

Antes: grade plana de 25 atalhos + KPIs sem hierarquia + placeholders
mock ("—") + skeleton customizado + erro em card cinza sem semântica.

Depois: cockpit em 6 blocos executivos com fila de atenção real
priorizada, KPIs tipografados em `tabular-nums`, semântica de tom
(primary/warning/danger/success), primitivos compartilhados 100% adotados,
falha parcial resiliente, copy executiva, teclado e leitores de tela
plenamente suportados.

Deltas para 10: (1) plugar MRR real e faturas em atraso como KPI
executivo, (2) briefing IA embutido, (3) consolidar dashboards
paralelos legados.
