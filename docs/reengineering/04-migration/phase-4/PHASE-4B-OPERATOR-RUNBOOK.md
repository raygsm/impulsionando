# Phase 4B — Operator runbook (staging close)

**Audience:** human operator  
**Gate:** Phase 4B **CLOSED** in `STATUS.md` (2026-09-03) — keep this runbook for redeploy/rollback  
**Do not:** prod DNS, legacy VPS, `db push`/reset prod, secrets in evidence docs

Authority: [`PHASE-4B-EXIT-REPORT.md`](./PHASE-4B-EXIT-REPORT.md) · [`STATUS.md`](../../STATUS.md)

## 0. Preconditions

- Repo on `reengineering/program` (or SHA that contains 4B deliverables).
- Staging Supabase project access (SQL editor / CLI) — **staging only**.
- Clean host SSH for Swarm deploy (`2.25.123.224`) — not legacy prod.
- GHCR workflows registered on **`main`** (`reengineering-ghcr-api.yml`, `reengineering-ghcr-tenant-web.yml`, `reengineering-ghcr-worker.yml`). Dispatch may build `ref=reengineering/program`.

Local contracts (no secrets) before touching staging:

```bash
npm run test:phase4b:contracts
```

## 1. Database (staging only)

Apply in order:

1. Migration `supabase/migrations/20260902120000_phase4b_tenant_aliases_membership.sql`
2. Entitlements seed SQL `scripts/staging/phase4b-seed-entitlements.sql` (if not already applied)

Record project ref + timestamp in evidence (no connection strings).

## 2. Seeds (staging)

```bash
npm run staging:seed:chrismed-tenant
npm run staging:seed:garrido-tenant
npm run staging:seed:garrido-config
npm run staging:seed:membership
```

## 3. Publish images (GHCR)

`workflow_dispatch` on GitHub Actions (full commit SHA tags only):

| Workflow | Image |
| --- | --- |
| Reengineering GHCR API | `ghcr.io/.../impulsionando-api:<sha>` |
| Reengineering GHCR tenant-web | `ghcr.io/.../impulsionando-tenant-web:<sha>` |
| Reengineering GHCR Worker | `ghcr.io/.../impulsionando-worker:<sha>` |

Note the published SHA(s). Do not treat `latest` as authority.

## 4. Deploy (clean host)

On clean host `2.25.123.224` (operator SSH — outside this runbook’s automation):

```bash
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-api-clean-host.sh
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-tenant-web-clean-host.sh
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-worker-clean-host.sh
```

Append a dated entry to `docs/reengineering/04-migration/phase-2/clean-host/IMPLEMENTATION-LOG.md` (no secrets). Update `HOST.md` only if listeners/role changed.

## 5. Live smokes

Against staging bases (env vars as used by each script; never commit tokens):

```bash
npm run phase4:smoke:tenant-resolve
npm run phase4:smoke:tenant-resolve-deny
npm run phase4:smoke:tenant-membership-allow
npm run phase4:smoke:tenant-membership-deny
npm run phase4:smoke:tenant-entitlements
npm run phase4:smoke:garrido-resolve
npm run phase4:smoke:tenant-web-health
npm run phase5:smoke:worker-health
```

Expect allow paths to return identity/entitlements; deny paths to reject unknown/spoofed/cross-tenant. HTTP 200 alone is not enough — check payload fields documented in each smoke script.

## 6. Close the gate

When all smokes pass and clean-host log is updated:

1. Update [`STATUS.md`](../../STATUS.md): Phase 4B → **Concluída** with evidence pointers (SHA, host, smoke results).
2. Optionally flip this runbook / exit report staging columns from ⏳ to ✅.
3. Do **not** proceed to prod tenant cutover from this checklist.

## Out of scope here

| Item | Why |
| --- | --- |
| Cloudflare / prod DNS | Separate gate |
| `platform-web` / `app-web` Swarm | Stubs in repo; Traefik apex/app shell later |
| Phase 5B+ queue/outbox | Separate exit reports |
| RioMed rename/migration | Read-only audit only (`RIOMED-IDENTITY-AUDIT.md`) |
