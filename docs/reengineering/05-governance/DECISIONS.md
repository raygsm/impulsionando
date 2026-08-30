# Registro de decisões

Toda decisão relevante deve ter um ADR em [`05-governance/adrs/`](adrs/README.md) usando o [template de ADR](../templates/ADR-TEMPLATE.md).

**Acceptance packet (not yet Aceita):** [`ADR-ACCEPTANCE-PACKET.md`](ADR-ACCEPTANCE-PACKET.md) — Phase 1 P1-B recommendations and signature block. Agent recommendations ≠ Aceita; only Cauã + Raygs mark Aceita in ADR files. Aceita ≠ implement Nest/Dokploy/monorepo today (Phases 2/3 still gated).

## Decisões propostas, ainda não aprovadas

| ID | Decisão | Estado | ADR |
|---|---|---|---|
| ADR-001 | Adotar monorepo com `pnpm` workspaces | Proposta | [ADR-001](adrs/ADR-001-pnpm-monorepo-workspaces.md) |
| ADR-002 | Manter TanStack Start nos frontends | Proposta | [ADR-002](adrs/ADR-002-keep-tanstack-start-frontends.md) |
| ADR-003 | Adotar NestJS com Fastify para o API modular | Proposta | [ADR-003](adrs/ADR-003-nestjs-fastify-modular-api.md) |
| ADR-004 | Manter Supabase gerenciado | Proposta | [ADR-004](adrs/ADR-004-keep-managed-supabase.md) |
| ADR-005 | Usar Supabase Queues inicialmente | Proposta | [ADR-005](adrs/ADR-005-supabase-queues-initially.md) |
| ADR-006 | Usar Dokploy como control plane em infraestrutura limpa | Proposta | [ADR-006](adrs/ADR-006-dokploy-clean-infra.md) |
| ADR-007 | Usar GHCR e imagens imutáveis por SHA | Proposta | [ADR-007](adrs/ADR-007-ghcr-immutable-sha-images.md) |
| ADR-008 | Separar platform-web, tenant-web e app-web | Proposta | [ADR-008](adrs/ADR-008-split-platform-tenant-app-web.md) |

## Regra

“Proposta” significa direção recomendada, não autorização de implementação. Registrar contexto, alternativas, consequências e critérios de revisão antes de marcar como aceita.

## Observações operacionais da Fase 0 (não são ADRs aceitos)

| ID | Observação | Estado |
| --- | --- | --- |
| P0-SCHEMA-SOT | Live Supabase structure is the observational baseline; no `db push`/`reset`; reconciliation deferred to Phase 1 | Registrado em `01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md` (2026-08-30) |
| P0-AUTHORITY | Temporary production approvers = Cauã + Raygs; emergency stub in DEPLOYMENT-PUBLISHERS | DECLARED; automation freeze incomplete while orphan workflows remain active |

Nenhuma das ADRs acima (enquanto **Proposta**, ou mesmo após Aceita sem o gate da fase) autoriza scaffolding Nest/monorepo, Dokploy em prod, mudanças de VPS/DNS, ou migrations corretivas. Fase 1 autoriza contratos e o processo de aceite — ver o [acceptance packet](ADR-ACCEPTANCE-PACKET.md).
