# Estratégia Dokploy

## Intended VPS architecture

The target infrastructure replaces the current split-brain production topology with a clean, container-based platform controlled through Dokploy.

```text
Internet
  → Cloudflare
      → DNS, proxy, WAF, and edge rate limiting
      → clean production server
          → Traefik managed by Dokploy
              → platform-web
              → tenant-web
              → app-web
              → api
              → internal worker and integration services

Dokploy control server
  → pulls immutable images from GHCR
  → manages deployments, domains, environment variables, and service lifecycle

Staging server
  → runs the same service topology at reduced capacity
  → validates migrations, releases, smoke tests, E2E tests, and rollback

Managed Supabase
  → PostgreSQL
  → Auth
  → Storage
  → Realtime
  → Supabase Queues/pgmq if approved
  → remains outside the VPS and Dokploy runtime
```

## Intended server separation

The preferred initial topology uses three operationally separate environments:

| Environment | Responsibility | Must not become |
| --- | --- | --- |
| Dokploy control server | Deployment control plane and service lifecycle | An application server or source of business logic |
| Clean production server | Traefik and production application containers | A build machine, Git checkout, or staging environment |
| Staging server | Production-like validation, migrations, smoke/E2E checks, and rollback rehearsals | A system with production data or unrestricted production credentials |

If budget prevents three servers initially, the Dokploy control plane and staging workloads may share one server with explicit resource limits. Production must remain isolated from staging and from the legacy VPS.

The existing VPS is not cleaned or repurposed during discovery. It remains available as evidence and a controlled rollback source until the new production platform, critical tenant journeys, and rollback procedure are proven.

## Production service placement

| Service | Responsibility | Exposure |
| --- | --- | --- |
| `platform-web` | Impulsionando institutional and acquisition website | Public through Traefik |
| `tenant-web` | Public and white-label tenant websites; one image for every tenant | Public through Traefik |
| `app-web` | Authenticated product application and thin frontend BFF where necessary | Public through Traefik |
| `api` | NestJS/Fastify modular API, authorization, business use cases, transactions, and job publication | Public or internal routes through Traefik as explicitly configured |
| `worker-default` | Durable asynchronous job consumption | Internal only |
| Specialized workers | Isolated workloads justified by scale, availability, or security | Internal only |
| `n8n` | Auxiliary visual orchestration and integration workflows | Restricted administrative access and controlled webhook entry points |
| Evolution API | WhatsApp transport | Internal by default; only required callbacks exposed |

Workers must not be started as children of SSR or API processes. A web deployment must not implicitly start, stop, or duplicate background consumers.

## Network and routing model

- Cloudflare is the public edge authority.
- Traefik is the single origin routing authority on the clean production server.
- Only Traefik exposes host ports `80` and `443`.
- Application services communicate through internal Docker networks.
- Services use internal exposure rather than public host ports unless an exception is documented in an ADR and runbook.
- A hostname resolves tenant configuration; it must not select a different application commit.
- All tenants served by a service run the same immutable image version.
- Unknown, unverified, or unowned hostnames fail safely instead of silently becoming arbitrary tenant routes.
- Health and readiness checks are service-specific and do not treat unauthenticated provider responses as proof of full health.

## Release and promotion flow

```text
pull request
  → lint, types, unit, integration, contract, RLS, and build checks
  → optional bounded preview without production credentials

merge to main
  → build each deployable image once
  → publish GHCR:<full-commit-sha>
  → deploy the exact image to staging
  → run health, readiness, migration compatibility, smoke, and E2E checks
  → rehearse or verify rollback compatibility

explicit production approval
  → promote the same GHCR image to production
  → verify every critical domain, runtime, and full commit SHA externally
  → observe logs, metrics, jobs, webhooks, and critical journeys
  → retain the previous known-good release for the rollback window
```

No source build, `git pull`, mutable `latest` tag, manual release-directory rewrite, or production code edit belongs in this flow.

## Configuration and secrets

- Versioned configuration defines service names, networks, health checks, domains, and non-secret defaults.
- Secrets remain in the service environment or an approved secret-management mechanism.
- Production secrets are never available to previews or staging by default.
- Browser bundles receive only explicitly public values.
- Environment validation fails service startup when required configuration is absent or contradictory.
- Secret names, owners, environments, and rotation procedures are inventoried without storing secret values in Git.

## Data and migration boundary

Supabase remains a managed external dependency and is not installed in Dokploy. Database migrations run as a controlled release job, not during startup of every API or worker replica.

Schema changes use expand/contract so that:

1. the new schema remains compatible with the currently deployed application;
2. the new application can be promoted and rolled back safely;
3. destructive removal occurs only in a later release after usage evidence and backup compatibility are proven.

Production data is not copied into staging without an approved anonymization and access procedure.

## Availability and rollback posture

- Deployments use readiness gates before receiving traffic.
- The previous immutable image remains identifiable and deployable throughout the rollback window.
- Routing changes have exact before/after configuration and a reversal procedure.
- API, web, worker, n8n, and Evolution lifecycles are independently controllable.
- A worker rollout cannot be hidden inside a web rollout.
- Rollback never depends on reversing a destructive database migration.
- External smoke checks prove domain, TLS, runtime, release SHA, expected surface, and critical behavior—not only HTTP 200.
- The legacy VPS is retired only in Phase 7 after tenant cutover evidence and the rollback window close.

## Phase boundary and decision status

**Phase 2 planning opened 2026-08-30.** ADRs 001–008 are Aceita / Aceita-com-condições (Cauã + Raygs). Aceita records direction — it does **not** authorize provisioning Dokploy, DNS/Traefik cutover, Nest bootstrap, monorepo mechanical moves, or legacy VPS wipe/reinstall today.

This document remains the intended Phase 2+ platform architecture. Implementation waits on: Phase 1 residual (staging restore + auth/tenant non-prod), cost/capacity expectations, and an explicit Phase 2 implementation gate. Planning artifacts: [`../04-migration/phase-2/README.md`](../04-migration/phase-2/README.md), [`../04-migration/phase-2/CLEAN-INFRA-TOPOLOGY.md`](../04-migration/phase-2/CLEAN-INFRA-TOPOLOGY.md), [`../04-migration/phase-2/GHCR-AND-PROMOTE.md`](../04-migration/phase-2/GHCR-AND-PROMOTE.md).

Accepted (direction, still phase-gated for install):

- Dokploy as the deployment control plane on **clean** infra (ADR-006 Aceita-com-condições);
- GHCR and full-SHA immutable images (ADR-007 Aceita);
- separation of `platform-web`, `tenant-web`, and `app-web` (ADR-008 Aceita-com-condições — physical split later);
- NestJS/Fastify for the modular API (ADR-003 Aceita-com-condições — **Phase 3**, not Phase 2 Day-0);
- preferred three-server topology; budget may share control + staging (ADR-006) — exact placement still human-gated.

The legacy VPS remains rollback-only until Phase 7. Do not install Dokploy on it as prep.

## What Dokploy does not solve

Dokploy provides a deployment control plane. It does not solve:

- missing domain boundaries;
- multi-tenant authorization or data isolation;
- incompatible database migrations;
- non-idempotent jobs or webhooks;
- missing business observability;
- unsafe or untested application code;
- unclear product ownership;
- missing backup and recovery evidence.
