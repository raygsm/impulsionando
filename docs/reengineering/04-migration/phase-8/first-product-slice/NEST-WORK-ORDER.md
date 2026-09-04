# First product slice — Nest work order

Created: **2026-09-04T22:20Z** · State: **PAPER** (execute after G0)
Authority: [`README.md`](./README.md) · Overlay: [`STAKEHOLDER-DELTA.md`](./STAKEHOLDER-DELTA.md) · F8: [`../FOUNDATION-TRACKS.md`](../FOUNDATION-TRACKS.md) · P2: [`../SLICE-CATALOG.md`](../SLICE-CATALOG.md)

## 1. Current Nest inventory (STATIC, repo)

Live staging API: `https://api.stg.impulsionando.com.br` · prefix `/api/v1` · health outside prefix.

**27 endpoints** (Phase 8 baseline):

| Module | HTTP | Auth today |
| --- | --- | --- |
| health | `GET /health`, `GET /health/ready` | public |
| support | `POST /support/tickets`, `GET /support/tickets`, `PATCH /support/tickets/:ticketId/status` | create optional bearer; list/status `SupabaseAuthGuard` |
| tenants | `GET /tenants/resolve` · `GET /tenants/context` · `GET /tenants/:id/{config,entitlements,aliases,flags/:key}` | resolve public; rest guard + `assertMembership` |
| jobs | `POST /jobs/enqueue` | (existing) |
| webhooks | `POST /webhooks/:provider` | HMAC (Phase 5D) |
| journeys | `POST /journeys/invites` · click · first-login | (existing) |
| ops | `GET /ops/queue-metrics`, `GET /ops/integrations` | (existing) |
| ai | `GET /ai/{capabilities,policy,tools,metrics,agents/:tenantId}` · `POST /ai/chat` | (existing) |
| ai-effects | `POST /ai/effects/requests` · `GET …/:id` · `POST …/:id/decide` | (existing) |

**Gaps this slice closes:**

| Gap | Hurt |
| --- | --- |
| No global pipe / filter / interceptor | per-controller `safeParse` + minted correlation ids |
| No `CapabilityGuard` / `@Public()` | deny-by-default is cultural |
| No `TenantScopeGuard` | membership per-handler |
| No `AuditInterceptor` | Support writes `support_ticket_events` by hand |
| `process.env` unsanitized | F4 not applied to `api` |
| No `identity` module | no session bundle; no `universalMinimum` map |
| `getTicketById` service-only | CONTRACT-HTTP-API already named HTTP GET |
| List AuthZ queries `user_profiles` first | `auth.ts` says that table is not production authority |
| Two staff answers | RPC in Support vs metadata+heuristic in `fetchCurrentUser` |
| Tickets unnamed as platform cases | Help can be read as tenant CS (PRD-DB-05) |
| `packages/domain` placeholder; `packages/config` app-web only; `supportApi` has no `get` | |

`packages/auth` SSR helpers are for web. Nest verifies Bearer via `SupabaseService.admin().auth.getUser`.

## 2. Wrong twins (do not parity against these)

| Surface | Table | Fate |
| --- | --- | --- |
| `_authenticated/support.cockpit.tsx` | `support_sessions` | Staff session/impersonation → A-lane |
| Tenant customer-service desk | (none) | PRD-DB-05 — **do not invent** |
| `src/lib/support-pro.functions.ts`, ticketing-health | mixed | A5 / later |
| `admin.support-ticketing-health.tsx` | ops | A5 |

P2 ticket owners: `abrir-ticket.tsx`, `src/routes/api/public/support/create-ticket.ts`, `src/lib/support-tickets.functions.ts`.

## 3. Work packages

Execute in order. WP-P2 after WP-F8 smokes are green.

### WP-F8 — `apps/api/src/common/`

| Piece | File | Behaviour |
| --- | --- | --- |
| `ZodValidationPipe` | `common/zod-validation.pipe.ts` | replace per-controller `safeParse` |
| `HttpExceptionFilter` | `common/http-exception.filter.ts` | envelope always has `correlationId` |
| `CorrelationInterceptor` | `common/correlation.interceptor.ts` | read or mint `X-Correlation-Id` |
| `@Public()` / `@RequireCapability()` | `common/decorators.ts` | |
| `CapabilityGuard` | `common/capability.guard.ts` | deny by default in tests; FPS HTTP mode **log-only** for capability |
| `TenantScopeGuard` + `@TenantParam()` | `common/tenant-scope.guard.ts` | membership on `:tenantId` |
| `AuditInterceptor` | `common/audit.interceptor.ts` | reuse `support_ticket_events` until `audit` module |
| `ConfigModule` | `common/config.module.ts` + `packages/config/src/api.ts` | missing **names** fail boot |
| Tenant column registry | `common/tenant-column.registry.ts` | `support_tickets.company_id`, `user_roles.company_id`, `companies.id` |

Annotate all 27 existing endpoints in the same series (`@Public()` or interim capability) so Phase 3–6 smokes still PASS.

| Handler class | Decorator |
| --- | --- |
| Health, `tenants/resolve`, `POST support/tickets`, `POST webhooks/:provider` | `@Public()` (webhook still HMAC in service) |
| Support list / get | `@RequireCapability('support.ticket.read')` log-only |
| Support status | `@RequireCapability('support.ticket.update_status')` — **staff deny stays enforcing** |
| Tenants config/entitlements/flags/aliases/context | `@RequireCapability('tenants.read')` log-only; `TenantScopeGuard` enforcing |
| jobs / journeys / ops / ai / effects | existing AuthZ; log-only capability aliases |

Log-only: log `X-Authz-Decision`, do **not** change HTTP status for capability misses. 401/403 for auth/membership stay.

**Done when:** undecorated handler fails a test; `phase5:staging:verify` and `phase6:staging:verify` PASS on the SHA.

### WP-S1-min — `apps/api/src/identity/`

| Endpoint | Auth | Returns |
| --- | --- | --- |
| `GET /api/v1/identity/session` | Bearer | `SessionContext` including `universalMinimum` |
| `GET /api/v1/identity/memberships` | Bearer | same memberships loader |
| `POST /api/v1/identity/session/active-tenant` | Bearer | 403 if not a member |

Data: `getUser` + `user_roles` ⋈ `companies`. **Do not** use `user_profiles` as authority.

Staff: one `resolveStaffFlags` used by identity **and** Support — [`STAFF-RULE.md`](./STAFF-RULE.md).

`universalMinimum` in FPS:

| Key | Value |
| --- | --- |
| `platformSupport` | `available` |
| `internalAgent` | `available` if Phase 6 agent config exists for proposed/active tenant, else `unavailable` |
| contacts, leadLifecycle, tasks, growthOverview | `not_implemented` |

**Out:** S2 capabilities, server `DashboardManifest` / KPI briefing, impersonation writes, cookies, quota, Impulsionito on tenant session.

**Done when:** non-member tenantId → 403; observer ≠ staff; shared staff function; backing map as above.

### WP-P2 — Support harden

| Change | Why |
| --- | --- |
| `GET /api/v1/support/tickets/:ticketId` | HTTP contract + UI |
| List query `tenantId` optional | client id is a request |
| Stop `user_profiles` as membership | align with `TenantsService` |
| Shared staff function | WP-S1-min |
| Domain status table in `packages/domain/src/support/` | illegal transition → 400 |
| `supportApi.get` | UI must not raw-fetch |
| Registry `support_tickets` → `company_id` | no hand-written tenant filter |
| `caseKind: platform_support` on summaries | PRD-DB-05 |
| No customer-service routes | 404 if guessed |
| Create stays `@Public()` | do not trust client `company_id` |
| Status stays staff-enforcing | already proven |

**Not in WP-P2:** SLA, message thread, CSAT, `support_sessions`, **tenant CS cases**, email inbox, status page, AI triage.

## 4. Proposed tree

```text
packages/config/src/api.ts
packages/contracts/src/identity.ts
packages/contracts/src/support.ts           # additive
packages/domain/src/support/status.ts
packages/api-client/src/resources.ts        # get + identityApi

apps/api/src/common/                        # F8
apps/api/src/identity/
  identity.module.ts
  identity.controller.ts
  identity.service.ts
  staff-flags.ts
apps/api/src/support/                       # extend
apps/api/src/main.ts
apps/api/src/app.module.ts
```

Do **not** touch `src/routeTree.gen.ts` or `src/generated/build-info.ts`.

## 5. Sequencing

```text
G0 recorded
  → WP-F8
  → WP-S1-min
  → WP-P2
        └─ app-web Help (other agent; prefix still legacy)
```

Server `DashboardManifest` is **not** Nest FPS. Transitional client composition may remain.

## 6. Staging observations (read-only)

| # | Probe |
| --- | --- |
| O1 | Does `user_profiles` exist on staging? |
| O2 | Staff RPC vs metadata vs master-company heuristic (upgrade [`STAFF-RULE.md`](./STAFF-RULE.md)) |
| O3 | `support_tickets` RLS |
| O4 | `create_support_ticket_with_outbox` still present |

No `db push`.

## 7. Rollback

| WP | Rollback |
| --- | --- |
| F8 | previous API SHA |
| S1-min | new routes only |
| P2 | additive GET; list AuthZ behind `SUPPORT_MEMBERSHIP_SOURCE` |

No prefix flip in this agent’s rollback.

## 8. Explicitly not this work order

S2/S3/S4 · P1 KPI module · P3 inbox · P4 CRM · tenant CS engine · quota · sale/stock (PRD-DB-07/08) · F3 cookie dual-write · F9 app-web image · Traefik `app.stg…`
