# Supabase backup — how to confirm and dump by hand

Status: operator runbook for Phase 0 decision #2 (Cauã, 2026-08-30).  
Do **not** paste connection strings, passwords, or service-role keys into Git or chat.

You do **not** need a custom dump for Supabase Pro to “have a backup” — Pro already takes **daily managed backups**. A hand dump is an **extra** safety copy and helps when you later test restore on staging.

## A. Confirm managed backups (required — 2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **Impulsionando** (the live Pro project).
2. Go to **Project Settings → Database** (or **Database → Backups**, depending on UI).
3. Write down (in a private note, not in Git if it includes secrets):
   - Date/time of the **most recent** backup
   - Retention shown (Pro is typically ~7 days)
   - Whether **PITR** (Point-in-time recovery) is **On** or **Off**
4. Reply to the team with only those three facts (no keys).

That confirmation is enough for Phase 0 “confirm” **if** you also accept that a full **isolated restore drill** waits until a staging project exists.

## B. Optional: logical dump by hand (extra copy)

Use this when you want a file **you** control. Prefer dumping to your laptop encrypted disk or a private bucket — **never** commit the dump to this repo.

### Option B1 — Dashboard (simplest)

1. Dashboard → **Database → Backups**
2. If the UI offers **Download** / export for a backup, use that.
3. Store the file outside the git repo (e.g. `~/backups/impulsionando/` which is gitignored, or Drive with restricted access).

### Option B2 — `pg_dump` via connection string (advanced)

1. Dashboard → **Project Settings → Database** → copy the **URI** (session mode).  
   Use the **password reset** flow if you don’t have it. Never paste it into Slack/chat/Git.
2. On your Mac (Postgres client installed):

```bash
# Replace URI yourself in the shell — do not put it in a committed file
export DATABASE_URL='postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres'

mkdir -p "$HOME/backups/impulsionando"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$HOME/backups/impulsionando/supabase-$STAMP.dump"

# Optional encrypt
gpg -c "$HOME/backups/impulsionando/supabase-$STAMP.dump"
```

3. Verify the file size is non-trivial (`ls -lh`).
4. Unset the env var: `unset DATABASE_URL`.

**Do not** run `pg_dump` against production during peak load if the DB is large — prefer off-peak.  
**Do not** restore this dump onto the **live** project as a “test”. Restore only into a **new empty staging project**.

## C. What “restore proven” still means (later)

Phase 0 can close on **confirm + optional hand dump**. Proving restore means:

1. Create a **second** Supabase project (staging).
2. Restore the managed backup **or** `pg_restore` the hand dump **into staging only**.
3. Run read-only structure checks (`scripts/audits/phase0-supabase-structure.sql`).
4. Record duration = RTO; backup age = RPO.

## D. Storage note

Managed DB backups **do not** include Storage object bytes. Files in buckets need a separate strategy later.

## Record after you finish A (and optional B)

Update [`BACKUPS.md`](BACKUPS.md) with: latest backup date, PITR on/off, whether a hand dump was taken (path private — only “yes/no + timestamp”, no secrets).
