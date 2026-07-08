# Auditoria de Front-end — Core Impulsionando

**Data:** 08/07/2026
**Modo:** Somente leitura — **nenhuma alteração de código, banco, RLS, secrets, integrações, migrations, Edge Functions ou APIs foi realizada.**
**Escopo:** Camada de apresentação (rotas em `src/routes/`, componentes em `src/components/`, estilos em `src/styles.css`), com foco em problemas visíveis ao usuário final e ao operador do painel.
**Método:** Inventário do file-based routing, varreduras `ripgrep` por antipadrões (`href="#"`, `size="icon"` sem `aria-label`, cores hardcoded, `h-screen`, `TODO/FIXME`, `console.log`, placeholders), inspeção pontual de rotas críticas do funil e verificação da integridade do bootstrap TanStack.

---

## 0. Panorama quantitativo

| Métrica | Valor |
|---|---|
| Rotas públicas (`src/routes/*.tsx`) | **191** arquivos |
| Rotas autenticadas (`src/routes/_authenticated/*.tsx`) | **515** arquivos |
| Route files com `head()` (SEO) — amostra top-10 | ✅ 10/10 presentes |
| `__root.tsx` com `notFoundComponent` + `errorComponent` | ✅ presente |
| `html lang="pt-BR"` | ✅ presente |
| Arquivos com `h-screen` / `min-h-screen` | **145** |
| Arquivos com cores Tailwind hardcoded (`text-white`, `bg-black`, `text-gray-*`, `bg-[#...]`) | **124** |
| Arquivos com `size="icon"` (Button) | **109** — em **61** deles nenhum ou parte dos ícones tem `aria-label` |
| `console.log` / `console.debug` em produção | **12** ocorrências (majoritariamente em server handlers/webhooks, aceitável; 1-2 clientes revisáveis) |
| `href="#"` ou `onClick={() => {}}` (link/CTA morto) | **1** confirmado (`marocas.login.tsx`) |
| `TODO` / `FIXME` deixados no código | 5 marcadores reais |
| Placeholders textuais/simulados aparentes | ~10 blocos identificados |

Nenhum bloqueador estrutural (router, `__root.tsx`, `<Outlet />`, boundaries) foi detectado.

---

## 1. O que foi auditado

### 1.1 Home, header, footer, menus
- `src/routes/index.tsx` (Home)
- `src/components/marketing/PublicHeader.tsx`
- Rodapé/componentes de marketing em `src/components/marketing/*`
- Menu do dock/assistente (`src/components/impulsionito/ImpulsionitoDock.tsx`)

### 1.2 Funil comercial público
- `planos.tsx`, `contratar.tsx`, `contratar.sob-medida.tsx`
- `checkout.$slug.tsx`, `checkout.index.tsx`, `checkout.success.tsx`
- `trial.tsx`, `trial_.cadastro.tsx`, `onboarding-guiado.tsx`
- CTAs "Baixar app", "Entrar", "Contratar agora"
- Fluxo `colors.painel.tsx` (funil recém-adicionado)

### 1.3 Institucional & suporte
- `sobre.tsx`, `contato.tsx`, `suporte.tsx`, `central-de-ajuda.tsx`
- `abrir-ticket.tsx`, `canal-oficial.tsx`, `status.tsx`, `status.$slug.tsx`
- `legal.tsx`, `privacidade.tsx`, `termos.tsx`, `reembolso.tsx`

### 1.4 Vitrine, Clube, Consumidor
- `vitrine.tsx`, `vitrine.$slug.tsx`
- `clube.tsx`, `clube.cadastro.tsx`, `clube.login.tsx`
- `consumidor.tsx`, `catalogo.tsx`, `pesquisa.tsx`

### 1.5 Demonstrações e nichos
- `demo.*` (28 rotas)
- `showroom.*` (43 rotas)
- `nichos.index.tsx`, `nichos.$slug.tsx`, `modulos.*`, `escolher-nicho.tsx`
- Tenants-exemplo: `chrismed.*` (11), `riomed.*` (19), `marocas.*` (4), `wmp.*` (6), `colors.*` (6), `imoveis.*`, `paciente.*`

### 1.6 Áreas autenticadas (`_authenticated/*`, 515 rotas)
- Administrativa (`admin.*`) — hub master, catálogo, billing, auditoria, branding, health checks
- Cliente (`app.*`, dashboards, CRM, agenda, financeiro, contabilidade)
- Consumidor (memberships/clube dentro do `_authenticated`)
- White label (`white-label.*`)
- Portais de token (`portal.*`, `parceiro.*`, `parceiro-corretor.*`, `mesa.$token`)

### 1.7 Sistêmico
- 404 (`__root.tsx > notFoundComponent`)
- Boundaries de erro (`__root.tsx > errorComponent`)
- Responsividade — varredura por `h-screen`, `min-w-`, uso de `md:`/`lg:` breakpoints
- Acessibilidade — `alt`, `aria-label`, contraste, foco
- Consistência de design — tokens semânticos vs. classes hardcoded

---

## 2. Achados por severidade

### 🔴 CRÍTICA — quebra função ou compromete confiança do usuário

| # | Problema | Arquivo / Rota | Impacto | Correção recomendada | Segura só no front? | Estrutural? |
|---|---|---|---|---|---|---|
| C1 | `<a href="#">Esqueci a senha</a>` — link morto no login do tenant marocas. | `src/routes/marocas.login.tsx:116` | Usuário não recupera senha; erosão de confiança no portal. | Trocar por `<Link to="/reset-password">` ou botão que dispara `supabase.auth.resetPasswordForEmail`. | ✅ Sim | ❌ Não |
| C2 | Fluxo de auth marcado `// TODO: integrar com Supabase auth` — login apenas navega sem autenticar. | `src/routes/marocas.login.tsx:25`, `src/routes/marocas.contratar.$plano.tsx:57` | Portal do proprietário fica em "modo demo" indefinido; risco de expor rota que aparenta login real. | Integrar com `supabase.auth.signInWithPassword` + `requireSupabaseAuth`, ou rotular a página como "prévia". | ⚠️ Parcial (troca de UI + hook) | ⚠️ Pequena — usa integração já existente |
| C3 | 61 arquivos com `<Button size="icon">` sem `aria-label` (109 ocorrências totais). Casos críticos: `PublicHeader.tsx` (menu mobile), `ImpulsionitoDock.tsx` (6 botões), `NotificationsBell.tsx` (2/3), `checkout.$slug.tsx`, `chrismed.agendar.tsx` (copiar PIX), `demo.cliente-final.tsx` (5), `demo.afiliados.tsx` (4), `demo.white-label.tsx` (4), tabelas de `admin.clientes.riomed.*`. | Vários | Leitores de tela anunciam "botão" sem função; WCAG 2.1 SC 4.1.2 falha. | Adicionar `aria-label="ação"` em cada `<Button size="icon">`. | ✅ Sim | ❌ Não |
| C4 | Página `wmp.index.tsx:91` explicitamente marcada `{/* CASES (placeholder com dados reais virão na Onda 2) */}` — bloco visível ao público final. | `src/routes/wmp.index.tsx` | Passa aspecto de "site em construção" em landing paga. | Substituir por cases reais ou ocultar o bloco até haver dado. | ✅ Sim | ❌ Não |

### 🟠 ALTA — degrada UX, SEO ou responsividade

| # | Problema | Arquivo / Rota | Impacto | Correção recomendada | Segura só no front? | Estrutural? |
|---|---|---|---|---|---|---|
| A1 | 145 arquivos usam `h-screen` / `min-h-screen`. Em iOS/Android a barra dinâmica corta conteúdo. Top ofensores: `vitrine.$slug.tsx`, `riomed.v.$slug.tsx`, `recomendacao.$nicho.tsx`, portais de token, `mesa.$token.tsx`, `_authenticated/busca.tsx`. | 145 arquivos | Corte de CTA/rodapé em mobile; scroll duplicado em iOS Safari. | Substituir por `h-dvh` / `min-h-dvh`. | ✅ Sim | ❌ Não |
| A2 | 124 arquivos com cores Tailwind hardcoded (`text-white`, `bg-black`, `text-gray-500`, `bg-[#...]`) — quebram dark mode / branding por tenant via `TenantBrandingProvider`. Top: rotas de impressão da imobiliária, `mesa.$token.tsx`, `contabilidade.*`, `finance.*`. | 124 arquivos | Tenant com branding próprio vê elementos "invadindo" o tema; contraste inconsistente entre light/dark. | Trocar por tokens semânticos (`text-foreground`, `bg-background`, `text-muted-foreground`, `bg-card`). Preservar `text-white`/`bg-black` **apenas** dentro de `colors.*` e `wmp.*` (marcas que exigem essas cores). | ✅ Sim (apenas classes) | ❌ Não |
| A3 | Formulários em `colors/ContatoSection.tsx` e `EbooksSection.tsx` usam `placeholder:text-white/40` sobre `bg-black/40` — contraste ~2.9:1 (falha WCAG AA 4.5:1 para texto pequeno). | `src/components/colors/ContatoSection.tsx`, `src/components/colors/EbooksSection.tsx`, `src/routes/colors.painel.tsx:405` | Placeholders quase invisíveis para baixa visão. | Subir para `placeholder:text-white/70` ou usar `text-muted-foreground`. | ✅ Sim | ❌ Não |
| A4 | `src/routes/_authenticated/restaurante.mesas.tsx:198` gera QR em `<img>` **sem `alt`** dentro de string HTML injetada em janela de impressão. | Restaurante — impressão de mesas | Cliente-final que use TalkBack não sabe o que está imprimindo. | Adicionar `alt="QR Code da mesa N"`. | ✅ Sim | ❌ Não |
| A5 | 45 arquivos aparecem em varredura de `<img>` potencialmente sem `alt`; confirmar caso a caso (muitos são falsos-positivos, mas há candidatos em rotas de vitrine/tenant). | 45 arquivos | Falha WCAG 1.1.1; imagens decorativas não sinalizadas para AT. | Para decorativas: `alt=""`. Para informativas: descrição curta. | ✅ Sim | ❌ Não |
| A6 | Nenhum og:image detectado em `head()` de rotas leaf verificadas (planos, contratar, vitrine, clube, suporte). | 10+ rotas | Compartilhamento em WhatsApp/LinkedIn cai no default do domínio; taxa de clique menor. | Definir `og:image` absoluto por rota-âncora (imagem já existente do módulo/tenant). | ✅ Sim | ❌ Não |

### 🟡 MÉDIA — polimento, consistência e higiene

| # | Problema | Arquivo / Rota | Impacto | Correção recomendada | Segura só no front? | Estrutural? |
|---|---|---|---|---|---|---|
| M1 | 12 `console.log`/`console.debug` deixados em produção. Aceitáveis em webhooks (`payments/webhook.ts`, `uptime-check.ts`, `email/*`) por ficarem em runtime server; revisáveis em cliente: `src/lib/funnelTracking.ts:90` e `src/components/app/CoreCopyGuard.tsx:215-217`. | 12 arquivos | Poluição do console do usuário; `funnelTracking` expõe envelope de analytics. | Trocar por `logger.ts` (já existente) e gate por `import.meta.env.DEV`. | ✅ Sim | ❌ Não |
| M2 | 5 TODOs reais no código (marocas login, marocas contratar, planos.tsx cópia comentada, releases.functions.ts docstring). | Vários | Sinal de trabalho pendente; risco de esquecer integrações. | Resolver os TODOs pendentes; converter os que são apenas docstring em comentário normal. | ⚠️ Depende | Alguns exigem back-end |
| M3 | Textos placeholder em `PromptMasterEditor.tsx` (`## APRENDIZADOS APROVADOS\n(placeholder ...)`) aparecem em UI admin. | `src/components/impulsionito-ic/PromptMasterEditor.tsx:56` | Admin master vê literal `(placeholder …)` no editor. | Substituir por copy real ou esconder até haver conteúdo. | ✅ Sim | ❌ Não |
| M4 | Duplicação de rotas de painel administrativo entre `admin.*` (público-admin) e `_authenticated/admin.*` — 515 rotas autenticadas com forte crescimento; risco de rotas obsoletas conviverem com novas. | `src/routes/_authenticated/admin.*` | Navegação inconsistente, links internos apontando para versões antigas. | Rodar auditoria dedicada de rotas admin em rodada futura, mapear "vivas vs. legadas" numa planilha. | ⚠️ Requer rodada específica | ❌ Não (só front) |
| M5 | Falta de `<main>` explícito em muitas rotas — o layout raiz não cobre todas as áreas com landmark único. | `__root.tsx` + rotas | Leitores de tela sem "pular para conteúdo" confiável. | Envolver `<Outlet />` do root com `<main>` **ou** garantir um `<main>` por rota. | ⚠️ Escolher um dos dois lados | Mudança pequena no root |
| M6 | `chrismed.agendar.tsx:326` usa `toast.success('Copiado!')` mas o botão de copiar PIX é `size="icon"` sem `aria-label` — combinar com C3. | `chrismed.agendar.tsx` | Duplo problema: usuário AT nem sabe o que copiou. | `aria-label="Copiar código PIX"`. | ✅ Sim | ❌ Não |

### 🟢 BAIXA — cosmético / documentação

| # | Problema | Arquivo | Correção |
|---|---|---|---|
| B1 | Comentários em português com "TODO" em maiúsculas em `planos.tsx:202` e `admin.status-webhooks.tsx` — grep gera ruído. | 3 arquivos | Renomear para "todos" (lowercase) quando é a palavra portuguesa. |
| B2 | Placeholders de input em espanhol/português misturados em `PhoneBO.tsx` (`+591 …` como default). | `src/components/forms/PhoneBO.tsx` | Definir por locale/tenant. |
| B3 | Botão "outline + size icon" repetido no checkout (`checkout.$slug.tsx:231`) sem tooltip. | `checkout.$slug.tsx` | Adicionar `<Tooltip>` + `aria-label`. |
| B4 | `PixCheckoutCard.tsx:179` placeholder `(11) 9...` — melhor exemplo completo. | `payments/PixCheckoutCard.tsx` | Ajustar copy. |

---

## 3. Correção recomendada por bloco (mapa de arquivos)

> Somente arquivos que **seriam alterados na próxima rodada**. Nenhum arquivo foi modificado agora.

### 3.1 Acessibilidade (C3 + M6)
- `src/components/marketing/PublicHeader.tsx`
- `src/components/impulsionito/ImpulsionitoDock.tsx`
- `src/components/app/NotificationsBell.tsx`
- `src/components/app/PageElements.tsx`
- `src/components/marketing/ImpulsionitoPanel.tsx`
- `src/components/orcamento/QuoteSidebar.tsx`
- `src/components/demo/DemoCheckout.tsx`
- `src/components/affiliates/ResourceListPage.tsx`
- `src/components/core/DomainTab.tsx`
- `src/routes/checkout.$slug.tsx`
- `src/routes/chrismed.agendar.tsx`
- `src/routes/riomed.carrinho.tsx`
- `src/routes/showroom.site.tsx`, `showroom.pdv.tsx`, `showroom.clientes.tsx`
- `src/routes/demo.cliente-final.tsx`, `demo.afiliados.tsx`, `demo.white-label.tsx`
- `src/routes/_authenticated/admin.clientes.riomed.*.tsx` (produtos, precos-listas, pos, portal, vendedores)
- Demais 40 arquivos listados pelo grep (batch)

### 3.2 Responsividade mobile (A1)
- Rotas de token (usam h-screen para overlay fullscreen): `mesa.$token`, `parceiro.$token`, `parceiro-corretor.$token`, `portal.contabilidade.$token`, `portal.proprietario.$token`
- Rotas de tenant: `vitrine.$slug`, `riomed.v.$slug`, `recomendacao.$nicho`, `imoveis.$slug.$propertyId`, `demo.restaurante.$tenant.$qr`
- Interno: `_authenticated/busca.tsx`
- Batch dos 145 arquivos com `h-screen`

### 3.3 Design tokens & branding (A2)
- Rotas de impressão da imobiliária (`imobiliaria.aprovacoes.*.imprimir.tsx`) — CSS de impressão, avaliar se contrast is intencional
- `mesa.$token.tsx`
- `_authenticated/contabilidade.*`, `finance.*`, `crm.leads.$id.tsx`, `agenda.*`
- Batch dos 124 arquivos com cores hardcoded
- **Preservar sem tocar:** `colors.*`, `wmp.*` (branding preto/verde intencional)

### 3.4 Placeholders visíveis (C4, M3)
- `src/routes/wmp.index.tsx`
- `src/components/impulsionito-ic/PromptMasterEditor.tsx`

### 3.5 Auth / integrações pendentes (C2)
- `src/routes/marocas.login.tsx`
- `src/routes/marocas.contratar.$plano.tsx`
> Estes exigem hook de back-end — **fora do escopo "só front"**; sinalizar para rodada de integração.

### 3.6 SEO por rota (A6)
- `planos.tsx`, `contratar.tsx`, `vitrine.tsx`, `clube.tsx`, `suporte.tsx`, `contato.tsx`, `consumidor.tsx`, `central-de-ajuda.tsx`, `white-label.tsx`, `wmp.tsx`, `marocas.tsx`
- Rotas leaf de tenants (chrismed, riomed, colors) para `og:image` do módulo

### 3.7 Higiene de logs (M1)
- `src/lib/funnelTracking.ts`
- `src/components/app/CoreCopyGuard.tsx`
> Server-side (`payments/webhook.ts`, `uptime-check.ts`, `email/*.ts`) — manter, é log operacional.

---

## 4. Ordem recomendada de execução (próximas rodadas)

**Rodada 1 — Críticos (baixo risco, alto ganho) — só front**
1. C1: consertar link morto do `marocas.login`.
2. C3 + M6: adicionar `aria-label` em todos os `size="icon"` (batch por diretório: primeiro `components/`, depois `routes/`, depois `_authenticated/`).
3. C4 + M3: remover ou preencher placeholders visíveis (`wmp.index`, `PromptMasterEditor`).

**Rodada 2 — Responsividade mobile — só front**
4. A1: substituir `h-screen` por `h-dvh` nos 145 arquivos, com regressão visual por batch (portais primeiro, tenants depois, interno por último).

**Rodada 3 — Design tokens & contraste — só front**
5. A3: subir opacidade de placeholders de formulários dark (`colors/*`).
6. A2: migrar cores hardcoded para tokens semânticos, preservando `colors.*` e `wmp.*`. Fazer por diretório em PRs pequenos.
7. A5 + A4: revisar imagens sem `alt` (batch com script assistido).

**Rodada 4 — SEO leaf routes — só front**
8. A6: `og:image` absoluto por rota-âncora e módulo/tenant.

**Rodada 5 — Higiene**
9. M1: trocar `console.*` cliente por `logger`.
10. M5: definir estratégia de `<main>` (root vs por rota) e aplicar.
11. B1-B4: cosméticos.

**Rodada 6 — Integrações pendentes (exige back-end / fora do escopo "só front")**
12. C2: fechar TODO de auth do `marocas` — depende de definição do produto.
13. M4: auditoria dedicada de convivência entre `admin.*` legado e `_authenticated/admin.*` novo.

---

## 5. Notas finais

- **Bootstrap TanStack íntegro:** `__root.tsx` tem `notFoundComponent`, `errorComponent`, `<Outlet />` e `<html lang="pt-BR">`; `src/routes/index.tsx` não contém marcador `data-lovable-blank-page-placeholder`.
- **Nenhuma rota pública quebrada** foi encontrada além do único `href="#"` em `marocas.login`. Todos os demais links usam `<Link to="…">` do TanStack.
- **Não foi feita** inspeção página-a-página das 706 rotas — a rodada correspondente pode ser fatiada por módulo (Home+Planos → Vitrine+Clube → Áreas Admin → Áreas Cliente → Tenants) conforme a preferência de escopo do usuário.
- **Nada foi alterado.** Este documento aguarda aprovação antes de qualquer correção.

> Próximo passo: aprovar Rodada 1 (Críticos) ou solicitar recorte por módulo específico.
