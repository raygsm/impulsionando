# Fase 5 — Workers e integrações

Detailed execution plan: [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5.

## Objetivo

Retirar processamento demorado e dependências externas do ciclo de vida web.

## Subphases

### 5A — Worker artifact

- independent `apps/worker` lifecycle and readiness;
- GHCR full-SHA image;
- clean-host staging service;
- worker failure does not affect API/SSR.

### 5B — Queue semantics

- staging durable queue;
- visibility timeout, bounded retry/backoff and DLQ;
- idempotency/deduplication;
- duplicate-delivery single-effect smoke.

### 5C — Events and outbox

- versioned event/job envelopes;
- API-authoritative state transitions;
- transactional outbox where state and event must commit together;
- correlation across HTTP, event, job and integration.

### 5D — Secure webhooks

- signature/origin and schema validation;
- replay and duplicate rejection;
- safe payload redaction/retention;
- durable async processing and audit.

### 5E — Communications and adapters

- adapters for n8n, Evolution/official WhatsApp, e-mail, payments and OAuth;
- versioned tenant templates, consent, opt-out, cooldown and delivery state;
- n8n consumes committed events; it never owns canonical domain state.

### 5F — First intake-aligned proof

Prove the 90-day CRM invitation journey in staging with synthetic/test recipients:

```text
invite → dispatch → click → CRM state → first login/action
→ cancel incompatible reminders → support handoff
```

### 5G — Operations

- dashboards for backlog, oldest job, failure, retry/DLQ and provider latency;
- integration owner/status/runbook registry;
- safe replay and manual recovery;
- provider-failure drill without frontend/API outage.

## Critério de saída

Phase 5 closes only when 5A–5G have staging evidence, one complete async journey passes retry/duplicate/failure tests, integration failure does not bring down frontend/API, and each live integration has an owner and runbook.

## Explicitly excluded

- Impulsionando Payments marketplace/split/wallet/Turbo;
- full ERP/CRM rebuild;
- real-recipient campaign blast;
- autonomous AI actions;
- clinical/investment production workflows;
- production DNS cutover.

