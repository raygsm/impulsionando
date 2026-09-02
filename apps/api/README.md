# @impulsionando/api — Phase 3

NestJS + Fastify modular API. **Support pilot:** create / list / update-status.

## Run (local, staging Supabase)

```bash
# from repo root — use staging project aamorcqznimmleafavai only
pnpm install --filter @impulsionando/api...
set -a && source .env.staging && set +a
pnpm --filter @impulsionando/api start:dev
# → http://127.0.0.1:3100/health
# → http://127.0.0.1:3100/api/v1/support/tickets
```

## Endpoints (v1)

| Method | Path | Auth | Status |
| --- | --- | --- | --- |
| GET | `/health` | none | live (Traefik-compatible) |
| GET | `/health/ready` | none | live |
| POST | `/api/v1/support/tickets` | optional Bearer | create |
| GET | `/api/v1/support/tickets` | Bearer | list (staff = all; else own/company) |
| PATCH | `/api/v1/support/tickets/:id/status` | Bearer staff | update-status |

## Image

```text
infra/compose/Dockerfile.api
ghcr.io/<org>/impulsionando-api:<full-sha>
```

Workflow: `.github/workflows/reengineering-ghcr-api.yml` (`workflow_dispatch`).

## Gates

- Staging only — never prod keys / prod DNS / legacy VPS
- Service-role used for DB; AuthZ enforced in Nest (list/update)
- Do not mechanically move all TanStack routes
