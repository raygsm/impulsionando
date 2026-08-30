# Jornadas críticas e characterization

Atualizado em: 2026-08-30.

O mapa consolidado está em [`../product-map/README.md`](../product-map/README.md). Prioridade abaixo é provisória.

## Contexto de lançamento

- Pré-lançamento; 30/90 dias de uso **UNKNOWN**.
- Tratar todos os dados como reais (clarifications).
- Ordem: Impulsionando → Chrismed → Colors → WMP.
- Product owner: Raygs; technical: Cauã + Raygs.

| Jornada | Prioridade | Owner (product / tech) | Characterization | Decisão |
| --- | --- | --- | --- | --- |
| J-01 host → runtime → SHA | P0 | Raygs / Cauã+Raygs | **LIVE parcial** — mapa Nginx/upstream/runtime/SHA em [`DOMAINS-AND-RUNTIMES.md`](DOMAINS-AND-RUNTIMES.md); smoke 12/15; CF zone export pendente | manter; congelar routing |
| J-02 auth/session/membership | P0 | Raygs / Cauã+Raygs | **STATIC** — [`AUTH-SESSION-TRACE.md`](AUTH-SESSION-TRACE.md); allow/deny não executado | manter/migrar por contrato |
| J-03 onboarding | P0 | Raygs / Cauã+Raygs | STATIC coverage no product-map; E2E pendente | revisar/migrar |
| J-05 payments | P0 | Cauã+Raygs | STATIC + DECLARED matrix [`PAYMENTS-CANONICAL.md`](PAYMENTS-CANONICAL.md); LIVE webhook/accounts pending | characterize per canonical provider |
| J-06 communications | P0 | Raygs / Cauã+Raygs | Evolution containers LIVE; instances UNKNOWN | inventário |
| J-07 jobs/webhooks | P0 | Raygs / Cauã+Raygs | STATIC + workers LIVE; external consumers UNKNOWN | inventário |
| J-08 Chrismed | P0 | Raygs / Cauã+Raygs | STATIC; write E2E deferred | manter c/ cautela |
| J-09 Colors | P0 | Raygs / Cauã+Raygs | STATIC + Colors worker LIVE ticks | manter |
| J-10 WMP | P0 | Raygs / Cauã+Raygs | STATIC | manter |
| J-15 publish authority | P0 ops | Cauã+Raygs | **LIVE** registry 209/168; 7 contidos; orphans active classificados; autoridade + stub documentados | conter orphans restantes |
| J-16 backup/restore | P0 ops | Cauã+Raygs | policy Pro documentada; **restore não provado** | próximo passo em BACKUPS.md |

## Smoke público

Baselines: [`PUBLIC-SMOKE-BASELINE-2026-08-28.md`](PUBLIC-SMOKE-BASELINE-2026-08-28.md), [`PUBLIC-SMOKE-BASELINE-2026-08-30.md`](PUBLIC-SMOKE-BASELINE-2026-08-30.md) — ambos 12/15.

## Gate

Fase 0 fast-close **não** exige as 16 jornadas CHARACTERIZED. Exige blockers J-01/J-15/J-16/owners/SoT endereçados ou residual explícito — ver [`PHASE-0-EXIT-REPORT.md`](PHASE-0-EXIT-REPORT.md).
