## Onda 4 — Núcleo financeiro e comercial de Afiliados e Produtos

Implementação **incremental e pontual** em cima do que já existe (tabelas `aff_*` da Onda 1-3 e `affiliates.functions.ts` da Onda 4 parcial). Nada será recriado nem apagado.

---

### Etapa 1 — Banco de dados (1 migration adicional)

**Ajustes em tabelas existentes (ADD COLUMN IF NOT EXISTS):**
- `aff_products`: `consumption_days int`, `is_recurring_consumption bool`, `allow_installments bool`, `max_installments int default 12`, `interest_paid_by text default 'customer'` (`customer` | `producer`)
- `aff_offers`: mesmos campos de parcelamento/juros (override por oferta)
- `aff_sales`: `gateway_fee numeric`, `installment_interest numeric`, `interest_paid_by text`, `coupon_id uuid`, `bump_sale_id uuid`, `upsell_of_sale_id uuid`, `kind text default 'main'` (`main|bump|upsell|cross`), `payment_status text`, `recovery_status text`
- Taxa Impulsionando fixa em 5% — constante no código (`PLATFORM_FEE = 0.05`), não em coluna

**Novas tabelas:**
- `aff_product_plans` — variações/planos (1 pote, 2 potes, 3 potes): `product_id`, `name`, `quantity`, `consumption_days`, `price_cents`, `sort_order`, `is_active`
- `aff_coupons` — `company_id`, `code`, `product_id?`, `offer_id?`, `affiliate_id?`, `discount_type` (`percent|fixed`), `discount_value`, `valid_from`, `valid_until`, `max_uses`, `used_count`, `max_per_customer`, `keep_commission bool`, `status`
- `aff_bumps` — `product_id` (principal), `bump_product_id`, `name`, `description`, `price_cents`, `image_url`, `is_active`, `affiliate_gets_commission bool`, `commission_override numeric?`
- `aff_upsells` — análogo a bumps + `trigger` (`after_approved|after_pix_pending`)
- `aff_crosssells` — `product_id`, `cross_product_id`, `moment` (`post_purchase|email|area|checkout`), `is_active`
- `aff_crm_flows` — réguas de recuperação/recompra: `company_id`, `product_id?`, `kind` (`cart_recovery|pix_pending|boleto_pending|card_declined|repurchase`), `steps jsonb` (lista de `{delay_days, channel, template}`), `is_active`
- `aff_crm_events` — log: `sale_id?`, `customer_email`, `flow_id`, `step_index`, `sent_at`, `converted_at`

Todas com GRANT a `authenticated` + `service_role`, RLS por `company_id` usando `user_belongs_to_company` + `user_has_permission('aff.<entity>.read|write')`. Novas permissões `aff.coupon.*`, `aff.bump.*`, `aff.upsell.*`, `aff.crosssell.*`, `aff.crm.*`, `aff.plan.*`.

---

### Etapa 2 — Lógica de split (extender `affiliates.functions.ts`)

Atualizar `registerAffiliateSale` para:
1. Aplicar **taxa Impulsionando = 5%** sobre `gross_amount` (constante `PLATFORM_FEE`)
2. Aceitar `gateway_fee`, `installment_interest`, `interest_paid_by` no input
3. Calcular base líquida = `bruto - 5% - gateway_fee - (juros se assumido pelo produtor)`
4. Distribuir comissões (afiliado/coprodutor/gerente) sobre base líquida ou bruto conforme config do produto
5. Resto = produtor
6. Status iniciais conforme matriz (cartão/pix/boleto)
7. `release_at = sold_at + prazo_gateway + 3 dias úteis`

Novas server functions:
- `createCoupon`, `applyCoupon` (valida validade, limites, retorna discount)
- `registerBumpSale`, `registerUpsellSale` — chamam `registerAffiliateSale` com `kind` apropriado e `parent_sale_id`
- `enqueueCrmFlow(sale_id, kind)` — insere `aff_crm_events` para cada step da régua ativa
- `seedDemoEmagrecedor` — cria produto "Super Emagrecedor Premium" + 3 planos + bump "Guia Digital" + upsell + régua de recompra

---

### Etapa 3 — UI (apenas adicionar páginas; sem refazer existentes)

Estender o submenu `AffiliatesSubnav` com: **Planos**, **Cupons**, **Order Bump**, **Upsell**, **Cross-sell**, **CRM**.

Novas rotas (TanStack file-based) sob `_authenticated/affiliates.*`:
- `affiliates.products.$id.tsx` — detalhe com abas: Planos, Bumps, Upsells, Cross-sell, CRM, Comissão, Parcelamento
- `affiliates.coupons.tsx` — CRUD via `ResourceListPage`
- `affiliates.bumps.tsx`, `affiliates.upsells.tsx`, `affiliates.crosssells.tsx` — CRUD
- `affiliates.crm.tsx` — listagem de fluxos + editor JSON simples (steps)
- `affiliates.recovery.tsx` — dashboard de carrinhos/pix/boletos pendentes + métricas

Atualizar `affiliates.index.tsx` (dashboard) com cards de recuperação/recompra (consultam `aff_crm_events`).

Em `affiliates.sales.tsx`: mostrar breakdown completo (bruto, taxa 5%, gateway, juros, comissões, líquido).

---

### Etapa 4 — Cron / fluxos

Reaproveitar `pg_cron` existente (`aff-advance-commissions`). Adicionar:
- `aff-process-crm` — endpoint público `/api/public/hooks/aff-process-crm` que percorre `aff_crm_events` pendentes e marca como `sent` (envio real fica pendente de gateway WhatsApp/Email — usa `enqueue_message` existente quando possível)
- Agendar 1×/hora

---

### Etapa 5 — Integrações de pagamento

**Não simular pagamento real.** Em todas as telas de checkout/pagamento exibir badge: *"Integração preparada — aguardando credenciais externas (gateway)"*. Toda a lógica de split/comissão/CRM funciona a partir de vendas registradas manualmente ou por webhook futuro.

---

### Etapa 6 — Seed demo

Botão "Criar produto demo (Emagrecedor)" no dashboard de Afiliados → chama `seedDemoEmagrecedor` server fn.

---

### Detalhes técnicos

- Taxa 5% em `src/lib/affiliates.constants.ts` (`export const PLATFORM_FEE = 0.05`)
- Cálculo de juros: usa tabela simples de taxas de gateway por parcela (config futura); por ora aceita input manual no registro de venda
- LGPD: afiliados só veem vendas onde `affiliate_user_id = auth.uid()` (já garantido pelas policies da Onda 5 de segurança)
- Sem alterações em autenticação, sem mexer em CRM existente (`crm_leads`/`crm_opportunities`) — o CRM de vendas/recompra é específico do módulo Afiliados (`aff_crm_*`)

---

### Entregas após aprovação

1. 1 migration SQL com novas tabelas + colunas + permissões + RLS
2. Atualização de `src/lib/affiliates.functions.ts` (split + cupons + bumps + upsells + CRM enqueue + seed demo)
3. `src/lib/affiliates.constants.ts` (PLATFORM_FEE)
4. ~8 novas rotas em `_authenticated/affiliates.*`
5. Atualização de `AffiliatesSubnav.tsx`
6. Endpoint público `aff-process-crm` + cron schedule
7. Nada existente apagado; rotas e componentes prévios intactos

**Confirmar para eu prosseguir com a implementação?**
