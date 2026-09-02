# Status do Programa

Atualizado em: 2026-09-01 (Phase 1 CLOSED; Phase 2 residual; Phase 3 IN PROGRESS — exit report; Phase 4–5 seeds opened)

## Estado geral

**FASE 0 CONCLUÍDA. FASE 1 CONCLUÍDA. FASE 2 quase fechada (GHCR+rollback OK; stg DNS LIVE). FASE 3 IN PROGRESS — pilot LIVE em `api.stg`; exit report publicado; close bloqueado por GHCR SHA promote + staff list/update smoke. FASES 4–5 INICIADAS (seed) — paralelismo via [`04-migration/ACCELERATION-BOARD.md`](04-migration/ACCELERATION-BOARD.md).**

| Fase | Estado | Evidência / residual |
| --- | --- | --- |
| 0 | **Concluída** | Phase-0 exit report |
| 1 | **Concluída** | [`04-migration/phase-1/PHASE-1-EXIT-REPORT.md`](04-migration/phase-1/PHASE-1-EXIT-REPORT.md) · staging `aamorcqznimmleafavai` verify OK · live auth 20/20 |
| 2 | **Quase fechada** | GHCR + A→B→A rollback ✅ · smoke ✅ · **DNS `stg`/`api.stg`/`dokploy.stg` LIVE** ✅ · alerts ⏳ |
| 3 | **In progress** | Exit report [`04-migration/phase-3/PHASE-3-EXIT-REPORT.md`](04-migration/phase-3/PHASE-3-EXIT-REPORT.md) · **LIVE** ✅ Nest `api.stg` · create **201** · CRM adapter · `ticket_code` workaround · TanStack strangler ✅ · **residual** ⏳ GHCR SHA promote · staff list/update JWT smoke · optional `support_ticket_seq` GRANT — [`04-migration/phase-3/`](04-migration/phase-3/) |
| 4 | **In progress** | Tenant resolve — RPC applied ✅ · smoke **200** ✅ · API redeployed `gitSha=badfb94d…` · GHCR push pending — [`04-migration/phase-4/`](04-migration/phase-4/) |
| 5 | **Iniciada (seed)** | Worker skeleton — processo independente (health, bootstrap) — [`04-migration/phase-5/`](04-migration/phase-5/) |
| 6–7 | Não iniciadas | gates Phase 5+ |

## Próximo gate

1. Phase 3 close (residual): **GHCR push** — image built locally + on clean host as `ghcr.io/raygsm/impulsionando-api:badfb94d…`; push **denied** (gh token lacks `packages:write`; commit + `workflow_dispatch` on `reengineering-ghcr-api.yml` or operator `docker login` with PAT). Staff list/update smoke: fix `.env.staging` — `SUPPORT_SMOKE_ACCESS_TOKEN` must be JWT (`eyJ…`) or set `TEST_USER_PASSWORD`.
2. Phase 4 (parallel): optional staging seed row for a known host (e.g. `chrismed`) to return non-null `data`; deny tests for unknown/suspended hosts.
3. Optional: grey-cloud `dokploy.stg` if TLS flaky; set real ACME inbox; fill numeric RPO/RTO in restore evidence when timestamps known.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, `db push`/reset prod, deploy legacy monolith onto clean host.

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Verify | `companies=313` `user_roles=3` |
| Live auth | 20/20 pass |
| GHCR / rollback | PASS · live SHA-A `647308e7…` |
| Clean host | `2.25.123.224` |
