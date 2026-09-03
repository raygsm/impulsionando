# @impulsionando/app-web

Phase **4B** authenticated app shell runtime.

## Current state

Independent Node process with:

- `GET /health` / `GET /ready` probes
- Strangler stub JSON (authenticated routes still on legacy monolith)

## Scripts

```bash
pnpm --filter @impulsionando/app-web start:dev
# or from repo root:
npm run app-web:dev
```

Port: `APP_WEB_PORT` (default **3320**).

## Docker / GHCR

- `infra/compose/Dockerfile.app-web`
- Build locally for now; GHCR workflow can extend from `reengineering-ghcr-tenant-web.yml` when staging needs an independent app shell service
