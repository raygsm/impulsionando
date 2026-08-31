# Status do Programa

Atualizado em: 2026-08-31 (Phase 1 CLOSED; Phase 2 residual DNS; Phase 3 starting)

## Estado geral

**FASE 0 CONCLUÍDA. FASE 1 CONCLUÍDA. FASE 2 quase fechada (GHCR+rollback OK; DNS/TLS humano). FASE 3 INICIANDO — Nest Support API.**

| Fase | Estado | Evidência / residual |
| --- | --- | --- |
| 0 | **Concluída** | Phase-0 exit report |
| 1 | **Concluída** | [`04-migration/phase-1/PHASE-1-EXIT-REPORT.md`](04-migration/phase-1/PHASE-1-EXIT-REPORT.md) · staging `aamorcqznimmleafavai` verify OK · live auth 20/20 |
| 2 | **Quase fechada** | GHCR + A→B→A rollback ✅ · smoke ✅ · **DNS/TLS staging ⏳** · alerts ⏳ |
| 3 | **Em execução** | Nest Support bootstrap (apps/api) |
| 4–7 | Não iniciadas | gates Phase 3+ |

## Próximo gate

1. Phase 3: Nest + Fastify Support module (pilot) consuming staging Supabase.
2. Human: Cloudflare staging DNS → `2.25.123.224` + ACME email.
3. Optional: fill numeric RPO/RTO in restore evidence when timestamps known.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, `db push`/reset prod, deploy legacy monolith onto clean host.

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Verify | `companies=313` `user_roles=3` |
| Live auth | 20/20 pass |
| GHCR / rollback | PASS · live SHA-A `647308e7…` |
| Clean host | `2.25.123.224` |
