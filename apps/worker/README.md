# @impulsionando/worker

Phase **5A+5B** independent worker process.

## Current state

- HTTP `/health` and `/ready` on `WORKER_PORT` (default **3200**)
- Background heartbeat log
- **5B:** pgmq consumer when `WORKER_CONSUMER_ENABLED=true` (default)

## Env

| Var | Default | Purpose |
| --- | --- | --- |
| `WORKER_PORT` | `3200` | Health server |
| `WORKER_CONSUMER_ENABLED` | `true` | Set `false` for seed-only mode |
| `WORKER_POLL_MS` | `2000` | Queue poll interval |
| `WORKER_BATCH_SIZE` | `5` | Messages per poll |
| `WORKER_VT_SECONDS` | `30` | Visibility timeout |
| `SUPABASE_URL` | — | Required for consumer |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Required for consumer |

## Scripts

```bash
pnpm --filter @impulsionando/worker start:dev
```

## Docker / GHCR

- `infra/compose/Dockerfile.worker`
- GitHub Actions: `Reengineering GHCR Worker` (`workflow_dispatch`)

## Smokes

- `npm run phase5:smoke:worker-health`
- `npm run phase5:smoke:job-enqueue-consume` (staging, after 5B migration)
- `npm run phase5:smoke:job-duplicate` (staging)
