# Status do Programa

Atualizado em: 2026-09-03T11:45Z (Phase 6 **IN PROGRESS** — 6A–6E code in repo · contracts 44/44 · combined `…-phase6cdef` promote **UNKNOWN**/aborted; Phase 5 staging exit remains **CLOSED**)

## Estado geral

**FASES 0–5 CONCLUÍDAS (staging). FASE 6 IN PROGRESS (6A–6E). FASE 7 NÃO INICIADA.**

| Fase | Estado | Evidência |
| --- | --- | --- |
| 4B | **Concluída (staging)** | tenant.stg LIVE · smokes PASS |
| 5A+5B | **CLOSED (staging)** | ledger SELECT **PASS** · enqueue/dup/poison **PASS** |
| 5C | **CLOSED (staging)** | event-outbox live smoke **PASS** (residual table GRANTs applied) |
| 5D | **CLOSED (staging)** | webhook ingress **PASS** (secret set) |
| 5E | **CLOSED (staging)** | `WORKER_COMMUNICATION_ENABLED=true` · `COMMUNICATION_SINK=true` |
| 5F | **CLOSED (staging)** | CRM invite → click → first-login live **PASS** (`…-journeyfix`) |
| 5G | **CLOSED (staging)** | ops metrics **PASS** · outage drill **PASS** · owners **assigned** (Cauã) |
| **5 (gate)** | **CLOSED (staging exit)** | `npm run phase5:staging:verify` **8/8 PASS** @ 2026-09-03T03:40Z |
| **6A/6B** | **IN PROGRESS** | staging API `…-phase6a` promote **PASS** · live smoke **PASS** |
| **6C/6F** | **IN PROGRESS** (repo) | deterministic pilot + telemetry/evals · contracts included in 44/44 · combined staging promote **UNKNOWN** |
| **6D** | **IN PROGRESS** (scaffolding) | tenant agent + `GET /ai/agents/:tenantId` |
| **6E** | **IN PROGRESS** (scaffolding) | gated effects + `/api/v1/ai/effects` · worker handler still noop |
| 7 | Não iniciada | Cutover not authorized |

## Próximo gate

Phase 6 governed AI is **IN PROGRESS** (6A–6E in repo; 6A/6B staging-live on `…-phase6a`). Do **not** mark Phase 6 CLOSED. Next: promote `…-phase6cdef` (or successor) with `AI_CHAT_ENABLED`, live smoke, then exit residuals (pilot applies agent config, durable approvals, effects worker). Phase 7 remains blocked.

Phase 5 staging exit evidence (8/8 PASS @ 2026-09-03T03:40Z) is unchanged and remains authoritative for worker/ops close-out.

Human residual: optional GHCR push of local-load SHA tags; combined 6C–6E staging promote = **UNKNOWN** (aborted mid-run).

## Phase 5 staging verify matrix (2026-09-03T03:40Z) — **8/8 PASS**

`npm run phase5:staging:verify` against `https://api.stg.impulsionando.com.br` after residual GRANTs + `…-journeyfix` API:

| Check | Result | Note |
| --- | --- | --- |
| 5B ledger SELECT | **PASS** | proof=table |
| 5B job-enqueue-consume | **PASS** | proof=worker_log |
| 5B job-duplicate | **PASS** | proof=rpc |
| 5B job-poison-dlq | **PASS** | proof=enqueued_no_ssh_verify |
| 5C event-outbox live | **PASS** | ticket+outbox row |
| 5D webhook-ingress | **PASS** | 202 accepted |
| 5G ops-metrics | **PASS** | queue-metrics + integrations 200 |
| 5F crm-journey live | **PASS** | invite_created → link_clicked → first_login |

## Phase 5 staging verify matrix (2026-09-03T03:20Z)

| Check | Result | Note |
| --- | --- | --- |
| 5B ledger SELECT | **PASS** | proof=table |
| 5B job-enqueue-consume | **PASS** | |
| 5B job-duplicate | **PASS** | |
| 5B job-poison-dlq | **PASS** | |
| 5C event-outbox live | **FAIL** | need residual GRANT |
| 5D webhook-ingress | **PASS** | |
| 5G ops-metrics | **PASS** | |
| 5F crm-journey live | **FAIL** | need residual GRANT |

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Live API | `https://api.stg.impulsionando.com.br` |
| Live tenant-web | `https://tenant.stg.impulsionando.com.br` · `/health` **200** · ACME OK |
| API image (local-load) | `ghcr.io/raygsm/impulsionando-api:67e109511962f86dbbdea2356bc8486b87a4abc1-phase6a` |
| Worker image (local-load) | `ghcr.io/raygsm/impulsionando-worker:67e109511962f86dbbdea2356bc8486b87a4abc1-outbox` (alias `-outbox1`) · outbox/comm/journey **ON** |
| tenant-web image (local-load) | `ghcr.io/raygsm/impulsionando-tenant-web:67e109511962f86dbbdea2356bc8486b87a4abc1` |
| Runtime gitSha (API) | `67e109511962f86dbbdea2356bc8486b87a4abc1` |
| Clean host | `2.25.123.224` |
| GHCR workflow (prior) | [33575721274](https://github.com/raygsm/impulsionando/actions/runs/33575721274) — this SHA **not** GHCR-pushed |
| Integration owners | Cauã — [`04-migration/phase-5/INTEGRATION-REGISTRY.md`](04-migration/phase-5/INTEGRATION-REGISTRY.md) |
