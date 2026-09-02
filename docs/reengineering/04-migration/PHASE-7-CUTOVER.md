# Fase 7 — Cutover e retirada do legado

Detailed execution plan: [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 7.

## Objetivo

Consolidar produção e remover o legado sem perder capacidade de recuperação.

Phase 7 is a **migration and retirement phase**, not the phase where missing CRM, ERP, Payments, AI, clinical or investment products are built.

## Subphases

### 7A — Playbook

- execute a complete tenant cutover rehearsal in staging;
- identify owners, rollback image/configuration and observation window.

### 7B — Low-risk production pilot

- migrate one explicitly approved low-risk tenant/flow;
- exclude clinical/payment-heavy tenants unless separately justified.

### 7C — Reconciliation

- prove data, jobs, integrations, auth, tenant isolation and user journeys;
- reconcile old/new side effects before authority moves.

### 7D — Gradual traffic

- move DNS/traffic gradually;
- expose old/new release identity and health;
- observe the rollback window.

### 7E — Legacy freeze

- freeze legacy writes when applicable;
- confirm no hidden publisher, worker, webhook or n8n dependency.

### 7F — Retirement

- retire Nginx and concurrent runtimes after approval;
- archive required evidence/configuration;
- remove releases/images/volumes only after backup/restore evidence;
- revoke old credentials and access.

## Critério de saída

Todo domínio público aponta para a arquitetura nova, nenhum fluxo depende do runtime legado, rollback antigo foi formalmente encerrado e a limpeza possui evidência de backup/restauração.

The product-intake “all modules PASS” vision is a product north star, **not** the Phase 7 migration gate.

## Explicitly excluded

- building missing product modules during cutover;
- Impulsionando Payments, revenue share or regulated vertical activation without their own gates;
- big-bang DNS migration;
- destructive cleanup before the rollback window and restore proof close.

