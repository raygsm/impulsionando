# Nest reformulation — what `app-web` consumes

Created: **2026-09-04**  
Next.js does **not** duplicate these endpoints.

## Existing (staging-proven) — integrate now

| Method | Path | UI |
| --- | --- | --- |
| GET | `/health`, `/health/ready` | ops / degraded banners (optional) |
| GET | `/api/v1/tenants/resolve` | host resolution |
| GET | `/api/v1/tenants/context` | active tenant ∩ membership |
| GET | `/api/v1/tenants/:tenantId/config` | branding, locale, niche |
| GET | `/api/v1/tenants/:tenantId/entitlements` | modules, flags, plan |
| GET | `/api/v1/tenants/:tenantId/flags/:flagKey` | default-deny flag |
| POST/GET/PATCH | `/api/v1/support/tickets*` | Help |
| GET | `/api/v1/ai/capabilities`, `/policy`, `/tools` | agent panel |
| GET | `/api/v1/ai/agents/:tenantId` | tenant agent summary |
| POST | `/api/v1/ai/chat` | internal agent |
| GET | `/api/v1/ops/queue-metrics` | optional operations widget |
| GET | `/api/v1/ops/integrations` | integrations list (Management) |

## Missing — do not fake

`identity` session bundle, `DashboardManifest`, CRM/agenda/sales/inventory/finance reads, communications connection status, billing self-service.

Transitional adapter: `packages/api-client` + `lib/modules/manifest.ts` compose a **client-side** `DashboardManifest` from config+entitlements. Marked transitional. Not authorization.

## Worker

Never started from Next.js. No queue consumer in `app-web`.
