# Marocas — Plataforma de food service do ecossistema Impulsionando

Marocas passa a ser o cliente de referência do core Impulsionando para o nicho de alimentação. Tudo desenvolvido aqui deve ser reutilizável por bares, restaurantes, cafeterias, hamburguerias, pizzarias, delivery, dark kitchens e redes de franquia.

## O que já está ativo (frontend)

- **Home** (`/marocas`): hero comercial (pedir agora / reservar mesa), destaques, categorias, novidades, endereço/horário, CTA de plataforma.
- **Cardápio** (`/marocas/cardapio`): busca, filtros por categoria, ordenação (preço/rapidez), estado esgotado, tags (vegetariano, novo, mais pedido).
- **PDP** (`/marocas/cardapio/$slug`): fotos, adicionais obrigatórios/opcionais, observações, quantidade, "adicionar ao carrinho" + "ir ao carrinho", relacionados.
- **Carrinho** (`/marocas/carrinho`): edição de quantidade, remoção, modo (delivery/retirada/salão), taxa de entrega, resumo persistente em localStorage.
- **Checkout** (`/marocas/checkout`): contato, endereço (só delivery), pagamento (PIX/cartão/presencial), troco, resumo fixo e confirmação com código de rastreio.
- **Reservas** (`/marocas/reservas`): data/hora/pessoas/ocasião, validação básica, confirmação.
- **Meus pedidos** (`/marocas/pedidos`) e **rastreio** (`/marocas/pedidos/$id`): timeline recebido → preparando → saiu → entregue.
- **FAQ** (`/marocas/faq`): JSON-LD FAQPage.
- **Planos** (`/marocas/planos`): três planos B2B (Balcão, Salão, Rede) com jornada de contratação em 3 passos.
- **Assistente** (`/marocas/assistente`): tópicos guiados; WhatsApp só como SAC.
- **Login** (`/marocas/login`): área do cliente (fluxo mock, aguarda integração real).
- **Shell** (`MarocasShell`): header sticky, nav mobile, breadcrumbs, badge de carrinho, footer 4 colunas, skip-link.

Componentes reutilizáveis vivem em `src/components/marocas/`:
- `MarocasShell.tsx`
- `MarocasHelpFab.tsx`
- `foodMenu.ts` (mock)
- `useMarocasCart.ts` (localStorage)
- `marocasPlanos.ts`

## Módulo obrigatório: Comandas por pulseira numerada

Todo o fluxo já está preparado para receber o módulo de pulseiras:

- `CartState.pulseira` e `CartState.mesa` já existem em `useMarocasCart.ts`.
- Modo `salao` no carrinho e no checkout mostra placeholder explicando o fluxo futuro.
- Plano **Salão Marocas** anuncia o recurso ao operador na página de planos.
- Assistente contém tópico dedicado explicando o fluxo.

**Pontos de integração previstos para o Codex:**

1. **Onboarding no salão**: rota `/marocas/mesa/$numero` (a criar) leia QR da mesa, associe a pulseira (via `POST /rest/v1/salon_wristbands`).
2. **Vinculação da comanda**: cada linha do carrinho, ao entrar no modo `salao`, gera `salon_orders` com `wristband_id`.
3. **Fechamento**: rota `/marocas/mesa/$numero/fechar` com opção "fechar por pulseira", "fechar por CPF" ou "dividir a comanda".
4. **Impressão em cozinha**: emitir evento `kitchen.order.created` (KDS) via server function.
5. **Segurança**: RLS por `company_id` + `session_id` de mesa; pulseira ativa só enquanto sessão aberta.

## Dashboard recomendado (operador Marocas)

A arquitetura sugerida para `/admin/clientes/marocas/painel` (a implementar via core):

```
KPIs topo:
  ─ Vendas hoje (R$, ticket médio, nº pedidos)
  ─ Ocupação atual (mesas ativas, ocupação %)
  ─ Pedidos por canal (salão / delivery / retirada)
  ─ SLA cozinha (tempo médio de preparo vs. estimado)

Painéis:
  ─ KDS (cozinha em tempo real)
  ─ Mapa de mesas + comandas por pulseira
  ─ Fila de delivery (rotas, entregador, ETA)
  ─ Reservas do dia (confirmadas / no-show)
  ─ Estoque crítico (itens esgotados / próximos do fim)
  ─ Financeiro do dia (recebimentos por método, taxa, líquido)

Rede (multi-unidade):
  ─ Comparativo por unidade, hora, dia, categoria
  ─ Franqueadora aprova mudanças de cardápio/preço
  ─ Royalties automáticos (fixo ou % sobre venda)
```

Reaproveita: `hooks/useCompanyModules`, `TenantBrandingProvider`, `CheckoutShell`, `PlanGate`, RBAC via `has_role`.

## Reutilização por outros clientes food service

Todos os componentes em `src/components/marocas/` são pensados para serem promovidos ao registry oficial `src/components/impulsionando/foodservice/` na próxima onda:

- `MarocasShell` → `FoodServiceShell` com `brand` prop.
- `useMarocasCart` → `useFoodCart` (mesma API, storage key parametrizada).
- `foodMenu.ts` → schema de tipos + adapter de dados por tenant.
- `marocasPlanos.ts` → planos padrão do nicho (Balcão / Salão / Rede) reutilizados por qualquer marca conectada.

## Pendências Codex

1. Substituir `useMarocasCart` (localStorage) por sessão persistente com fallback anônimo + login.
2. Integrar checkout real (PIX Copia e Cola + cartão via Paddle/Mercado Pago). Não cobrar antes de integrar.
3. Ativar módulo de pulseiras/mesa (schema `salon_sessions`, `salon_wristbands`, `salon_orders`).
4. KDS (Kitchen Display System) via realtime.
5. Reservas com validação de disponibilidade real (grid de mesas × horários).
6. Área logada do cliente: histórico, favoritos, repetir pedido em 1 clique, benefícios.
7. Dashboard do operador (multi-unidade, KPIs, financeiro).
8. Substituir números de WhatsApp placeholder por reais.
9. Substituir imagens Unsplash por fotos autorizadas.

## Compliance mantido

- Sem depoimentos reais.
- Sem urgência artificial ("só hoje", "última chance").
- Sem promessas de resultado.
- Sem promessa de cobrança se o pagamento real ainda não estiver integrado.
- WhatsApp posicionado exclusivamente como SAC/pós-venda.
- "Cliente" e "empresa conectada ao core", nunca "tenant" em copy pública.
