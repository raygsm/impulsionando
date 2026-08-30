# System and actors

## Product boundary

The current Impulsionando repository acts as several products inside one deployable core:

1. The Impulsionando institutional and acquisition site.
2. Public websites and funnels for named tenants.
3. An authenticated multi-module business application.
4. Tenant-specific vertical applications such as health, commerce, events, and sales operations.
5. A backend composed of TanStack HTTP routes, `createServerFn` functions, server modules, database functions, Supabase Edge Functions, workers, and n8n workflows.
6. An operational control surface for releases, tenant publication, monitoring, communication, and integrations.

The dominant legacy tenant key is `company_id`. The target concept is `tenant`, but the equivalence between company and tenant is not yet approved or proven for every table.

## Actors

| Actor | Intent | Expected trust level | Current evidence |
| --- | --- | --- | --- |
| Anonymous visitor | Discover a brand, product, professional, event, or offer | Untrusted | Public routes and host smoke are `STATIC`/partially `LIVE` |
| Lead or prospective customer | Submit interest, request contact, obtain a quote, or begin checkout | Untrusted input with PII | Lead, funnel, support, quote, and checkout surfaces are `STATIC` |
| Customer or consumer | Authenticate, buy, track, manage a profile, or consume a tenant service | Authenticated, tenant-bound | Multiple account and portal routes are `STATIC`; E2E is `UNKNOWN` |
| Patient | Schedule, receive care, access documents, or join teleconsultation | Authenticated or token-bound; health data | Chrismed surfaces are `STATIC`; safe characterization is `UNKNOWN` |
| Tenant staff member | Operate CRM, agenda, inventory, sales, support, or communication | Authenticated membership and role | Authenticated module routes are `STATIC`; canonical RBAC is `UNKNOWN` |
| Health professional | Manage availability, appointments, records, documents, and payouts | Authenticated professional role | Chrismed professional routes are `STATIC`; deny behavior is `UNKNOWN` |
| WMP operator or partner | Manage proposals, contracts, equipment, agenda, briefing, and evidence | Authenticated or signed-token access | WMP surfaces are `STATIC`; full journey is `UNKNOWN` |
| Affiliate or partner | Generate referrals, view performance, and receive commissions | Authenticated partner role | Affiliate routes/tables are `STATIC`; financial reconciliation is `UNKNOWN` |
| Tenant administrator | Configure users, modules, branding, integrations, and tenant operations | Privileged within one tenant | Admin/configuration surfaces are `STATIC`; isolation proof is `UNKNOWN` |
| Platform administrator | Operate tenants and platform-wide capabilities | Highly privileged | Global admin routes exist; privilege model and audit coverage are `UNKNOWN` |
| Cauã and Raygs | Approve technical production changes | Human production approvers | Confirmed in Phase 0 business context |
| External integration | Deliver webhook/callback or receive an outbound action | Machine identity | Many endpoints exist; signatures and ownership are often `UNKNOWN` |
| Scheduler or job caller | Trigger recurring work | Machine identity | Cron/tick endpoints and Actions exist; consumer map is `UNKNOWN` |
| Worker | Consume queued or polled work and call integrations | Privileged server process | Pulsonitor and Colors workers are `STATIC`/observed in runtime design |
| AI assistant | Answer, recommend, or request a controlled action | Must never be an authority by itself | Several chat endpoints exist; policy and tool boundaries are `UNKNOWN` |

## Shared product lifecycle

### 1. Discovery and tenant entry

An anonymous request reaches Cloudflare, then the VPS origin. Nginx selects an upstream. The TanStack application uses hostname and route information to select an Impulsionando or tenant surface. Named mappings exist in `infra/subdomains/clients.json` and `src/lib/subdomain.ts`; an unreserved subdomain may fall back to `/vitrine/{slug}`.

Current evidence: `STATIC` plus partial `LIVE`. Production is split-brain, so hostname resolution does not prove a single release.

### 2. Acquisition and conversion

The visitor may submit a lead, request a quote, contact support, start signup, or enter checkout. These actions may write directly through server functions or HTTP routes and may dispatch notifications, n8n workflows, WhatsApp, e-mail, or payment requests.

Current evidence: `STATIC`. There is no single proven owner for lead deduplication, consent, notification, or conversion state.

### 3. Identity and tenant membership

Supabase Auth issues the user session. Application middleware and authenticated routes attach identity. The product is expected to resolve a company/tenant membership, role, modules, and permissions before allowing business actions.

Current evidence: `STATIC`. End-to-end session refresh, password reset, membership selection, tenant isolation, and role-deny behavior remain uncharacterized.

### 4. Tenant operation

Authenticated users enter shared or vertical modules: CRM, agenda, sales, finance, inventory, support, communications, integrations, administration, Chrismed, WMP, Colors, RioMed, and others. Components frequently call `createServerFn` functions, Supabase, or route endpoints.

Current evidence: broad `STATIC` surface. The repository does not yet provide one canonical application-service boundary.

### 5. Money, messages, and automation

Business actions can produce payments, webhooks, scheduled work, e-mail, WhatsApp, n8n dispatches, Edge Function execution, or worker activity. Multiple implementations may affect the same business state.

Current evidence: `STATIC`; live ownership and consumer contracts are largely `UNKNOWN`. These are the highest-risk journeys.

### 6. Audit, support, and recovery

The code contains audit, status, reliability, support, integration-log, and backup concepts. Their completeness and operational ownership are not proven. A backup workflow exists, but the latest recorded execution failed before producing the intended dump and no isolated Supabase restore has been proven.

Current evidence: mixed `STATIC` and partial `LIVE`; recovery is `UNKNOWN`.

## Trust boundaries

```text
Internet visitor
  → Cloudflare
  → Nginx/origin routing
  → public SSR or HTTP endpoint

Authenticated browser
  → Supabase Auth session
  → TanStack route/server function
  → application authorization and/or RLS
  → Postgres/Storage

External provider
  → webhook signature/replay boundary
  → route or Edge Function
  → idempotent state transition
  → job/notification/reconciliation

Scheduler
  → machine authentication boundary
  → cron/tick endpoint
  → bounded batch
  → retry/audit

AI request
  → authenticated product boundary
  → tenant/policy context
  → model
  → registered tool
  → authorization re-check
  → audited result
```

Only the first boundary has partial public characterization. The remaining boundaries require explicit allow, deny, replay, and failure tests.

## Current and target ownership

| Concern | Current owner in the legacy | Intended owner after migration |
| --- | --- | --- |
| Public rendering and routing | TanStack routes plus Nginx and hostname helpers | `platform-web` or `tenant-web` |
| Authenticated UI | TanStack authenticated routes | `app-web` |
| Business rules | Scattered across UI, server functions, endpoints, DB functions, Edge Functions, n8n | Modular API/domain |
| Authorization | Mixed application checks, session helpers, RLS, grants | API policy plus tested RLS defense |
| Durable work | HTTP cron, workers, Actions, Edge Functions, n8n | Queue plus independent worker |
| Integration transport | Routes, functions, Edge Functions, n8n, direct SDK calls | Integration adapters and workers |
| Deployment | Competing Actions, publisher, Docker/systemd, Nginx | GitHub Actions, GHCR SHA images, Dokploy, Traefik |
| AI actions | Tenant-specific chat endpoints and server code | Governed AI runtime with tool policy |

