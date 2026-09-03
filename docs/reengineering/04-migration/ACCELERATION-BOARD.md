# Acceleration board — parallel strangler tracks

Atualizado em: **2026-09-03T23:20Z**

Program SoT: [`../STATUS.md`](../STATUS.md)  
Speed canvas: [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md)

## Princípio

Acelerar implementação via **verticais strangler em paralelo**, não via atalhos de governança.  
Quality: contracts green → promote → live allow/deny → evidence → only then CLOSED.

## Tracks

| Track | Fase | Estado | Escopo |
| --- | --- | --- | --- |
| **P2 platform** | 2 | **CLOSED** | Dokploy + Traefik + GHCR + DNS — [`phase-2/PHASE-2-EXIT-REPORT.md`](./phase-2/PHASE-2-EXIT-REPORT.md) |
| **P3 Support** | 3 | **CLOSED** | Nest Support LIVE · GHCR promote — [`phase-3/PHASE-3-EXIT-REPORT.md`](./phase-3/PHASE-3-EXIT-REPORT.md) |
| **P4A tenant resolve** | 4A | **CLOSED** | resolve + seed + deny — [`phase-4/PHASE-4-EXIT-REPORT.md`](./phase-4/PHASE-4-EXIT-REPORT.md) |
| **P4B tenant/config** | 4B | **CLOSED (staging)** | tenant.stg LIVE · stubs OK for exit — [`phase-4/PHASE-4B-EXIT-REPORT.md`](./phase-4/PHASE-4B-EXIT-REPORT.md) |
| **P5 async/integrations** | 5 | **CLOSED (staging)** | verify **8/8 PASS** 2026-09-03T03:40Z — [`phase-5/README.md`](./phase-5/README.md) |
| **P6 governed AI** | 6 | **IN PROGRESS** | 6A/6B staging-live · 6C–6F gaps — [`phase-6/README.md`](./phase-6/README.md) · [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md) |
| **P2 observability follow-up** | 2+ | Deferred | External alerts — [`phase-2/OBSERVABILITY-MINIMUM.md`](./phase-2/OBSERVABILITY-MINIMUM.md) |
| **V1–V7 verticals** | post-6 | Not started | CRM → Marocas → Colors… — [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) |
| **P7 cutover** | 7 | Blocked | Needs Phase 6 CLOSED + explicit auth |

## Phase 6 parallel lanes (active)

| Lane | Focus | Parallel? |
| --- | --- | --- |
| **A** | Policy: allowlist + budgets + context assembly | yes |
| **B** | Agent route + pilot consumes config | yes (coord pilot file) |
| **C** | Effects membership + worker `ai.effect.execute` sink | yes |
| **D** | Smoke/contracts extensions | yes |
| **P** | Promote + live prove | **sequential** after A–D merge |

## Proibido (todos os tracks)

- Cutover de DNS prod / apex / tenant prod
- Dokploy, wipe ou deploy no VPS legacy (`187.77.232.52`)
- Movimento mecânico de todas as rotas
- `db push` / reset em prod
- Tratar `latest` como identidade de release
- Executar fintech, clínica, investimento ou campanhas reais diretamente de Product Intake
- Marcar Phase 6 CLOSED sem smoke live allow/deny
