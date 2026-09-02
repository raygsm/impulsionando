# Status do Programa

Atualizado em: 2026-09-02 (Phase 4B repo-complete; Phase 5B repo-complete; staging verification pending)

## Estado geral

**FASES 0–3 CONCLUÍDAS. FASE 4A CONCLUÍDA. FASE 4B REPO-COMPLETA (staging smokes pendentes). FASE 5A+5B REPO-COMPLETAS (staging queue smokes pendentes). FASES 6–7 NÃO INICIADAS.**

| Fase | Estado | Evidência |
| --- | --- | --- |
| 0 | **Concluída** | Phase-0 exit report |
| 1 | **Concluída** | [`04-migration/phase-1/PHASE-1-EXIT-REPORT.md`](04-migration/phase-1/PHASE-1-EXIT-REPORT.md) |
| 2 | **Concluída** | [`04-migration/phase-2/PHASE-2-EXIT-REPORT.md`](04-migration/phase-2/PHASE-2-EXIT-REPORT.md) · GHCR + rollback ✅ · DNS LIVE ✅ · observability minimum ✅ |
| 3 | **Concluída** | [`04-migration/phase-3/PHASE-3-EXIT-REPORT.md`](04-migration/phase-3/PHASE-3-EXIT-REPORT.md) · Nest `api.stg` LIVE · GHCR promote ✅ · staff smoke ✅ |
| 4A | **Concluída** | [`04-migration/phase-4/PHASE-4-EXIT-REPORT.md`](04-migration/phase-4/PHASE-4-EXIT-REPORT.md) · resolve **200** · chrismed seed ✅ · deny smokes ✅ |
| 4B | **Repo-completa** | [`04-migration/phase-4/PHASE-4B-EXIT-REPORT.md`](04-migration/phase-4/PHASE-4B-EXIT-REPORT.md) · 8/8 packages in git · **CLOSE pending staging smokes** |
| 5 | **5A+5B repo-completas** | Worker + queue semantics — [`04-migration/phase-5/PHASE-5B-EXIT-REPORT.md`](04-migration/phase-5/PHASE-5B-EXIT-REPORT.md) · **CLOSE pending staging smokes** |
| 6–7 | Não iniciadas | gates Phase 5+ |

## Próximo gate

1. **Operator — close Phase 4B on staging** — apply migration `20260902120000_phase4b_*`, deploy API/tenant-web/worker GHCR images, run [`PHASE-4B-EXIT-REPORT.md`](04-migration/phase-4/PHASE-4B-EXIT-REPORT.md) smoke checklist.
2. **Operator — close Phase 5B on staging** — apply migration `20260902130000_phase5b_*`, deploy API+worker with consumer enabled, run [`PHASE-5B-EXIT-REPORT.md`](04-migration/phase-5/PHASE-5B-EXIT-REPORT.md) smokes.
3. **Phase 5C–5G** — outbox/events, webhooks, communications, synthetic journey, ops runbooks.
4. **Phase 6 later** — governed AI gateway/tools/read-only tenant agent; no autonomous regulated actions.
5. **Vertical waves before Phase 7** — shared modules first, tenant configuration second.
6. Full action plan: [`04-migration/PRODUCT-INTAKE-ACTION-PLAN.md`](04-migration/PRODUCT-INTAKE-ACTION-PLAN.md).
7. **Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, `db push`/reset prod, real-recipient campaign blast, intake-driven fintech/clinical/investment execution without dedicated gates.

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Live API | `https://api.stg.impulsionando.com.br` |
| GHCR API image | `ghcr.io/raygsm/impulsionando-api:b58d4c111b0b37bc48dacad3a7e12c1506f9d6e1` |
| Runtime gitSha | `badfb94d01cec685736bc1377f008adf3acd863b` |
| Clean host | `2.25.123.224` |
| GHCR workflow | [33575721274](https://github.com/raygsm/impulsionando/actions/runs/33575721274) |
