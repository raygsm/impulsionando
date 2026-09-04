# Current state and gaps

Created: **2026-09-04**  
Evidence: **STATIC** unless noted.

## What is already true on the new stack (staging)

| Capability | Where | Phase |
| --- | --- | --- |
| Host → tenant resolve | `GET /api/v1/tenants/resolve` | 4 |
| Membership context | `GET /api/v1/tenants/context` | 4B |
| Tenant config / entitlements / flags | `GET /api/v1/tenants/:id/{config,entitlements,flags/:key}` | 4B |
| Support tickets | `/api/v1/support/tickets*` | 3 |
| Jobs, outbox, webhooks, comms sink, CRM invite journey, ops metrics | Nest + worker | 5 |
| Governed AI gateway | `/api/v1/ai/*` | 6 |
| `apps/app-web` before this branch | Node `/health` stub | 4B |

## Legacy authenticated product (still live)

- 576 `_authenticated` route files; dual RBAC; ~32% screens hit Supabase directly; UI-gated permissions; competing shells.
- Must not be mechanically moved (ADR-001).

## Gaps this frontend must not pretend to close

| Gap | Honest UI |
| --- | --- |
| No Nest `GET /dashboard/manifest` yet | Transitional adapter from config + entitlements |
| No Nest CRM/ERP/payments read APIs for the new IA | Area shells + `UNKNOWN` / not-entitled / configuring |
| No Nest communications connection inventory for WhatsApp/email | Provider-neutral status widgets; never “sent” without a backend receipt |
| Session still `localStorage` on legacy | Cookie SSR in `app-web`; dual-write is a later F3 coexistence task |
| ADR-009 Proposed; G0 not opened | No prod deploy; no DNS |

## Dual-framework cost (declared)

Until ADR-009 is Aceita and public apps decide their stack, the monorepo may contain TanStack Start (legacy + platform/tenant) and Next.js (`app-web`). That cost is accepted only as a **temporary** strangler, not as two dashboards.
