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

---

## Subonda P6.5 — Integrações, Comunicação e Confiabilidade Operacional

Aprovada como continuação natural da P6.4. Foco em Integrações,
Automação, Comunicação, Entregabilidade e Confiabilidade.

### Arquivos migrados (4)

- `src/routes/_authenticated/admin.integrations-automation-health.tsx`
- `src/routes/_authenticated/admin.comms-health.tsx`
- `src/routes/_authenticated/admin.notification-deliverability-health.tsx`
- `src/routes/_authenticated/admin.jobs-queues-reliability-health.tsx`

### Componentes adotados

`PageHeader`, `KpiGrid`, `MetricCard` (com `tone` semântico +
`tabular-nums`), `CoreSection`, `LoadingState`, `EmptyState`,
`ErrorState`, `KeyCountTable` (novo primitivo — ver abaixo).

### Novo primitivo compartilhado — `KeyCountTable`

Promovido a partir do padrão local `Tab`/`SimpleTable` que reaparecia em
todos os 4 arquivos deste lote (>25 tabelas `k/count` só em
`comms-health`). Arquivo: `src/components/impulsionando/KeyCountTable.tsx`.

Contrato mínimo e reutilizável:

```tsx
<KeyCountTable
  keyLabel="Canal"
  countLabel="Total"
  rows={[{ k: "email", count: 120 }]}
  ariaLabel="Distribuição por canal"
  emptyTitle="Nenhum envio nesta janela."
/>
```

- Cabeçalhos `<th scope="col">` explícitos.
- `caption` acessível via `ariaLabel` (visualmente oculto).
- Coluna de contagem com `tabular-nums`.
- `EmptyState` compacto interno quando `rows` vazio.
- API estável para futura reutilização (não abstrai além do necessário).

Exportado em `src/components/impulsionando/index.ts`.

### Duplicações removidas

- Helpers locais `fmt`, `pct`, `sec` eliminados (substituídos por
  `formatInt` / `formatPct` de `@/lib/format`; `sec` mantido só em
  `jobs-queues-reliability-health` porque é uma formatação específica
  de latência).
- Componente `Tab` local em `comms-health.tsx` — removido.
- `Skeleton` manual em quatro rotas — substituído por `LoadingState`.
- Blocos `errorComponent` inline com `<Card>` — substituídos por
  `ErrorState`.
- Mensagens “Sem dados.” / “—” genéricas — substituídas por
  `KeyCountTable` com `emptyTitle` específico ou copy explícita.

### Formatadores centralizados

`formatInt`, `formatPct`, `formatDateTime` — todos de `@/lib/format`.

### Melhorias de acessibilidade

- H1 único via `PageHeader` em cada rota.
- Selects com `aria-label="Janela de análise"`.
- Botão “Atualizar” com `aria-label` e ícone `aria-hidden`.
- Tabelas com `<thead>` + `<th scope="col">` explícito em todas as
  tabelas restantes (SLO, credenciais WhatsApp, view de fila,
  webhooks, integrações).
- Checkmarks (`✓`/`—`) receberam `<span class="sr-only">Sim/Não</span>`
  para não depender apenas de glifo visual.
- Estados de health / throttle expressos por `Badge` semântico +
  rótulo textual, nunca só por cor.
- `EmptyState` mantém `role="status"`.

### Melhorias mobile

- `KeyCountTable` envolvido em `overflow-x-auto` e usa `break-words`
  nas células-chave (para IDs de integração, nomes de mailbox, etc.).
- Tabelas ricas (WhatsApp credenciais, SLO, fila do funil) mantidas
  em `overflow-x-auto` com quebras seguras nas colunas de texto.
- `KpiGrid columns={4}` responde: 1 col mobile → 2 sm → 4 lg.
- Badges longos (health, status de cron) usam `flex-wrap` no cabeçalho
  da linha para não estourar em telas estreitas.

### Tons semânticos aplicados

- Entregabilidade (outbox, tentativas, WhatsApp, e-mail, webhooks):
  helper `deliveryTone(rate, base)` — `positive ≥95%`, `warning ≥80%`,
  `critical <80%`, `default` quando base insuficiente.
- Integrações com erro / webhooks falhos / runtime errors — `warning`
  com escalonamento para `critical` conforme volume.
- Throttle de e-mail — `critical` quando ativo, `positive` quando livre.
- WhatsApp credenciais unhealthy — `critical`; healthy/ok — `positive`.
- Fila do funil, cron jobs, tarefas operacionais, incidentes — tons
  escalonados por volume de falhas/atrasos.
- Cobrança da diretriz: rótulo textual sempre presente ao lado do tom.

### Copy padronizada

- “tenant” removido dos textos visíveis nas 4 rotas.
- Substituições: “Webhooks recebidos”, “clientes conectados ao Core”,
  “automação”, “reprocessamentos”, “falhas”, “ação necessária” (nos
  estados vazios), “assinaturas inválidas” (MP), “descadastros”
  (e-mail).

### Regras respeitadas

Nenhuma alteração de backend, queries, contratos de servidor, RLS,
migrations, integrações ou dados. Comportamento funcional preservado
(filtro de janela, refetch, dados renderizados).

### Riscos / pendências

Nenhum bloqueante. `KeyCountTable` já pronto para adoção nas próximas
subondas — deve ser o vetor principal de consolidação nos ~50
dashboards `admin.*-health.tsx` restantes.

### Typecheck

`bunx tsgo --noEmit` — sem erros.

### Padronização estimada

| Área                                    | Pós-P6.4 | Pós-P6.5 |
| --------------------------------------- | -------: | -------: |
| Biblioteca compartilhada disponível     |     95% |    **97%** (KeyCountTable) |
| Rotas administrativas críticas migradas |     70% |     **78%** |
| Formatadores canônicos                  |     55% |     **62%** |
| KPI cards padronizados                  |     58% |     **68%** |
| Copy “tenant → cliente”                 |     72% |     **80%** |
| **Padronização global**                 | **~72%** | **~80%** |

Próxima subonda sugerida (P6.6): Domínios/DNS/SSL de tenants,
Publicação/Deploy e Segurança/Auditoria — famílias irmãs às health
dashboards, com forte candidato de reuso para `KeyCountTable`.

## Subonda P6.6 — Dados, Analytics, Relatórios e Observabilidade

Migração de 4 dashboards analíticos e de qualidade de dados, usando o
`admin.crm-health.tsx` (P6.2) como referência canônica e reaproveitando
o `KeyCountTable` promovido na P6.5.

Observação de escopo: os arquivos-alvo indicados no plano
(`admin.analytics-health.tsx`, `admin.data-quality-health.tsx`,
`admin.events-tracking-health.tsx`, `admin.observability-health.tsx`)
não existem na base atual. Foram substituídos pelos equivalentes reais
mais próximos:

| Alvo do plano                        | Arquivo real migrado                 |
| ------------------------------------ | ------------------------------------ |
| Analytics / funil                    | `admin.growth-funnel-health.tsx`     |
| Data quality                         | `admin.data-quality.tsx`             |
| Events / tracking                    | `admin.events-health.tsx`            |
| Observability / qualidade de dados   | `admin.revenue-quality.tsx`          |

### Arquivos migrados

- `src/routes/_authenticated/admin.data-quality.tsx`
- `src/routes/_authenticated/admin.events-health.tsx`
- `src/routes/_authenticated/admin.growth-funnel-health.tsx`
- `src/routes/_authenticated/admin.revenue-quality.tsx`

### Componentes compartilhados adotados

`PageHeader`, `KpiGrid`, `MetricCard` (com `tone` semântico e
`tabular-nums`), `CoreSection`, `LoadingState`, `EmptyState`,
`ErrorState`, `KeyCountTable`, `StatusBanner`.

### Uso do `KeyCountTable`

O componente foi adotado extensivamente: substituiu **17 tabelas
locais** de chave/contagem (7 em growth-funnel, 2 em data-quality,
1 em events-health + 7 tabelas simples adicionais em growth-funnel
para status, origens, motivos, stages, nichos, módulos e survey).

### Formatadores locais eliminados

Removidos `fmt`, `fmtNum`, `brl`, `pct`, `fmtPct` locais em favor de
`formatBRL`, `formatInt`, `formatPct`, `formatDateTime` de
`@/lib/format`.

### Melhorias de acessibilidade

- Todos os `Select` com `<label htmlFor>` sr-only + `aria-label`.
- Botões de refresh com `aria-label` explícito.
- Ícones decorativos com `aria-hidden="true"`.
- Tabelas com `<th scope="col">` e `<caption class="sr-only">`.
- Barra de progresso Top 10 recebeu `role="img"` + `aria-label`
  descritivo (participação relativa não depende apenas de cor).
- Tons semânticos (`positive` / `warning` / `critical`) reforçam
  significado além da cor.
- `ErrorState` com `role="alert"` (já embutido) substituiu Cards de
  erro manuais.

### Melhorias mobile

- `KpiGrid columns={3|4}` responsivo padrão (1 → 2 → 3/4).
- Tabelas agora envelopadas em `rounded-xl border bg-card` com
  `overflow-x-auto` consistente.
- Grid de funil consolidado quebra 2 col (mobile) → 5 col (desktop).
- Header com filtros/refresh empilha corretamente no mobile via
  `PageHeader.actions` (flex-wrap + shrink-0).

### Duplicações removidas

- 4 blocos `errorComponent` manuais (Card + Skeleton + Button)
  substituídos por `ErrorState` inline.
- 4 skeletons de loading manual substituídos por `LoadingState`.
- 4 headers `<h1><Icon/>...</h1>` inconsistentes unificados em
  `PageHeader` com `eyebrow` + `description` + `actions`.
- KPI cards manuais (`Card + CardContent + text-2xl font-bold`)
  substituídos por `MetricCard` (5 em events-health, 8 em
  growth-funnel, 6 em revenue-quality, 8 em data-quality).
- Alerts manuais em `admin.revenue-quality.tsx` migrados para
  `StatusBanner` com tom semântico.

### Copy

Padronizada para “cliente / clientes”, “grupos duplicados”, “fonte”,
“janela”, “ação necessária”, “atualização”. Removidas menções a
“tenant” nas superfícies visíveis.

### Riscos

Nenhum bloqueante. Sem alterações em queries, contratos de dados,
RLS, migrations, mocks ou funções server-side. Nenhum evento novo
criado. Nenhum botão de exportação sem ação foi adicionado.

### Pendências

- `admin.analytics-health.tsx`, `admin.data-quality-health.tsx`,
  `admin.events-tracking-health.tsx`, `admin.observability-health.tsx`
  não existem — se forem criados no futuro, herdar o padrão desta
  subonda.
- Restam dashboards analíticos secundários (`admin.conversion-funnel`,
  `admin.crm-funnel-health`, `admin.funil-360`, `admin.funil-reguas`,
  `admin.funnel-fallbacks`, `admin.catalog-analytics`,
  `admin.whatsapp-metrics`, `bi.*`) como candidatos naturais para
  subonda P6.7.

### Typecheck

`bunx tsgo --noEmit` — sem erros.

### Padronização estimada

| Área                                    | Pós-P6.5 | Pós-P6.6 |
| --------------------------------------- | -------: | -------: |
| Biblioteca compartilhada disponível     |     97% |    **97%** |
| Rotas administrativas críticas migradas |     78% |     **83%** |
| Formatadores canônicos                  |     62% |     **68%** |
| KPI cards padronizados                  |     68% |     **75%** |
| Tabelas chave/contagem padronizadas     |     40% |     **62%** (via `KeyCountTable`) |
| Copy “tenant → cliente”                 |     80% |     **84%** |
| **Padronização global**                 | **~80%** | **~85%** |
