# Status do Programa

Atualizado em: 2026-08-30 (ADRs Aceitas; Fase 2 planejamento autorizado)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS (com condições onde aplicável). FASE 1 em fechamento (staging restore + auth/tenant baseline). FASE 2 PLANEJAMENTO AUTORIZADO — sem provisionar Dokploy/DNS/Nest ainda.**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 concluída | ADRs Aceitas ✅; contratos ✅; piloto Support ✅; **falta** restore staging + testes auth/tenant non-prod |
| 2. Plataforma e staging | **Planejamento** | ADRs Aceitas + contratos | deploy/rollback em staging em infra limpa (sem SSH manual) |
| 3. Nova API modular | Não iniciada | staging saudável | Support piloto em paralelo |
| 4. Frontends e tenants | Não iniciada | API estável para o módulo | primeiro tenant migrado |
| 5. Workers e integrações | Não iniciada | contratos e filas | jobs idempotentes |
| 6. Plataforma de IA | Não iniciada | segurança/auditoria | evals + gates |
| 7. Cutover e retirada do legado | Não iniciada | tenants críticos | legado fora do tráfego |

## Próximo gate

1. Executar [`STAGING-RESTORE-PLAN.md`](04-migration/phase-1/STAGING-RESTORE-PLAN.md) (humano) + registrar RPO/RTO.
2. Rodar baseline auth/tenant allow/deny em non-prod (ver Phase 1 residual / Phase 2 board).
3. Phase 2: workboard em [`04-migration/phase-2/`](04-migration/phase-2/) — Dokploy **clean** infra, GHCR SHA, Traefik staging — **não** no VPS legado.
4. Prod VPS hoje **não** serve `main` tip (`bfdc9dd8`); split-brain `ebcc52f0` host Node + `80e20d11` Docker — não “consertar” com wipe; só cutover Fase 7 / publish consciente.

**Proibido ainda sem gate explícito:** Nest bootstrap, monorepo move mecânico, Dokploy no VPS legado, wipe VPS, DNS cutover prod, `db push`/reset prod.

## Evidência corrente

- ADRs: [`05-governance/ADR-ACCEPTANCE-PACKET.md`](05-governance/ADR-ACCEPTANCE-PACKET.md) signed; [`DECISIONS.md`](05-governance/DECISIONS.md).
- Phase 1 board: [`04-migration/phase-1/README.md`](04-migration/phase-1/README.md).
- Contenção: **163** `disabled_manually`; **46** `active`; **18** residual name-matches.
- Prod identity (2026-08-30 probe): apex/app often `commit:unknown` / host Node `ebcc52f0`; Docker core `80e20d11` — **não** GitHub `main` tip.

## Como atualizar

- Nunca marcar fase concluída só porque código foi escrito.
- Incluir evidências reproduzíveis.
- Manter no máximo uma fase principal de *implementação* viva; planejamento da seguinte pode ser paralelo.
