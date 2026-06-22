# RioMed — Finalização da Integração no Core Impulsionando

## Status: ✅ Provisionamento e schema operacional concluídos

A RioMed (Bolívia, nicho médico-hospitalar) está totalmente provisionada como **tenant do Core Impulsionando**, com plano Enterprise + Taxa de Intermediação Digital de 0,75% e isolamento por RLS via `company_id`.

---

## Fases executadas

### Fase 1 — Provisionamento ✅
- `companies.RioMed` criada (subdomínio `riomed.impulsionando.com.br`, locale `es-BO`, moeda `BOB`).
- 19 módulos core ativos em `company_modules` (CRM, ERP, estoque, comércio, etc.).
- 4 pipelines em `crm_pipelines` (Vendas, Locação, AT, B2B) com stages localizados.
- Identidade visual base em `core_tenant_identity`.

### Fase 2 — Locação ✅
- `rental_assets` — cadastro de ativos hospitalares (camas, equipamentos home care, etc.) com taxas diária/mensal, status e custo de aquisição.
- `rental_contracts` — contratos de locação por cliente com ciclo de faturamento, datas e endereço de entrega.
- `rental_contract_items` — itens de cada contrato, ligados a um ativo.

### Fase 3 — Assistência Técnica ✅
- `service_orders` — Ordens de Serviço com tipo (preventiva/corretiva), prioridade, SLA, técnico responsável, custos (mão de obra + peças).
- `service_order_events` — histórico de eventos da OS (abertura, atribuição, diagnóstico, fechamento).

### Fase 4 — Roteamento de Leads ✅
- `crm_lead_routing_rules` — regras configuráveis por segmento/origem que atribuem leads aos 7 vendedores conforme prioridade.

### Fase 5 — Recuperação de Carrinho ✅
- `commerce_abandoned_carts` — rastreamento de carrinhos abandonados para disparo de jornadas via `core_funnel_*`.

### Fase 6 — Menu Master ✅
- Itens RioMed registrados em `core_admin_menu` sob vertente `clientes`, grupo `riomed`:
  - Locação · `/admin/clientes/riomed/locacao`
  - Assistência Técnica · `/admin/clientes/riomed/assistencia`
  - Roteamento de Leads · `/admin/clientes/riomed/routing`
  - Carrinhos Abandonados · `/admin/clientes/riomed/carrinhos`

---

## Segurança e isolamento

Todas as 6 novas tabelas seguem o padrão Core:

```sql
USING (user_belongs_to_company(auth.uid(), company_id)
   OR is_impulsionando_staff(auth.uid()))
```

- Equipe RioMed vê **apenas** seus dados.
- Staff Impulsionando (`raygs@hotmail.com`) tem visão master.
- Cliente-teste `raygsmonnerat@gmail.com` será auto-seed via trigger existente.

Índices em `company_id` (+ status, quando aplicável) garantem performance em escala.

---

## Próximos passos (UI/UX)

As estruturas de dados estão prontas. As telas administrativas (CRUD de ativos, contratos, OS, regras de routing, dashboard de carrinhos) podem ser construídas incrementalmente sobre essa base, todas reaproveitando:

- `CheckoutShell` / `BillingGate` / `PlanGate` do Core
- `TenantBrandingProvider` com identidade RioMed
- `createServerFn` com `requireSupabaseAuth` para todas as mutações
- Componentes shadcn já existentes no Core

A RioMed agora opera como tenant full-feature do Core Impulsionando, replicável para qualquer outro cliente médico-hospitalar trocando apenas o `company_id`.
