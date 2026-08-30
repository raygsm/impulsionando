# Architecture Decision Records

Decisões arquiteturais individuais no formato `ADR-NNN-titulo.md`.

Use o [template de ADR](../../templates/ADR-TEMPLATE.md) e mantenha o índice em [DECISIONS.md](../DECISIONS.md) sincronizado.

**Acceptance packet (signed 2026-08-30):** [`../ADR-ACCEPTANCE-PACKET.md`](../ADR-ACCEPTANCE-PACKET.md) — Cauã + Raygs. Aceita ≠ Nest/Dokploy/DNS no dia do aceite.

## Índice

| ID | Arquivo | Decisão | Estado |
|---|---|---|---|
| ADR-001 | [ADR-001-pnpm-monorepo-workspaces.md](ADR-001-pnpm-monorepo-workspaces.md) | Adotar monorepo com `pnpm` workspaces | Aceita-com-condições |
| ADR-002 | [ADR-002-keep-tanstack-start-frontends.md](ADR-002-keep-tanstack-start-frontends.md) | Manter TanStack Start nos frontends | Aceita |
| ADR-003 | [ADR-003-nestjs-fastify-modular-api.md](ADR-003-nestjs-fastify-modular-api.md) | Adotar NestJS com Fastify para o API modular | Aceita-com-condições |
| ADR-004 | [ADR-004-keep-managed-supabase.md](ADR-004-keep-managed-supabase.md) | Manter Supabase gerenciado | Aceita-com-condições |
| ADR-005 | [ADR-005-supabase-queues-initially.md](ADR-005-supabase-queues-initially.md) | Usar Supabase Queues inicialmente | Aceita-com-condições |
| ADR-006 | [ADR-006-dokploy-clean-infra.md](ADR-006-dokploy-clean-infra.md) | Usar Dokploy como control plane em infraestrutura limpa | Aceita-com-condições |
| ADR-007 | [ADR-007-ghcr-immutable-sha-images.md](ADR-007-ghcr-immutable-sha-images.md) | Usar GHCR e imagens imutáveis por SHA | Aceita |
| ADR-008 | [ADR-008-split-platform-tenant-app-web.md](ADR-008-split-platform-tenant-app-web.md) | Separar platform-web, tenant-web e app-web | Aceita-com-condições |
