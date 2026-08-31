# Staging restore evidence (Phase 2)

Opened: **2026-08-30**  
Status: **STAGING REACHABLE — data present (companies/user_roles); formal RPO/RTO drill fields still open**  
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
| Project name | staging (operator-confirmed) |
| Project ref | **`aamorcqznimmleafavai`** |
| Project status | Healthy (operator 2026-08-31) |
| Local wiring | `.env.staging` + `npm run verify:staging-supabase` **OK** 2026-08-31 |
| Structure smoke (app-level) | `companies` count=313 · `user_roles` count=3 |
| Restore method (A managed / B hand dump) | _pending formal record_ |
| Backup / dump timestamp (UTC) | _pending_ |
| Restore start (UTC) | _pending_ |
| Restore ready (UTC) | _pending_ |
| RPO (achieved) | _pending_ |
| RTO (achieved) | _pending_ |
| Notes (no secrets) | Old ref `kyiczxtcoexnvcqgrgkr` superseded (no DNS). Prod deny = `arygtqrdpcdkwnuwsgmm`. Data present ⇒ restore-or-seed already happened; still need timestamps for Phase 1 exit. |

## Drill log

| Date (UTC) | Operator | Action | Result | Evidence (refs only) |
| --- | --- | --- | --- | --- |
| 2026-08-30 | Agent | Attempt execute P1-I restore end-to-end | **BLOCKED** — Dashboard unauthenticated | `/sign-in` |
| 2026-08-30 ~23:50Z | Cauã + org AI | Create sibling project (logged as `kyiczxt…`) | recorded; later superseded | dead DNS |
| 2026-08-31 | Cauã | Confirmed live staging ref `aamorcqznimmleafavai` + API keys | Healthy | Dashboard |
| 2026-08-31 ~20:24Z | Agent | `npm run verify:staging-supabase` | **OK** — companies=313 user_roles=3 | local `.env.staging` |
  
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
| Project name | `impulsionando-staging` (operator-confirmed) |
| Project ref | **`aamorcqznimmleafavai`** (canonical as of 2026-08-31) |
| Region | _confirm in Dashboard_ |
| Plan / compute | _confirm in Dashboard_ |
| PostgreSQL | _confirm in Dashboard_ |
| Created at (UTC) | _confirm in Dashboard_ |
| Project status at record | **Healthy** (operator 2026-08-31) |
| Notes (no secrets) | Earlier create log used ref `kyiczxtcoexnvcqgrgkr` — **superseded**; that hostname does not resolve. Staging = `aamorcqznimmleafavai`. Prod deny = `arygtqrdpcdkwnuwsgmm`. |

## Drill log

| Date (UTC) | Operator | Action | Result | Evidence (refs only) |
| --- | --- | --- | --- | --- |
| 2026-08-30 | Agent | Attempt execute P1-I restore end-to-end | **BLOCKED** — Dashboard unauthenticated in agent session | `/sign-in` |
| 2026-08-30 | Agent | Confirm prod ref for deny-list | OK | `arygtqrdpcdkwnuwsgmm` |
| 2026-08-30 ~23:50Z | Cauã + org AI | Create sibling project `impulsionando-staging` | **CREATED** — status COMING_UP; restore not run; prod untouched | ref `kyiczxtcoexnvcqgrgkr`, region `us-east-2`, PG 17.6.1.166 |
| 2026-08-31 ~20:05Z | Agent | Attempt close P1-I via local `.env.staging` | **BLOCKED** — no `.env.staging` on operator machine; cannot claim restore without evidence timestamps | scripts ready: `npm run verify:staging-supabase` |

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
