# Phase 4 — Tenant resolve (hostname → tenant)

Opened: **2026-09-01**  
Status: **IN PROGRESS** — API deployed with full git SHA; staging RPC applied; smoke **200**; `data: null` for chrismed = no matching tenant row on staging (endpoint OK)

Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Acceleration board: [`../ACCELERATION-BOARD.md`](../ACCELERATION-BOARD.md)  
Staging SQL: [`STAGING-RPC-APPLY.md`](./STAGING-RPC-APPLY.md)

## Goal

Canonical **hostname → tenant** resolution in Nest (`apps/api`) and shared package `@impulsionando/tenant-context`, replacing ad-hoc hostname logic scattered in TanStack routes.

## Delivered (repo)

| Item | Path |
| --- | --- |
| Shared types | `packages/tenant-context` |
| Nest module | `apps/api/src/tenants/` — `GET /api/v1/tenants/resolve?host=` |
| Contract tests | `tests/reengineering/tenant-resolve.contract.test.ts` |
| TanStack strangler | `src/lib/reengineering/tenant-resolve-api.ts` → `src/lib/tenant-resolver.functions.ts` (Nest first when `PHASE3_API_BASE` set) |
| Staging SQL patch | `scripts/staging/phase4-resolve-tenant-rpc.sql` |
| Apply helper | `npm run staging:apply:db-patch` |
| Smoke | `npm run phase4:smoke:tenant-resolve` |

## Staging status

| Check | State |
| --- | --- |
| RPC `resolve_tenant_by_host` applied | ✅ operator (2026-09-01) |
| `npm run phase4:smoke:tenant-resolve` | ✅ HTTP **200** |
| `data` for `chrismed.impulsionando.com.br` | `null` — staging restore has no active `companies` row with `domain`/`subdomain` matching Chrismed (prod tenant; not seeded on staging). Endpoint OK; not an RPC failure. |

To get non-null `data` on staging, seed a row (operator SQL only — do not run on prod):

```sql
-- Example: match host chrismed.impulsionando.com.br (staging project only)
UPDATE public.companies
SET subdomain = 'chrismed',
    domain = 'chrismed.impulsionando.com.br',
    is_active = true,
    updated_at = now()
WHERE id = '<existing-staging-company-uuid>';
```
| GHCR image `ghcr.io/raygsm/impulsionando-api:<full-sha>` | ⏳ built on clean host; registry push pending |

## Staging blocker (resolved)

~~`api.stg` returns **500/503** until operator runs the SQL patch~~ — **resolved**. Re-apply only if PostgREST cache stale:

1. Dashboard SQL Editor — paste `scripts/staging/phase4-resolve-tenant-rpc.sql`
2. Or `npm run staging:apply:db-patch`
3. Verify: `npm run phase4:smoke:tenant-resolve` → HTTP **200**

## Out of scope (explicit)

| Item | Reason |
| --- | --- |
| Prod tenant cutover | Phase gate + DNS not authorized |
| Chrismed pilot | Tenant-specific; not a generic resolve gate |
| Mechanical move of all TanStack hostname checks | Strangler per vertical only |

## Exit criteria (future — not met)

- Resolve endpoint **200** on `api.stg` with contract tests green
- At least one TanStack consumer switched via strangler flag ✅ (seed)
- Deny tests: unknown hostname, suspended tenant, cross-tenant host spoof
- Evidence in `STATUS.md` and clean-host log if redeployed

## Evidence checklist

| # | Check | State |
| --- | --- | --- |
| 1 | Phase 4 README + STATUS row | ✅ |
| 2 | `GET /api/v1/tenants/resolve` implemented + deployed | ✅ `gitSha=badfb94d01cec685736bc1377f008adf3acd863b` |
| 3 | Contract tests (`npm run test:reengineering:tenant-resolve`) | ✅ |
| 4 | Staging RPC applied | ✅ |
| 5 | Staging smoke **200** | ✅ |
| 6 | TanStack strangler (Nest-first) | ✅ |
