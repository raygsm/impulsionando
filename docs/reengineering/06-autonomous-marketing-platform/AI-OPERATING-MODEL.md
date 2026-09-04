# AI operating model (app-web)

Created: **2026-09-04**  
Authority: Phase 6 Nest gateway. Legacy Impulsionito HTTP routes are **not** the target.

## Internal business agent (every tenant)

Visible dock/panel on the authenticated shell.

- Calls `GET /api/v1/ai/capabilities|policy|tools` and `GET /api/v1/ai/agents/:tenantId`
- Chat via `POST /api/v1/ai/chat` (READ / refuse / kill-switch)
- Show source, freshness, risk class
- Support READ, RECOMMEND, and typed **PREPARE** (non-executed) when the API returns them
- Unavailable/degraded tools shown honestly
- Do not claim an effect ran without an execution receipt (Phase 6E approvals)

## Impulsionito (staff)

Platform-parent agent for authorized staff only. Not mounted on every tenant Home. Must not auto-load raw cross-tenant rows.

## Client-facing agent

Belongs to `tenant-web`. `app-web` may link to configuration only.

## Policy

Models never receive service-role keys, arbitrary SQL, or unrestricted HTTP from the frontend.
