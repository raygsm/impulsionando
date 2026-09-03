# Phase 4A — Tenant resolve (hostname → tenant)

Opened: **2026-09-01**  
Status: **PHASE 4A CLOSED · PHASE 4B CLOSED** — see [`PHASE-4-EXIT-REPORT.md`](./PHASE-4-EXIT-REPORT.md) · [`PHASE-4B-EXIT-REPORT.md`](./PHASE-4B-EXIT-REPORT.md) · [`../PHASE-4-TENANTS.md`](../PHASE-4-TENANTS.md)

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
| TanStack strangler | `src/lib/reengineering/tenant-resolve-api.ts` → `src/lib/tenant-resolver.functions.ts` |
| Staging SQL patch | `scripts/staging/phase4-resolve-tenant-rpc.sql` |
| Staging seed | `npm run staging:seed:chrismed-tenant` |
| Smokes | `npm run phase4:smoke:tenant-resolve` · `npm run phase4:smoke:tenant-resolve-deny` |

## Staging status (closed)

| Check | State |
| --- | --- |
| RPC `resolve_tenant_by_host` applied | ✅ |
| `npm run phase4:smoke:tenant-resolve` | ✅ HTTP **200** · `data.id=642096b5…` |
| Deny smokes (unknown host) | ✅ `data: null` |
| GHCR image on Swarm | ✅ `b58d4c11…` |
| Contract tests | ✅ 12/12 |

## Out of scope (explicit)

| Item | Reason |
| --- | --- |
| Prod tenant cutover | Phase gate + DNS not authorized |
| Chrismed pilot on prod | Tenant-specific; staging seed only |
| Mechanical move of all TanStack hostname checks | Strangler per vertical only |

## Phase 4B continuation

The full tenant/frontend phase continues with canonical identity, memberships, plans/entitlements, typed tenant configuration, feature flags, frontend runtime boundaries, and one low-risk common-image tenant slice.

Execution plan: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 4B.

### 4B in progress (repo)

| Package | Deliverable | Path |
| --- | --- | --- |
| 4B-1 | Alias inventory (read-only) | [`TENANT-ALIAS-INVENTORY.md`](./TENANT-ALIAS-INVENTORY.md) · `scripts/staging/phase4b-tenant-aliases.sql` |
| 4B-2 | Host ∩ membership binding | `packages/tenant-context/src/membership.ts` · `GET /api/v1/tenants/context` |
| 4B-3/4/5 | Config + entitlements + flags | `packages/contracts/src/tenant.ts` · `GET /tenants/:id/config` · `GET /tenants/:id/entitlements` · `GET /tenants/:id/flags/:key` |
| 4B-8 | RioMed identity audit | [`RIOMED-IDENTITY-AUDIT.md`](./RIOMED-IDENTITY-AUDIT.md) |
| Tests | Membership + entitlements contracts | `npm run test:reengineering:tenant-membership` · `test:reengineering:tenant-entitlements` |
| Smokes | Allow/deny + entitlements + tenant-web | `phase4:smoke:tenant-membership-*` · `phase4:smoke:tenant-entitlements` · `phase4:smoke:tenant-web-health` |
| 4B-6 | Frontend runtime boundaries | [`PHASE-4B-FRONTEND-BOUNDARIES.md`](./PHASE-4B-FRONTEND-BOUNDARIES.md) · `apps/{tenant,platform,app}-web` |
| 4B-7 | Garrido pilot seed | [`PHASE-4B-TENANT-PILOT.md`](./PHASE-4B-TENANT-PILOT.md) · `staging:seed:garrido-*` |

Exit report: [`PHASE-4B-EXIT-REPORT.md`](./PHASE-4B-EXIT-REPORT.md) — **CLOSED 2026-09-03**  
Operator runbook: [`PHASE-4B-OPERATOR-RUNBOOK.md`](./PHASE-4B-OPERATOR-RUNBOOK.md)
