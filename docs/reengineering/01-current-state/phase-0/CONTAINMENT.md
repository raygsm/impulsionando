# Contenção de produção

## Estado

**Phase 0 exit containment recorded 2026-08-30 evening.**  
At Phase 0 close: **34** `disabled_manually`; **175** `active`; residual name-matched mutative/diagnose/tmp: **~129**.

**Phase 1 track P1-A (Day-0) applied 2026-08-30:** disabled the **129** residual paths from [`RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt`](RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt) via `gh workflow disable` (0 failures; 0 preserve hits in that list; no re-enables).  

LIVE after P1-A: **163** workflows `disabled_manually`; **46** still `active` (registry total **209**). Remaining name-matched mutative/diagnose/tmp still `active` (excluding preserve list): **18** — list rewritten in [`RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt`](RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt).

Preserved active (intentional, verified still `active`): `db-backup-daily`, e2e*, tests-gate, security-*, `dns-vps-check`, `all-client-subdomains-reconcile`, `automation-approvals`, `fronts-live-matrix`, Colors/CHRISMED public smokes, `colors-hydration-*`, `colors-edge-audit`, `colors-origin-diagnose`, `colors-origin-identity-audit`, `core-edge-splitbrain-audit`, `harden-supabase-auth`, `wmp-vps-disk-audit`.

## Controles aplicados em 2026-08-28 (original seven)

| Workflow                                |        ID | Estado atual        | Motivo                                                               |
| --------------------------------------- | --------: | ------------------- | -------------------------------------------------------------------- |
| Production Front                        | 339400748 | `disabled_manually` | congelar promoção automática do frontend                             |
| n8n universal READY provisioner         | 338099077 | `disabled_manually` | interromper import/publish/restart recorrente com 73 probes falhando |
| Wildcard Client Subdomains              | 337913830 | `disabled_manually` | congelar reconciliação mutável de DNS a cada 10 minutos              |
| Remove autonomous job environment gates | 338105259 | `disabled_manually` | impedir remoção automática de approval gates                         |
| Core Release Retention                  | 335308283 | `disabled_manually` | preservar releases como evidência e impedir limpeza                  |
| WMP VPS Safe Cleanup                    | 335306837 | `disabled_manually` | preservar imagens/cache/release durante descoberta                   |
| VPS safe cleanup                        | 339708424 | `disabled_manually` | preservar evidência operacional                                      |

## Controles adicionais (2026-08-30)

Named mutators from Phase 0 exit list were disabled by operator/script (sample includes `reconstruct-legacy-schema`, `vps-n8n-repair`, `emergency-apex-dns-cutover`, `p0-recover-fronts`, `core-backup-restore`, Colors/WMP cutover/repair, provisioner v2/v3, etc.). Phase 0 close: **34** `disabled_manually`.

**P1-A Day-0 (same date, post Phase 0 close):** disabled all **129** then-active residual mutative/diagnose paths from the residual list snapshot. Failures: none (no 404 orphans in that batch). Registry after: **163** `disabled_manually`, **46** `active`.

Script reference (Phase 0 named set): `scripts/audits/phase0-disable-high-risk-workflows.sh`. Residual follow-up list: [`RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt`](RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt) (**18** remaining name-matches).

Backups, checks HTTP/DNS, testes e auditorias somente leitura preservados.

## Fatos confirmados

- No início da fase, 209 workflows estavam registrados como `active` no GitHub; sete foram então desabilitados manualmente.
- 168 workflows existem no checkout atual.
- `main` não possui branch protection observável.
- O environment `production` não possui reviewers nem wait timer.
- Há workflows automáticos capazes de acessar a VPS por SSH, reiniciar serviços/containers, alterar n8n, alterar Cloudflare, publicar frontend e modificar Supabase.
- Há workflows antigos removidos do checkout que continuam registrados no catálogo do GitHub.
- O backup diário permanece habilitado, porém a execução mais recente falhou em `Configure SSH`, antes de produzir ou transferir o backup.

## Classes de workflow

### Preservar ativos

- backup, após confirmar que não modifica runtime além de gravar backup;
- testes e validações locais;
- monitoramento externo somente leitura;
- auditorias somente leitura sem coleta de secrets.

### Converter para manual ou desabilitar

- deploy e promoção;
- repair, recovery e cutover;
- alteração de DNS/Cloudflare;
- provisionamento/alteração de n8n;
- cleanup e retention destrutivos;
- migrations e patches de produção;
- workflows temporários com escrita;
- diagnósticos que reiniciam ou reconfiguram serviços.

### Investigar antes da decisão

- jobs de negócio agendados, como sincronização de preços e comunicação diária;
- rotinas que misturam diagnóstico e reparo;
- agentes externos e publishers residentes na VPS.

## Sequência de contenção

1. Completar catálogo path/ID/trigger/efeito/owner.
2. Confirmar rotinas protetivas que devem permanecer.
3. Verificar publishers fora do GitHub.
4. Desabilitar mecanismos concorrentes por IDs explícitos.
5. Verificar novamente runs, serviços, domínios e backups.
6. Registrar rollback de cada controle aplicado.

## Rollback da contenção

Workflows desabilitados devem manter uma lista de IDs e comandos de reativação. Serviços externos pausados devem registrar estado anterior e comando de retorno. Nenhuma remoção será usada como método de contenção.

Comandos de rollback, usar somente após decisão registrada:

```bash
gh workflow enable production-front.yml
gh workflow enable n8n-universal-ready-provisioner.yml
gh workflow enable wildcard-subdomain-dns.yml
gh workflow enable remove-production-environment-gates.yml
gh workflow enable core-release-retention.yml
gh workflow enable wmp-vps-safe-cleanup.yml
gh workflow enable vps-safe-cleanup.yml
```
