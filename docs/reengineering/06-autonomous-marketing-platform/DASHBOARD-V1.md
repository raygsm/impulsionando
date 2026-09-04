# Dashboard v1 — information architecture

Created: **2026-09-04**  
Runtime target: Next.js `apps/app-web` **if** ADR-009 is accepted. Until then this is the intended IA, not a live product.

## Invariant primary areas

```text
Home          → /dashboard
Growth        → /growth
Customers     → /customers
Operations    → /operations
Management    → /management
Help          → /help
Settings      → /settings
```

Auth:

```text
Login           → /login
Reset password  → /reset-password
```

Probes: `GET /healthz`, `GET /ready`.

## Home

- Daily briefing (from manifest; UNKNOWN if Nest has no briefing API)
- Attention / action queue
- Internal business agent dock
- Acquisition / follow-up / conversion / retention widgets as **module cards**
- Optional ops widgets (agenda today, inventory, AP/AR, tickets, conversations) — hidden or `NOT_ENTITLED`, never fake KPIs

## Growth

Lead acquisition, channel, campaign, follow-up, conversion, retention, reactivation. Attribution/cost missing → **UNKNOWN**.

## Customers

Contacts, leads, opportunities, pipeline, activities, follow-ups, timeline — shells until CRM Nest module (Phase 8 P4).

## Operations

Daily tracking, tasks, workload, optional agenda/orders/inventory signals.

## Management

Company configuration, team/access, modules, integrations, ERP (finance, AP/AR, catalog, inventory, documents, billing, payments), reports. Finance-limited roles: forbidden state, not hidden-only.

## Help

Nest Support API only (`support_tickets`). Do not use legacy `support_sessions` as if it were tickets.

## Branding

`TenantConfigV1.branding` (logo, primary/secondary, name via tenant). Does not change layout, nav order, or endpoints.

## Rollback

See ADR-009. Do not deploy this shell as the authenticated origin until G0 + Aceita ADR + Traefik prefix ownership.
