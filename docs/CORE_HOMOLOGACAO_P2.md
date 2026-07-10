# Homologação Premium do Core — Fase P2 (Cliente 360)

Escopo executado sem tocar backend, migrations, RLS, server functions,
autenticação, RBAC, integrações ou regras de cobrança/cortesia.

## Rotas auditadas
- `/_authenticated/admin/clientes/$slug` (shell)
- `/_authenticated/admin/clientes/$slug/` (Resumo)
- `/_authenticated/admin/clientes/$slug/painel`
- `/_authenticated/admin/clientes/$slug/dados`
- `/_authenticated/admin/clientes/$slug/plano`
- `/_authenticated/admin/clientes/$slug/modulos`
- `/_authenticated/admin/clientes/$slug/cerebro-ia`
- `/_authenticated/admin/clientes/$slug/automacoes`
- `/_authenticated/admin/clientes/$slug/financeiro`
- `/_authenticated/admin/clientes/$slug/mercado-pago`
- `/_authenticated/admin/clientes/$slug/dominio`
- `/_authenticated/admin/clientes/$slug/publicacao`
- `/_authenticated/admin/clientes/$slug/logs`
- `/_authenticated/admin/clientes/$slug/configuracoes`

## Arquivos alterados
- `src/routes/_authenticated/admin.clientes.$slug.tsx` — shell reescrito
- `src/routes/_authenticated/admin.clientes.$slug.index.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.painel.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.dados.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.modulos.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.financeiro.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.mercado-pago.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.publicacao.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.logs.tsx`
- `src/routes/_authenticated/admin.clientes.$slug.configuracoes.tsx`

## Cabeçalho do Cliente 360 (shell)
Novo cabeçalho consolidado exibe:
- breadcrumb `Clientes / <slug>`;
- logo do cliente (fallback ícone) + nome + badges de `demo`/`inativo`;
- razão social e nicho (join com `niches.name`);
- chips de status (comercial / financeiro / técnico) com tons semânticos
  (`ok/warn/bad/muted`) via classes semânticas (sem `text-gray-*` nem
  `bg-*-100` cru);
- chip de Cortesia Full com dias restantes;
- chip do Cérebro IA com status (lido de `core_ai_brains.status`);
- chip do domínio principal (destaque quando é domínio próprio);
- ações rápidas: **Abrir site** (nova aba, `aria-label`) e **Painel**
  (sempre com destino funcional; nenhum botão decorativo).
- `min-h-dvh` no wrapper e header sticky com `backdrop-blur`.

## Navegação entre abas
- 13 abas na ordem contratual (Painel → Dados → Plano → Módulos →
  Cérebro IA → CRM → Automações → Financeiro → Mercado Pago → Domínio →
  Publicação → Logs → Configurações).
- `aria-current="page"` na aba ativa; `nav` com `aria-label`.
- Foco visível (`focus-visible:ring-2 ring-ring`) em todos os links.
- Scroll horizontal controlado no mobile (`overflow-x-auto scroll-contrast`),
  sem quebra de layout nem sobreposição.
- `whitespace-nowrap` nas labels evita corte.

## Estados vazios (regra de produto)
Removidas todas as menções “Em breve”, “Próxima entrega”, “Aba visual ·
Onda 3.2”, “Prévia visual · Fase 3.5”. Substituídas pelo `EmptyState`
premium com título + descrição orientativa + CTA funcional quando existe
rota. Frase padrão passa a comunicar preparação e consolidação
automática, nunca inacabamento.

## Copy — “tenant” → “cliente / empresa”
Substituições feitas em:
- shell (comentários e strings visíveis);
- Resumo (`Módulos do tenant` → `Módulos do cliente`; `Governança do
  tenant` → `Governança do cliente`; “Nenhum tenant ativo com slug” →
  EmptyState);
- Painel (comentário de topo);
- todos os 6 stubs reescritos (dados, módulos, financeiro,
  mercado-pago, publicação, logs, configurações).

Ainda restam ocorrências internas de “tenant” em outros módulos do Core
(fora do escopo do Cliente 360) — pendência para próximas fases.

## Componentes migrados para primitivos P1
- `LoadingState` — Resumo (estado de carregamento).
- `EmptyState` — Resumo (cliente não encontrado), Dados, Módulos,
  Financeiro, Mercado Pago, Publicação, Logs, Configurações.
- `CoreSection` — Dados, Módulos, Financeiro, Mercado Pago, Publicação,
  Logs, Configurações.
- `formatBRL` / `formatInt` — Painel (via wrapper que preserva suporte a
  moedas estrangeiras como BOB para POS).

## Duplicações eliminadas
- 6 componentes `Card` decorativos com copy “em breve” + botão de link
  substituídos por `CoreSection` + `EmptyState`.
- `fmtMoney` / `fmtNum` do Painel agora delegam para `format.ts`.
- Loader ad-hoc do Resumo agora usa `LoadingState`.
- `Section` local, `MockField` e “Aba visual” badges removidos.

## Melhorias mobile
- `min-h-dvh` no shell.
- Cabeçalho `grid-cols-[minmax(0,1fr)_auto]` — texto sempre trunca
  sem colidir com ações; ícones/logo com `shrink-0`.
- Ações rápidas escondem label em `< sm` mostrando apenas ícones.
- Padding responsivo `p-4 sm:p-6` nos stubs.
- Cards de `mercado-pago` empilham em coluna única no mobile.

## Melhorias de acessibilidade
- `aria-current="page"` nas abas.
- `nav aria-label="Áreas do Cliente 360"`.
- `aria-label` nos ícones-botão (Abrir site, links externos).
- `aria-hidden` em todos os ícones decorativos.
- Foco visível (`ring-ring`) em todos os links de navegação.
- `LoadingState` já anuncia via `role="status" aria-live="polite"`.
- Uso consistente de tokens semânticos (nenhuma cor apenas por cor —
  status sempre acompanhado de label textual).

## Preservado (nada alterado)
- Regras de Cortesia Full (Onda 3.3): mantidas 100%.
- Cérebro IA (Fase 3.4): apenas leitura de status no shell, nenhuma
  regra tocada.
- Automações, CRM, Domínio, Plano: intocados.
- Schema Supabase, RLS, server functions, RBAC, auth.
- Chaves auto-geradas (`src/integrations/supabase/*`).

## Riscos
- Baixo. Todas as alterações são de camada de apresentação e uso de
  primitivos já homologados na P1. Typecheck limpo (`bunx tsgo`).
- Colunas lidas no shell (`status_financial`, `status_technical`,
  `niche_id`, `logo_url`) existem no schema atual (`companies`);
  quando `null`, os chips renderizam `—` com tom `muted`, sem quebrar.
- Query em `core_ai_brains` respeita RLS existente — retorna `null` se
  o registro não existir; o chip simplesmente não aparece.

## Pendências para o Codex
- Popular `companies.status_financial` e `status_technical` de forma
  automática (hoje muitos clientes têm `null` — chips ficam `muted`).
- Expor `full_courtesy_ends_at` também no `select` do Resumo (index)
  para o chip de cortesia aparecer no card, não só no shell.
- Endpoint de leitura de módulos filtrado por cliente para popular a
  aba Módulos com ativação real (P2 preparou o container).
- Endpoint de leitura de conta Mercado Pago do cliente
  (`mp_accounts`) para trocar `EmptyState` por dados reais na Fase 3.5.

## Oportunidades para P3 (A11y global)
- Auditar `aria-label` de icon-buttons no dossiê legado
  `admin.clientes.riomed.*` (48 rotas).
- Padronizar `role="status"` + `aria-live` em toasts e loaders do
  restante do Core.
- Substituir `text-gray-*` remanescentes fora do Cliente 360.
- Substituir `min-h-screen` em rotas públicas de tenant demo.

## Nota de maturidade UX do Cliente 360
- Antes da P2: **6.2 / 10** (cabeçalho pobre, 6 abas com “em breve”,
  copy “tenant” visível, tabs sem foco/aria-current, formatadores
  locais duplicados).
- Depois da P2: **8.6 / 10** (cockpit executivo, chips de saúde,
  ações rápidas, estados vazios premium, a11y consistente,
  primitivos P1 aplicados).
- Restam ~1.4 pontos que dependem de dados reais (Módulos, Financeiro,
  Mercado Pago, Logs) — bloqueados por backend (Codex Fase 3.5).
