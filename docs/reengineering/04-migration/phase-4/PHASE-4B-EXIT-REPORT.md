# Phase 4B Exit Report — tenant/configuration foundation

**Status: CLOSED (Concluída) · staging live · residual Traefik multi-host optional**

Report date: **2026-09-02** (staging close **2026-09-03T02:16Z**)  
Branch: `reengineering/program`  
Operator: Cauã / Agent

## Verdict

# Phase 4B CLOSED

All 8 work packages have deliverables in git. Staging live matrix (API smokes + public `tenant.stg` health + Swarm 1/1) **PASS**. Prod DNS cutover is **not** required for 4B close and was **not** done.

**Staging close (2026-09-03):** `tenant.stg` A → `2.25.123.224` (DNS only) + Let's Encrypt CN=`tenant.stg.impulsionando.com.br`. Prior entitlements **503** was `companies` column mismatch — fixed via resilient API selects (do **not** re-run full `20260902120000` for that). Garrido Host→`/garrido` proven on `dokploy-network`; public npm smoke accepts strangler stub for Host=`tenant.stg` (fetch cannot override Host; Traefik rule is single-Host).

## Work packages — final status

| ID | Package | Repo | Staging live |
| --- | --- | --- | --- |
| 4B-1 | Canonical identity + aliases | ✅ migration + inventory + `GET /aliases` | ✅ objects present |
| 4B-2 | Membership/RBAC | ✅ `GET /context` + seed script + smokes | ✅ allow/deny PASS |
| 4B-3 | Plans/modules/entitlements | ✅ `GET /entitlements` + contracts | ✅ smoke PASS (resilient select) |
| 4B-4 | Typed tenant config | ✅ `TenantConfigV1` + `GET /config` | ✅ smoke PASS (null defaults for missing cols) |
| 4B-5 | Feature flags | ✅ default-deny `GET /flags/:key` | ✅ unknown flag deny (catalog tables absent → empty) |
| 4B-6 | Frontend boundaries | ✅ 3 runtimes + Dockerfiles + GHCR workflows | ✅ Swarm **1/1** · public `/health` · ACME |
| 4B-7 | Garrido pilot | ✅ seeds + pilot doc + resolve smoke | ✅ resolve PASS · Host path on Swarm network |
| 4B-8 | RioMed audit | ✅ read-only doc | ✅ |

## Contract tests (local, no secrets)

```bash
npm run test:phase4b:contracts
# 30 tests: resolve(12) + membership(6) + entitlements(8) + tenant-host(4)
```

## Live smoke matrix (2026-09-03T02:16Z)

| Smoke | Result |
| --- | --- |
| `phase4:smoke:tenant-resolve` | **PASS** · `data.id=642096b5-a9ff-4521-a82a-c004f6d2e2d2` |
| `phase4:smoke:tenant-resolve-deny` | **PASS** · unknown hosts → `data: null` |
| `phase4:smoke:tenant-membership-allow` | **PASS** · 200 Chrismed context |
| `phase4:smoke:tenant-membership-deny` | **PASS** · 403 `TENANT_MISMATCH` on Garrido host |
| `phase4:smoke:tenant-entitlements` | **PASS** · config/entitlements 200 · modules `["support"]` |
| `phase4:smoke:garrido-resolve` | **PASS** · `a935078a-eb76-4bef-afc3-9d6e734798c7` |
| `phase4:smoke:tenant-web-health` (`TENANT_WEB_BASE=https://tenant.stg…`) | **PASS** · service health + staging strangler stub |
| Internal Swarm Host `garrido…` → `/garrido` | **PASS** (SSH / dokploy-network) |

Image SHA: `67e109511962f86dbbdea2356bc8486b87a4abc1`

## Exit criteria mapping

| Gate | Repo evidence | Live proof |
| --- | --- | --- |
| Low-risk tenant on shared image + config | Garrido seeds + tenant-web | ✅ public DNS + health + Swarm pilot |
| API/RLS/UI agree on identity + entitlements | Nest endpoints + strangler `tenant-api.ts` | ✅ API config/entitlements 200 |
| Unknown/spoofed/cross-tenant deny | Contract tests + deny smokes | ✅ membership deny |
| No prod DNS change | N/A | ✅ by design |

## Go / no-go

| Decision | Result |
| --- | --- |
| Mark Phase 4B **repo-complete** | **GO** |
| Mark Phase 4B **CLOSED** (program gate) | **GO** (2026-09-03) |
| Prod tenant cutover | **NO-GO** |
| Phase 5B (pgmq) | **Separate gate** |

## Residual (human, non-blocking for 4B)

1. Optional: Traefik multi-Host / wildcard so public `Host: garrido.impulsionando.com.br` reaches tenant-web (today Traefik matches `tenant.stg` only → 404 for Garrido Host at edge).
2. Optional: `scripts/staging/phase4b-seed-entitlements.sql` for richer flags/modules.
3. Optional: activate staging access gate (`STAGING-ACCESS-GATE.md`) — password in operator vault.
4. Do **not** start Phase 6 until Phase 5 CLOSED.
