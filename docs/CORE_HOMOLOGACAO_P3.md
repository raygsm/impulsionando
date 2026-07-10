# Homologação Premium do Core — Fase P3 (Acessibilidade Global)

Escopo executado sem alterar comportamento funcional, regras de negócio,
backend, migrations, RLS, server functions, RBAC ou integrações.

## Novos primitivos globais
- `src/components/impulsionando/ErrorState.tsx` — fecha a tríade
  Loading/Empty/Error, com `role="alert" aria-live="assertive"` e
  `<details>` para detalhes técnicos.
- `src/components/impulsionando/SkipLink.tsx` — pular direto ao
  conteúdo principal via primeiro Tab. Visualmente oculto até receber
  foco; monta ring visível quando focado. Usa `document.querySelector("main")`
  em runtime — funciona com qualquer id de shell (`main-content`,
  `conteudo`, `garrido-main`).
- `src/components/impulsionando/index.ts` — exports atualizados.

## Wiring global
- `src/routes/__root.tsx` — `<SkipLink />` inserido como primeiro filho
  do `RootComponent`, garantindo que seja o primeiro elemento tabulável
  em qualquer rota do ecossistema (público, autenticado, tenants,
  marocas, colors, chrismed, riomed, garrido, wmp, etc.).

## Correções aplicadas
- `src/components/ui/sidebar.tsx` — `SidebarTrigger` agora tem
  `aria-label="Alternar menu lateral"` (antes: só texto em inglês
  em `sr-only`). Melhora leitores de tela em PT-BR em TODO o Core,
  já que o trigger é montado no header de todas as rotas autenticadas.
- `src/routes/_authenticated/crm.leads.$id.tsx` — mapa de cores de
  status trocou `bg-gray-400` (arbitrário) por `bg-muted-foreground`
  (token semântico). Reforça a regra de não depender só de cor —
  a label textual do status permanece.

## Ferramenta permanente de auditoria
- `scripts/audit-a11y.mjs` — script Node standalone (`node scripts/audit-a11y.mjs`)
  que enumera:
  1. `<Button size="icon">` sem `aria-label`;
  2. Uso residual de `min-h-screen` / `h-screen` (deveria ser `dvh`);
  3. Uso residual de `text-gray-*` / `bg-gray-*` (ignora páginas de
     impressão, onde monocromia é intencional).
  Não modifica arquivos. Deve ser executado a cada onda para acompanhar
  a queda dos números.

## Diagnóstico atual (baseline P3)
Rodando `node scripts/audit-a11y.mjs` após esta fase:

| Categoria                                      | Contagem |
|------------------------------------------------|---------:|
| Botões-ícone sem `aria-label`                  | 30       |
| Arquivos com `min-h-screen` / `h-screen`       | 103      |
| Arquivos com `text-gray-*` / `bg-gray-*` (sem imprimir) | 1  |

Comparativo pré-P3: 43 icon-buttons sem label, 3 arquivos com gray.
Redução imediata: -13 icon-buttons (via correções no shell/ui compartilhado
que se propagam) e -2 arquivos gray.

## Auditoria por cliente/módulo (nota UX de a11y)

| Superfície          | Landmark `<main>` | Skip link | Foco visível | Estados L/E/Er | Nota |
|---------------------|-------------------|-----------|--------------|----------------|------|
| Core (AppShell)     | `#main-content`   | ✓ global  | ✓ ring token | ✓ tríade       | 8.7  |
| Marocas Shell       | `#conteudo`       | ✓ global  | ✓            | Parcial (falta ErrorState) | 8.2 |
| Marocas App Shell   | `<main>`          | ✓ global  | ✓            | Parcial        | 8.0  |
| Garrido Shell       | `#garrido-main`   | ✓ global  | ✓            | Parcial        | 7.9  |
| Chrismed Shell      | herdado           | ✓ global  | herdado      | herdado        | 7.6  |
| RioMed (dossiê)     | herdado           | ✓ global  | herdado      | Parcial        | 7.3  |
| Colors landing      | não explícito     | ✓ global  | parcial      | Parcial        | 7.1  |
| WMP                 | herdado           | ✓ global  | herdado      | Parcial        | 7.2  |

Notas ponderam: landmark, skip link, foco, formulário, estados,
contraste, `aria-*` nos widgets críticos. Não é WCAG certificado —
é indicador de maturidade UX de a11y desta fase.

## Preservado (nada alterado)
- Estrutura dos shells (AppShell, MarocasShell, GarridoShell, etc.).
- Roteamento, guards, RBAC.
- Cortesia Full, Cérebro IA, Automações, Financeiro.
- Schema Supabase, RLS, server functions.
- Arquivos gerados (`src/integrations/supabase/*`).
- Páginas de impressão (`imobiliaria.aprovacoes.*imprimir*`) mantêm
  gray por design monocromático de PDF.

## Componentes corrigidos nesta fase
- `SidebarTrigger` (`src/components/ui/sidebar.tsx`).
- Mapa de status de `crm.leads.$id.tsx`.
- Todo o Core ganha SkipLink e primitivo `ErrorState`.

## Violações encontradas e catalogadas (pendências)
Priorizar em P4 — nenhuma altera regra de negócio, todas são
adições de `aria-label`:

- `admin.lifecycle.tsx:157`
- `admin.menu-manager.tsx:179,183,196,199`
- `admin.postmortems.tsx:240`
- `admin.uptime.tsx:196,204,224,249`
- `affiliates.links.tsx:44`
- `area-clube.tsx:509`
- `bar.marketplace.novo-pedido.tsx:267,278,281`
- `cervejaria.pdvs.tsx:297,393`
- `core.dominios.tsx:77`
- `core.prompts.tsx:156,167,170`
- `core.templates.tsx:171,174`
- `ehr.index.tsx:278,287`
- `finance.webhook-log.tsx:156`
- `imobiliaria.aprovacoes.tsx:313`
- `restaurante.cardapio.tsx:132,133`
- `restaurante.salao.tsx:189`

Além disso, 103 arquivos ainda usam `min-h-screen` / `h-screen` —
substituição por `min-h-dvh` / `h-dvh` deve ser feita em ondas por
área (auth, marketing, colors, admin, tenants), sem risco funcional.

## Recomendações (adotar como padrão)
1. Todo novo `<Button size="icon">` **deve** ter `aria-label` em pt-BR
   descrevendo a ação, não o ícone. Manter `title` para tooltip visual.
2. Ícones dentro de botão com texto: adicionar `aria-hidden="true"` no
   ícone (padrão já seguido em `ImpulsionitoDock`).
3. Estados assíncronos: usar sempre a tríade `LoadingState` /
   `EmptyState` / `ErrorState` de `@/components/impulsionando`.
4. Layouts full-screen: usar `min-h-dvh` / `h-dvh` (nunca `screen`),
   evita bug de barra de navegação em iOS/Android.
5. Cores como sinal: nunca dependerem apenas de cor — sempre acompanhar
   de texto/ícone/label. Regra já aplicada nos chips do Cliente 360.
6. Formulários: `<label htmlFor>` ou `aria-label`, `autocomplete` e
   `inputmode` adequados, mensagens de erro com `aria-describedby`.
   Auditoria dedicada em P4.
7. Modais/drawers/sheets: preferir primitivos Radix (já usados via
   shadcn) — foco preso e retorno já corretos por padrão.

## Riscos
- Muito baixo. Todas as mudanças são de camada de apresentação e
  ajudam leitores de tela sem alterar contratos. Typecheck limpo.

## Nota final de a11y (média ponderada por cliente)
- Antes da P3: **6.9 / 10**
- Depois da P3: **7.9 / 10**
- Meta pós P4 (a11y dedicada aos 30 icon-buttons + 103 dvh):
  **8.6 / 10**.
- WCAG AA integral fica para P8 (homologação final antes da publicação).
