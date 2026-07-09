# Matriz de Maturidade dos Tenants — Ecossistema Impulsionando

_Consolidado ao final da Onda 2.6 (Garrido). Todos os clientes auditados são empresas conectadas ao Core Impulsionando — auth, RBAC (`user_roles`+`has_role`), multi-tenant por `company_id`, billing/`BillingGate`, branding via `TenantBrandingProvider` e server logic em `createServerFn`._

## Convenção de nota
- **Inicial** — publica, mas jornada quebrada em pontos-chave.
- **Intermediário** — jornadas principais funcionam, SEO/compliance parcial.
- **Avançado** — jornadas premium, SEO/JSON-LD/breadcrumbs sistemáticos, compliance limpo, mobile e a11y sólidos.
- **Premium** — tudo do Avançado + integrações reais com o Core (pagamentos, contratos, auditoria, IA, dashboards).

## Padrões globais aplicados nesta onda

- **Scrollbar contrastada** por default (`html` + `@utility scroll-contrast` / `.scroll-invert`).
- **FAB "há mais conteúdo"** (`<MoreContentFab />` em `@/components/impulsionando`) — surge quando a página é rolável, some perto do fim. Ativado no `GarridoShell`.
- **WhatsApp restrito a suporte/pós-venda** em todos os tenants.
- **Head/SEO** — `title`, `description`, `og:*` self-referencing, `canonical` leaf-only, `BreadcrumbList` + JSON-LD específico por rota.

## Matriz

| Tenant | Escopo | Maturidade | Destaques | Pendências críticas | Próxima prioridade |
|---|---|---|---|---|---|
| **Colors Saúde** | E-commerce dermocosméticos | Avançado | PDP Super Green Black premium, antifalsificação, área do cliente + rastreio, CTAs internos priorizados. | Recuperar carrinho abandonado; provas sociais moderadas; upsell contextual. | Assinatura Colors + programa de indicação. |
| **Chrismed** | Clínica médica com internacional | Avançado | Agenda BR/Internacional, JSON-LD limpo, compliance médico revisado. | Booking real com bloqueio de agenda; pagamento antecipado; prontuário. | Motor de agenda real + lembretes multicanal. |
| **Riomed** | Marketplace B2B saúde | Avançado | Referência para distribuidoras/atacadistas; jornadas B2B coesas (hospitais, aluguel, cotação, serviço técnico). | Cotação com múltiplos fornecedores; PIM; extrato da Taxa de Intermediação Digital. | Cotação com SLA + integração real de estoque/preço. |
| **WMP** | Produção e gestão de eventos | Avançado | Shell unificado, breadcrumbs, JSON-LD, roadmap em `docs/WMP_PLATFORM_ROADMAP.md`. | Motor de agenda + PDP de eventos + ingressos; área do produtor; check-in PWA. | Piloto real: um evento com agenda ativa. |
| **Marocas** | Food service | Avançado | Plataforma completa: planos, cardápio, PDP, carrinho persistente, checkout, reservas, rastreio, arquitetura pronta para pulseiras. | Pagamento real (PIX/Cartão); KDS + pulseiras (Realtime); grid de reservas real. | PIX/Cartão + dashboard operador multi-unidade. |
| **Garrido** | Imobiliária (compra/venda/locação/temporada/lançamentos/comercial/rural) | Avançado | Shell com nav pré-filtrada; landings por segmento; busca com filtros ampliados sincronizados à URL; PDP com `RealEstateListing` + `BreadcrumbList` + CTA primário "Agendar visita"; favoritos localStorage; contas institucionalizadas; políticas LGPD; WhatsApp reduzido a suporte. | Wire real visita/proposta em `realestate_*`; contratos digitais; boletos/repasse; IA WhatsApp; app do corretor. | Ativar visita/proposta reais no Core. |

## Padrão de UX validado nos 6

- Header sticky com skip-link, tap ≥44 px, ARIA em ícone-only, menu mobile completo.
- Um único `<main>` por rota, breadcrumbs sistemáticos.
- Cards com aspect ratio fixo + `loading="lazy"` (sem layout shift).
- Focus-visible preservado (shadcn/Radix).
- Estados vazios sempre educacionais + CTA "cadastrar interesse / seguir por outro caminho".

## Sinais monitorados na auditoria transversal

- **Consistência visual**: cada tenant mantém tokens em `styles/tokens-tenants.css` + `data-tenant="<slug>"` no shell.
- **CTAs**: hierarquia primário/secundário/terciário; nenhuma rota comercial com WhatsApp como CTA principal.
- **SEO/Schema**: JSON-LD por tipo de rota (Organization sitewide, BreadcrumbList em deep, RealEstateListing/Product/FAQPage/Article nos leaves).
- **A11y**: sem `text-gray-*` de baixo contraste; ícones-only com `aria-label`; alt significativo; `role="tab"`/`aria-selected` em tabs.
- **Compliance**: nenhum depoimento inventado; nenhuma métrica sem fonte; nenhuma promessa médica.

## Prioridades globais — próxima fase

1. **Instalar `MoreContentFab`** nos shells Colors/Chrismed/Riomed/WMP/Marocas (1 linha cada).
2. **Wires reais** de conversão (visita/proposta Garrido, cotação Riomed, agenda Chrismed, checkout Marocas) contra tabelas do Core, respeitando RLS auditada.
3. **Depoimentos reais** via módulo de avaliações do Core com moderação.
4. **Área logada real** por tenant (favoritos, pedidos, propostas, contratos).
5. **Observabilidade** de conversão (view PDP, add cart/favorito, agendar visita, checkout) alimentando o funil Impulsionando.

_Próxima revisão: início da Onda 3._
