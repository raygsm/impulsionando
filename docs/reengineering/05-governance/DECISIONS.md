# Registro de decisões

Toda decisão relevante deve ter um ADR em [`05-governance/adrs/`](adrs/README.md) usando o [template de ADR](../templates/ADR-TEMPLATE.md).

**Acceptance packet (signed 2026-08-30):** [`ADR-ACCEPTANCE-PACKET.md`](ADR-ACCEPTANCE-PACKET.md) — Cauã + Raygs Aceita (WhatsApp). Aceita ≠ implement Nest/Dokploy/monorepo/DNS on accept day (Phases 2/3 still gated).

## Decisões aceitas

| ID | Decisão | Estado | ADR |
|---|---|---|---|
| ADR-001 | Adotar monorepo com `pnpm` workspaces | Aceita-com-condições | [ADR-001](adrs/ADR-001-pnpm-monorepo-workspaces.md) |
| ADR-002 | Manter TanStack Start nos frontends | Aceita | [ADR-002](adrs/ADR-002-keep-tanstack-start-frontends.md) |
| ADR-003 | Adotar NestJS com Fastify para o API modular | Aceita-com-condições | [ADR-003](adrs/ADR-003-nestjs-fastify-modular-api.md) |
| ADR-004 | Manter Supabase gerenciado | Aceita-com-condições | [ADR-004](adrs/ADR-004-keep-managed-supabase.md) |
| ADR-005 | Usar Supabase Queues inicialmente | Aceita-com-condições | [ADR-005](adrs/ADR-005-supabase-queues-initially.md) |
| ADR-006 | Usar Dokploy como control plane em infraestrutura limpa | Aceita-com-condições | [ADR-006](adrs/ADR-006-dokploy-clean-infra.md) |
| ADR-007 | Usar GHCR e imagens imutáveis por SHA | Aceita | [ADR-007](adrs/ADR-007-ghcr-immutable-sha-images.md) |
| ADR-008 | Separar platform-web, tenant-web e app-web | Aceita-com-condições | [ADR-008](adrs/ADR-008-split-platform-tenant-app-web.md) |

## Regra

“Aceita” / “Aceita-com-condições” registra direção aprovada. Implementação segue o gate da fase correspondente (Fase 2 = plataforma/staging limpa; Fase 3 = Nest; Fase 4 = split de fronts).

## Observações operacionais da Fase 0 (não são ADRs)

| ID | Observação | Estado |
| --- | --- | --- |
| P0-SCHEMA-SOT | Live Supabase structure is the observational baseline; no `db push`/`reset`; reconciliation deferred | Registrado em `01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md` |
| P0-AUTHORITY | Temporary production approvers = Cauã + Raygs | DECLARED |

Aceita das ADRs **não** autoriza sozinha: scaffolding Nest, move mecânico de monorepo, Dokploy no VPS legado, DNS cutover, ou migrations corretivas em prod.
