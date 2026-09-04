# Acceleration board — parallel strangler tracks

Atualizado em: **2026-09-04** (Phase 7 Wave 0 prep)

Program SoT: [`../STATUS.md`](../STATUS.md)  
Speed canvas: [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md)  
Phase 7: [`phase-7/PARALLEL-SPEED-PLAN.md`](./phase-7/PARALLEL-SPEED-PLAN.md)

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
| **P6 governed AI** | 6 | **CLOSED (staging)** | Wave 2 verify **2/2 PASS** · `…-phase6exit` · [`phase-6/README.md`](./phase-6/README.md) · [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md) |
| **P2 observability follow-up** | 2+ | Deferred | External alerts — [`phase-2/OBSERVABILITY-MINIMUM.md`](./phase-2/OBSERVABILITY-MINIMUM.md) |
| **V1–V7 verticals** | post-6 | Not started | CRM → Marocas → Colors… — [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md) |
| **P7 cutover** | 7 | **IN PROGRESS** | **7A PASS** · **7B=CSI** staging SSR **PASS** · prod DNS blocked · **7F PARKED** — [`phase-7/CSI-PILOT-7B.md`](./phase-7/CSI-PILOT-7B.md) |

## Wave 1 + Wave 2 (complete)

| Lane | Focus | State |
| --- | --- | --- |
| **A** | Policy: allowlist + budgets + context assembly | **DONE** |
| **B** | Agent route + pilot consumes config | **DONE** |
| **C** | Effects membership + worker `ai.effect.execute` sink | **DONE** (in-memory approvals OK) |
| **D** | Smoke/contracts extensions | **DONE** — `test:phase6:contracts` **47/47** |
| **P** | Promote + live prove | **DONE** — `phase6:staging:verify` **2/2 PASS** @ 2026-09-04T00:03Z |

## Phase 6 residuals (non-blocking)

| Item | State |
| --- | --- |
| Optional GHCR push of `…-phase6exit` | pending |
| Durable approvals migration | optional |
| Effect worker domain writes | out of Phase 6 (sink only) |

## Phase 7 Wave 0 lanes

| Lane | Focus | State |
| --- | --- | --- |
| **Inv** | Legacy dependency inventory | **LANDED** |
| **Play** | Cutover playbook | **LANDED** |
| **Recon** | `phase7:staging:rehearse` | **LANDED** |
| **Id** | Release identity dual-observe | **LANDED** |
| **Rb** | Rollback kit | **LANDED** |
| **Pilot** | Selection criteria (human picks later) | **LANDED** |
| **7A–7E** | Live rehearsal / pilot / freeze | **BLOCKED** on human — [`phase-7/GATES.md`](./phase-7/GATES.md) |
| **7F** | Legacy retirement | **PARKED** |

## Proibido (todos os tracks)

- Cutover de DNS prod / apex / tenant prod
- Dokploy, wipe ou deploy no VPS legacy (`187.77.232.52`)
- Movimento mecânico de todas as rotas
- `db push` / reset em prod
- Tratar `latest` como identidade de release
- Executar fintech, clínica, investimento ou campanhas reais diretamente de Product Intake
- Tratar Phase 6 CLOSED como autorização de Phase 7
