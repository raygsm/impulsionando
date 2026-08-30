# Estado dos backups

Atualizado em: 2026-08-30 (Phase 0 close).

## Postura gerenciada Supabase

| Item | Evidência | Nível |
| --- | --- | --- |
| Projeto | Único projeto Pro (informado por owners) | `DECLARED` |
| Daily backups (Pro) | Política do provedor + **confirmação Dashboard por Cauã 2026-08-30** | `DECLARED` (operator confirm) |
| PITR | Detalhe on/off não exigido para fechar Fase 0 | follow-up opcional |
| Storage files | Backups de DB do provedor **não** incluem objetos Storage | `DECLARED` (docs provedor) |
| Restore isolado | **não executado** — dívida Fase 1/2 com projeto staging | aberto |

## Evidência VPS / Actions

- Workflow `db-backup-daily.yml` permanece **active** (preservado).
- Execução histórica `33185576586` (2026-08-28): falhou em `Configure SSH`; dump/transfer não rodaram.
- `/var/backups/impulsionando`: bundles/snapshots presentes; **sem** `daily/*.sql.gz.enc` observado em 2026-08-30.
- `core-backup-restore.yml` contido em `disabled_manually` no close (não reabilitar sem decisão).

## Conclusão (Phase 0 exit)

| Gate | Status |
| --- | --- |
| Backup gerenciado Supabase confirmado no Dashboard | **YES** (Cauã 2026-08-30) |
| Backup lógico VPS do Postgres app | **não provado** (pipeline falhou) |
| Restore isolado medido (RPO/RTO) | **não provado** — próximo passo Fase 1/2 |
| RPO/RTO aceitos por tenant P0 | **UNKNOWN** até packet Raygs |

**Phase 0:** backup confirmation satisfied. **Do not** claim restore proven.

## Próximo passo (Fase 1+)

Plano executável (P1-I): [`STAGING-RESTORE-PLAN.md`](../../04-migration/phase-1/STAGING-RESTORE-PLAN.md).

1. Staging Supabase vazio (checklist no plano).
2. Restore isolado do snapshot **ou** `pg_restore` do hand dump + smoke estrutural (`phase0-supabase-structure.sql`).
3. Registrar RPO/RTO no plano e aqui.
4. Hand dump opcional: [`SUPABASE-HAND-BACKUP-RUNBOOK.md`](SUPABASE-HAND-BACKUP-RUNBOOK.md).

Nenhum arquivo em `/var/backups` deve ser removido até o restore isolado passar.
