# Status do Programa

Atualizado em: 2026-08-30 (Phase 2 scaffold started)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS. FASE 1 em fechamento (restore + auth baseline). FASE 2 EM EXECUÇÃO — Dokploy v0.30.3 no clean host; restore staging ainda independente/aberto.**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 | ADRs ✅ contratos ✅ piloto ✅; **humano:** staging restore + live auth baseline |
| 2. Plataforma e staging | **Em execução** | ADRs + contracts | Dokploy ✅ `2.25.123.224:3000`; Traefik 80/443 up; GHCR/DNS/app bind still open; Nest still Phase 3 |
| 3. Nova API modular | Não iniciada | staging saudável | Support no Nest |
| 4–7 | Não iniciadas | gates anteriores | ver docs da fase |

## Próximo gate

1. **Independent of restore (running):** Dokploy admin signup → GHCR placeholder publish → first placeholder deploy on clean host → staging hostname plan (Cloudflare human).
2. **Restore track (Phase 1 residual):** staging healthy → restore into `kyiczxtcoexnvcqgrgkr` → RPO/RTO → auth/tenant baseline.
3. Nest remains **Phase 3**.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, Nest bootstrap, `db push`/reset prod, mechanical move of all routes.

## Evidência corrente

- Branch: `reengineering/program`
- Workspace: `pnpm-workspace.yaml` + `apps/*` + `packages/*` stubs; legacy root still `impulsionando-core`
- Contracts package: `@impulsionando/contracts` (HTTP envelope + Support pilot schemas)
- Phase 2 board: [`04-migration/phase-2/README.md`](04-migration/phase-2/README.md)
- Clean VPS log: [`04-migration/phase-2/clean-host/`](04-migration/phase-2/clean-host/README.md)
- Prod hotfix (parallel agent): apex/`app` may be on canary `:3488` / `bfdc9dd8…`; CHRISMED often still `:3000` / `ebcc52f0` — not Phase 2 work

## Como atualizar

- Nunca marcar fase concluída só porque scaffolding existe.
- Evidências reproduzíveis (SHA, timestamps, project refs sem secrets).
- Toda implementação: close-out em [`AGENTS.md`](../../AGENTS.md) / [`05-governance/IMPLEMENTATION-RULES.md`](05-governance/IMPLEMENTATION-RULES.md).
