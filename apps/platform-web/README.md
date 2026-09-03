# @impulsionando/platform-web

Phase **4B** institutional / marketing web runtime (apex).

## Current state

Independent Node process with:

- `GET /health` / `GET /ready` probes
- Strangler stub JSON (marketing routes still on legacy monolith)

## Scripts

```bash
pnpm --filter @impulsionando/platform-web start:dev
# or from repo root:
npm run platform-web:dev
```

Port: `PLATFORM_WEB_PORT` (default **3310**).

## Docker / GHCR

- `infra/compose/Dockerfile.platform-web`
- Build locally for now; GHCR workflow can extend from `reengineering-ghcr-tenant-web.yml` when staging Traefik needs an independent apex service
