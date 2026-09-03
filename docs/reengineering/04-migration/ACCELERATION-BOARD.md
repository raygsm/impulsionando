# Acceleration board — parallel strangler tracks

Atualizado em: **2026-09-02**

Program SoT: [`../STATUS.md`](../STATUS.md)

## Princípio

Acelerar implementação via **verticais strangler em paralelo**, não via atalhos de governança.

## Tracks ativos

| Track | Fase | Estado | Escopo |
| --- | --- | --- | --- |
| **P2 platform** | 2 | **CLOSED** | Dokploy + Traefik + GHCR + DNS — [`phase-2/PHASE-2-EXIT-REPORT.md`](./phase-2/PHASE-2-EXIT-REPORT.md) |
| **P3 Support** | 3 | **CLOSED** | Nest Support LIVE · GHCR promote — [`phase-3/PHASE-3-EXIT-REPORT.md`](./phase-3/PHASE-3-EXIT-REPORT.md) |
| **P4A tenant resolve** | 4A | **CLOSED** | resolve + seed + deny — [`phase-4/PHASE-4-EXIT-REPORT.md`](./phase-4/PHASE-4-EXIT-REPORT.md) |
| **P4B tenant/config** | 4B | **REPO-COMPLETE** | 8/8 packages — [`phase-4/PHASE-4B-EXIT-REPORT.md`](./phase-4/PHASE-4B-EXIT-REPORT.md) · staging close pending |
| **P5 async/integrations** | 5 | **CLOSED (staging)** | verify **8/8 PASS** 2026-09-03T03:40Z — [`phase-5/README.md`](./phase-5/README.md) · [`../STATUS.md`](../STATUS.md) |
| **P2 observability follow-up** | 2+ | Deferred | External alerts — [`phase-2/OBSERVABILITY-MINIMUM.md`](./phase-2/OBSERVABILITY-MINIMUM.md) |

Product-intake mapping and vertical-wave order: [`PRODUCT-INTAKE-ACTION-PLAN.md`](./PRODUCT-INTAKE-ACTION-PLAN.md).

## Proibido (todos os tracks)

- Cutover de DNS prod / apex / tenant prod
- Dokploy, wipe ou deploy no VPS legacy (`187.77.232.52`)
- Movimento mecânico de todas as rotas
- `db push` / reset em prod
- Tratar `latest` como identidade de release
- Executar fintech, clínica, investimento ou campanhas reais diretamente de Product Intake
