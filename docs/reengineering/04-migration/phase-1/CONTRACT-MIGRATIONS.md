# Contract — Database migrations (expand / contract)

Track: **P1-G**  
Status: **Phase 1 contract** (executable standard; does **not** authorize applying migrations, `db push`, `db reset`, or production schema writes)  
Date: 2026-08-30

## Authority

| Precedence | Source |
| ---------- | ------ |
| Observational SoT (live shape) | [`../../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md`](../../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md) |
| Drift evidence | [`../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md`](../../01-current-state/phase-0/SUPABASE-LIVE-AUDIT.md), [`../../01-current-state/phase-0/SUPABASE-RISK-REGISTER.md`](../../01-current-state/phase-0/SUPABASE-RISK-REGISTER.md) |
| Delivery rules | [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md), [`../../00-foundation/PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md) |
| Target layout | [`../../02-target-architecture/REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md) (`supabase/migrations/`, future `packages/database`) |
| Staging / restore | [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) (P1-I) |

Live Supabase structure remains the **observational baseline** of production reality until a reconciled, forward-only migration corpus is proven. Repository `supabase/migrations/` and `src/integrations/supabase/types.ts` are **not** authority for production shape today.

---

## 1. Expand / contract rules

All schema changes that affect running application code follow **expand → migrate traffic → contract**.

### Expand (additive, same release window as app deploy)

Allowed in the migration that ships **with or before** the app that needs the new shape:

- Add nullable columns, new tables, new indexes (non-blocking where possible).
- Add new enums / enum values (never rename or remove values in the same step).
- Add views, functions, triggers that are **backward-compatible** with the currently deployed app.
- Add RLS policies that only **narrow** or **add** explicit allow paths after deny tests exist (see §4).
- Dual-write / dual-read bridges (old column + new column, old table + new table) when renaming or splitting identity.

The expanded schema **must** remain compatible with the previously deployed application image. App rollback must not require a schema downgrade.

### Migrate (application / dual-path)

- New application code reads/writes the expanded shape; may still tolerate the old shape until contract.
- Backfills run as **controlled jobs** (idempotent, batched, observable), not as unbounded one-shot SQL in the app startup path.
- Feature flags or versioned readers may bridge during the window; silent fallback to an unidentified schema is forbidden.

### Contract (destructive, later release only)

Allowed only in a **subsequent** release after:

1. staging proof that nothing reads/writes the retired surface;
2. backup / restore compatibility for the post-contract schema;
3. documented rollback that does **not** reverse the destructive migration (roll app image back only if still compatible, or leave schema expanded).

Contract steps include: drop column/table, rename without dual column, remove enum value, drop policy/function/trigger that old code still needs, `NOT NULL` on a column that old writers omit.

**Hard rule:** never drop or tighten a column/table in the same release as the application that still depends on it. Destruction is always a later release.

### Compatibility matrix (release N)

| Change type | Release N (expand) | Release N+k (contract) |
| ----------- | ------------------ | ---------------------- |
| Add column / table | Yes | — |
| Backfill / dual-write | Yes (job) | Stop dual-write |
| App uses new shape | Yes | Required before drop |
| Drop / rename / NOT NULL | **No** | Yes, after evidence |
| App rollback to previous SHA | Must work against expanded schema | Must not require undoing drop |

---

## 2. Immutable migrations

1. **Never rewrite** a migration file that has been applied to any shared environment (staging or production), or that appears in that environment’s `supabase_migrations.schema_migrations` history.
2. **Never edit** checksums, timestamps, or version IDs of applied versions to “make histories match.”
3. Fix mistakes with a **new** forward migration (or an expand that adds the correct object and a later contract that removes the wrong one).
4. Local-only drafts may be amended **only** before first apply to any shared DB; once applied anywhere shared, they are frozen.
5. Duplicate version timestamps in the repo (known Phase 0 hazard) must be resolved by **new** uniquely versioned files and an explicit reconciliation record — not by renaming applied history on live.

Migrations are applied by a **controlled release job**, never by API/worker replica startup, and never by ad-hoc `db push` against production.

---

## 3. Reconciliation strategy (repo ↔ live drift)

Phase 0 established material divergence: live migration history and repo files share only a small intersection; `types.ts` intersects live public tables poorly. Corrective posture is **observe → baseline → forward-only**, never “force repo onto live.”

### Phase A — Observe (complete for Phase 0; keep current)

- Treat live inventory (audit + `.local/phase0-evidence/` CSVs) as observational SoT.
- Do not apply repo migrations to “catch up.”
- Do not regenerate types and treat them as a contract to fix live.
- Record drift metrics (table counts, version-set diffs) when re-auditing.

### Phase B — Baseline (Phase 1 prep; gated by P1-I)

1. Prove backup + isolated restore (see staging/restore plan).
2. Stand up a **staging** Supabase project restored or structured from an approved, anonymized/isolated copy — not casual prod clones.
3. Capture a **schema baseline artifact** from the restored/staging shape (structure-only dump or equivalent inventory): tables, columns, constraints, indexes, RLS enablement, policies, grants, functions, triggers, storage buckets.
4. Decide and record a **migration corpus root**: either
   - **Baseline squash:** one (or few) reviewed “baseline” migration(s) that recreate the observed shape for *new* environments, with live/staging marked as already at that baseline via explicit history bookkeeping; or
   - **Shadow baseline:** keep live history untouched; repo starts a **new forward-only** sequence whose first commit is documentation + empty/no-op + process, then only additive deltas validated on staging.

Either path must leave production history intact. Inventing a fake shared past by rewriting `schema_migrations` on prod is forbidden.

### Phase C — Forward-only (ongoing)

1. Every production schema change is a **new** immutable migration file in `supabase/migrations/`.
2. Apply order: CI checks → apply on **staging** via migration job → smoke / RLS / app tests → human gate → **same migration version(s)** on production via migration job.
3. Repo and live converge only by **applying the same forward migrations** that staging already accepted — never by resetting prod to match git, never by wholesale `db push`.
4. Objects that exist only in repo history and never on live are **not** resurrected onto prod unless a product decision and expand migration deliberately recreate them.
5. Objects that exist only on live are captured into the baseline artifact; subsequent changes to them go through forward migrations.

### Drift detection (continuous)

- CI or scheduled audit compares: applied version set (staging/prod) vs repo files; optional structure diff against baseline artifact.
- Drift alerts are **stop-the-line** for schema PRs until reconciled with a forward migration or an explicit documented exception.
- HTTP 200 / green deploy is not schema proof.

---

## 4. RLS and policy changes

RLS and grants are **tested, not presumed** ([`PRINCIPLES.md`](../../00-foundation/PRINCIPLES.md), [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)).

Any PR that creates, alters, or drops:

- `ENABLE/FORCE ROW LEVEL SECURITY`
- policies (`CREATE` / `ALTER` / `DROP POLICY`)
- grants / revokes on tables, views, or routines exposed to `anon` / `authenticated`
- `SECURITY DEFINER` function bodies or execute privileges
- Storage bucket policies

**must** include automated **allow and deny** tests before merge, at minimum:

| Case | Expectation |
| ---- | ----------- |
| Member of tenant A | can perform intended action on A’s rows |
| Member of tenant A | **denied** on tenant B’s rows (read and write) |
| User without membership | **denied** |
| Inadequate role / capability | **denied** |
| Privileged server path (`service_role` / authorized backend) | succeeds only where intended and leaves audit where required |

Additional rules:

- Do not enable real data on tables that lack RLS (Phase 0: 21 EVR tables) until policies + allow/deny tests exist.
- Do not “fix” hardcoded tenant UUID policies by expanding them in prod without a tenant-identity contract and tests.
- Policy expressions that use `USING (true)` / `WITH CHECK (true)` require an explicit product justification and abuse tests.
- Structure-only CI green without allow/deny coverage does **not** satisfy this contract.

Target home for shared DB test helpers: `packages/testing` / `supabase/tests` per [`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md).

---

## 5. Forbidden operations

| Forbidden | Why |
| --------- | --- |
| `supabase db reset` (or equivalent) against staging-with-prod-data or production | Destroys or rewrites shared state; not a reconciliation tool |
| Wholesale `db push` / migrate-to-match-repo against live | Repo history ≠ live history; intersection is small |
| Rewriting or deleting applied migration files / history rows | Breaks immutability and auditability |
| Destructive drops (column/table/enum value/policy needed by old app) in the **same** release as the app that still needs them | Violates expand/contract; blocks safe app rollback |
| Schema changes applied by every API/worker replica on startup | Race, partial apply, unclear ownership |
| Regenerating `types.ts` and treating output as SoT to “correct” live | Types currently diverge; see §7 |
| Production migration job without prior successful staging apply of the **same** versions | No rehearsal, no gate |
| Using tag `latest` or unpinned local SQL as production schema identity | Release identity must be commit SHA + migration version set |

Exceptions require a written decision in `05-governance/` with owner, blast radius, backup proof, and rollback that does not assume destructive undo.

---

## 6. Staging before production migration jobs

Per [`CI-CD.md`](../../03-platform/CI-CD.md) and Dokploy migration boundary:

```text
PR (migration SQL + tests)
  → lint / types gate (see §7) / unit / integration / RLS allow+deny / build
merge to main
  → migration job on STAGING (controlled, versioned)
  → staging smoke + E2E + RLS suite
promotion approved (human while program is in migration)
  → SAME migration versions on PRODUCTION (controlled job)
  → external smoke + release record (commit SHA + schema versions)
```

Requirements:

1. **Staging Supabase** must exist and be the first apply target for every forward migration (P1-I).
2. Production apply is a **promotion of already-applied staging versions**, not a different SQL path.
3. Backup posture: compatible backup before production contract (destructive) steps; restore rehearsed for the class of change.
4. App images promote independently of schema only within expand/contract compatibility; readiness gates must fail closed if required migrations are missing.
5. Rollback of application **must not** depend on reversing a destructive migration.

Until staging + restore gates from P1-I are met, **no** corrective or forward production migrations are authorized by this contract alone.

---

## 7. Gating `types.ts` regeneration

Current path: `src/integrations/supabase/types.ts` (legacy monolith). Target: types derived from a reconciled schema live under `packages/database` (or equivalent) once the monorepo exists.

### When regeneration is forbidden

- Phase 0 posture continues until Phase B baseline exists: do **not** regenerate and commit types as a way to “fix” production or to invent a contract.
- Do not regenerate from an arbitrary linked project without recording **which** project (staging vs prod) and **which** schema version set was used.
- Do not treat regenerated types as permission to alter live schema.

### When regeneration is allowed

All of the following must be true:

1. **Baseline or forward migration corpus** for the target environment is defined (§3 Phase B/C).
2. Regeneration source is **staging** (preferred) or a structure-only snapshot that matches the migration version set under test — not an stale laptop DB.
3. The PR that updates types:
   - lists the migration version(s) / baseline ID used as input;
   - is coupled to those migrations (same PR or strictly dependent PR);
   - does not widen client surface to tables/columns that lack RLS allow/deny coverage when those surfaces are newly exposed to `anon`/`authenticated`;
   - passes typecheck for packages that import the generated types.
4. Human review confirms the diff is explained by the migration (additive expand expected; mass unexplained churn is a stop).

### Process sketch

```text
forward migration merged & applied on staging
  → generate types FROM staging (or CI job with staging credentials)
  → commit types only with migration version metadata in PR description
  → consumers compile against new types
  → production migration promotion does not require a second type regen if versions match
```

Until the gate above is satisfied, `types.ts` remains a **historical / divergent artifact**. Call sites must not assume it matches live; characterization and live audit win disputes.

---

## 8. Definition of done (schema change)

A schema change is done when:

- [ ] Expand/contract phase of the change is correct for this release (§1).
- [ ] New immutable migration file(s); no rewrite of applied history (§2).
- [ ] Staging applied successfully with the same versions intended for prod (§6).
- [ ] RLS/policy/grant/DEFINER changes have allow **and** deny tests (§4).
- [ ] No forbidden operation used (§5).
- [ ] Types updated only if §7 gates pass (or explicitly deferred with rationale).
- [ ] Release record includes commit SHA + migration version set.
- [ ] Rollback plan does not require undoing a destructive migration.

---

## 9. Out of scope for this contract alone

- Applying any migration to staging or production (needs P1-I + human gate).
- Choosing canonical tenant column names (P1-C).
- Implementing Nest/`packages/database` scaffolding (later phases).
- Re-enabling contained workflows or cleaning live EVR tables without product decision.

---

## Related

- Phase 1 board: [`README.md`](README.md)
- Foundation phase summary: [`../PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md)
- Decision log entry P0-SCHEMA-SOT: [`../../05-governance/DECISIONS.md`](../../05-governance/DECISIONS.md)
