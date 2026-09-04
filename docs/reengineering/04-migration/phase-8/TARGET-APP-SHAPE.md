# Phase 8 — target app shape

Created: **2026-09-04**
Authority: [`../../02-target-architecture/TARGET-STACK.md`](../../02-target-architecture/TARGET-STACK.md) · [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md) · ADR-002, ADR-003, ADR-008

How the Impulsionando core app is actually constructed on the new stack. This is the shape every slice in [`SLICE-CATALOG.md`](./SLICE-CATALOG.md) builds into, so that ten slices do not invent ten architectures.

## 1. Runtime topology

```text
Cloudflare
   │
Traefik (clean host 2.25.123.224)
   ├── app.stg.impulsionando.com.br ──► app-web   (TanStack Start SSR, port 3320)
   │        └── path prefixes still owned by legacy are 308'd back (see STRANGLER-ROUTING.md)
   ├── api.stg.impulsionando.com.br ──► api       (Nest/Fastify, port 3100)
   ├── tenant.stg…                  ──► tenant-web
   └── (marketing)                  ──► platform-web
                                        │
                                    worker (no public traffic, port 3200 health only)
                                        │
                              managed Supabase (outside Dokploy)
```

`app-web` never holds a service-role key, never opens a privileged Supabase connection, and never talks to n8n, payment providers or WhatsApp. It holds one credential class: the end user's session. Everything else goes through `api`.

## 2. `apps/app-web` — from stub to real app

Today `apps/app-web` may be a Next.js App Router scaffold on a feature branch (**ADR-009 Proposed**). Until that ADR is Aceita, the Phase 8 paper still allows the TanStack Start shape below as the ADR-002 path.

Target `apps/app-web/` (Next.js path, ADR-009):

```text
apps/app-web/
  src/app/(auth) (dashboard) healthz ready
  src/components/{dashboard,navigation,modules,agents,states,ui}
  src/lib/{api,auth,config,modules}
  middleware.ts
```

```text
apps/app-web/
  package.json            @tanstack/react-start ^1.167 · react 19 · vite 7 · nitro 3
  vite.config.ts          tanstackStart plugin + tailwindcss/vite + tsconfig paths
  app.config.ts           nitro preset: node-server
  src/
    router.tsx            createRouter — queryClient context, scroll restoration
    routes/
      __root.tsx          html shell, providers, error/404 boundaries, correlation id
      _app/route.tsx      authenticated layout: SSR session guard + AppShell
      _app/…              one folder per slice (crm/, agenda/, finance/, …)
      _staff/route.tsx    staff layout: SSR session + staff capability guard
      _staff/…            staff console slices
      healthz.ts          { status, gitSha, phase } — mirrors api/worker contract
    server/
      session.ts          @supabase/ssr cookie session read (request-scoped)
      api.ts              server-side @impulsionando/api-client with bearer forwarding
    components/           app-specific composition only
```

### Non-negotiable rules for `app-web`

| Rule | Why |
| --- | --- |
| No `createServerFn` that contains business rules | TECHNOLOGY-BOUNDARIES: Start is UI/SSR/thin BFF. Server functions may only shape a response from `api`. |
| No direct Supabase data reads or writes from React | Closes the ~32% direct-Supabase authorization hole documented in [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) §6 |
| No `service_role` key in the app's environment | Would defeat RLS and the Nest authorization layer |
| Every route's data comes from `@impulsionando/api-client` | One contract surface, one error envelope, one place to add correlation IDs |
| UI permission checks are cosmetic | The server already refused; the UI only avoids showing a dead end |
| One image for all tenants | ADR-008: hostname and config differentiate, never a per-tenant commit |

### Why `app-web` is not the legacy monolith recompiled

The legacy authenticated area sets `ssr: false` and runs as a client-only SPA inside the Nitro shell, with guards in React. `app-web` inverts that: the session is read **on the server** during SSR, the layout guard runs before HTML is produced, and an unauthenticated or unentitled request never ships the protected bundle. This is the single largest behavioural difference and it is deliberate.

## 3. Session and tenant context

```text
browser cookie (Supabase auth, HttpOnly, host-scoped)
        │
        ▼
app-web SSR   ── @supabase/ssr createServerClient → user
        │
        │ Authorization: Bearer <access token>
        │ X-Correlation-Id, X-Tenant-Id
        ▼
api  SupabaseAuthGuard → AuthUser
        │
        ├─ identity.resolveActiveContext(user, host, requestedTenantId)
        │     └─ membership ∩ host  → { tenantId, role, capabilities[] }
        ├─ tenants.entitlements(tenantId) → { modules[], flags{}, plan }
        └─ billing.accessPolicy(tenantId) → { accessMode, serviceState }
        │
        ▼
    one response: SessionContext
```

`GET /api/v1/identity/session` returns the whole context in one call so that SSR does not fan out. The client caches it in React Query and re-fetches on tenant switch.

### Two decisions this forces

| Legacy behaviour | Target behaviour | Consequence |
| --- | --- | --- |
| Session in `localStorage` | Session in an HttpOnly cookie via `@supabase/ssr` | SSR can read it; XSS cannot. Requires a coexistence period where legacy also writes the cookie — see [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) §4. |
| Active company in `localStorage["imp.activeCompanyId"]`, client-chosen | Active tenant proposed by the client, **validated and returned** by the server | A client can ask for a tenant; only membership decides. Removes the `useCompanyModules` / `useActiveCompany` divergence noted in the legacy audit. |

## 4. `apps/api` — module layout

Existing modules stay as they are. Phase 8 adds modules under the same conventions (`/api/v1` prefix, Zod validation in controllers, `{ data, meta }` success envelope, `{ error: { code, message, correlationId } }` failure envelope).

```text
apps/api/src/
  auth/            SupabaseAuthGuard (exists)
  supabase/        SupabaseService (exists)
  support/  tenants/  jobs/  outbox/  webhooks/  journeys/  ops/  ai/     (exist)
  identity/        NEW — session, memberships, capabilities, users, invites
  billing/         NEW — access policy, contracts, invoices, subscription
  crm/  agenda/  sales/  inventory/  finance/  communications/  reports/  NEW
  audit/           NEW — sensitive-action log, consents
  admin/           NEW — staff-only: tenant registry, Cliente 360, provisioning
  automations/     NEW — n8n registry + webhook console
  common/          NEW — see §5
```

### 5. `common/` — the gaps Phase 8 must close first

The API today has no global pipe, interceptor or exception filter, and reads `process.env` directly. Before the first product slice ships, `apps/api/src/common/` gains:

| Piece | Responsibility | Replaces |
| --- | --- | --- |
| `ZodValidationPipe` | One validation path | per-controller `safeParse` |
| `HttpExceptionFilter` | One error envelope, correlation ID always present | manual throws |
| `CorrelationInterceptor` | Read or mint `X-Correlation-Id`, put it on logs and responses | nothing |
| `CapabilityGuard` + `@RequireCapability()` | Server-enforced authorization, deny by default | scattered `assertMembership` calls |
| `TenantScopeGuard` + `@TenantParam()` | Membership check on every `:tenantId` route | `assertMembership` per handler |
| `AuditInterceptor` | Sensitive actions produce an audit row | nothing |
| `ConfigModule` over `@impulsionando/config` | Typed, validated env at boot | `process.env` reads |

This is track **F8** and it is a hard precondition for slice S2.

## 6. Package boundaries

| Package | Owns | Consumed by |
| --- | --- | --- |
| `contracts` | Zod DTOs, envelopes, event/job schemas | api, worker, app-web, tests |
| `api-client` | Typed HTTP client over `contracts`; retries, correlation, idempotency keys, envelope→error mapping | app-web, platform-web, tenant-web, smokes |
| `auth` | `@supabase/ssr` session helpers, capability predicates, guard utilities shared by web apps | app-web, tenant-web |
| `config` | Typed env schema per app, validated at boot | all apps |
| `ui` | Design system extracted from `src/components/ui` (Radix + Tailwind 4) + shell primitives | app-web, platform-web, tenant-web |
| `observability` | Structured logger, correlation propagation, `gitSha`, client error reporting | all apps |
| `tenant-context`, `tenant-host` | Host→tenant, membership resolution | api, webs |
| `domain` | Pure business rules extracted from server functions, framework-free | api, worker |
| `database` | **Intentionally left empty.** ADR-004 keeps managed Supabase; the API uses `SupabaseService`. Introducing an ORM is a separate decision. | — |
| `testing` | Shared fixtures, parity harness, allow/deny matrix helpers | tests, smokes |

Dependency direction is one-way: `apps/*` → `packages/*`, `domain` never imports infrastructure, web apps never import `apps/api` internals.

## 7. What a slice looks like end to end

Using P4 (CRM) as the worked example — every slice follows this seven-step shape:

1. **Contracts.** `packages/contracts/src/crm.ts` — entities, list/create/update DTOs, error codes. Contract tests land with it.
2. **Domain.** Pure rules lifted out of `src/lib/crm*.functions.ts` into `packages/domain/src/crm/`, with unit tests. No Supabase import.
3. **API module.** `apps/api/src/crm/` — controller (Zod + `@RequireCapability('crm.lead.read')`), service (Supabase queries, tenant-scoped), audit on writes, outbox events on state changes.
4. **Allow/deny matrix.** Tests proving a member of tenant A cannot read, write or enumerate tenant B — both directions recorded, per [`../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md).
5. **Client.** `packages/api-client/src/crm.ts` typed methods.
6. **UI.** `apps/app-web/src/routes/_app/crm/*` — loaders call the client, capability comes from `SessionContext`, empty/error/forbidden states are explicit.
7. **Retirement.** Route-ownership manifest flips `/crm` to `app-web`; legacy `_authenticated/crm.*` and its `*.functions.ts` are deleted in the same PR series; evidence file records parity, allow/deny, idempotency and the rollback rehearsal.

A slice that stops at step 6 is not done. See [`../../05-governance/DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md).

## 8. Parity harness

Because the legacy behaviour is only documented as `STATIC`, correctness cannot be asserted from the code alone. Track **F9** builds `scripts/phase8-parity.mjs`:

- for a given slice, call the legacy endpoint (staging legacy host) and the new endpoint with the same staging credentials and tenant;
- normalize both payloads through a slice-specific projection;
- diff, and write the result into the slice's evidence file.

Parity is a **read-side** tool. Writes are never dual-executed against staging data; write correctness is proven by contract tests, idempotency tests and an audit row, not by mirroring.

## 9. Release identity

`app-web` joins the same release discipline as `api` and `worker` (ADR-007):

| Item | Value |
| --- | --- |
| Image | `ghcr.io/raygsm/impulsionando-app-web:<full-git-sha>` |
| Dockerfile | `infra/compose/Dockerfile.app-web` (exists, needs the real build) |
| Workflow | `.github/workflows/reengineering-ghcr-app-web.yml` (**to create**, `workflow_dispatch`) |
| Health | `GET /healthz` → `{ status, gitSha, phase }`; `GET /ready` |
| Deploy | `scripts/deploy-reengineering-app-web-clean-host.sh` (**to create**, mirrors the api/worker scripts) |
| Rollback | Redeploy the previous SHA; `latest` is never a release authority |

`src/generated/build-info.ts` in the legacy tree is build noise and must not be used as release identity for `app-web`.
