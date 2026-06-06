
# Módulo "Afiliados e Produtos" — Plano incremental

Hoje "Afiliados" só existe como conteúdo de marketing (`/modulos#afiliados`). Não há rotas internas nem tabelas de afiliados/coprodutores/gerentes/comissões dedicadas. Vou promover o módulo no app autenticado **sem mexer em nada funcional** (CRM, Finance, Sales, Inventory, Agenda, EHR, Auth permanecem intactos).

Execução em 5 ondas curtas. Aprovo onda por onda — só sigo para a seguinte com seu "ok".

## Onda 1 — Banco de dados (migration única)

Tabelas novas no schema `public`, todas com RLS + GRANTs:

- `aff_products` — produto comissionável (nome, descrição, categoria, nicho, tipo, valor base, status, permite_afiliado, exige_aprovacao, comissao_padrao_pct).
- `aff_offers` — ofertas por produto (nome, valor, tipo_cobranca, recorrencia, trial, comissao_pct, status).
- `aff_affiliates` — afiliado (user_id?, nome, doc, contatos, canal, pix, status, gerente_id).
- `aff_coproducers` — coprodutor por produto/oferta (percentual, valor_fixo, escopo, status).
- `aff_managers` — gerente de afiliados (comissao_pct, tipo).
- `aff_affiliate_products` — autorização afiliado×produto + comissão custom.
- `aff_links` — link/cupom/QR único (slug, tipo, utm, contadores cliques/leads/vendas/receita).
- `aff_sales` — venda registrada (link_id, produto, oferta, afiliado, gerente, coprodutor, valor_bruto, taxa_gateway, valor_liquido, forma_pagto, status_financeiro, datas).
- `aff_commissions` — linha de comissão por participante (tipo: produtor/copro/afiliado/gerente, valor, status, prazo_liberacao, data_liberacao, data_pagto).
- `aff_payouts` — solicitação e pagamento de saque.

RLS: leitura/escrita por `user_belongs_to_company` + `user_has_permission` (novas permissões `aff.*`). Afiliado/coprodutor/gerente veem apenas o que é seu via `user_id`.

Status financeiros enum: `venda_registrada`, `pagto_pendente`, `aprovado`, `aguardando_gateway`, `aguardando_prazo_interno`, `disponivel`, `saque_solicitado`, `saque_aprovado`, `pago`, `cancelado`, `estornado`, `chargeback`, `bloqueado`.

Regra de prazo: trigger que calcula `data_liberacao = data_aprovacao + prazo_gateway_dias + 3 dias úteis`.

## Onda 2 — Rotas e menu interno

Layout `src/routes/_authenticated/affiliates.tsx` (com `<Outlet/>`) + leaves:

- `affiliates.index.tsx` — Dashboard
- `affiliates.products.tsx` + `.new.tsx` + `.$id.tsx`
- `affiliates.offers.tsx`
- `affiliates.affiliates.tsx` (lista + aprovação)
- `affiliates.coproducers.tsx`
- `affiliates.managers.tsx`
- `affiliates.links.tsx` (links / cupons / QR)
- `affiliates.commissions.tsx`
- `affiliates.splits.tsx` (regras)
- `affiliates.sales.tsx`
- `affiliates.payouts.tsx`
- `affiliates.campaigns.tsx`
- `affiliates.reports.tsx`
- `affiliates.settings.tsx`

Adicionar entrada **"Afiliados e Produtos"** no `AppSidebar` como módulo principal, com os submenus acima. Nada removido do menu atual.

## Onda 3 — Painéis por perfil

Componentes compartilhados em `src/components/affiliates/`:

- `ProducerDashboard` — produtos, ofertas, afiliados, vendas, receitas, ROI.
- `AffiliateDashboard` — produtos disponíveis, links, cliques→vendas, comissão pendente/liberada/paga, próxima liberação.
- `CoproducerDashboard` — produtos vinculados, % participação, receita líquida estimada.
- `ManagerDashboard` — afiliados sob gestão, ranking, conversão, comissão gerada.

Roteamento por perfil: `affiliates.index.tsx` decide qual dashboard renderiza com base em `user_profiles`/permissões.

## Onda 4 — Server functions + lógica de split

`src/lib/affiliates.functions.ts`:

- CRUD de produtos, ofertas, afiliados, coprodutores, gerentes, links.
- `registerAffiliateSale` — recebe venda, calcula split (produtor/copro/afiliado/gerente/plataforma/gateway), grava `aff_sales` + linhas em `aff_commissions` com `data_liberacao`.
- `advanceCommissionStatus` (cron) — promove `aguardando_*` → `disponivel` quando passa o prazo.
- `requestPayout` / `approvePayout` — fluxo de saque.
- Tracking: endpoint público `/api/public/aff/r/$slug` registra clique e redireciona; cookie de atribuição 30d.

Nada toca em `sales_orders`/`fin_*` — split usa as tabelas `aff_*` próprias e só **lê** `fin_payment_methods` para listar formas.

## Onda 5 — Marketing + integrações

- Atualizar `src/routes/modulos.tsx` seção `#afiliados` apontando para o módulo interno.
- Garantir item "Afiliados e Produtos" no `PublicHeader` (Soluções → Crescimento).
- Documentar no painel: o que depende de credencial externa (gateway de pagamento para `valor_liquido` real, webhook de aprovação/chargeback).

## Pendências explícitas (fora do escopo desta entrega)

- Integração ao vivo com gateway (Stripe/Paddle/Asaas) para receber webhooks de `aprovado/estornado/chargeback` → a lógica fica pronta, só precisa do conector e segredo quando você quiser ativar.
- Geração de PDF de contrato de afiliado (futuro).

## Confirmação

Posso começar pela **Onda 1 (migration)** agora? Você revisa, aprova a migration, e seguimos para a Onda 2.
