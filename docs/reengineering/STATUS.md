# Status do Programa

Atualizado em: 2026-09-04T00:03Z (Phase 6 **CLOSED (staging)** — Wave 2 promote + `phase6:staging:verify` **2/2 PASS**; Phase 5 remains **CLOSED**; Phase 7 **not started**)

Operational canvas: [`04-migration/UPDATE-CANVAS.md`](04-migration/UPDATE-CANVAS.md)  
Wave 2 plan: [`04-migration/phase-6/WAVE-2-CLOSE.md`](04-migration/phase-6/WAVE-2-CLOSE.md)

## Estado geral

**FASES 0–6 CONCLUÍDAS (staging). FASE 7 NÃO INICIADA.**

| Fase | Estado | Evidência |
| --- | --- | --- |
| 4B | **Concluída (staging)** | tenant.stg LIVE · smokes PASS |
| 5A+5B | **CLOSED (staging)** | ledger SELECT **PASS** · enqueue/dup/poison **PASS** |
| 5C | **CLOSED (staging)** | event-outbox live smoke **PASS** |
| 5D | **CLOSED (staging)** | webhook ingress **PASS** |
| 5E | **CLOSED (staging)** | communication sink **ON** |
| 5F | **CLOSED (staging)** | CRM invite journey **PASS** |
| 5G | **CLOSED (staging)** | ops metrics + drill **PASS** · owners Cauã |
| **5 (gate)** | **CLOSED (staging exit)** | `phase5:staging:verify` **8/8 PASS** @ 2026-09-03T03:40Z |
| **6 (gate)** | **CLOSED (staging)** | Wave 2 live proof @ 2026-09-04T00:03Z — see below |
| 6A–6F | **CLOSED with Phase 6** | gateway/tools/pilot/agents allow+deny/effects create/metrics |
| 7 | Não iniciada | Cutover not authorized |

## Phase 6 staging close (2026-09-04T00:03Z)

| Item | Value |
| --- | --- |
| Promoted SHA | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| API image | `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (local-load amd64) |
| Worker image | `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (local-load amd64) |
| Runtime `/health` | **200** · `gitSha=c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Verify | `npm run phase6:staging:verify` · **PASS=2 FAIL=0** |
| Flags | `AI_CHAT_ENABLED=true` · tenant agent seed enabled |
| Method | `docker save\|gzip\|ssh docker load` + `SKIP_PULL=1` · `PHASE6_CHAT=1` |
| Residuals (non-blocking) | Approvals MVP in-memory OK per Wave 2 plan · effect worker = sink (no domain writes) · GHCR push of `…-phase6exit` optional · durable `reengineering_ai_approvals` migration may be applied separately |

### Verify matrix

| Check | Result |
| --- | --- |
| 6A–6F gateway matrix (capabilities/policy/tools/metrics/chat/agents allow/effects create) | **PASS** |
| 6D agents deny + chat cross-tenant refuse | **PASS** |

## Próximo gate

Phase 6 staging exit is **CLOSED**. **Phase 7 cutover is not started** and remains blocked until an explicit program gate. Do not treat this close as prod DNS / legacy VPS authority.

## Phase 5 staging verify matrix (2026-09-03T03:40Z) — **8/8 PASS**

`npm run phase5:staging:verify` against `https://api.stg.impulsionando.com.br` — retained as Phase 5 authority.

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Live API | `https://api.stg.impulsionando.com.br` |
| Live tenant-web | `https://tenant.stg.impulsionando.com.br` |
| API image (local-load) | `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| Worker image (local-load) | `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| Runtime gitSha (API) | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Clean host | `2.25.123.224` |
| Integration owners | Cauã — [`04-migration/phase-5/INTEGRATION-REGISTRY.md`](04-migration/phase-5/INTEGRATION-REGISTRY.md) |
