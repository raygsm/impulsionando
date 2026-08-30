# Staging environment inventory (names only)

Opened: **2026-08-30**  
Status: **INVENTORY — names only**  
Authority: [`TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md), [`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md), [`GHCR-AND-PROMOTE.md`](./GHCR-AND-PROMOTE.md)

**Hard rule:** list **variable names** only. Never commit values, URIs with credentials, or keys. Store secrets in the operator vault / Dokploy secret store when Phase 2 wiring is gated.

Staging apps below are the **target** deployables. Nest `api` remains Phase 3; names are reserved so staging secret slots can be planned early.

## Shared / platform

| Name | Used by (intended) | Notes |
| --- | --- | --- |
| `NODE_ENV` | all | e.g. `staging` / `production` — value not recorded here |
| `APP_ENV` | all | non-prod marker when distinct from `NODE_ENV` |
| `PORT` | api, worker, web SSR | process listen port inside container |
| `GIT_SHA` / `RELEASE_SHA` | all | full commit SHA for smoke identity |
| `PUBLIC_SITE_URL` | web, api | staging public origin |
| `PUBLIC_APP_URL` | web, api | alternate public origin if split |

## Supabase (staging project)

| Name | Used by (intended) | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | api, worker, web SSR | staging project URL |
| `SUPABASE_ANON_KEY` | web / BFF | public anon |
| `SUPABASE_PUBLISHABLE_KEY` | web / BFF | alias of anon when used |
| `SUPABASE_SERVICE_ROLE_KEY` | api, worker only | never browser |
| `SUPABASE_JWT_SECRET` | api (if needed) | staging-only; do not copy prod |
| `DATABASE_URL` | restore ops / migrations job | operator shell / job only; not app happy-path if using Supabase client |
| `VITE_SUPABASE_URL` | platform-web, tenant-web, app-web | build-time public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | platform-web, tenant-web, app-web | build-time public |
| `VITE_SUPABASE_PROJECT_ID` | web builds | staging project ref id |
| `VITE_PUBLIC_SITE_URL` | web builds | staging site |

## Observability

| Name | Used by (intended) | Notes |
| --- | --- | --- |
| `SENTRY_DSN` | web, api, worker | staging project DSN |
| `VITE_SENTRY_DSN` | web builds | if browser Sentry enabled |
| `LOG_LEVEL` | api, worker | |

## Auth / session (staging)

| Name | Used by (intended) | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser client | already listed |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser client | already listed |

## Workers / jobs (when present on staging)

| Name | Used by (intended) | Notes |
| --- | --- | --- |
| `CRON_SECRET` | worker / cron routes | staging-only secret |
| `IMPULSIONANDO_WEBHOOK_SECRET` | api / hooks | staging-only; do not reuse prod |
| `QUEUE_URL` / `REDIS_URL` | worker | if queue backend is introduced — name reserved |

## Explicit non-inventory (do not put in staging by default)

Per [`../phase-1/STAGING-RESTORE-PLAN.md`](../phase-1/STAGING-RESTORE-PLAN.md): do **not** copy prod payment provider keys, Evolution tokens, Meta webhook secrets, prod SMTP/OAuth client secrets, or prod `service_role` into staging unless a separate gated decision says so.

## Related

- [`STAGING-RESTORE-EVIDENCE.md`](./STAGING-RESTORE-EVIDENCE.md)
- [`CLEAN-INFRA-TOPOLOGY.md`](./CLEAN-INFRA-TOPOLOGY.md)
- [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md)
