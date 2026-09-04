# Product model — autonomous marketing operations platform

Created: **2026-09-04**  
Status: **VISION / DECLARED** — not CHARACTERIZED  
Authority: `docs/reengineering/` ADRs → STATUS.md → this folder. Intake is input, not a phase skip.

## What Impulsionando sells

A **multi-tenant operations dashboard** for physical businesses (restaurants, clinics, real-estate offices, service companies). Every tenant runs the **same** application image and the **same** information architecture.

The product helps the company run:

- Customer acquisition, leads, CRM, follow-ups
- Campaigns, retention, reactivation
- Communications (provider-neutral UI)
- Daily operations, team, tasks, agenda
- Sales, catalog, inventory
- Finance (AP/AR), documents
- Automated billing and payments **as Nest capabilities**, not frontend processors
- Support tickets
- Governed AI assistance

## Universal dashboard

Tenant variation is configuration, not a fork:

| May vary | Must not vary |
| --- | --- |
| Branding tokens (name, logo, primary/accent) | Layout and nav **positions** |
| Niche blueprint | Authorization (server) |
| Commercial plan / entitlements | API endpoints |
| Enabled modules and their **states** | Deployment artifact / Git SHA |
| Role and capabilities (cosmetic in UI) | Per-tenant route trees |
| Integration readiness, flags, safety policy | Direct table access from the browser |

## Runtime

```text
Browser → Next.js app-web (SSR UI)
            → NestJS api
                → managed Supabase
                → jobs/outbox → worker
```

`platform-web` and `tenant-web` stay TanStack Start (public). Client-facing agents belong on `tenant-web`, not `app-web`.

## Evidence language

Unbuilt Nest modules (CRM write, ERP, payments) are **UNKNOWN** in the UI: explicit unavailable/configuring states, never a fake zero that looks like data.
