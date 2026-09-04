# NestJS reformulation

Created: **2026-09-04** · State: **PROPOSED**
Technical authority: [`../02-target-architecture/SYSTEM.md`](../02-target-architecture/SYSTEM.md) · Phase 8 baseline: [`../04-migration/phase-8/TARGET-APP-SHAPE.md`](../04-migration/phase-8/TARGET-APP-SHAPE.md)

## Verdict

**Yes, the NestJS application needs reformulation—but not a rewrite.**

Phases 3–6 built useful infrastructure and proved it on staging. Replacing it would discard the exact safety mechanisms the new product needs. The change is to reorganize product boundaries around the autonomous marketing lifecycle, add missing cross-cutting enforcement, and turn pilot/stub state into durable product state.

## 1. Keep as-is or extend

| Existing module/asset | Decision | Reason |
| --- | --- | --- |
| Nest 11 + Fastify bootstrap and `/api/v1` | **Keep** | Accepted architecture and staging-proven |
| `SupabaseService` | **Keep, constrain** | Managed Supabase remains; access must move behind repositories/query services |
| `SupabaseAuthGuard` | **Keep, extend** | Token validation exists; add session/capability/resource context |
| `TenantsModule` | **Extend** | Resolve, membership, config, entitlements, aliases and flags already exist |
| `SupportModule` | **Keep** | First complete vertical pilot; becomes Help/Tickets |
| `JobsModule` + worker queue | **Keep** | Durable enqueue/idempotency/DLQ already proven |
| `OutboxModule` | **Keep** | Required event spine |
| `WebhooksModule` | **Keep** | Provider ingress and replay protection |
| `JourneysModule` | **Adapt** | Current CRM invite journey is a first lifecycle automation, not the entire automation engine |
| `OpsModule` | **Extend** | Queue/integration metrics feed platform health and Impulsionito |
| `AiModule` | **Extend materially** | Gateway/policy/tools/effects are correct foundation |

Two “already built” facts must not be misread:

- `TenantEntitlementsService` already merges plan/modules/flags, but the authenticated UI does not consume it; Dashboard V1 must put it on the navigation/widget hot path.
- `AiAgentService` currently returns an environment-seeded tenant pilot whose default id is `impulsionito`; that is not the proposed platform parent and must be migrated with an explicit `AgentKind`.

## 2. Cross-cutting reformulation first

The current API has no global validation pipe, exception filter, correlation interceptor or capability guard. Product modules must not repeat manual checks.

```text
apps/api/src/common/
  config/                 typed environment validation
  http/                   Zod validation, envelope and exception filter
  correlation/            request/log/outbox correlation
  authorization/          CapabilityGuard, TenantScopeGuard, ResourceGuard
  audit/                  sensitive action interceptor
  idempotency/            command idempotency helper
  data/                   tenant column registry and repository base
```

Rules:

- every route is `@Public()` or declares required capabilities;
- tenant routes resolve tenant context from actor + host/path, never trust a client ID;
- writes declare idempotency behavior and audit category;
- services do not scatter direct `SupabaseService.client.from(...)` calls;
- service-role access remains server-only and is treated as privileged bypass.

## 3. Target bounded contexts

```text
Platform foundation
  Identity ─┬─ Tenants ─┬─ Entitlements
            │           └─ Module Registry / Blueprints / Onboarding
            └─ Audit

Customer lifecycle
  Contacts ─► Growth ─► CRM ─► Communications
                  │       └─ Campaigns / Retention
                  └────────► Tasks

Operations
  Agenda ─┐
  Sales ──┼─► Operations projections ─► Dashboard
  Inventory┤
  Finance ┤
  Billing ┘

Execution
  Domain events ─► Outbox ─► Jobs/Worker ─► Integration adapters

AI
  Agent Registry ─► Context/Policy ─► Tool Registry
       └────────────────────────────► every bounded context through tools only
```

### Foundation modules

| Module | Responsibilities |
| --- | --- |
| `identity` | Session context, users, memberships, roles→capabilities, invitations |
| `tenants` | Resolve host, active tenant, profile, units and configuration |
| `entitlements` | Effective module set, plan limits, flags, readiness |
| `modules` | Capability registry, dependencies, activation state |
| `blueprints` | Versioned niche presets |
| `onboarding` | Answers, compilation proposal, apply and readiness |
| `audit` | Sensitive actions, access events and query API |

`entitlements`, `modules`, `blueprints` and `onboarding` may initially be submodules inside `TenantsModule`; they need clear internal boundaries, not premature services. Ownership is still explicit: `TenantsModule` owns tenant identity/profile, while each submodule owns its contracts and application service. None may update another submodule's tables except through that service.

### Product modules

| Module | Responsibilities |
| --- | --- |
| `contacts` | Canonical person/organization, contact points, consent, deduplication |
| `growth` | Acquisition, attribution facts, funnel and retention projections |
| `crm` | Leads, opportunities, stages, activities and follow-ups |
| `campaigns` | Campaign metadata, audience references, outcome linkage |
| `communications` | Channel connections, templates, message intent and delivery projections |
| `tasks` | Daily action queue, assignment and completion |
| `agenda` | Resources, availability, appointments, waitlist |
| `sales` | Quotes/orders and fulfillment state |
| `catalog` | Products/services and pricing facts |
| `inventory` | Warehouses, stock and movements |
| `finance` | Payables, receivables, cash and reconciliation |
| `billing` | Recurring contracts, invoices, dunning and access policy |
| `payments` | Provider-neutral payment state and settlement |
| `documents` | Domain-linked document metadata and access |
| `dashboard` | Read projections and manifest; owns no transactional business truth |

Modules may start as folders in the modular monolith. They become separate services only with evidence.

## 4. Dashboard V1 API

Minimize SSR fan-out with coarse read models while keeping writes narrow.

### Session and composition

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/identity/session` | User, active tenant, memberships, capabilities |
| `POST` | `/api/v1/identity/session/active-tenant` | Request active tenant; server revalidates membership |
| `GET` | `/api/v1/dashboard/manifest` | Navigation, widgets, actions from modules + role + readiness |
| `GET` | `/api/v1/dashboard/home?from=&to=` | Daily briefing source, growth and operational summaries |
| `GET` | `/api/v1/dashboard/actions` | Deterministic attention/next-action queue |

### Growth/customer

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/growth/overview` | Acquisition, follow-up, conversion, retention |
| CRUD | `/api/v1/contacts` | Canonical contacts |
| CRUD | `/api/v1/crm/leads` | Leads and qualification |
| CRUD | `/api/v1/crm/opportunities` | Pipeline state |
| CRUD | `/api/v1/tasks` | Follow-up and daily work |
| CRUD | `/api/v1/campaigns` | Campaign metadata, audiences and outcomes |
| `GET` | `/api/v1/retention/audiences` | At-risk/inactive/reactivation candidates |

### Configuration

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/modules` | Catalog permitted to the tenant/admin |
| `GET` | `/api/v1/tenants/:id/modules` | Effective activation/readiness |
| `PATCH` | `/api/v1/tenants/:id/modules/:key` | Enable/disable entitled optional module |
| `GET/POST` | `/api/v1/onboarding` | Read answers / compile proposal |
| `POST` | `/api/v1/onboarding/apply` | Idempotently apply approved configuration |
| `GET` | `/api/v1/integrations/connections` | Provider-neutral readiness |

### AI

Keep `/api/v1/ai/*` compatibility initially, then expose:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/agents` | Agent definitions visible to actor |
| `POST` | `/api/v1/agents/:id/chat` | Scoped conversation |
| `GET` | `/api/v1/agents/:id/capabilities` | Effective tools and degraded state |
| `POST` | `/api/v1/agents/:id/prepared-actions` | Prepare without executing |
| `POST` | `/api/v1/ai/effects/requests` | Existing gated effects compatibility |

## 5. Internal dependency rules

1. Dashboard reads projections; it never updates another module's table.
2. CRM references `contactId`; it does not own a second customer table.
3. Communications accepts a `MessageIntent`; CRM never calls a provider.
4. Finance records receivable/payment facts; Payments owns provider state.
5. Billing emits invoice/dunning events; it does not send messages directly.
6. Agenda/Sales emit conversion and fulfillment events consumed by Growth projections.
7. AI calls application services through registered tools; it never imports repositories.
8. n8n receives/requests events and commands through contracts; it never becomes domain authority.

## 6. Persistence

Canonical database redesign: [`database/README.md`](./database/README.md).

No ORM is automatically required for Dashboard V1, and the 577-table legacy shape must not become the new model. The physical access choice—private canonical schemas, prefixed public/RLS tables, or a new managed project—requires an explicit technical decision. Until a canonical aggregate migrates, keep Supabase JS/RPC adapters, but **no product slice may open until its per-table adapter is registered and tested against staging**. The reviewed `company_id`/`tenant_id` mapping described in Phase 8 is a hard precondition, not later cleanup.

New product state should prefer:

- additive tables/migrations;
- one canonical `tenantId` in TypeScript contracts;
- `company_id` physical mappings where existing tables require it;
- RLS on every exposed table;
- security-invoker views or protected/private views;
- private privileged functions where feasible;
- expand/contract migration.

Production schema changes remain outside this planning document.

## 7. What must be durable before product use

The Phase 6 MVP intentionally allowed in-memory state. The product cannot.

| Current MVP | Required target |
| --- | --- |
| Seeded tenant agent configuration | Durable agent registry, versioned |
| In-memory approvals | Durable approval records before real effects |
| In-memory telemetry | Durable/sampled telemetry and aggregates |
| Effect worker sink | Keep sink until each real handler has its own gate |
| Static integrations registry | Tenant connection/readiness records with adapter-owned health |

## 8. Migration strategy—no rewrite

| Stage | Action | Existing proof preserved |
| --- | --- | --- |
| N0 | Accept the Phase 8 RBAC ADR; add the cross-cutting common layer in log-only mode; move existing endpoints through it | Phase 3–6 smokes rerun |
| N1 | Add module/blueprint/onboarding contracts and registry | Existing tenant endpoints remain |
| N2 | Add dashboard manifest/home read models | No domain writes |
| N3 | Add Contacts/Growth/Tasks around existing CRM data via adapters | Legacy tables remain |
| N4 | Migrate CRM, campaigns and communications slices | Phase 5 outbox/jobs reused |
| N5 | Add optional Operations/ERP modules in dependency order | Per-module parity and deny tests |
| N6 | After P-DB-09 + durable Phase 6 registry gate: make agent registry durable and add tenant/client/parent scopes | Existing Phase 6 routes stay compatible |
| N7 | Retire legacy server functions by route-ownership slice | Rollback manifest retained |

At no stage is the current Nest application discarded or replaced.

Any N3–N7 stage that introduces writes is subordinate to [`database/MIGRATION-PLAN.md`](./database/MIGRATION-PLAN.md) Step 7/DB7: enumerate and disable or route every legacy browser, n8n, webhook and cron writer before authority moves. “Legacy tables remain” never authorizes parallel independent writers. The accepted `app-web` runtime—TanStack under ADR-002 unless ADR-009 is accepted—consumes the same Nest contracts.

### Existing endpoint migration map

| Existing API surface | Target ownership | Compatibility |
| --- | --- | --- |
| `/health`, `/health/ready` | Platform/common | Unchanged |
| `/support/tickets*` | Help/Tickets (`SupportModule`) | Unchanged initially |
| `/tenants/resolve`, `/tenants/context` | Tenants + Identity context | Keep paths; session endpoint composes them |
| `/tenants/:id/config` | Tenants | Keep |
| `/tenants/:id/entitlements`, flags, aliases | Entitlements/Tenants submodules | Keep paths; enrich response compatibly |
| `/jobs/enqueue` | Jobs application service | Keep; restrict direct callers by capability/job type |
| `/webhooks/:provider` | Webhook ingress | Keep; route normalized events to adapters |
| `/journeys/invites*` | Growth/CRM lifecycle adapter | Keep during transition; no generic-automation claim |
| `/ops/queue-metrics`, `/ops/integrations` | Operations/health projections | Keep; feed staff dashboard and Impulsionito |
| `/ai/*` | AI Runtime | Keep compatibility; add agent-kind routes around it |

New modules consume these application services; they do not duplicate the endpoints under new paths and leave two authorities.

The legacy `support.cockpit` is not API parity proof: it reads `support_sessions`, while the Nest pilot owns `support_tickets`. The new Help/Tickets UI must be built against the Nest contract and any session/impersonation capability modeled separately.

## 9. Testing requirements

- Nest in-process integration tests for guards, filters and controllers—the current API has none;
- contract tests for every new DTO;
- repository tests proving tenant filters;
- allow/deny for every resource and aggregate endpoint;
- dashboard manifest matrix: niche × plan × role × readiness;
- event/outbox idempotency;
- concurrent agenda/stock/billing tests where relevant;
- AI scope tests from [`AI-OPERATING-MODEL.md`](./AI-OPERATING-MODEL.md);
- legacy/new read parity during strangling;
- existing Phase 3–6 staging smokes after every reformulation stage.

## 10. Reformulation exit criteria

Nest is ready for Dashboard V1 when:

1. cross-cutting authorization is deny-by-default;
2. one server endpoint computes session context and one computes the dashboard manifest;
3. module activation/readiness is server-authoritative;
4. Contacts, Growth, Tasks and Support feed real staging data into Home;
5. the internal business agent reads those capabilities through audited tools;
6. all existing Phase 3–6 smokes still pass;
7. no frontend needs privileged Supabase or provider access.
