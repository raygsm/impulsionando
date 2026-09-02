# @impulsionando/tenant-web

Phase **4B** public / white-label tenant web runtime.

## Current state

Independent Node process with:

- `GET /health` / `GET /ready` probes
- Hostname → tenant path via `@impulsionando/tenant-host`
- Strangler stub JSON (TanStack routes still on legacy monolith)

## Scripts

```bash
pnpm --filter @impulsionando/tenant-web start:dev
```

Port: `TENANT_WEB_PORT` (default **3300**).

## Docker / GHCR

- `infra/compose/Dockerfile.tenant-web`
- GitHub Actions: `Reengineering GHCR tenant-web` (`workflow_dispatch`)
