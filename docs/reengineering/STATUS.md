# Status do Programa

Atualizado em: 2026-08-31 (GHCR PR to main + staging scripts + rollback runbook)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS. FASE 1 em fechamento (restore + auth). FASE 2 EM EXECUÇÃO — Dokploy + Traefik + placeholder SHA smoke; GHCR unblock PR aberto.**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 | ADRs ✅ contratos ✅ piloto ✅; **humano:** staging restore evidence + live auth baseline |
| 2. Plataforma e staging | **Em execução** | ADRs + contracts | Dokploy ✅ · placeholder ✅ · [PR #100](https://github.com/raygsm/impulsionando/pull/100) GHCR→main ⏳ merge · staging DNS ⏳ · rollback drill ⏳ |
| 3. Nova API modular | Não iniciada | staging saudável | Support no Nest |
| 4–7 | Não iniciadas | gates anteriores | ver docs da fase |

## Próximo gate

1. **Merge [PR #100](https://github.com/raygsm/impulsionando/pull/100)** → `gh workflow run "Reengineering GHCR SHA placeholder"` → Dokploy pull by full SHA.
2. **Human DNS:** confirm zone + records in [`04-migration/phase-2/STAGING-HOSTNAMES.md`](04-migration/phase-2/STAGING-HOSTNAMES.md); Cloudflare → `2.25.123.224` (staging only).
3. **Rollback drill:** [`04-migration/phase-2/ROLLBACK-DRILL.md`](04-migration/phase-2/ROLLBACK-DRILL.md) after ≥2 GHCR SHAs.
4. **Phase 1 residual:** restore evidence + RPO/RTO on `kyiczxtcoexnvcqgrgkr` → `npm run verify:staging-supabase` → `npm run test:auth-baseline:live`.
5. Nest remains **Phase 3**.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, Nest bootstrap, `db push`/reset prod, mechanical move of all routes, deploy legacy monolith onto clean host.

## Evidência corrente

- Branch: `reengineering/program` (tip moves; placeholder still `97d167bd` on clean host until GHCR republish)
- Clean host: `2.25.123.224` — log [`04-migration/phase-2/clean-host/`](04-migration/phase-2/clean-host/)
- Placeholder smoke: `npm run phase2:smoke:placeholder` · `http://2.25.123.224:8088/health`
- GHCR unblock PR: https://github.com/raygsm/impulsionando/pull/100
- Staging Supabase: `kyiczxtcoexnvcqgrgkr` — restore evidence still open in [`04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md`](04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md)
- Local staging wiring: `.env.staging.example` · `npm run verify:staging-supabase` · `npm run dev:staging`
- Agent entry: [`AGENTS.md`](../../AGENTS.md)

## Como atualizar

- Nunca marcar fase concluída só porque scaffolding existe.
- Evidências reproduzíveis (SHA, timestamps, project refs sem secrets).
- Toda implementação: close-out em [`AGENTS.md`](../../AGENTS.md) / [`05-governance/IMPLEMENTATION-RULES.md`](05-governance/IMPLEMENTATION-RULES.md).
