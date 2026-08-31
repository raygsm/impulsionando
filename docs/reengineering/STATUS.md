# Status do Programa

Atualizado em: 2026-08-31 (GHCR live + rollback drill PASS; Phase 1 residual still human)

## Estado geral

**FASE 0 CONCLUÍDA. ADRs 001–008 ACEITAS. FASE 1 em fechamento (restore + live auth). FASE 2 quase fechada — GHCR promote + rollback drill OK; DNS/TLS staging ainda humano.**

| Fase | Estado | Entrada obrigatória | Evidência para encerrar |
| --- | --- | --- | --- |
| 0. Contenção e descoberta | **Concluída** | autorização 2026-08-28 | [`01-current-state/phase-0/PHASE-0-EXIT-REPORT.md`](01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) |
| 1. Contratos e fundação | **Fechamento** | fase 0 | ADRs ✅ contratos ✅ piloto ✅ mock auth ✅; **faltam:** restore evidence + RPO/RTO + live auth |
| 2. Plataforma e staging | **Quase fechada** | ADRs + contracts | Dokploy ✅ · GHCR ✅ · rollback A→B→A ✅ · smoke SHA ✅ · DNS/TLS ⏳ · alerts ⏳ |
| 3. Nova API modular | Não iniciada | Phase 1 residual + staging bind | Support no Nest |
| 4–7 | Não iniciadas | gates anteriores | ver docs da fase |

## Próximo gate

1. **Human — Phase 1:** fill [`04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md`](04-migration/phase-2/STAGING-RESTORE-EVIDENCE.md) (timestamps + RPO/RTO + structure smoke) → create `.env.staging` → `npm run verify:staging-supabase` → `npm run test:auth-baseline:live`.
2. **Human — Phase 2 DNS:** Cloudflare staging hostnames → `2.25.123.224` + real ACME email ([`STAGING-HOSTNAMES.md`](04-migration/phase-2/STAGING-HOSTNAMES.md)).
3. **Optional polish:** recreate placeholder via Dokploy UI (today updated via Swarm + GHCR SHA); P2-G alert destinations.
4. Nest remains **Phase 3** until Phase 1 residual closed and staging env bound.

**Proibido:** Dokploy on legacy VPS, wipe VPS, prod DNS cutover, Nest bootstrap, `db push`/reset prod, mechanical move of all routes, deploy legacy monolith onto clean host.

## Evidência corrente (2026-08-31)

| Item | Value |
| --- | --- |
| PR #100 | **MERGED** `647308e7` — workflow on default branch |
| GHCR SHA-A | `ghcr.io/raygsm/impulsionando-reengineering-placeholder:647308e7bed44576c794211e44952c0cf93b03df` · digest `sha256:04ffacfc…` · [run 33433542700](https://github.com/raygsm/impulsionando/actions/runs/33433542700) |
| GHCR SHA-B | `…:7db6ceaf0aaf4fe9db2478da5d10597dd4c07c3f` · digest `sha256:a6daa06f…` · [run 33433588827](https://github.com/raygsm/impulsionando/actions/runs/33433588827) |
| Rollback drill | **PASS** A→B→A; live now serving **SHA-A** full `gitSha` on `:8088` + Traefik Host |
| Clean host | `2.25.123.224` · Swarm update-order set to `start-first` |
| Staging Supabase | `kyiczxtcoexnvcqgrgkr` — evidence file still open (no local `.env.staging`) |
| Branch tip | `reengineering/program` |

## Como atualizar

- Nunca marcar fase concluída só porque scaffolding existe.
- Evidências reproduzíveis (SHA, timestamps, project refs sem secrets).
- Toda implementação: close-out em [`AGENTS.md`](../../AGENTS.md) / [`05-governance/IMPLEMENTATION-RULES.md`](05-governance/IMPLEMENTATION-RULES.md).
