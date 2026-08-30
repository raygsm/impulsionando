# Status do Programa

Atualizado em: 2026-08-30 (Phase 2 scaffold started)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS. FASE 1 em fechamento (restore evidence + live auth baseline). FASE 2 IMPLEMENTAÇÃO INICIAL — workspace + contracts + GHCR stub (sem Dokploy/Nest/DNS).**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 | ADRs ✅ contratos ✅ piloto ✅; **humano:** staging restore evidence + live auth baseline |
| 2. Plataforma e staging | **Em execução (scaffold)** | ADRs + contracts | workspace skeleton ✅; GHCR stub ✅; still need clean hosts + Dokploy + staging bind |
| 3. Nova API modular | Não iniciada | staging saudável | Support no Nest |
| 4–7 | Não iniciadas | gates anteriores | ver docs da fase |

## Próximo gate

1. Human: fill [`04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md`](04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md) after restore drill.
2. Human: quotes/provision **clean** hosts (not legacy VPS) — [`phase-2/CLEAN-INFRA-TOPOLOGY.md`](04-migration/phase-2/CLEAN-INFRA-TOPOLOGY.md).
3. Bind staging Supabase env names — [`phase-2/STAGING-ENV-INVENTORY.md`](04-migration/phase-2/STAGING-ENV-INVENTORY.md).
4. `workflow_dispatch` [`reengineering-ghcr-sha.yml`](../../.github/workflows/reengineering-ghcr-sha.yml) when ready to prove placeholder publish.
5. Nest remains **Phase 3** — `apps/api` is placeholder only.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, Nest bootstrap, `db push`/reset prod, mechanical move of all routes.

## Evidência corrente

- Branch: `reengineering/program`
- Workspace: `pnpm-workspace.yaml` + `apps/*` + `packages/*` stubs; legacy root still `impulsionando-core`
- Contracts package: `@impulsionando/contracts` (HTTP envelope + Support pilot schemas)
- Phase 2 board: [`04-migration/phase-2/README.md`](04-migration/phase-2/README.md)
- Prod hotfix (parallel agent): apex/`app` may be on canary `:3488` / `bfdc9dd8…`; CHRISMED often still `:3000` / `ebcc52f0` — not Phase 2 work

## Como atualizar

- Nunca marcar fase concluída só porque scaffolding existe.
- Evidências reproduzíveis (SHA, timestamps, project refs sem secrets).
