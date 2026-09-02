# Fase 4 — Frontends e tenants

## Estado reconciliado

- **Phase 4A — tenant resolve:** **CLOSED** (staging endpoint, known-host and deny smokes).
- **Phase 4B — tenant/configuration foundation:** **OPEN**.

The Phase 4A exit report proves one foundational slice; it does **not** prove the full phase criterion below. Product-intake reconciliation and the Phase 4B plan are defined in [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md).

## Objetivo

Substituir builds e rotas específicas por uma plataforma white-label dirigida por configuração.

## Trabalho

- separar site institucional, app autenticado e tenant web;
- criar resolução canônica hostname -> tenant;
- modelar branding, conteúdo, módulos e feature flags;
- reduzir rotas duplicadas em componentes e configurações compartilhadas;
- migrar um tenant de baixa criticidade;
- repetir cutover usando o checklist padrão.

## Phase 4B work packages

1. Canonical tenant ID and explicit alias policy.
2. Membership/RBAC bound to canonical tenant context.
3. Plans, modules, limits, entitlements and server-side feature flags.
4. Typed tenant configuration: branding, locale, timezone, currency, providers and templates.
5. Independent `platform-web`, `tenant-web` and `app-web` runtime boundaries.
6. One low-risk tenant using shared images and configuration-only differences.
7. RioMed `rio-med` versus `riomed` read-only identity audit before any migration.

## Ordem sugerida de tenant

Começar por tenant com baixo tráfego, poucas integrações e responsável disponível. Chrismed, pagamentos e fluxos clínicos não devem ser o piloto sem uma razão documentada.

## Critério de saída

Tenants ativos usam imagens comuns, diferenças são declaradas em dados/configuração e o proxy não escolhe commits por hostname ou path.

Phase 4B may close before production DNS cutover, but must prove the common-image/configuration model with a staging or explicitly gated low-risk tenant slice.

