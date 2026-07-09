# PLANS — Impulsionando Core

## Planos comerciais (billing)

Fonte: tabela `billing_plans` + gate `PlanGate`/`BillingGate`/`CheckoutShell`.

Estruturas suportadas hoje:
- Plano recorrente por cliente (contrato em `billing_contracts`).
- Faturas em `billing_invoices` (status: open, pending, paid, overdue).
- Régua de cobrança / dunning em `billing_dunning_policy` + `billing_dunning_runs`.
- Suspensões em `billing_suspensions`.

## Cortesia Full 30 dias (Onda 3.3)

- Parâmetro global: `core_settings.full_courtesy_days_default` (default 30).
- Estado por cliente em `companies`:
  - `full_courtesy_status` (`none | active | expired | converted | revoked`)
  - `full_courtesy_started_at`, `full_courtesy_ends_at`, `full_courtesy_days`
  - `full_courtesy_plan_id` → `billing_plans.id`
- Auditoria em `core_courtesy_events`.
- UI: aba **Plano e cortesia** do Cliente 360 + badge no header.
- RPCs (`src/lib/courtesy.functions.ts`):
  - `getFullCourtesy`, `grantFullCourtesy`, `extendFullCourtesy`,
    `revokeFullCourtesy`, `convertFullCourtesy`, `setDefaultCourtesyDays`.
- Só staff Impulsionando (`is_impulsionando_staff`) pode escrever.

## Roadmap de planos (Onda 4)

1. **Conversão de cortesia em lote** — coortes próximas do fim.
2. **Planos por nicho** com override de preço e módulos padrão.
3. **Marketplace B2B** — Taxa de Intermediação Digital com relatórios de
   GMV e overrides por nicho/fornecedor.
4. **Assinatura Consumidor Premium** — cobrança recorrente ligada ao
   `consumer_memberships`.
5. **Governança de reembolsos** — políticas em `core_refund_rules`
   ligadas ao Mercado Pago.
