# Core Impulsionando — Fase P1 · Fundação (tokens e primitivos globais)

> Escopo: consolidar a base do Design System do Core.
> Todas as fases seguintes (P2–P10) consomem os primitivos criados aqui.
> Regra: nada de backend, Supabase, RLS, auth ou integrações — puramente UX/UI/DS.

---

## 1. Componentes consolidados (promovidos à biblioteca global)

### 1.1 `src/components/impulsionando/CoreSection.tsx` (novo)
Cabeçalho + conteúdo padrão para seções do Core. Substitui as ~18
implementações locais de `function Section(...)` espalhadas em
`core.hub-cobranca`, `core.hub-automacoes`, `core.automacao.*`,
`adm.master`, entre outras.

- Suporta `title` + `description` + `actions`.
- Header responsivo com `grid-cols-[minmax(0,1fr)_auto]` no mobile e
  `flex flex-wrap` no desktop (padrão anti-clipping da regra
  `responsive-layout-patterns`).
- Nível semântico configurável (`h2` ou `h3`).

### 1.2 `src/components/impulsionando/LoadingState.tsx` (novo)
Estado de carregamento canônico. Substitui `<Skeleton>` inline em
`impulsionito-ic/*` e abas do Cliente 360.

- `role="status"` + `aria-live="polite"` — anúncio automático a screen readers.
- Modo `compact` para uso em cards menores.

### 1.3 `src/components/impulsionando/EmptyState.tsx` (novo)
Estado vazio canônico. **Regra de produto codificada no próprio JSDoc**:
proibido usar copy tipo "Disponível na próxima versão" ou "Em breve".
Sugere as duas fórmulas aprovadas:

> "Nenhum dado disponível no momento. Assim que este cliente utilizar
> os recursos correspondentes, esta visão será preenchida automaticamente."

> "Esta área está preparada para consolidar as informações. Os dados
> serão exibidos automaticamente conforme os módulos e integrações
> forem ativados."

### 1.4 `src/lib/format.ts` (novo)
Formatadores canônicos: `formatBRL`, `formatInt`, `formatPct`,
`formatDate`, `formatDateTime`. Elimina duplicações de `brl`,
`fmtBRL`, `fmtDate` em ~20 rotas (a serem migradas nas Fases P5–P6).

- `formatBRL` aceita reais ou centavos (`fromCents: true`).
- Todos os formatadores retornam `"—"` para `null`/`undefined`/`NaN`
  (padrão consistente de "sem dado").

### 1.5 `src/components/impulsionando/index.ts` (atualizado)
Exporta os 3 novos primitivos + tipos, mantendo a documentação de
"REGRA DE OURO" (nenhum componente hardcoda cor).

---

## 2. Correções de fundação

| Item | Arquivo | Antes | Depois |
|---|---|---|---|
| Viewport mobile | `src/components/app/AppShell.tsx:107` | `min-h-screen` | `min-h-dvh` |
| Viewport mobile | `src/components/app/AppShell.tsx:125` | `min-h-screen` | `min-h-dvh` |
| Dark mode do logo | `src/components/app/Sidebar.tsx:22` | `bg-white shadow-sm` | `bg-card ring-1 ring-border shadow-sm` |

### 2.1 Mapas de status — `text-gray-*` → tokens semânticos
Substituição bulk em 11 arquivos das rotas administrativas. Padrão:
- `bg-gray-100 text-gray-{600,700}` → `bg-muted text-muted-foreground`
- `bg-gray-500/15 text-gray-{600,700}` → `bg-muted text-muted-foreground`

Arquivos alterados:
- `src/routes/_authenticated/admin.billing-contracts.tsx`
- `src/routes/_authenticated/agenda.index.tsx`
- `src/routes/_authenticated/agenda.waitlist.tsx`
- `src/routes/_authenticated/contabilidade.obrigacoes.tsx`
- `src/routes/_authenticated/contabilidade.clientes.tsx`
- `src/routes/_authenticated/contabilidade.contratos.tsx`
- `src/routes/_authenticated/contabilidade.tarefas.tsx`
- `src/routes/_authenticated/contabilidade.documentos.tsx`
- `src/routes/_authenticated/finance.commissions.tsx`
- `src/routes/_authenticated/finance.transactions.tsx`
- `src/routes/mesa.$token.tsx`

Ganho: cores de status agora respeitam dark mode e o token semântico
`--muted` / `--muted-foreground`. Verificação final `rg` retornou zero
ocorrências de `text-gray-*` nos arquivos alterados.

**Preservado intencionalmente:**
- `src/routes/_authenticated/imobiliaria.aprovacoes.$id.imprimir.tsx`
- `src/routes/_authenticated/imobiliaria.aprovacoes.imprimir-fila.tsx`

Motivo: são páginas de **impressão** — o `text-gray-500/600` é
intencional para garantir contraste no papel, onde não há tema escuro.

---

## 3. Duplicações eliminadas (inventário para P5–P6)

Estes ainda existem, mas agora têm substituto canônico. Migração
programada nas fases seguintes (não fazer em P1 para não estourar escopo):

| Padrão local (a migrar) | Substituto canônico | Fase |
|---|---|---|
| `function Section(...)` local em `core.hub-*`, `automacao.*`, `adm.master` | `CoreSection` de `@/components/impulsionando` | P4/P5 |
| `<Skeleton>` inline em `impulsionito-ic/*`, abas Cliente 360 | `LoadingState` | P2/P3 |
| Estados vazios ad-hoc (`<p>Sem dados</p>`) em marketplace, automações | `EmptyState` | P4/P5/P6 |
| `function brl(cents)`, `function fmtBRL(v)` em 20 rotas | `formatBRL` de `@/lib/format` | P5/P6 |
| `function fmtDate(...)` em `marocasMockData.ts` e outros | `formatDate` de `@/lib/format` | P5/P6 |

---

## 4. Ganhos de UX imediatos

- **Sem "notch bug"**: `AppShell` não fica cortado em iOS/Android com barra
  dinâmica graças a `min-h-dvh`.
- **Dark mode do Sidebar corrigido**: logo do tenant não é mais uma placa
  branca fluorescente sobre fundo escuro.
- **Status legíveis em dark mode**: 11 rotas administrativas agora usam
  tokens que se ajustam automaticamente ao tema.
- **DS documentado no código**: `EmptyState` bloqueia o antipadrão "em breve"
  via JSDoc — cada consumidor lê a regra de produto direto na API.

---

## 5. Arquivos afetados

**Criados (4):**
- `src/lib/format.ts`
- `src/components/impulsionando/CoreSection.tsx`
- `src/components/impulsionando/LoadingState.tsx`
- `src/components/impulsionando/EmptyState.tsx`

**Editados (14):**
- `src/components/impulsionando/index.ts`
- `src/components/app/AppShell.tsx`
- `src/components/app/Sidebar.tsx`
- 11 rotas com mapa de status (listadas em §2.1)

**Documentação:**
- `docs/CORE_HOMOLOGACAO_P1.md` (este arquivo)

---

## 6. Riscos

- **Nenhum consumidor migrado ainda.** P1 só cria fundação; nenhuma rota
  existente foi refatorada para usar `CoreSection`/`EmptyState`/`formatBRL`.
  Isso é intencional (escopo controlado), mas a duplicação persiste até
  as próximas fases.
- **`bg-card ring-1 ring-border`** no logo do Sidebar altera levemente a
  aparência em light mode (borda sutil no lugar de sombra pura). Se o
  Codex tiver preferência de retornar ao visual anterior em light,
  ajustar via variante `data-tenant`.

## 7. Pendências para o Codex

Nenhuma. P1 é 100% frontend/DS.

## 8. Próxima fase

**P2 — Cliente 360: layout, navegação e abas stub premium.**

Escopo P2:
1. `admin.clientes.$slug.tsx` → `min-h-[calc(100dvh-3rem)]`.
2. Substituir breadcrumb manual pelo componente `Breadcrumbs` já
   existente em `@/components/impulsionando`.
3. Criar `StubTabCard` (na biblioteca global) usando `EmptyState` como
   base, com copy premium aprovada (nunca "em breve").
4. Aplicar `StubTabCard` nas 5 abas: `financeiro`, `modulos`,
   `configuracoes`, `publicacao`, `mercado-pago`.
5. Corrigir copy: eliminar palavra "tenant" das 5 abas stub.
6. Fade-mask lateral no tab bar (12 abas em mobile).
7. `aria-label` na `<nav>` do tab bar.

Aguardando aprovação para prosseguir com P2.
