# @impulsionando/api — Phase 3

NestJS + Fastify modular API. **Support pilot first** (`support.ticket.create`).

## Run (local, staging Supabase)

```bash
# from repo root
pnpm install   # or npm install in apps/api if workspace not linked
cd apps/api
set -a && source ../../.env.staging && set +a
npm run start:dev
# → http://127.0.0.1:3100/api/v1/health
```

## Endpoints (v1)

| Method | Path | Status |
| --- | --- | --- |
| GET | `/api/v1/health` | live |
| GET | `/api/v1/health/ready` | live |
| POST | `/api/v1/support/tickets` | create (validates Zod contract; inserts `support_tickets` when schema matches) |

List / update-status come next (AuthZ + capabilities).

## Gates

- Staging only — never prod keys
- No prod DNS / legacy VPS
- Do not mechanically move all TanStack routes
