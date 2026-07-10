# Marocas — Fase A · Vitrine Pública Premium

Data: 2026-07-10 · Onda: Marocas Full · Fase: A (Vitrine Pública)

Cliente de referência do ecossistema Impulsionando para Food Service. Fase A
eleva toda a vitrine pública ao nível internacional/Copacabana, sem quebrar
arquitetura, DB, Supabase, RLS ou rotas existentes.

## Escopo entregue

### Camada de identidade / conteúdo
- **`src/components/marocas/marocasContent.ts`** (novo) — fonte única de
  conteúdo público: brand, contato, horários, bairros de delivery, história,
  eventos, prova social por métricas, imagens ultrarrealistas (placeholders
  Unsplash claramente marcados para troca pelo kit oficial). Nenhum
  depoimento fictício com nome real.
- **`src/components/marocas/MarocasShell.tsx`** (refino profundo) — header
  glass sticky com transição transparente→sólido no scroll, uso do logo
  oficial (`marocas-logo.png.asset.json`), navegação estendida
  (Cardápio · Delivery · Reservas · Eventos · Sobre · Contato), CTA
  "Reservar mesa" no header, menu mobile completo com WhatsApp/endereço,
  footer editorial em fundo escuro com Instagram, mapa, horários e canais
  segmentados. Wrapper `data-tenant="marocas"` ativa tokens da marca +
  camada Copacabana Sunset (coral/areia).

### Páginas refeitas / criadas
- **`src/routes/marocas.tsx`** (home refeita) — hero cinemático 92dvh com
  wave divider evocando o calçadão, prova social por métricas, 3 modos de
  pedir (delivery/retirada/reserva), split editorial "história em
  Copacabana", categorias em grid grande, chef's picks em seção escura
  premium, galeria estilo Instagram, novidades da temporada, CTA de eventos
  full-bleed, strip de imprensa, blocos de confiança, endereço/horário e
  CTA final. JSON-LD `Restaurant` completo com endereço, telefone,
  horários e menu.
- **`src/routes/marocas.eventos.tsx`** (novo) — hero editorial + 6 formatos
  clicáveis (aniversários, corporativos, confraternizações, mini weddings,
  chef em casa, workshops), lista de inclusos, formulário de orçamento com
  tela de sucesso e CTA WhatsApp.
- **`src/routes/marocas.sobre.tsx`** (novo) — hero Copacabana, manifesto
  em serifa, timeline 2012→2024 alternada, 4 pilares de valores, CTAs.
- **`src/routes/marocas.contato.tsx`** (novo) — 4 canais segmentados
  (WhatsApp da casa · Reservas · Eventos · Imprensa), mapa Google embed,
  endereço, telefone, horários, Instagram.
- **`src/routes/marocas.delivery.tsx`** (novo) — hero orla, 3 promessas,
  busca de bairro + lista de 12 bairros da Zona Sul com prazo/taxa
  (Copacabana grátis), CTA para cardápio.
- **`src/routes/marocas.reservas.tsx`** (refino) — hero imersivo, cards
  em bloco premium, tela de sucesso rica com formatação de data em
  extenso e CTA WhatsApp, e-mail de reservas como fallback.
- **`src/routes/marocas.faq.tsx`** (refino) — busca + filtro por 5
  categorias, 13 perguntas cobrindo pedidos/delivery/reservas/eventos/
  institucional, CTA de suporte.

### Preservado sem quebrar
- `src/routes/marocas.cardapio.tsx`, `marocas.cardapio.$slug.tsx`,
  `marocas.carrinho.tsx`, `marocas.checkout.tsx`, `marocas.pedidos*`,
  `marocas.assistente.tsx`, `marocas.login.tsx`, `marocas.planos.tsx`,
  `marocas.contratar.$plano.tsx` — continuam funcionando, mudanças
  visuais herdadas via `MarocasShell` e novo `data-tenant`.
- `foodMenu.ts`, `useMarocasCart.ts`, `marocasPlanos.ts`,
  `MarocasHelpFab.tsx` — inalterados.

## Melhorias implementadas

1. **Identidade Copacabana cosmopolita** — hero cinemático, wave divider
   evocando o calçadão, camada quente coral/areia por cima do verde
   marocas, tipografia serifada (font-serif do Tailwind) para hierarquia
   editorial, microinterações (hover-scale, story-link, fade-in) usando
   classes já disponíveis em `src/index.css`.
2. **Prova social honesta** — apenas métricas de casa e badges genéricos
   de veículos ("Vistos e comentados em"), sem depoimentos com nomes
   inventados. Fácil de trocar por citações reais depois.
3. **CTAs fortes e claros** — cada seção termina em ação: pedir, reservar,
   solicitar orçamento, falar no WhatsApp.
4. **Navegação impecável** — header sticky glass com progressive
   enhancement, breadcrumbs em todas as rotas internas, footer com 4
   colunas organizadas por intenção.
5. **Mobile-first** — todos os grids colapsam bem, tap targets ≥44×44,
   header mobile com sheet full-screen e WhatsApp/endereço em destaque.
6. **Acessibilidade AA** — skip-link, `aria-label` em ícones, `aria-pressed`
   em toggles, formulários com `<label>` associados, `text-muted-foreground`
   consistentemente (sem `text-gray-*`), foco visível via `focus:ring`.
7. **SEO completo** — cada rota tem `title`/`description`/`og:*`/canonical
   apontando para si mesma; JSON-LD Restaurant na home e FAQPage no /faq;
   `og:image` em rotas leaf usando as imagens dos heróis.

## Ganhos esperados

- **Conversão de pedido**: hero acionável, prova social above-the-fold,
  redução de fricção com 3 modos de pedir explícitos.
- **Reservas**: CTA sempre visível no header + tela de sucesso confiável
  reduz abandono e aumenta o link cross-canal com WhatsApp.
- **Eventos**: nova página com formulário próprio abre um funil B2B/B2C
  que antes não existia.
- **SEO local**: JSON-LD Restaurant, endereço em Copacabana, horários
  estruturados e canonical corretos melhoram o pacote local do Google.
- **Percepção de marca**: linguagem editorial + identidade Copacabana
  posiciona a Marocas no mesmo campo dos concorrentes premium.

## Riscos

- **Imagens Unsplash**: são placeholders licenciáveis para preview. Antes
  de publicar em produção definitiva, substituir pelo kit fotográfico
  oficial da Marocas (mesmas variáveis em `MAROCAS_IMAGENS`).
- **Dados de contato**: endereço, telefone fixo, WhatsApp e emails são
  placeholders plausíveis (Rua Barata Ribeiro, 500 · Copacabana). Trocar
  em `MAROCAS_CONTATO` quando o cliente validar.
- **Google Maps embed**: usa a mesma query do endereço placeholder. Ajuste
  automático quando o endereço real for atualizado.
- **Iframe do mapa**: sem API key — usa embed público do Google Maps, que
  respeita o CSP padrão. Se o `Content-Security-Policy` do projeto
  bloquear `frame-src google.com`, será necessário whitelisting.

## Pendências para o Codex

- **Fase B — Área do Cliente**: refino de `/marocas/pedidos`,
  `/marocas/pedidos/$id`, `/marocas/login`, novo `/marocas/conta`,
  `/marocas/favoritos`, `/marocas/enderecos`, `/marocas/fidelidade`,
  `/marocas/cupons`, `/marocas/pagamentos` e integração real do
  `/marocas/assistente` com o Cérebro IA por Cliente (Fase 3.4).
- **Fase C — Cockpit Operacional**: rotas `/marocas/cockpit/*` com KDS,
  mapa de mesas, comandas por pulseira, fila de preparo, retirada,
  delivery, reservas do dia, ocupação, financeiro.
- **Fase D — Automações N8N**: payloads e docs para reserva confirmada,
  lembrete 2h/24h, aniversário, pós-visita/NPS, recuperação de cliente,
  abandono de carrinho, campanhas de fidelidade.
- **createServerFn** para reservas, eventos e delivery (hoje os forms
  apenas mostram tela de sucesso local — comentários `TODO Codex` marcam
  os pontos).
- **Substituir imagens Unsplash e dados de contato** pelo kit oficial da
  Marocas quando o cliente entregar.
- **Ativação do Plano Full 30d**: consumido pelo core Impulsionando via
  `CheckoutShell`/`BillingGate` — nenhuma mudança de schema necessária
  nesta fase. A Marocas segue como tenant Full ativado por cortesia.

## Próximos passos recomendados

1. Validar visualmente no preview
   (`https://id-preview--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/marocas`).
2. Trocar `MAROCAS_CONTATO` e `MAROCAS_IMAGENS` pelos dados oficiais.
3. Aprovar Fase A e iniciar **Fase B — Área do Cliente**.
