# Phase 4B — Tenant alias inventory (4B-1)

Created: **2026-09-02**  
Status: **READ-ONLY AUDIT** — no silent merges applied

## Canonical key

- **Authoritative tenant ID:** `public.companies.id` (`company_id` everywhere)
- **Phase 4A resolve:** `resolve_tenant_by_host` → Nest `GET /api/v1/tenants/resolve`

## Alias sources inventoried

| Source | Field | Example | Notes |
| --- | --- | --- | --- |
| `companies` | `subdomain` | `chrismed`, `riomed` | Used by resolve RPC |
| `companies` | `domain` | `agenda.chrismed.com.br` | Custom domain match |
| `core_tenant_identity` | `subdomain`, `custom_domain` | `riomed` | DNS registry; not joined by resolve RPC today |
| `communication_tenants` | `slug` | `rio-med`, `chrismed` | Omnichannel registry; can diverge from `companies.subdomain` |
| Route slugs | path prefix | `/riomed`, `/chrismed` | TanStack monolith |
| CI policy | `.github/tenant-scope-policy.json` | `riomed` ↔ `rio-med` | Path tokens only |
| Email aliases | `core_tenant_email_aliases` | `contato@` | Not hostname aliases |

## Known duplicates (action required)

| Tenant | Canonical slug | Compatibility alias | Risk |
| --- | --- | --- | --- |
| **RioMed** | `riomed` | `rio-med` | `riomed_company_id()` and ~20 server functions query `rio-med` |
| Orphan row | — | `rio-med` (archived company) | Archived in migration `20260622224209` — do not reactivate |

## Clean reference tenant

**Chrismed** — single slug `chrismed` across `companies`, `core_tenant_identity`, `communication_tenants`, Phase 4A staging seed.

## Proposed staging patch (not applied without gate)

Canonical migration: `supabase/migrations/20260902120000_phase4b_tenant_aliases_membership.sql`  
Staging quick-apply copy: `scripts/staging/phase4b-tenant-aliases.sql`

- Table `core_tenant_slug_aliases` (`company_id`, `alias_slug` UNIQUE, `alias_kind`, `is_canonical`)
- Seed RioMed: canonical `riomed`, compatibility `rio-med`
- Upgrade `resolve_tenant_by_host` to check alias table after subdomain/domain match

## Next evidence

- [ ] Staging migration approved and applied
- [ ] Alias resolve smoke (`riomed` and `rio-med` → same `company_id`)
- [ ] RioMed audit signed off — see [`RIOMED-IDENTITY-AUDIT.md`](./RIOMED-IDENTITY-AUDIT.md)
