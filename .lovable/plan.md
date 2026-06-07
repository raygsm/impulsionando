## Objetivo

Implementar a política padrão de **faturamento recorrente, régua de cobrança automática (D-7 / D-1 / D0 / D+1) e suspensão/reativação automáticas** no ERP da Impulsionando, e aplicar essa política ao primeiro cliente real: **Patrícia Lenine Psicologia**.

A regra precisa virar **modelo padrão**: toda nova contratação herda a mesma régua sem intervenção manual.

## O que JÁ existe (vamos reutilizar, não recriar)

- `fin_transactions` (receitas/despesas, status, vencimento) → usado para setup e mensalidades
- `fin_accounts`, `fin_categories`, `fin_payment_methods` → contas, categorias, métodos
- `subscriptions` (cliente, plano, ciclo, status, período) → contrato recorrente Paddle/Stripe
- `message_outbox` + `message_templates` → envio WhatsApp/e-mail
- `companies`, `company_modules`, `customers` → cadastro do cliente Patrícia Lenine
- `notifications`, `audit_logs` → trilha de auditoria
- Rotas: `finance.*`, `admin.billing`, `minha-assinatura`

## O que falta (novo)

### 1. Schema (1 migração)

Novas tabelas em `public`:

- `billing_plans` — catálogo de planos (Mensal R$ 99,90, Trimestral, Anual etc.) com `setup_fee`, `recurring_amount`, `cycle`, `due_day`.
- `billing_contracts` — contrato ativo de cada cliente (company_id, plan_id, start_date, due_day, status: `active|suspended|cancelled`, next_due_date, last_paid_at).
- `billing_invoices` — fatura mensal gerada (contract_id, period_start, period_end, due_date, amount, status: `open|paid|overdue|cancelled`, pix_payload, paid_at).
- `billing_dunning_policy` — régua padrão configurável (steps: dias relativos, canais, template_key, ação).
- `billing_dunning_runs` — log de cada disparo (invoice_id, step, channel, sent_at, status).
- `billing_suspensions` — histórico de suspensão/reativação (contract_id, suspended_at, reason, reactivated_at).

Tudo com RLS por `company_id` + GRANTs (admin/superuser veem global).

### 2. Lógica automática (cron + server functions)

- Server fn `runBillingCycle` (já fica registrada como cron pg_cron diário às 00:05):
  - gera próxima fatura quando faltar 7 dias para `next_due_date`
  - dispara passo D-7 / D-1 / D0 conforme `billing_dunning_policy`
  - às 00:01 do dia seguinte ao vencimento: marca `overdue`, suspende contrato, grava em `billing_suspensions`
- Server fn `markInvoicePaid` → libera contrato, dispara reativação automática, registra `paid_at` no `fin_transactions` + recibo NFe (flag).
- Reativação consulta `billing_suspensions` em aberto e atualiza `contracts.status = active`.

Templates de mensagem (`message_templates`) com PIX (chave, copia-e-cola, QR placeholder). Renderização final via `message_outbox`.

### 3. Efeito de suspensão no app

- Hook `useContractStatus()` consulta o contrato ativo da empresa.
- Em `_authenticated/route.tsx`: se `status = suspended` → redireciona para `/conta-suspensa` (página nova com instruções e botão "Já paguei").
- Páginas públicas do tenant (agenda pública / site) mostram banner "Serviço temporariamente indisponível por pendência financeira" (componente `<SuspendedBanner />` consumido pelas rotas de paciente/agenda pública).
- Bloqueio de novos agendamentos: `agenda_appointments` policy adicional via trigger checando contrato ativo.

### 4. UI nova

- `/_authenticated/admin/billing-policy.tsx` — editar a régua padrão (D-7/D-1/D0/D+1), templates, e ativar para todas as empresas.
- `/_authenticated/admin/billing-contracts.tsx` — lista de contratos recorrentes, status, próximo vencimento, ações (forçar suspensão / reativar / marcar pago / gerar fatura agora).
- `/_authenticated/admin/billing-contracts.$id.tsx` — detalhe do contrato com timeline de faturas + log de cobranças + suspensões.
- Card no `admin.billing` existente: "Receita recorrente do mês", "Inadimplentes", "Suspensos".
- `/conta-suspensa.tsx` — página da cliente quando suspensa.

### 5. Seed do cliente Patrícia Lenine (via `supabase--insert`)

- Cria `company` "Patrícia Lenine Psicologia" (subdomínio `patricialenine`).
- Cria `customer` Patrícia.
- Cria `fin_transaction` receita R$ 307,00 categoria "Setup / Implantação", pago em 08/06/2026 via Pix.
- Cria `billing_plan` "Mensal — Licença de Uso" (R$ 99,90, due_day=5).
- Cria `billing_contract` ativo, start 05/07/2026, next_due_date 05/07/2026.
- Marca registro de Nota Fiscal (flag `nfe_issued_at=08/06/2026`).

### 6. Política como padrão

- Linha única em `billing_dunning_policy` com `is_default=true` e os 4 passos.
- Trigger ao inserir novo `billing_contract`: se a empresa não tem política própria, herda a default.

## Detalhes técnicos resumidos

- Cron via pg_cron chamando `/api/public/hooks/billing-tick` (apikey anon).
- Envio: o `runBillingCycle` apenas insere em `message_outbox`; o flusher existente entrega.
- PIX: campos `pix_key`, `pix_copy_paste`, `pix_qr_url` no `billing_invoices` (gerados no momento da fatura — placeholder estático no MVP, integração InfinitePay já existe no projeto).
- Tudo idempotente via `unique(invoice_id, step)` em `billing_dunning_runs`.

## Fora do escopo desta etapa

- Geração real de NFe (apenas marcamos a flag; integração fiscal fica para depois).
- Geração dinâmica de QR Pix por fatura (usa o copia-e-cola configurado no plano por enquanto).
- Despublicação real do site do tenant (banner cobre o caso; "despublicar" de fato exige integração com publishing — fica como TODO marcado).

## Confirmação

Topa que eu siga exatamente esse escopo, incluindo seed da Patrícia Lenine e cron diário? Se sim, executo: migração → server fns → UI admin → página `/conta-suspensa` → seed de dados → cron.