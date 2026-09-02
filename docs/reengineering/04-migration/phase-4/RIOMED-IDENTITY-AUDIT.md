# RioMed identity audit (4B-8)

Created: **2026-09-02**  
Status: **READ-ONLY** — no data migration executed

## Verdict

RioMed has **two historical slug representations** for one tenant. This is a configuration/alias problem, not two active production tenants.

| Layer | Slug | Status |
| --- | --- | --- |
| Canonical (intended) | `riomed` | Active `companies` + `core_tenant_identity` + public routes |
| Communication / legacy functions | `rio-med` | `communication_tenants.slug`; `riomed_company_id()` RPC |
| Orphan company row | `rio-med` | Archived — migration `20260622224209` |

## Authority split

```text
companies.id (canonical)
 ├── core_tenant_identity.subdomain = 'riomed'
 ├── communication_tenants.slug     = 'rio-med'   ← mismatch
 └── riomed-*.functions.ts          → query 'rio-med'
```

## Risk hotspots

1. **`riomed_company_id()`** — hard-coded `communication_tenants.slug = 'rio-med'` (`20260815114030`)
2. **Restore migration** may sync identity subdomain from communication slug (`rio-med` overwrites `riomed`)
3. **`riomed-portal.functions.ts`** — maps `riomed` → `rio-med` for identity lookup (opposite of canonical direction)
4. **N8N workflows** — slug prefix `rio-med.*` (`20260816033500`)
5. **CI path policy** — accepts both tokens (`.github/tenant-scope-policy.json`)

## Recommended migration proposal (gated)

1. **Declare canonical:** `company_id` of provisioned RioMed row; slug `riomed`; host `riomed.impulsionando.com.br`
2. **Register alias:** `rio-med` → same `company_id` in `core_tenant_slug_aliases` (see [`TENANT-ALIAS-INVENTORY.md`](./TENANT-ALIAS-INVENTORY.md))
3. **Replace `riomed_company_id()`** with slug resolver that checks alias table
4. **Strangler refactor:** centralize company resolution in one helper; migrate `riomed-*.functions.ts` incrementally
5. **Do not reactivate** archived orphan company `b7daafc3…`

## Live DB reconciliation

Whether `communication_tenants.company_id` for `rio-med` matches `core_tenant_identity.company_id` for `riomed` is **UNKNOWN** without staging query — required before alias seed.

## Pilot exclusion

RioMed is **not** the Phase 4B-7 low-risk tenant pilot (clinical-adjacent). Use **Garrido** or **Grupo EVR** for common-image pilot; keep Chrismed for resolve/membership contract smokes only.
