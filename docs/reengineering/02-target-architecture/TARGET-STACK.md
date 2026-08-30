# Target technology stack

Status: **intended architecture — ADRs Aceitas 2026-08-30 (with conditions). Implementation still phase-gated.**

This document records the intended stack for the Impulsionando reengineering program. It aligns with [`SYSTEM.md`](SYSTEM.md), [`TECHNOLOGY-BOUNDARIES.md`](TECHNOLOGY-BOUNDARIES.md), [`REPOSITORY.md`](REPOSITORY.md), and the proposed ADRs in [`../05-governance/DECISIONS.md`](../05-governance/DECISIONS.md).

**Phase 0 does not authorize implementing this stack.** Implementation starts only after Phase 0 exit evidence and the corresponding phase gates (and after ADRs are accepted where required).

## Shape

pnpm workspace monorepo built as an **incremental modular monolith**. Extract separate services only when operational evidence justifies it.

## Frontend

- React
- TanStack Start
- Vite
- TypeScript
- Separate runtime applications:
  - `platform-web` — Impulsionando institutional website
  - `tenant-web` — public and white-label tenant websites
  - `app-web` — authenticated product application
- Shared UI / design-system package
- TanStack may provide SSR and a thin BFF, but **must not own core business rules**

## Backend

- NestJS
- Fastify as the HTTP adapter
- TypeScript
- Modular domain-oriented API
- Zod / OpenAPI versioned contracts
- Runtime input and environment validation
- Business rules, authorization, transactions, external contracts, and job publication live in the API
- Starts as a modular monolith; extract services only with evidence

## Asynchronous processing

- Independent Node.js worker applications
- Supabase Queues / pgmq as the initially proposed durable queue
- Retries, idempotency, dead-letter handling, and correlation IDs
- Workers must not share lifecycle with SSR or API processes
- Specialized workers only when justified by workload or isolation

## Database and managed backend

- Managed Supabase (not self-hosted)
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where appropriate
- Supabase Queues / pgmq where approved
- Immutable SQL migrations
- Expand / contract migration strategy
- RLS as defense in depth
- Explicit tenant, membership, role, grant, function, view, and Storage-policy tests

## Integrations

- Adapter-based integration packages
- n8n for auxiliary visual orchestration — **not** source of truth for business rules
- Evolution API or approved providers for WhatsApp transport
- Approved providers for payments, e-mail, SMS, voice, fiscal services, and external APIs
- Signed webhooks with replay protection and idempotency
- Integration failures must not bring down public pages, SSR, or the main API lifecycle

## AI

- Provider-independent model gateway
- AI SDK / provider adapters
- Synchronous streaming for interactive conversations
- Durable workers for long-running AI tasks
- Registered tools with validated input / output schemas
- Tenant / user / role / capability policy gates
- Human approval for sensitive actions
- Tenant-isolated RAG and embeddings
- Versioned prompts
- Evaluation suites, audit trails, cost telemetry, token limits, and rate limits
- Models never receive arbitrary SQL access, service-role keys, or unrestricted HTTP access

## Infrastructure

- Docker containers
- Dokploy as the proposed deployment control plane
- Traefik managed through Dokploy as the origin reverse proxy
- Cloudflare for DNS, proxying, TLS edge controls, WAF, and edge rate limiting
- Managed Supabase remains outside Dokploy
- Production, staging, and preferably the Dokploy control plane should be operationally separated

## CI/CD

- GitHub + GitHub Actions
- GHCR for container images
- Immutable images identified by the full Git commit SHA
- Build once; promote the same image
- Pull request validation
- Automatic deployment to staging after merge to `main`
- Explicit production promotion gate
- Health, readiness, smoke, E2E, contract, RLS, and migration checks
- Documented and rehearsed rollback

## Observability

- Structured logs
- Correlation IDs across HTTP requests, jobs, webhooks, and integrations
- Service-specific health and readiness endpoints
- Metrics, traces, actionable alerts, release identity, and audit events
- Tenant-aware operational telemetry without exposing sensitive data

## Testing

- Unit, integration, and contract tests
- RLS allow-and-deny tests
- Multi-tenant isolation tests
- Characterization tests for legacy behavior
- Public smoke tests
- Authenticated E2E tests
- External integration and webhook tests
- Backup restoration and deployment rollback tests

## Target repository structure

```text
apps/
  platform-web/
  tenant-web/
  app-web/
  api/
  worker/

packages/
  contracts/
  domain/
  auth/
  database/
  integrations/
  observability/
  config/
  ui/
  testing/

supabase/
  migrations/
  functions/
  tests/
  seed/

infra/
  dokploy/
  compose/
  runbooks/
```

## Related ADRs (all still Proposed)

| ID | Decision |
| --- | --- |
| ADR-001 | pnpm workspace monorepo |
| ADR-002 | Keep TanStack Start for frontends |
| ADR-003 | NestJS + Fastify for modular API |
| ADR-004 | Keep managed Supabase |
| ADR-005 | Supabase Queues initially |
| ADR-006 | Dokploy on clean infra |
| ADR-007 | GHCR immutable SHA images |
| ADR-008 | Split platform-web / tenant-web / app-web |

## Agent rule

When an agent proposes scaffolding, Nest bootstrap, Dokploy provisioning, or monorepo moves: refuse unless the current phase gate and accepted ADRs explicitly authorize that work. Prefer updating inventories and evidence under Phase 0.
