# Phase 3 Support API client

Thin fetch helpers for the Nest Support pilot (`/api/v1/support/tickets`).

## Server (TanStack strangler)

`src/lib/reengineering/support-api.ts` — used by `src/routes/api/public/support/create-ticket.ts` when `PHASE3_API_BASE` is set.

```bash
# .env.staging
PHASE3_API_BASE=https://api.stg.impulsionando.com.br
```

`abrir-ticket` keeps calling `/api/public/support/create-ticket`; the route delegates to Nest on staging.

## Smoke

```bash
npm run phase3:smoke:api
npm run phase3:smoke:support-live
```

Optional auth for list/update: `SUPPORT_SMOKE_ACCESS_TOKEN` or `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` in `.env.staging`.
