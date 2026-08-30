# Log de execução da Fase 0

## 2026-08-28 — contenção inicial

Foram desabilitados manualmente no GitHub Actions, por ID/nome explícito:

1. `production-front.yml`
2. `n8n-universal-ready-provisioner.yml`
3. `wildcard-subdomain-dns.yml`
4. `remove-production-environment-gates.yml`
5. `core-release-retention.yml`
6. `wmp-vps-safe-cleanup.yml`
7. `vps-safe-cleanup.yml`

Motivo, IDs e comandos de rollback estão em [`CONTAINMENT.md`](CONTAINMENT.md). Após a ação, nenhum run estava queued/in progress.

### Alterações locais (2026-08-28)

- criada a branch `codex/reengineering-phase-0`;
- adicionados os documentos e catálogos da Fase 0;
- adicionado runner de smoke público somente leitura e seu manifesto;
- adicionado o script npm `phase0:smoke`;
- executado o smoke live somente leitura: 12/15 checks passaram.

### Explicitamente não executado (2026-08-28)

- deploy, merge ou push desta branch;
- alteração de DNS/Cloudflare;
- limpeza de container, imagem, release, volume ou worktree;
- migration ou escrita no Supabase;
- leitura/cópia de secrets;
- implementação das Fases 1–7.

## Documentation update — 2026-08-30 (product map)

- Added the canonical current-product map under [`../product-map/`](../product-map/README.md).
- No external system or production runtime was changed as part of that documentation update.

## Reconciliation — 2026-08-30 (VPS candidate + topology)

**Correção de registro anterior:** afirmações de que “nenhum processo foi iniciado na VPS” / “nenhum restart/stop/reconfig” estavam **stale** relativamente a um evento posterior à contenção inicial.

### Evento reconciliado (LIVE, somente leitura)

| Campo | Valor |
| --- | --- |
| Unit | `impulsionando-candidate-d3-web.service` (transient) |
| Started | `2026-08-30 15:48:53 UTC` |
| Status at inspect | `active (running)` ~2h depois |
| Bind | `127.0.0.1:3500` |
| Release cwd | `…/releases/recovery-d3ab3c8bdc9158119120efe63670dabd25312708` |
| Public Nginx route to :3500 | **nenhuma** |
| Action taken this session | **inspect only** at first pass; later **stopped** — see section below |

Handoff adicional: start acidental breve (~15s) de workers Pulsonitor/Colors via wrapper candidato em investigação anterior; side effects **UNKNOWN**.

### Também observado LIVE (sem mutação)

- Apex público → Nginx → `127.0.0.1:3490` → Docker `impulsionando-final3-test` (`commit: unknown`, health degraded).
- Tenants P0 majoritários → `127.0.0.1:3000` → `impulsionando-core.service` release `ebcc52f0…` com workers ativos.
- `impulsionando-publish-worker.service` inactive desde 2026-08-27.
- Smoke público reexecutado: 12/15 (baseline [`PUBLIC-SMOKE-BASELINE-2026-08-30.md`](PUBLIC-SMOKE-BASELINE-2026-08-30.md)).
- Registry GitHub: 209 workflows (202 active, 7 disabled_manually); 41 paths ausentes do checkout.

### Ainda não executado

- reabilitação de workflows contidos;
- DNS/Cloudflare writes;
- Docker prune / release cleanup;
- restore Supabase;
- Phases 1–7;
- commit/push desta branch (salvo pedido explícito).

## 2026-08-30 — decisões humanas Cauã + ações

### Decisões

1. **Workflows mutáveis de alto risco:** desabilitar (não aceitar residual). Script: `scripts/audits/phase0-disable-high-risk-workflows.sh` (preserva backup diário, e2e, security, smokes). Execução do script: **pendente aprovação/execução no ambiente do operador** se o agente não puder mutar Actions.
2. **Backup Supabase:** confirmar no Dashboard + runbook de dump manual — [`SUPABASE-HAND-BACKUP-RUNBOOK.md`](SUPABASE-HAND-BACKUP-RUNBOOK.md). Restore isolado ainda depois (staging).
3. **Candidate `:3500`:** **parar** (VPS é nightmare; não manter experimento).

### Ação LIVE — stop candidate (aprovado)

| Campo | Valor |
| --- | --- |
| When | 2026-08-30 ~19:14 UTC (sessão agente) |
| Host | `root@187.77.232.52` via `id_ed25519_impulsionando` |
| Before | `impulsionando-candidate-d3-web.service` **active**, PID 1247665, `127.0.0.1:3500` |
| Command | `systemctl stop impulsionando-candidate-d3-web.service` (+ disable/reset-failed best-effort) |
| After | **inactive**; port 3500 free; no candidate process |
| Scope | **somente** esta unit — nenhum outro serviço parado; sem prune/cleanup |

## 2026-08-30 — Phase 0 CLOSED

- Operator confirm: backup Dashboard OK; high-risk workflows treated as contained for exit.
- LIVE registry at close: **34** `disabled_manually`, **175** `active`, ~129 residual mutative name-matches listed in `RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt`.
- STATUS + EXIT-REPORT flipped to Phase 0 CLOSED; Phase 1 authorized for contracts/ADR process only.

### Mudança preexistente preservada

`src/routeTree.gen.ts` já estava modificado antes da Fase 0 e não faz parte deste trabalho. `src/generated/build-info.ts` é ruído de build local, não identidade de release.
