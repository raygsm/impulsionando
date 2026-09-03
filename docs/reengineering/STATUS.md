# Status do Programa

Atualizado em: 2026-09-03T23:40Z (Phase 6 **IN PROGRESS** — Wave 1 repo lanes A–D landed · contracts **47/47** · staging still on `…-phase6a` · Wave 2 promote **UNKNOWN**; Phase 5 staging exit remains **CLOSED**)

Operational canvas (tasks + parallel lanes): [`04-migration/UPDATE-CANVAS.md`](04-migration/UPDATE-CANVAS.md)

## Estado geral

**FASES 0–5 CONCLUÍDAS (staging). FASE 6 IN PROGRESS (6A–6E Wave 1 repo). FASE 7 NÃO INICIADA.**

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
| **6A/6B** | **IN PROGRESS** | staging API `…-phase6a` · Wave 1: allowlist + budgets + host-resolve membership |
| **6C/6F** | **IN PROGRESS** (repo) | pilot + telemetry · Wave 2 live promote **UNKNOWN** |
| **6D** | **IN PROGRESS** (repo) | `GET /ai/agents/:tenantId` wired · pilot **consumes** agent config |
| **6E** | **IN PROGRESS** (repo) | effects membership on create · worker `ai.effect.execute` **sink** (no domain writes) |
| 7 | Não iniciada | Cutover not authorized |

## Próximo gate

Phase 6 governed AI is **IN PROGRESS**. Wave 1 (repo) landed 2026-09-03T23:40Z — do **not** mark Phase 6 CLOSED until Wave 2 staging proof.

**Next (Wave 2 — sequential ops):**

1. Build/promote API + worker (`…-phase6cdef` or successor SHA) with `AI_CHAT_ENABLED` + optional `AI_TENANT_AGENT_*` seed
2. Live smoke: capabilities/policy/tools/metrics/chat grounded · agents allow/deny · effects create
3. Cross-tenant deny evidence
4. Then mark Phase 6 CLOSED in STATUS + phase-6 README + clean-host log

Phase 5 staging exit evidence (8/8 PASS @ 2026-09-03T03:40Z) is unchanged.

Human residual: optional GHCR push of local-load SHA tags; Wave 2 promote = **UNKNOWN** until operator run.

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
| Wave 1 contracts | `npm run test:phase6:contracts` **47/47 PASS** @ 2026-09-03T23:37Z |
| Integration owners | Cauã — [`04-migration/phase-5/INTEGRATION-REGISTRY.md`](04-migration/phase-5/INTEGRATION-REGISTRY.md) |
