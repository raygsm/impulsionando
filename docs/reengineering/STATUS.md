# Status do Programa

Atualizado em: 2026-08-30 (Phase 0 CLOSED)

## Estado geral

**FASE 0 CONCLUÍDA. FASE 1 AUTORIZADA (contratos e fundação — sem Nest/Dokploy até ADRs Aceitas).**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Em execução** | fase 0 concluída | ADRs Aceitas, contratos e testes-base aprovados |
| 2. Plataforma e staging | Não iniciada | fase 1 concluída | deploy e rollback reproduzidos em staging |
| 3. Nova API modular | Não iniciada | staging saudável | primeiro módulo operando em paralelo |
| 4. Frontends e tenants | Não iniciada | API estável para o módulo | primeiro tenant migrado e observável |
| 5. Workers e integrações | Não iniciada | contratos e filas definidos | jobs idempotentes e recuperáveis |
| 6. Plataforma de IA | Não iniciada | segurança e auditoria prontas | evals, limites e approval gates aprovados |
| 7. Cutover e retirada do legado | Não iniciada | tenants críticos migrados | legado fora do tráfego e rollback encerrado |

## Próximo gate (Fase 1)

1. Day-0: terminar contenção dos ~129 workflows mutativos/diagnose ainda `active` (lista em [`01-current-state/phase-0/CONTAINMENT.md`](01-current-state/phase-0/CONTAINMENT.md)).
2. Aceitar ou rejeitar ADRs 001–008 formalmente.
3. Contratos de identidade tenant/`company_id`, RBAC, eventos/jobs; piloto vertical não-pagamento/não-clínico (Support / J-13 paper).
4. Plano de staging Supabase + restore isolado (fecha dívida J-16).

**Proibido ainda:** Nest bootstrap, monorepo move mecânico, Dokploy em prod, wipe VPS, DNS cutover, `db push`/reset.

## Evidência corrente

- Exit Phase 0: [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md).
- Phase 1 board: [`04-migration/phase-1/README.md`](04-migration/phase-1/README.md) — **P1-A…I all done** (docs/contracts/containment); human Aceita + staging restore + pilot review still open.
- ADR acceptance packet (sign): [`05-governance/ADR-ACCEPTANCE-PACKET.md`](05-governance/ADR-ACCEPTANCE-PACKET.md).
- Contenção LIVE after P1-A: **163** `disabled_manually`; **46** `active`; **18** residual mutative name-matches still active.
- Candidate `:3500` **parado**.
- Backup Supabase: **confirmado**; restore plan: [`04-migration/phase-1/STAGING-RESTORE-PLAN.md`](04-migration/phase-1/STAGING-RESTORE-PLAN.md).
- Pagamentos canônicos: [`01-current-state/phase-0/PAYMENTS-CANONICAL.md`](01-current-state/phase-0/PAYMENTS-CANONICAL.md).
- ADRs 001–008: still **Proposta** until packet signed.

## Como atualizar

- Nunca marcar fase concluída só porque código foi escrito.
- Incluir evidências reproduzíveis.
- Manter no máximo uma fase principal em execução.
