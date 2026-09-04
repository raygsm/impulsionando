# Stakeholder overlay on the first product slice

Created: **2026-09-04T22:20Z**
Source: `docs/reengineering/06-autonomous-marketing-platform/STAKEHOLDER-REQUIREMENTS.md` (product owner “Arquitetura Mestre”; **PROPOSED**, not Aceita).
Interpretation rule (copied): **product and features are authoritative input; code structure, technologies and security mechanisms are not.**

Nothing here accepts an ADR, opens G0, or authorizes a deploy.

This overlay is what changed the Nest FPS flow after Wave 0 paper.

## 1. What stayed true

- First **live** product API on Nest remains **platform Support** (`support_tickets`, Phase 3).
- F8 + S1-min remain preconditions.
- `_authenticated/support.cockpit` / `support_sessions` is the wrong twin.
- No prod DNS, no `db push`, no quota counters, no fake KPIs.

## 2. Two case kinds (PRD-DB-05) — binding on this slice

| Kind | Relationship | Nest today | FPS |
| --- | --- | --- | --- |
| **Platform support case** | Tenant/user → **Impulsionando** | `support_tickets` | **This slice** |
| **Tenant customer-service case** | Final consumer → **the tenant** | does not exist | **Forbidden to invent** |

They may share a case engine later; ownership, audience, SLA and visibility stay explicit. Help must not imply a tenant service desk exists.

Contracts and HTTP name the platform kind (`caseKind: platform_support`). A guessed customer-service path is **404**, not an empty list.

## 3. Universal minimum (PRD-DB-04) — honesty map, not new domains

Every tenant is supposed to receive: contacts/customer identity · basic lead capture and lifecycle · tasks/follow-up · Growth overview · internal business agent · platform Support.

| Minimum | Nest backing in FPS |
| --- | --- |
| Platform Support | **available** — WP-P2 |
| Internal agent | **available / unavailable** — Phase 6 `/api/v1/ai/*` (do not rebuild; Impulsionito is not a tenant surface) |
| Contacts / lead lifecycle | **not_implemented** — P4 |
| Tasks / follow-up | **not_implemented** |
| Growth overview | **not_implemented** — journeys invite is not a Growth API |

FPS ships this map on `GET /identity/session`. It does **not** ship CRM list/write, task CRUD, or dashboard KPI numbers. Missing facts are `not_implemented` / Sem dados, never `0`.

Full CRM depth and ERP components stay entitlement-driven later. “Every tenant has CRM and ERP” means the **capability family**, not every table.

## 4. Explicit non-goals (from the same source)

| PRD | Nest FPS must not |
| --- | --- |
| PRD-DB-01/02 | Invent quota / plan counters |
| PRD-DB-03 | Invent a Marketing-only account type |
| PRD-DB-06 | Second ungoverned agent runtime, or Impulsionito on tenant Help |
| PRD-DB-07/08 | Sale / stock / receivable APIs (**BLOCKING** before Sales/Inventory/Finance schema) |
| PRD-DB-10 | Mercado Pago / WhatsApp as domain model (Phase 3 ticket `type` values stay categories, not providers) |
| §4 CRM/ERP depth | Serve those facts as data |

n8n does not write canonical domain tables. Impulsionito calls governed tools only. One image for all tenants (ADR-008).
