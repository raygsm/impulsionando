# Feature agent context

Created: **2026-09-04**
Plan: [`FOUNDATION-AND-CRM-PLAN.md`](./FOUNDATION-AND-CRM-PLAN.md) · Gates: [`GATES-TESTS-AND-EVIDENCE.md`](./GATES-TESTS-AND-EVIDENCE.md)

## 1. Your place in the program

You are the **first cross-stack product features agent**.

Agents before you:

- characterized and contained the legacy platform;
- created the pnpm workspace and clean staging runtime;
- built and proved the Nest API, worker, queues, outbox, webhook ingress and governed AI spine;
- planned Phase 8;
- proposed an autonomous-marketing product architecture;
- proposed/imported a Next.js dashboard shell in draft PR #151.

Your job is not to redesign those layers or build every product module. Your job is to connect the first safe product path through them:

```text
Next dashboard
  → typed API client
  → Nest session/capabilities/modules/manifest
  → Nest CRM application services
  → managed Supabase through tenant-scoped repositories
  → outbox/audit
  → dashboard Growth projection
```

You are responsible for both Next and Nest **only inside this slice**. You do not own public tenant sites, infrastructure, provider selection, database-wide cleanup or other vertical modules.

## 2. Authority order

Read in this order:

1. `AGENTS.md`
2. `docs/reengineering/STATUS.md`
3. accepted ADRs under `docs/reengineering/05-governance/adrs/`
4. `docs/reengineering/02-target-architecture/`
5. Phase 1 contracts
6. `docs/reengineering/04-migration/phase-8/`
7. `docs/reengineering/06-autonomous-marketing-platform/`
8. this plan
9. observed code and staging evidence
10. legacy docs/product intake

The autonomous-marketing documents and ADR-009 are **PROPOSED** until accepted. Product intent does not bypass gates.

## 3. Repository reality

### Legacy monolith

The root `src/` is a large TanStack Start application:

- 576 authenticated route files;
- 1,476 `createServerFn` call sites;
- direct browser Supabase access in many screens;
- several dashboard variants and tenant-specific route forks;
- UI-oriented permission/module gating;
- CRM data and behavior spread across routes, server functions, tables and health/cockpit views.

Legacy CRM source material includes:

```text
src/routes/_authenticated/crm.*
src/routes/_authenticated/customers*
src/routes/_authenticated/marketing*
src/routes/_authenticated/commercial*
src/lib/crm*.functions.ts
src/lib/marketing*.functions.ts
src/lib/growth*.ts
```

Likely data objects include:

```text
crm_leads
crm_opportunities
crm_pipelines
crm_stages
crm_activities
crm_lead_routing_rules
crm_touch_queue
crm_touch_rules
marketing_leads
customers
```

These names are **STATIC evidence**, not permission to assume their live shape. The generated types and live schema materially drift.

Do not edit or regenerate `src/routeTree.gen.ts` without dedicated approval. Do not treat `src/generated/build-info.ts` as release identity.

### Existing Nest API

`apps/api` is real and staging-proven. Preserve:

| Module | Existing purpose |
| --- | --- |
| `auth` | Supabase bearer validation |
| `supabase` | Server-only service-role client |
| `tenants` | Host resolve, active context, config, entitlements, aliases and flags |
| `support` | Ticket create/list/status |
| `jobs` | Durable job enqueue |
| `outbox` | Event outbox writes |
| `webhooks` | HMAC/replay-aware ingress |
| `journeys` | CRM invite/click/first-login journey |
| `ops` | Queue metrics and integration registry |
| `ai` | Capabilities, policy, tools, chat pilot, effects and telemetry |

The API lacks a global validation pipe, standard exception filter, correlation interceptor, deny-by-default capability guard and common tenant-scope guard. Existing authorization is service-specific. Unit A corrects this without breaking existing endpoints.

### Existing worker

`apps/worker` owns durable execution:

- pgmq consumption;
- idempotency/effect ledger;
- retries and DLQ;
- outbox polling;
- communication and AI-effect sinks.

Never execute a worker inside Next or Nest request lifecycle.

### Proposed Next frontend

Draft PR #151 proposes:

- Next.js App Router under `apps/app-web`;
- invariant routes for Dashboard, Growth, Customers, Operations, Management, Help and Settings;
- thin support/AI BFF routes;
- `packages/api-client`, `auth`, `config` and dashboard contracts;
- transitional local module manifest and preview fixtures;
- no fake CRM/ERP data.

It is **not on `reengineering/program` as of this plan's timestamp**. Inspect the final merged result instead of assuming the draft remains identical.

## 4. Product invariants

### One dashboard

Every tenant uses the same shell, IA, components and image. Modules change content and availability, not the application fork.

Stable areas:

```text
Home
Growth
Customers
Operations
Management
Help
Settings
```

### Capability composition

Effective UI comes from:

```text
mandatory platform capabilities
+ niche blueprint defaults
∩ plan entitlement
+ company overrides
∩ role capabilities
∩ integration readiness
∩ safety policy
```

Safety/authorization can always deny. Unknown modules and flags deny by default.

### Growth lifecycle

The first slice proves:

```text
Lead captured
  → Contact identified/created
  → Follow-up task assigned
  → Opportunity created
  → Stage advanced
  → Converted
  → Growth summary updated
```

Do not add campaign sending, WhatsApp or advanced retention to make this loop look broader.

### AI

- every tenant will have one internal business-agent configuration;
- the first slice only adds governed READ tools for the CRM/Growth data it owns;
- PREPARE remains a typed non-executed recommendation;
- no new effects;
- no client-facing agent in this slice;
- no Impulsionito cross-tenant implementation in this slice.

## 5. Security model

The Nest API uses a service-role Supabase client and bypasses RLS. Therefore Nest authorization is load-bearing.

Required:

- bearer authentication;
- tenant derived from authenticated membership plus request host/path context;
- capability check for every resource;
- resource ownership check where needed;
- deny by default;
- allow and deny tests;
- audit for sensitive writes;
- outbox in the same transaction/RPC where possible;
- no authorization from user-editable metadata;
- no service-role key in Next;
- no direct domain-table reads from Next.

RLS remains defense in depth. New exposed tables need RLS and policies, but an RLS policy does not replace Nest guards.

## 6. Data rule

TypeScript contracts use `tenantId`. Physical legacy tables may use `company_id` or `tenant_id`.

Do not mechanically rename columns. Build a reviewed table adapter/repository for every legacy object used by the slice. A table with unknown tenant semantics cannot be queried.

Do not remodel all 577 live tables. The physical database migration for this slice is additive and staging-only after an accepted migration plan.

## 7. Delivery discipline

### Unit A

Foundation and composition. No CRM domain writes.

### Unit B

CRM/Growth vertical. Starts only after Unit A/F2 is accepted and proven, C0 characterization is accepted by Cauã + Raygs, and authoritative Phase 8 G3 explicitly opens the first write slice.

Use separate branches/PRs or a clearly stacked PR relationship. A single giant PR is rejected by design.

Each unit must:

- preserve existing API contracts;
- include contract and integration tests;
- update documentation/evidence;
- expose full Git SHA;
- keep rollback possible;
- avoid unrelated cleanup.

## 8. What you must not infer

Mark these UNKNOWN until observed:

- which legacy CRM table is canonical for all tenants;
- exact live columns/policies;
- whether `customers` should be retained or adapted into Contacts;
- which CRM screens real users depend on;
- whether a metric means zero or missing data;
- whether the Next draft PR has been merged unchanged;
- whether ADR-009 or the product model has been accepted;
- whether staging has required migration objects.

## 9. Stop conditions

Stop and report rather than improvise if:

- the required frontend or ADR is not on the chosen base;
- product P0, Phase 8 G0 or G1/RBAC decision is not authorized before Unit A;
- Phase 8 G2 has not authorized enforcement;
- Phase 8 G3 has not authorized Unit B writes;
- canonical tenant ownership for a CRM table cannot be established;
- an implementation requires a production write;
- an existing endpoint would need an incompatible change;
- outbox/audit atomicity cannot be demonstrated for a write;
- a CI failure is unexplained and affects the changed surface;
- secrets or credentials are missing.

## 10. Expected final handoff

Report separately for Unit A and Unit B:

1. contracts added;
2. Nest modules/endpoints;
3. Next routes/components;
4. tables and tenant-column adapters touched;
5. allow/deny evidence;
6. idempotency/audit/outbox evidence;
7. legacy/new parity;
8. rollback;
9. remaining UNKNOWN;
10. exact commits, images and staging state.
