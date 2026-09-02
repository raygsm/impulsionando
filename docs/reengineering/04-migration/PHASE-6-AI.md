# Fase 6 — Plataforma de IA

Detailed execution plan: [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 6.

## Objetivo

Adicionar capacidades de IA sem violar isolamento, segurança ou previsibilidade de custos.

Phase 6 delivers the **shared governed AI platform**, not the complete Impulsionito/Íris/Investito/Medicito/Annita/Maroquito/Bierito product catalog.

## Subphases

### 6A — Gateway and policy

- provider-independent gateway and environment configuration;
- server-side authorized context;
- capability/tenant kill switch;
- rate, token and cost budgets.

### 6B — Tool registry

- READ, RECOMMEND, AUTO_SAFE, APPROVAL_REQUIRED and FORBIDDEN classes;
- runtime input/output contracts;
- authorization revalidated inside every tool;
- no arbitrary SQL, service-role keys or unrestricted HTTP.

### 6C — Real-data read pilot

- Impulsionito reads canonical tenant/support/journey data;
- source freshness and degraded state are visible;
- absent or unauthorized facts are refused, not invented.

### 6D — First tenant agent

- one configured tenant instance on the common runtime;
- tenant-isolated RAG where justified;
- start with a non-regulated READ-only workflow.

### 6E — Gated effects

- approval gates for sensitive actions;
- auditable, idempotent tool execution;
- Phase 5 queues for long-running work.

### 6F — Evaluation and operations

- offline evals and canary;
- telemetry for tokens, cost, latency, quality and outcome;
- versioned prompts/models/tools;
- retention and redaction policies.

## Critério de saída

Phase 6 closes when no security decision depends only on prompt text, every tool revalidates authorization, one real-data tenant-isolated agent is proven, sensitive actions are blocked or approval-gated, and kill switch/cost controls/evals work.

## Explicitly excluded

- omniscient Impulsionito over unfinished domains;
- per-tenant unrestricted provider keys;
- investment recommendations/orders without regulatory mode and approval;
- clinical diagnosis or unsupported health claims;
- autonomous payment, suspension or fiscal actions.

