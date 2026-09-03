# Phase 4B — Frontend runtime boundaries

Created: **2026-09-02**  
Status: **REPO-COMPLETE** — strangler stubs + Dockerfiles in git; staging Swarm **LIVE** (`tenant.stg` health PASS)

## Target topology

```text
Traefik → platform-web   (marketing / apex)
        → tenant-web     (*.impulsionando.com.br public tenants)
        → app-web        (authenticated shell)
        → api            (Nest — existing)
        → worker         (Phase 5A — independent)
```

All web images share **full commit SHA** tags. Tenant differences are configuration + hostname, not per-tenant images.

## Delivered (repo)

| Runtime | Port | Health | Dockerfile | GHCR workflow |
| --- | --- | --- | --- | --- |
| `tenant-web` | 3300 | `/health` `/ready` | `infra/compose/Dockerfile.tenant-web` | `reengineering-ghcr-tenant-web.yml` |
| `platform-web` | 3310 | `/health` `/ready` | `infra/compose/Dockerfile.platform-web` | (build locally / extend workflow) |
| `app-web` | 3320 | `/health` `/ready` | `infra/compose/Dockerfile.app-web` | (build locally / extend workflow) |

Shared package: `@impulsionando/tenant-host` — hostname → internal tenant path.

## Strangler rule

Stubs return JSON proving independent lifecycle. **TanStack routes remain on legacy root monolith** until vertical slices migrate (4B-7).

## Local dev

```bash
pnpm install
pnpm --filter @impulsionando/tenant-web start:dev
pnpm --filter @impulsionando/platform-web start:dev
pnpm --filter @impulsionando/app-web start:dev
```

## Smokes

```bash
npm run phase4:smoke:tenant-web-health
```

## Staging gate (operator)

1. `workflow_dispatch` → Reengineering GHCR tenant-web
2. Deploy Swarm service on clean host `2.25.123.224` (separate from `reengineering-api`)
3. Traefik `Host()` rule for `*.impulsionando.com.br` tenant slice (when ready)
4. Evidence in `phase-2/clean-host/IMPLEMENTATION-LOG.md`

## 4B-7 pilot candidate

**Garrido** — path-based + subdomain `garrido.impulsionando.com.br` → `/garrido`. Seed: `npm run staging:seed:garrido-tenant`.

Chrismed remains resolve/membership contract tests only — not the low-risk pilot per `PHASE-4-TENANTS.md`.
