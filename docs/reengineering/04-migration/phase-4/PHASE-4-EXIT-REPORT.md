# Phase 4A Exit Report — tenant resolve

**Status: PHASE 4A CLOSED · PHASE 4B OPEN**

Report date: **2026-09-02**  
Branch: `reengineering/program`  
Product owner: Raygs  
Operator: Cauã / Agent

## Verdict

# Phase 4A is CLOSED

Canonical hostname → tenant resolution is **LIVE** on `api.stg.impulsionando.com.br`. Staging RPC applied, Chrismed seed returns non-null `data`, deny smokes pass (unknown hosts → `data: null`), contract tests green, TanStack strangler wired.

This report closes the **tenant-resolve slice only**. It does not satisfy the original full Phase 4 criterion in [`../PHASE-4-TENANTS.md`](../PHASE-4-TENANTS.md): common frontend images, typed tenant configuration, plans/entitlements/feature flags, and one low-risk tenant migration remain **Phase 4B** work.

**Not authorized by this close:** prod tenant cutover, Chrismed pilot on prod DNS, mechanical migration of all hostname checks.

## Exit criteria — final status

| # | Criterion | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | `GET /api/v1/tenants/resolve` on `api.stg` | **CLOSED** | HTTP **200** |
| 2 | Staging RPC `resolve_tenant_by_host` | **CLOSED** | `scripts/staging/phase4-resolve-tenant-rpc.sql` applied |
| 3 | Contract tests | **CLOSED** | `npm run test:reengineering:tenant-resolve` — 12/12 |
| 4 | Known host returns tenant | **CLOSED** | `chrismed.impulsionando.com.br` → `data.id=642096b5…` |
| 5 | Deny: unknown host | **CLOSED** | `npm run phase4:smoke:tenant-resolve-deny` PASS |
| 6 | TanStack strangler (Nest-first) | **CLOSED** | `src/lib/reengineering/tenant-resolve-api.ts` |
| 7 | GHCR-deployed API | **CLOSED** | Swarm image `ghcr.io/raygsm/impulsionando-api:b58d4c11…` |

## Smoke evidence (2026-09-02)

```bash
npm run staging:seed:chrismed-tenant   # staging only
npm run phase4:smoke:tenant-resolve    # 200 + data.id
npm run phase4:smoke:tenant-resolve-deny  # unknown → null
npm run test:reengineering:tenant-resolve
```

## Go / no-go

| Decision | Result |
| --- | --- |
| Mark Phase 4A tenant resolve **Concluída** | **GO** |
| Mark the full Phase 4 charter **Concluída** | **NO-GO** — Phase 4B remains |
| Prod tenant cutover / Chrismed pilot | **NO-GO** |
| Phase 4B tenant/config foundation | **AUTHORIZED** — [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) |

## Next

Phase 4B can run in parallel with Phase 5 worker/integration foundations.
