# Auditoria de Front-end — Core Impulsionando (W110)

> Escopo: **read-only**, front-end público + shell autenticado + Impulsionito.
> Regra observada: `mem/core/frontend-only-lock.md` — nada editado, apenas
> apontado. Prioridades classificadas P0 (bloqueia venda / SEO / navegação),
> P1 (fricção clara), P2 (polimento).

## 1. Panorama

- **182 rotas** em `src/routes/` — ecossistema muito grande, o principal
  risco não é falta de páginas e sim **descoberta**: usuário/lead nunca vê o
  que existe (showroom, demos, nichos, tenants). Prioridade máxima é
  hierarquia e navegação, não criar mais páginas.
- Superfícies principais:
  - **Marketing/lead** (`/`, `/nichos*`, `/planos`, `/modulos*`, `/showroom.*`,
    `/ecossistema`, `/empresas`, `/consumidor`, `/clube`, `/white-label`,
    `/wmp*`, `/trabalhe-conosco*`, `/talentos`, `/vitrine*`, `/contato`,
    `/sobre`, `/legal`, `/termos`, `/central-de-ajuda`).
  - **Demos** (`/demo.*` — 20+ rotas, muitas órfãs no menu).
  - **Contratação** (`/contratar*`, `/checkout.*`, `/trial*`).
  - **Tenants públicos** (`/chrismed.*`, `/riomed.*`, `/marocas.*`,
    `/imoveis.*`, `/wmp.*`, `/clube`).
  - **Autenticado** (`/_authenticated/*` sob `AppShell` — dashboards, CRM,
    finance, agenda, admin, master-hub etc.).

## 2. Achados por superfície

### 2.1 Home + hero + menu principal (P0)

- **Menu principal (`PublicHeader.tsx`)**: verificar se expõe as 6 âncoras
  do ecossistema (Nichos · Planos · Demos · Ecossistema · Clube · Contato).
  Hoje há risco de submenu longo com destinos desconhecidos pelo lead.
- **Hero (`HomePage.tsx`)**: recém-refinado (W-anterior). Confirmar
  hierarquia mobile: título → subtítulo → 2 CTAs (Testar / Ver Planos) →
  prova social. Evitar 4+ CTAs concorrentes acima da dobra.
- **Prova social**: falta bloco unificado com CHRISMED · RioMed · WMP ·
  Marocas · Garrido logo abaixo do hero.
- **CTA "Como funciona"**: hoje disperso — sugerir seção única com 3
  passos (Escolher nicho → Ativar módulos → Publicar).

### 2.2 Nichos (P0)

- `/nichos` (index) + `/nichos/$slug` existem. Verificar:
  - cada slug tem proposta de valor + módulos + jornada + CTA?
  - imagens genéricas ou de nicho?
  - metadados OG por nicho (crítico para share em WhatsApp)?
- Nichos que **precisam existir**, checar cobertura: saúde, clínicas,
  medicina ocupacional, restaurantes/bares, microcervejarias, imobiliárias,
  eventos, serviços profissionais, e-commerce, distribuidores, locação,
  white label.

### 2.3 Planos + contratação (P0)

- `/planos` e `/contratar*`: revisar comparativo (tabela de features por
  plano), preço visível, CTA "Testar grátis" vs "Assinar".
- `/checkout.$slug` e `/checkout.index`: fluxo mobile precisa auditar
  passos, resumo do pedido fixo, e volta para plano anterior.
- `/trial` + `/trial_.cadastro`: duplicidade suspeita — validar se ambos
  estão linkados no menu ou se uma é órfã.

### 2.4 Showroom (P0 descoberta)

- **50+ rotas `/showroom.*`** — é a maior biblioteca comercial do site e
  provavelmente pouco descoberta pelo lead. Sugestão: index visual
  `/showroom` com grid categorizado (Vendas · Operação · Financeiro ·
  Marketing · IA · Integrações · Setores).
- Cada showroom deve terminar em **1 CTA** ("Testar este módulo" →
  `/trial?modulo=<slug>`), não 3.

### 2.5 Demos (P1)

- 20+ rotas `/demo.*` — muitas provavelmente órfãs do menu. Consolidar em
  `/demo.index` com filtros por vertical.
- `/demo.restaurante.$tenant.$qr` (QR de mesa) é uma joia comercial, quase
  invisível hoje.

### 2.6 Tenants públicos (P1)

- **CHRISMED** (`/chrismed*`): 10 rotas, provavelmente melhor estruturado.
  Verificar OG por rota e consistência visual entre `.clinica`,
  `.consultorio`, `.teleconsulta`, `.ocupacional`.
- **RioMed** (`/riomed*`): 14 rotas, muitas de portal (fornecedor,
  hospital, vendedor, técnico). Confirmar CTA claro na home `/riomed` para
  cada persona.
- **Marocas / Garrido / WMP / Clube**: revisar hero e prova social.

### 2.7 Autenticado — `AppShell` (P1)

- Sidebar (`Sidebar.tsx`) + Topbar + Breadcrumbs + MobileBottomNav — OK
  estruturalmente.
- **Impulsionito**: hoje é FAB (`ImpulsionitoFab.tsx`) que abre
  WhatsApp. **Deveria** abrir uma janela dentro do Core
  (`ImpulsionitoPanel.tsx` já existe — falta wire-up).
- Dashboards por perfil: verificar se admin master, gestor, vendedor,
  afiliado, financeiro, suporte, atendimento têm cada um seu home próprio
  ou compartilham `/dashboard` (risco de cognitive overload).

### 2.8 Auth + erro (P1)

- `/auth`, `/reset-password`, `/reset-password-sent`, `/empresa.login`,
  `/marocas.login`, `/clube.login`, `/white-label.login`, `/admin.login`
  — **muitos logins**. Padronizar visual (mesma card, mesma tipografia,
  branding por tenant via `TenantBrandingProvider`).
- Página de erro global (`errorComponent` do `__root`): confirmar copy
  humana, botão "voltar para home" e link "reportar problema".

### 2.9 Rodapé + institucional (P2)

- `PublicFooter.tsx`: revisar mapa do site — link para showroom,
  ecossistema, nichos, planos, blog (se houver), legal, termos, LGPD,
  canal oficial.

## 3. SEO / OG / meta (P0)

- `__root.tsx` OK (metatags globais, JSON-LD Organization, favicon PWA).
- **Faltando**: `og:image` por rota crítica (nichos, showroom, planos,
  tenants). Hoje toda rota herda a mesma imagem do core → share ruim em
  WhatsApp/LinkedIn.
- **Faltando**: `canonical` em rotas leaf (auditoria por rota exige batch).
- Sitemap.xml estático em `public/` — precisa contemplar showroom + nichos
  + demos (senão Google não indexa a biblioteca).

## 4. Acessibilidade / responsivo (P1)

- `MobileBottomNav` ok, mas conferir se cobre autenticado + público.
- Contraste dos botões `bg-gradient-primary text-primary-foreground` no
  header em modo claro — validar WCAG AA.
- Focus ring visível em Links, Buttons, PromptInput — auditar
  globalmente.

## 5. Rotas / botões que provavelmente estão quebrados

Sem edição, apontamentos para verificar (grep sugerido em novo turno):
- CTA "Testar" espalhado em múltiplos componentes → apontar todos para
  `/trial` (unificar destino).
- CTA "Falar com especialista" → hoje vai para WhatsApp externo em uns
  cards e para `/contato` em outros. Padronizar.
- `/trabalhe-conosco.$nicho.tsx` — validar se cada nicho tem conteúdo ou
  cai em 404.
- `/status.$slug.tsx` — página de status por tenant, confirmar que
  aparece no rodapé de cada subdomínio.
- `/vitrine*` — verificar se está sendo indexada e alimentando SEO
  long-tail.

## 6. Impulsionito (estado atual → alvo)

Estado atual:
- `ImpulsionitoFab.tsx`: FAB bottom-left que abre um popover com dica
  contextual + botão para WhatsApp externo.
- `ImpulsionitoPanel.tsx`: componente de painel (recém-adicionado,
  visual) — ainda não conectado a nenhum transport de chat real.
- `src/lib/impulsionito-context.functions.ts`: server fn que carrega
  contexto do tenant (métricas + amostras) — pronta, mas não usada por
  nenhuma UI.

Alvo (esperando autorização — ver `IMPULSIONITO_BACKEND_ROADMAP_W110.md`):
- Widget dentro do site + janela no Core.
- Chat real via server fn interna (`/api/impulsionito/chat`).
- Histórico persistido, contexto por tenant/módulo/página.
- Handoff humano, base de conhecimento, integração WhatsApp sem Papo AI.

## 7. Recomendação de ordem de execução

1. **B (home + hero + menu + rodapé)** — impacto imediato de conversão.
2. **C (páginas de nicho)** — SEO + venda direta.
3. **Showroom index visual** (não estava nos blocos A–F originais, mas
   subiu para P0 nesta auditoria).
4. **D (janela visual do Impulsionito no Core)** — sem backend, só UI.
5. **E (demos por nicho)** — completa a narrativa comercial.
6. **F (roadmap backend Impulsionito)** — entregue já como doc separado.

Nenhum item acima toca Supabase, RLS, auth, tenants, deploy ou
integrações — todos cabem dentro da trava front-only.
