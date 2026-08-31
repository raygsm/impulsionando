# Staging restore evidence (Phase 2)

Opened: **2026-08-30**  
Status: **PROJECT CREATED — waiting healthy + restore drill**  
Authority: [`../phase-1/STAGING-RESTORE-PLAN.md`](../phase-1/STAGING-RESTORE-PLAN.md)

**Hard rule:** no secrets, connection strings, dump paths with credentials, or API keys in this file.

## Known production identity (DO NOT restore here)

| Field | Value |
| --- | --- |
| Prod project ref | `arygtqrdpcdkwnuwsgmm` |
| Prod posture | Managed Pro; daily backup **confirmed** by Cauã 2026-08-30 ([`BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md)) |
| Isolated restore onto prod | **Forbidden** |

## Evidence table (staging)

| Field | Value |
| --- | --- |
| Project name | `impulsionando-staging` |
| Project ref | `kyiczxtcoexnvcqgrgkr` |
| Region | `us-east-2` |
| Plan / compute | Paid additional project in org; compute size **not yet reported** by create integration |
| PostgreSQL | **17.6.1.166** (engine 17) |
| Created at (UTC) | **2026-08-30T23:50:43.273537Z** |
| Project status at record | **COMING_UP** (initializing — not healthy yet) |
| Restore method (A managed / B hand dump) | _pending — not executed_ |
| Backup / dump timestamp (UTC) | _pending_ |
| Restore start (UTC) | _pending_ |
| Restore ready (UTC) | _pending_ |
| RPO (achieved) | _pending_ |
| RTO (achieved) | _pending_ |
| Structure smoke result | _pending — `scripts/audits/phase0-supabase-structure.sql` on staging only_ |
| Operator | Cauã (org AI integration + human) |
| Recorded at (UTC) | **2026-08-30** (create report ingested) |
| Notes (no secrets) | Sibling project created; **produção não foi alterada**. Restore **not** run. Empty staging ≠ restore proven. |

## Drill log

| Date (UTC) | Operator | Action | Result | Evidence (refs only) |
| --- | --- | --- | --- | --- |
| 2026-08-30 | Agent | Attempt execute P1-I restore end-to-end | **BLOCKED** — Dashboard unauthenticated in agent session | `/sign-in` |
| 2026-08-30 | Agent | Confirm prod ref for deny-list | OK | `arygtqrdpcdkwnuwsgmm` |
| 2026-08-30 ~23:50Z | Cauã + org AI | Create sibling project `impulsionando-staging` | **CREATED** — status COMING_UP; restore not run; prod untouched | ref `kyiczxtcoexnvcqgrgkr`, region `us-east-2`, PG 17.6.1.166 |

## Next (restore — only after healthy)

1. Wait until Dashboard shows staging **Active / healthy** (not COMING_UP).
2. On **prod** (`arygtqrdpcdkwnuwsgmm`) → Database → Backups: note latest backup **UTC**.
3. Restore **into staging only** (`kyiczxtcoexnvcqgrgkr`):
   - Prefer **Restore to a new project / clone into existing staging** if UI supports targeting this ref.
   - If UI only offers **in-place restore on prod** → **STOP**. Use Option B (`pg_restore` hand dump → staging URI only).
4. Record restore start/ready → compute RPO/RTO.
5. Structure smoke on **staging** connection only (keys in vault).
6. Flip this file Status → **DRILL COMPLETE**.

## Related

- [`../phase-1/STAGING-RESTORE-PLAN.md`](../phase-1/STAGING-RESTORE-PLAN.md)
- [`../../01-current-state/phase-0/BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md)
- [`../../01-current-state/phase-0/SUPABASE-HAND-BACKUP-RUNBOOK.md`](../../01-current-state/phase-0/SUPABASE-HAND-BACKUP-RUNBOOK.md)
- [`STAGING-ENV-INVENTORY.md`](./STAGING-ENV-INVENTORY.md)
