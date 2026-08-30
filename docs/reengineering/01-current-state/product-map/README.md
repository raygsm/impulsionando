# Impulsionando product map

Status: **Phase 0 evidence map — behavior is not fully characterized**

This directory is the canonical index of how the current product is believed to work. It connects product intent to actors, entry points, authorization, code, data, jobs, integrations, outcomes, failure behavior, ownership, and validation evidence.

It does not describe the target architecture. The target remains documented in [`../../02-target-architecture/`](../../02-target-architecture/). This map describes the legacy product that must be understood before it can be migrated.

## Why this map exists

The product is not one linear application. It is a shared runtime containing an institutional platform, public tenant sites, authenticated workspaces, vertical-specific products, APIs, server functions, database functions, Edge Functions, webhooks, workers, and automation systems.

Before a flow can be migrated, the team must be able to follow it end to end:

```text
actor
→ domain and entry point
→ tenant resolution
→ identity and session
→ authorization
→ UI or external event
→ server entry point
→ business behavior
→ database and files
→ event or job
→ external integration
→ resulting state and notification
→ failure, retry, reconciliation, and audit
```

## Map documents

| Document | Purpose |
| --- | --- |
| [`SYSTEM-AND-ACTORS.md`](SYSTEM-AND-ACTORS.md) | Product boundary, actors, trust boundaries, shared lifecycle, and capability ownership |
| [`TENANTS-AND-SURFACES.md`](TENANTS-AND-SURFACES.md) | Known tenant/product surfaces and the capabilities statically associated with them |
| [`JOURNEYS.md`](JOURNEYS.md) | Registry and end-to-end description of known critical product and operational journeys |
| [`VALIDATION-BACKLOG.md`](VALIDATION-BACKLOG.md) | Evidence still required before each journey can be declared characterized |
| [`CLARIFICATIONS-2026-08-30.md`](CLARIFICATIONS-2026-08-30.md) | Onboarding answers from Cauã; prioritization and authority overrides for this map |

## Evidence language

Every statement in this map must use one of these evidence levels:

| Level | Meaning |
| --- | --- |
| `VISION` | Desired by a stakeholder but not proven in the system |
| `DECLARED` | Present in documentation or configuration |
| `STATIC` | Found in code, migrations, generated types, or workflow definitions |
| `LIVE` | Observed in a running environment through a read-only check |
| `CHARACTERIZED` | Executed safely with expected success and failure behavior recorded |
| `UNKNOWN` | Not yet evidenced; no inference is permitted |

An HTTP 200, a route filename, a table name, or a UI screen proves only that a surface exists. It does not prove that the journey is authorized, connected to production data, safe, or operationally owned.

## Current completeness

The map has **coverage of all currently catalogued P0 journey families**, but it is not yet behaviorally complete. Most flows are at `STATIC`; public host reachability has partial `LIVE` evidence; authenticated, payment, clinical, messaging, and recovery flows still require safe characterization.

The map is complete only when every P0 journey has:

- a confirmed actor and owner;
- an exact entry point and tenant-resolution rule;
- success and deny paths;
- code, data, job, and integration dependencies;
- safe test data;
- evidence of execution;
- idempotency and retry behavior where applicable;
- audit and observability evidence;
- an SLA, recovery expectation, and rollback strategy;
- a migration decision.

## Source evidence

This map is derived from:

- [`../BASELINE.md`](../BASELINE.md) and [`../INVENTORY.md`](../INVENTORY.md);
- [`../phase-0/CRITICAL-JOURNEYS.md`](../phase-0/CRITICAL-JOURNEYS.md);
- [`../phase-0/DOMAINS-AND-RUNTIMES.md`](../phase-0/DOMAINS-AND-RUNTIMES.md);
- [`../phase-0/API-AND-JOBS.md`](../phase-0/API-AND-JOBS.md) and [`../phase-0/API-ENDPOINTS.md`](../phase-0/API-ENDPOINTS.md);
- [`../phase-0/DATA-AND-RLS.md`](../phase-0/DATA-AND-RLS.md), [`../phase-0/DATA-OBJECTS.md`](../phase-0/DATA-OBJECTS.md), and the live Supabase audit;
- [`../phase-0/INTEGRATIONS.md`](../phase-0/INTEGRATIONS.md);
- route, server-function, worker, Edge Function, and configuration filenames in the repository.

No production user records or secret values belong in this directory.

