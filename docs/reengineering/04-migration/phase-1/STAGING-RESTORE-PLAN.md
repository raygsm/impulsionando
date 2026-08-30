# Staging Supabase + isolated restore plan

Track: **P1-I**  
Status: **PLAN — humans execute** (no agent-created Supabase project unless credentials/tools are clearly available and the operator treats it as user-equivalent ops)  
Opened: 2026-08-30  
Authority: Phase 1 foundation; closes Phase 0 J-16 restore debt documented in [`BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md)

**Hard rules**

- No restore onto the **production** Supabase project.
- No secrets (connection strings, passwords, service-role keys, dump paths with credentials) in Git, chat, or this doc.
- Prefer a written checklist operators run; agents do not invent prod writes as “diagnostics.”
- Backup **confirmed** ≠ restore **proven**. This plan is how restore becomes proven.

---

## 1. Goals

| Goal | Why |
| --- | --- |
| **Prove restore** | Show that a managed backup **or** hand `pg_dump` can be restored into an **isolated** non-prod project, with measured **RPO** (backup age) and **RTO** (wall-clock restore + smoke). |
| **Enable non-prod auth / tenant tests** | Give Phase 1 exit a safe DB + Auth surface for allow/deny membership and RLS characterization without touching live tenants. |
| **Unblock Phase 2 prep** | Phase 2 still owns Dokploy/GHCR/DNS; this track only delivers a **named staging Supabase** that later platform work can point at. |

Success for P1-I (plan + first drill):

1. Staging project exists (name/ref recorded — no secrets).
2. One isolated restore completed **into staging only**.
3. Read-only structure smoke from `scripts/audits/phase0-supabase-structure.sql` recorded.
4. Numeric RPO/RTO written below (and optionally mirrored into the Raygs packet §3 once Raygs accepts gates).

---

## 2. Explicit non-goals

| Out of scope for P1-I | Where it belongs |
| --- | --- |
| Dokploy / Traefik / clean VPS | Phase 2 ([`PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md)) |
| GHCR images, CI deploy to staging hosts | Phase 2 + [`CI-CD.md`](../../03-platform/CI-CD.md) |
| DNS / Cloudflare cutover | Phase 2+ |
| Nest / monorepo scaffolding | After ADRs Aceitas + Phase 1/2 gates |
| Production schema push / reset / `db push` | Forbidden |
| Re-enabling contained GitHub workflows | Decision + containment docs only |
| Full Storage object byte restore | Separate later strategy (DB backup ≠ Storage files) |
| Anonymized full E2E of every tenant journey | Desirable; not required to mark restore proven |
| Accepting ADRs 001–008 | P1-B / humans |

---

## 3. Prerequisites (before create / restore)

- [ ] Phase 0 backup confirmation still holds (Dashboard daily backup visible) — see [`BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md).
- [ ] Operator has Supabase org access to **create a second project** (Raygs/Cauã — packet §2 / §6).
- [ ] Prod project **never** selected as restore target; double-check project name/ref before any restore UI action.
- [ ] Private note ready (1Password / operator vault) for staging URL, anon key, service role, DB password — **not** this repo.
- [ ] Optional hand dump already taken per [`SUPABASE-HAND-BACKUP-RUNBOOK.md`](../../01-current-state/phase-0/SUPABASE-HAND-BACKUP-RUNBOOK.md) if choosing Option B restore.
- [ ] `/var/backups/impulsionando` on VPS **not** deleted until this drill passes (per BACKUPS.md).

---

## 4. Checklist — create staging Supabase project

Execute as human ops. Record only non-secret identifiers in Git after the fact.

| # | Step | Done |
| ---: | --- | --- |
| 1 | Open [Supabase Dashboard](https://supabase.com/dashboard) → organization that owns Impulsionando prod. | ☐ |
| 2 | **New project** — name e.g. `impulsionando-staging` (or agreed slug). Region: prefer **same region as prod** unless Raygs decides otherwise (note choice). | ☐ |
| 3 | Generate a **strong DB password**; store only in the private vault. | ☐ |
| 4 | Plan: **Pro** if restore-from-managed-backup UI requires it; otherwise Free/Pro as org policy allows. Note plan tier in the evidence table below. | ☐ |
| 5 | Wait until project status is healthy (API + DB ready). | ☐ |
| 6 | Record in private note: project **name**, **ref**, region, created_at (UTC). In Git evidence table: name + ref only. | ☐ |
| 7 | Auth: leave default; do **not** copy prod JWT secret / custom SMTP / OAuth client secrets into staging unless a later controlled step requires it (default = **isolated Auth**, new users for tests). | ☐ |
| 8 | API keys: treat staging `service_role` as sensitive as prod; never commit; never share into CI until Phase 2 secret store exists. | ☐ |
| 9 | Confirm Raygs packet §6 can flip to **Yes** with project name/ref (no secrets). | ☐ |
| 10 | Label clearly in Dashboard favorites / org notes: **STAGING — restore drill / non-prod**. | ☐ |

**Do not** wire production domains, webhooks (Mercado Pago, n8n, Evolution, Meta), or GitHub Actions to this project in Phase 1.

---

## 5. Restore options

Choose **one** primary path for the first proven drill. Option A is preferred when the Dashboard supports restore-into-another-project; Option B proves the hand-dump path.

### Option A — Dashboard / managed backup restore (preferred when available)

1. In **production** project: **Database → Backups** — note latest backup timestamp (this ages into **RPO**).
2. Use Supabase UI flow to restore that backup **into the staging project** (or “restore to a new project” then treat that project as staging — do not overwrite prod).
3. If the UI only offers in-place restore on the same project: **STOP**. Do not proceed on prod. Fall back to Option B or create staging via support/docs path that restores to a **different** project ref.
4. Start wall clock when restore is confirmed started; stop when Dashboard reports DB ready → contributes to **RTO**.
5. Proceed to §7 validation.

### Option B — `pg_restore` of hand dump into staging

Prerequisites: custom-format dump from runbook Option B2 (`--format=custom`), stored **outside** git (e.g. `~/backups/impulsionando/`), optionally GPG-encrypted.

1. Staging Dashboard → **Project Settings → Database** → copy **URI** into a local shell env var only (`DATABASE_URL`). Never paste into Git/Slack.
2. Off-peak preferred if dump is large; restore targets **staging URI only**.
3. Example pattern (operator fills URI locally):

```bash
# Staging URI only — never commit
export DATABASE_URL='postgresql://…staging…'
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname="$DATABASE_URL" \
  "$HOME/backups/impulsionando/supabase-YYYYMMDDTHHMMSSZ.dump"
unset DATABASE_URL
```

4. Expect noise on roles/extensions that Supabase manages; treat “object already exists” / owner warnings as triage items, not automatic failure. Failure = empty/wrong schema or restore abort.
5. Wall clock from `pg_restore` start to successful exit (+ DB accepting connections) → **RTO**. Dump’s backup timestamp vs restore start → **RPO**.
6. Proceed to §7 validation.

### Option comparison

| | Option A (Dashboard) | Option B (`pg_restore`) |
| --- | --- | --- |
| Proves | Managed Pro backup is restorable | Operator-controlled logical dump is restorable |
| Needs | Staging project + UI path that never overwrites prod | Hand dump + `pg_restore` client |
| Risk | Mis-click prod project | Wrong `DATABASE_URL` |
| Storage objects | Still **not** restored | Still **not** restored |

Either option is enough to mark **restore proven** for Phase 1 J-16 debt if validation passes. Doing **both** later is nice-to-have.

---

## 6. Anonymization and access rules

Default posture: staging may contain a **full structural + row copy** after restore. Treat it as **sensitive**, not “public sandbox.”

| Rule | Detail |
| --- | --- |
| **No prod secrets into staging by default** | Do not copy prod `service_role`, JWT secret, webhook signing secrets, payment keys, SMTP, OAuth client secrets, or Evolution tokens into staging env/CI. Staging gets **its own** keys. |
| **No prod webhook fan-out** | Disable or never configure staging URLs on Mercado Pago, n8n, Meta, Evolution. Staging must not emit to prod integrations. |
| **Auth isolation** | Prefer staging-native test users. If Auth users were restored from backup, do not reuse prod passwords in docs; rotate or create fresh test accounts for allow/deny suites. |
| **Access allow-list** | Only Cauã + Raygs (and explicitly named ops) until Phase 2; no client / tenant admin access to staging Dashboard. |
| **Git / chat** | Project ref + “restore OK / fail” + RPO/RTO numbers only. No dumps, URIs, or keys. |
| **Anonymization (optional follow-up)** | After first structural proof, prefer scrubbing PII (emails, phones, clinical/fiscal fields) before wide engineer access. First drill may skip scrub if access stays on the allow-list — record that choice. |
| **Data handling** | Align with Raygs packet: treat restored rows as real data until scrubbed. |

---

## 7. Validation (after restore)

### 7.1 Structure smoke (required)

Run **read-only** sections from [`scripts/audits/phase0-supabase-structure.sql`](../../../../scripts/audits/phase0-supabase-structure.sql) in the **staging** SQL Editor (one numbered `SELECT` at a time; result limit **No limit**).

Minimum set for restore proof:

| Query | Purpose |
| --- | --- |
| `01-tables-columns` | Tables/columns/RLS flags present |
| `02-rls-policies` | Policies restored |
| `03-functions` | Function metadata (no bodies required) |
| `08-extensions` | Extensions present |
| `10-summary` | Single-row counts for quick compare |

Optional but useful: `04-triggers`, `05-grants`, `06-storage-buckets` (metadata only), `07-migration-history`, `09-security-definer-surface`.

Compare staging `10-summary` counts to the last prod Phase 0 export if available (order-of-magnitude / equality on table & policy counts). Document deltas (UNKNOWN if no prod baseline file at hand).

**Do not** add DML/DDL to the audit script for this drill.

### 7.2 Auth / tenant readiness (Phase 1 exit enabler)

After structure OK:

- [ ] Create **staging-only** Auth users for allow and deny cases (or document restored users + rotation).
- [ ] Smoke: sign-in against staging project URL/keys from a local or non-prod app config (not prod `.env`).
- [ ] Plan (execute when contracts P1-C / P1-D ready): membership allow for company A; deny cross-tenant read — evidence in [`AUTH-TENANT-BASELINE-TESTS.md`](AUTH-TENANT-BASELINE-TESTS.md) (P1-J).

### 7.3 Record RPO / RTO

| Metric | Definition | Fill after drill |
| --- | --- | --- |
| **RPO (achieved)** | Age of backup/dump used: `restore_start_utc − backup_timestamp_utc` | ______ |
| **RTO (achieved)** | Wall time until staging DB ready + §7.1 summary query succeeds | ______ |
| Backup / dump source | Managed UI timestamp **or** dump filename stamp | ______ |
| Method | Option A / Option B | ______ |
| Staging project name / ref | Non-secret identifiers | ______ |
| Operator + date | Who ran the drill | ______ |
| Structure smoke | Pass / fail + notes | ______ |

Target gates (Raygs packet §3) may still be blank; **achieved** numbers here close the “restore not proven” UNKNOWN even before Raygs accepts max RPO/RTO.

Update [`BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md) after the drill: restore proven yes/no, RPO/RTO, method — still no secrets.

---

## 8. How this unblocks Phase 1 exit and Phase 2

### Phase 1 exit ([`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md))

Exit needs ADRs Aceitas, contracts, pilot module, and **auth/tenant baseline tests in non-prod**. This plan:

- Supplies the **non-prod Supabase** those tests bind to.
- Closes J-16 “isolated restore” residual from Phase 0 exit report.
- Does **not** by itself finish Phase 1 (contracts P1-C–G, ADR packet P1-B, pilot P1-H still required).

### Phase 2 ([`PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md))

Phase 2 work includes “provisionar Supabase de staging separado” and later “testar … restauração.” P1-I:

- Can **pre-create** and **prove restore** so Phase 2 does not discover backup failure mid-platform build.
- Leaves Dokploy, GHCR SHA deploy, DNS, Traefik, centralized logs to Phase 2.
- Staging project ref becomes an input to Phase 2 env/secret wiring (still outside git).

### CI/CD note ([`CI-CD.md`](../../03-platform/CI-CD.md))

Production gates require “backup/restauração compatíveis.” This drill is the first evidence artifact; promoting images to prod still waits for Phase 2+ human gates.

---

## 9. Evidence log (fill in place)

| Date | Actor | Action | Result | Evidence (paths / refs, no secrets) |
| --- | --- | --- | --- | --- |
| 2026-08-30 | P1-I | Plan written | Plan only — restore **not** yet executed | this file |
| | | Staging project created | | |
| | | Restore Option A/B | | |
| | | Structure smoke | | |
| | | RPO/RTO recorded | | |

---

## 10. Related documents

- [`BACKUPS.md`](../../01-current-state/phase-0/BACKUPS.md) — current backup posture; next step points here
- [`SUPABASE-HAND-BACKUP-RUNBOOK.md`](../../01-current-state/phase-0/SUPABASE-HAND-BACKUP-RUNBOOK.md) — confirm managed backup + optional `pg_dump`
- [`PHASE-0-EXIT-REPORT.md`](../../01-current-state/phase-0/PHASE-0-EXIT-REPORT.md) — restore deferred at Phase 0 close
- [`RAYGS-DECISION-PACKET.md`](../../01-current-state/phase-0/RAYGS-DECISION-PACKET.md) — §3 RPO/RTO targets, §6 staging existence
- [`phase-1/README.md`](./README.md) — workboard track P1-I
- [`PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md) — staging platform (Dokploy et al.) after this prep
