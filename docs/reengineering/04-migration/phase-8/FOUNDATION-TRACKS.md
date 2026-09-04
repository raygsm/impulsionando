# Phase 8 — foundation tracks (F1–F9)

Created: **2026-09-04** · Subphase **8A** · State: **NOT STARTED**
Board: [`README.md`](./README.md) · Shape: [`TARGET-APP-SHAPE.md`](./TARGET-APP-SHAPE.md)

Nothing here is product-visible. All of it blocks the product. Eight of the twelve `packages/*` directories are README-only placeholders and `apps/app-web` is a health stub, so the first slice cannot start until this lane produces a working platform.

F1–F7 and F9 can run **in parallel**. F8 is a hard precondition for slice S2.

## F1 — `apps/app-web` becomes a real TanStack Start app

| Item | Detail |
| --- | --- |
| Replaces | `apps/app-web/src/server.ts` raw `node:http` stub |
| Stack | `@tanstack/react-start` ^1.167, React 19, Vite 7, Nitro 3 node-server preset, Tailwind 4 — matching the root monolith so extracted components port cleanly |
| Delivers | Router, `__root.tsx` shell, `_app` and `_staff` layouts, `/healthz` with `gitSha`, `/ready`, one placeholder screen |
| Does **not** deliver | Any product screen, any Supabase call |
| Done when | `pnpm --filter @impulsionando/app-web dev` serves SSR HTML locally and `npm run phase8:smoke:app-web-health` passes against staging |
| Depends on | — |

Keep `apps/app-web` out of the root Vite build. The root monolith and `app-web` are two independent builds that happen to share a repository.

## F2 — `packages/api-client`

| Item | Detail |
| --- | --- |
| Extracts | `src/lib/reengineering/support-api.ts`, `tenant-api.ts`, `tenant-resolve-api.ts` |
| Provides | Typed methods over `@impulsionando/contracts`; base URL from config; bearer injection; `X-Correlation-Id`; `Idempotency-Key` on writes; envelope → typed error mapping; bounded retry on idempotent GETs only |
| Consumed by | `app-web` (server and client), `platform-web`, `tenant-web`, smoke scripts |
| Done when | Legacy strangler modules re-export from the package instead of holding their own fetch logic, and contract tests cover the error-envelope mapping |
| Depends on | — |

## F3 — `packages/auth`

| Item | Detail |
| --- | --- |
| Provides | `@supabase/ssr` cookie session (`createServerClient` / `createBrowserClient`), request-scoped session read for SSR loaders, `requireSession()` / `requireCapability()` helpers, sign-out |
| Why new dependency | The repo currently uses `@supabase/supabase-js` with `localStorage` only. SSR guards need cookies. |
| Coexistence | During strangling, the legacy monolith must also write the same auth cookie so a user moving between legacy and `app-web` paths on the same host is not logged out — see [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) §4 |
| Done when | An SSR loader in `app-web` reads a session created by a legacy login, and sign-out from either side invalidates both |
| Depends on | F1 |

**Risk flagged:** the cookie migration touches live login for every user. It ships behind a flag, on staging first, with an explicit rollback (stop writing the cookie; `localStorage` remains authoritative).

## F4 — `packages/config`

| Item | Detail |
| --- | --- |
| Provides | Zod env schema per app, validated at boot, failing loudly with the missing **variable names** (never values) |
| Fixes | `apps/api` reads `process.env` directly with no validation; `apps/worker` the same |
| Done when | `api`, `worker` and `app-web` all boot through it and a missing required variable fails startup with a readable message |
| Depends on | — |
| Evidence rule | Variable **names** only, per [`../phase-2/STAGING-ENV-INVENTORY.md`](../phase-2/STAGING-ENV-INVENTORY.md) |

## F5 — `packages/ui`

| Item | Detail |
| --- | --- |
| Extracts | `src/components/ui/*` (Radix + Tailwind 4 + `components.json` shadcn config) and the shell primitives from `src/components/app/` |
| Excludes | `nav-config.tsx` and `AppShell.tsx` as they are — the shell is rebuilt in S5 around a server-computed nav manifest, not a hardcoded tree |
| Done when | `app-web` renders its placeholder screen using only `@impulsionando/ui`, and Tailwind tokens/contrast config are shared, not duplicated |
| Depends on | F1 |

Extraction is mechanical for primitives (button, dialog, table…) and a rewrite for anything that imports `src/lib/**` or Supabase.

## F6 — `packages/observability`

| Item | Detail |
| --- | --- |
| Provides | Structured JSON logger, correlation ID generation and propagation, `gitSha` surfacing, redaction helper, client-side error reporting hook |
| Satisfies | [`../phase-2/OBSERVABILITY-MINIMUM.md`](../phase-2/OBSERVABILITY-MINIMUM.md) for the new app |
| Done when | A request that enters `app-web` and reaches `api` shows the **same** correlation ID in both logs |
| Depends on | — |

## F7 — `packages/contracts` extension

| Item | Detail |
| --- | --- |
| Adds | `identity.ts`, `entitlements.ts` (extending `tenant.ts`), `billing.ts`, `crm.ts`, `agenda.ts`, `sales.ts`, `inventory.ts`, `finance.ts`, `communications.ts`, `reports.ts`, `audit.ts`, `admin.ts` |
| Rule | Contracts land **before** the module that implements them, with contract tests, exactly as Phases 3–6 did |
| Done when | Each new slice's contract file exists with tests before its API module opens |
| Depends on | — (but each file is gated by its slice) |

## F8 — `apps/api/src/common/` cross-cutting layer

**Hard precondition for S2 and every write slice.**

| Piece | Delivers |
| --- | --- |
| `ZodValidationPipe` | One validation path instead of per-controller `safeParse` |
| `HttpExceptionFilter` | One error envelope; correlation ID always present |
| `CorrelationInterceptor` | Correlation ID read or minted, logged, echoed |
| `CapabilityGuard` + `@RequireCapability()` | **Deny by default.** No handler without an explicit capability or an explicit `@Public()` |
| `TenantScopeGuard` | Membership verified for every `:tenantId` route in one place |
| `AuditInterceptor` | Sensitive actions write an audit row automatically |
| `ConfigModule` | Typed env via F4 |

| Done when | Detail |
| --- | --- |
| Deny-by-default proven | A handler without a capability decorator fails a test, not a code review |
| Existing modules migrated | The 27 existing endpoints run through the new pipeline with their smokes still passing |
| Depends on | F4, F7 |

## F9 — Delivery and verification plumbing

| Item | Detail |
| --- | --- |
| GHCR workflow | `.github/workflows/reengineering-ghcr-app-web.yml`, `workflow_dispatch`, full-SHA tag (ADR-007) |
| Dockerfile | Real build in `infra/compose/Dockerfile.app-web` (currently builds the stub) |
| Deploy script | `scripts/deploy-reengineering-app-web-clean-host.sh`, mirroring the api/worker scripts, `SKIP_PULL` supported |
| Smoke | `scripts/smoke-reengineering-app-web.mjs` → `npm run phase8:smoke:app-web-health` |
| Parity harness | `scripts/phase8-parity.mjs` → `npm run phase8:parity -- --slice=<id>` (see [`TARGET-APP-SHAPE.md`](./TARGET-APP-SHAPE.md) §8) |
| Route manifest check | `scripts/phase8-routes-check.mjs` → `npm run phase8:routes:check`, fails when a path prefix has zero or two owners |
| Aggregate verify | `scripts/phase8-staging-verify-all.mjs` → `npm run phase8:staging:verify`, the slice matrix in the style of `phase5`/`phase6` |
| Done when | An `app-web` SHA image deploys to the clean host, `/healthz` returns that SHA, and rollback to the previous SHA is rehearsed |
| Depends on | F1 |

## Track dependency graph

```text
F1 app-web ──┬─► F3 auth ──┐
             ├─► F5 ui     │
             └─► F9 CI ────┤
F2 api-client ──────────────┤
F4 config ──┬─► F8 common ──┼──► S1 identity spine
F7 contracts┘               │
F6 observability ───────────┘
```

## Exit criterion for 8A

| # | Condition |
| --- | --- |
| 1 | `app-web` serves SSR HTML on the clean host from a full-SHA GHCR image, `/healthz` reports that SHA |
| 2 | A request traced end to end shows one correlation ID across `app-web` and `api` logs |
| 3 | An SSR loader reads a Supabase session from a cookie and calls `api` with the bearer token |
| 4 | `apps/api` runs on the `common/` pipeline with deny-by-default authorization and the existing Phase 3–6 smokes still passing |
| 5 | `npm run phase8:routes:check` runs green with `app-web` owning zero product prefixes so far |
| 6 | Rollback of `app-web` to the previous SHA rehearsed and logged in [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) |

8A does **not** close because the app renders. It closes on the six conditions above.
