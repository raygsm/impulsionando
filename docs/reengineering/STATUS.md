# Status do Programa

Atualizado em: 2026-08-31 (Phase 2 placeholder live on clean host)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS. FASE 1 em fechamento (restore + auth). FASE 2 EM EXECUÇÃO — Dokploy + Traefik + placeholder SHA smoke no clean host.**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 | ADRs ✅ contratos ✅ piloto ✅; **humano:** staging restore + live auth baseline |
| 2. Plataforma e staging | **Em execução** | ADRs + contracts | Dokploy ✅ · placeholder `/health` `gitSha=97d167bd` ✅ · GHCR workflow on default branch ⏳ · staging DNS ⏳ |
| 3. Nova API modular | Não iniciada | staging saudável | Support no Nest |
| 4–7 | Não iniciadas | gates anteriores | ver docs da fase |

## Próximo gate

1. **Human DNS:** confirm zone + records in [`04-migration/phase-2/STAGING-HOSTNAMES.md`](04-migration/phase-2/STAGING-HOSTNAMES.md); Cloudflare → `2.25.123.224` (staging only).
2. **GHCR:** merge/enable `reengineering-ghcr-sha.yml` on default branch so `workflow_dispatch` works; republish placeholder by full SHA; prefer Dokploy UI pull.
3. **Phase 1 residual:** restore into `kyiczxtcoexnvcqgrgkr` → RPO/RTO → auth/tenant baseline.
4. Nest remains **Phase 3**.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, Nest bootstrap, `db push`/reset prod, mechanical move of all routes, deploy legacy monolith onto clean host.

## Evidência corrente

- Branch: `reengineering/program` @ `97d167bd`
- Clean host: `2.25.123.224` — log [`04-migration/phase-2/clean-host/`](04-migration/phase-2/clean-host/)
- Placeholder smoke: `http://2.25.123.224:8088/health` · Traefik Host `placeholder.staging.local`
- Staging Supabase: `kyiczxtcoexnvcqgrgkr` (empty; restore open)
- Agent entry: [`AGENTS.md`](../../AGENTS.md)

## Como atualizar

- Nunca marcar fase concluída só porque scaffolding existe.
- Evidências reproduzíveis (SHA, timestamps, project refs sem secrets).
- Toda implementação: close-out em [`AGENTS.md`](../../AGENTS.md) / [`05-governance/IMPLEMENTATION-RULES.md`](05-governance/IMPLEMENTATION-RULES.md).
