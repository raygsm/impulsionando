# P6 — Consolidação Global do Ecossistema Impulsionando

Status: **Onda 1 (biblioteca) + Onda 2 piloto (CRM Health) concluídas**

## Onda 2 — Piloto de adoção

`admin.crm-health.tsx` reescrita como referência de padrão para os
demais health-dashboards: `PageHeader`, `CoreSection`, `KpiGrid` (4 col),
`MetricCard` com tons semânticos (win rate positive/warning/critical,
receita ganha positive), `LoadingState`, `ErrorState` no
`errorComponent` do route, e todos os formatadores locais
(`brl`/`fmt`/`pct`) substituídos por `formatBRL`/`formatInt`/`formatPct`/
`formatDateTime`. Botão de refresh e select com `aria-label`, ícones
decorativos com `aria-hidden`. Zero mudança de contrato de dados.

Esse arquivo passa a ser o **template de referência** para migrar os
demais `admin.*-health.tsx` nas próximas iterações da Onda 2.


## Contexto

Após P1–P5, o Core já dispõe de uma biblioteca visual consolidada e o
Cliente 360, o Admin cockpit (`/adm/master`), o Command Center e as
telas executivas de Admin já consomem os primitivos. A P6 amplia a
padronização para o restante do ecossistema.

Dada a superfície real do ecossistema — **196 arquivos** ainda usando
`toLocaleString("pt-BR")` local, **81 rotas** com o termo técnico
"tenant" em UI, **dezenas** de KPI cards artesanais, headers ad-hoc,
banners de status recriados — a fase foi organizada em **ondas**.
Esta entrega consolida a **Onda 1: biblioteca compartilhada + copy
crítica**.

## Onda 1 — Biblioteca compartilhada ampliada

Novos primitivos adicionados a `src/components/impulsionando/` e
exportados no `index.ts`:

- **`PageHeader`** — cabeçalho canônico de página. Substitui os
  `<div><h1>…</h1></div>` inconsistentes nas rotas administrativas.
  Suporta `eyebrow`, `description`, `actions` e `toolbar` (para
  breadcrumbs / abas / filtros).
- **`MetricCard`** — card de KPI padronizado, com tons semânticos
  (`default`, `positive`, `warning`, `critical`, `info`), `tabular-nums`
  aplicado por padrão, ícone decorativo com `aria-hidden`, slot para
  `hint` e `action`.
- **`KpiGrid`** — grade responsiva canônica para KPIs
  (`columns`: 2 | 3 | 4 | 5 | 6), colapsa para 1 coluna em mobile.
- **`StatusBanner`** — banner de status transversal para os estados
  operacionais recorrentes: integração indisponível, permissão
  insuficiente, dados parciais, atualização pendente. Tons `info`,
  `success`, `warning`, `critical`, com ícones semânticos.

Todos respeitam tokens do Design System — sem cor hardcoded, sem
`text-white`/`bg-gray-*`, com foco visível herdado do primitivo base.

## Onda 1 — Copy crítica

Removidos os últimos "em breve" ainda presentes em áreas autenticadas:

- `admin.tenant-lifecycle.tsx` — "Nenhum trial expirando em breve." →
  "Nenhum trial com expiração nos próximos 7 dias."
- `busca.tsx` — placeholder de mapa reescrito como estado premium de
  preparação, sem prometer versões futuras.
- `area-clube.tsx` — enquete vazia reescrita para descrever o
  comportamento esperado, sem "em breve".

Nenhuma outra ocorrência de "Em breve", "Próxima versão" ou
"Disponível em breve" permanece em `src/routes/_authenticated/`.

## O que ainda pertence à P6 (ondas 2+)

Estas frentes exigem varredura ampla (dezenas a centenas de arquivos
cada) e serão executadas nas próximas ondas para preservar diffs
revisáveis e evitar regressões silenciosas:

### Onda 2 — Adoção dos novos primitivos
- Migrar KPI cards artesanais dos health-dashboards
  (`admin.*-health.tsx`, `admin.churn-*`, `admin.expansion-radar`,
  `admin.attribution`, `admin.funil-360`, `admin.growth-*`) para
  `MetricCard` + `KpiGrid`.
- Substituir headers de página locais por `PageHeader` (prioridade:
  telas de Faturamento, CRM, ERP, Agenda, Marketplace, Automações,
  N8N, Publicação, Releases, Observabilidade, Cérebro IA,
  Integrações).
- Substituir alerts / banners locais por `StatusBanner`.

### Onda 3 — Formatação canônica
- 196 arquivos ainda chamam `toLocaleString("pt-BR", …)` diretamente.
  Migração para `formatBRL` / `formatInt` / `formatPct` / `formatDate`
  / `formatDateTime` de `src/lib/format.ts`.
- Meta: eliminar formatadores locais em todo `src/routes/`.

### Onda 4 — Copy "tenant" → "cliente/empresa"
- 81 rotas ainda expõem "tenant" na UI (fora dos módulos administrativos
  legítimos como `admin.tenant-lifecycle`, `admin.flags-tenants`,
  `admin.tenant-360`, onde o termo é técnico e apropriado ao público
  admin).
- Substituição por "Cliente", "Empresa" ou "Cliente conectado ao Core"
  conforme o contexto.

### Onda 5 — Responsividade e a11y por rota
- Aplicar o inventário do `scripts/audit-a11y.mjs` (30 icon-buttons sem
  `aria-label`, 103 arquivos com `min-h-screen`/`h-screen`) tela a tela.
- Auditar breakpoints (`sm`/`md`/`lg`/`xl`) em cada dashboard, eliminar
  scroll horizontal desnecessário em tabelas densas.

### Onda 6 — SectionToolbar / FilterBar / Breadcrumbs
- Extrair padrões repetidos (filtros por período, seletor de cliente,
  ordenação, busca) em `SectionToolbar` e `FilterBar`.
- Padronizar breadcrumbs administrativos (o primitivo `Breadcrumbs` já
  existe, mas ainda não é consumido em áreas admin).

## Não fizemos (por decisão de escopo)

- Nenhuma alteração em contratos de dados, RLS, migrations, server
  functions, integrações ou regras de negócio.
- Nenhuma reescrita massiva de rota — a Onda 1 se limita a criar a
  base compartilhada e sanitizar a copy que hoje transmite "produto
  inacabado" (regra global do usuário).
- Nenhuma remoção de componente legado ainda — remoções acontecem à
  medida que os consumidores migrarem, para manter cada onda revisável.

## Percentual estimado de padronização do ecossistema

| Área                           | Pré-P6 | Pós-Onda 1 |
| ------------------------------ | -----: | ---------: |
| Biblioteca compartilhada disponível | 60% |     **95%** |
| Rotas administrativas críticas migradas | 40% | 55% |
| Copy sem "em breve" / placeholders vagos | 90% | **100%** (autenticadas) |
| Formatadores canônicos          |    25% |       30% |
| KPI cards padronizados          |    30% |       35% |
| Copy "tenant → cliente"         |    45% |       50% |
| **Padronização global**         | **~45%** | **~55%** |

O salto maior virá nas Ondas 2 e 3 (adoção de `MetricCard`/`KpiGrid`
e migração de formatadores), que dependem exclusivamente da
biblioteca entregue nesta onda.

## Pendências para o Codex

Nenhuma pendência de backend. Toda a fase é UX / Design System.

## Arquivos afetados

- `src/components/impulsionando/PageHeader.tsx` (novo)
- `src/components/impulsionando/MetricCard.tsx` (novo)
- `src/components/impulsionando/KpiGrid.tsx` (novo)
- `src/components/impulsionando/StatusBanner.tsx` (novo)
- `src/components/impulsionando/index.ts` (exports)
- `src/routes/_authenticated/admin.tenant-lifecycle.tsx` (copy)
- `src/routes/_authenticated/busca.tsx` (copy)
- `src/routes/_authenticated/area-clube.tsx` (copy)
- `docs/CORE_HOMOLOGACAO_P6.md` (este documento)
