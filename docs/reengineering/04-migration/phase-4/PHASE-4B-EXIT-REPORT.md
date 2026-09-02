# Phase 4B Exit Report — tenant/configuration foundation

**Status: REPO-COMPLETE · STAGING VERIFICATION PENDING**

Report date: **2026-09-02**  
Branch: `reengineering/program`  
Operator: Cauã / Agent

## Verdict

# Phase 4B implementation is COMPLETE in the repository

All 8 work packages have deliverables in git. **Phase 4B is NOT formally CLOSED** until staging operator applies migrations, deploys GHCR images, runs live smokes, and records evidence.

Prod DNS cutover is **not required** for 4B close.

## Work packages — final status

| ID | Package | Repo | Staging live |
| --- | --- | --- | --- |
| 4B-1 | Canonical identity + aliases | ✅ migration + inventory + `GET /aliases` | ⏳ apply migration |
| 4B-2 | Membership/RBAC | ✅ `GET /context` + seed script + smokes | ⏳ deploy API + seed |
| 4B-3 | Plans/modules/entitlements | ✅ `GET /entitlements` + contracts | ⏳ deploy API |
| 4B-4 | Typed tenant config | ✅ `TenantConfigV1` + `GET /config` | ⏳ deploy API |
| 4B-5 | Feature flags | ✅ default-deny `GET /flags/:key` | ⏳ deploy API |
| 4B-6 | Frontend boundaries | ✅ 3 runtimes + Dockerfiles + GHCR workflows | ⏳ Swarm deploy |
| 4B-7 | Garrido pilot | ✅ seeds + pilot doc + resolve smoke | ⏳ operator seeds |
| 4B-8 | RioMed audit | ✅ read-only doc | ✅ |

## Contract tests (local, no secrets)

```bash
npm run test:phase4b:contracts
# 30 tests: resolve(12) + membership(6) + entitlements(8) + tenant-host(4)
```

## Staging operator checklist

```bash
# 1. DB (staging only — human gate)
#    supabase/migrations/20260902120000_phase4b_tenant_aliases_membership.sql
#    scripts/staging/phase4b-seed-entitlements.sql

# 2. Seeds
npm run staging:seed:chrismed-tenant
npm run staging:seed:garrido-tenant
npm run staging:seed:garrido-config
npm run staging:seed:membership

# 3. GHCR workflow_dispatch
#    reengineering-ghcr-api.yml
#    reengineering-ghcr-tenant-web.yml
#    reengineering-ghcr-worker.yml

# 4. Deploy (clean host 2.25.123.224)
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-api-clean-host.sh
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-tenant-web-clean-host.sh
IMAGE_TAG=<sha> ./scripts/deploy-reengineering-worker-clean-host.sh

# 5. Live smokes
npm run phase4:smoke:tenant-resolve
npm run phase4:smoke:tenant-resolve-deny
npm run phase4:smoke:tenant-membership-allow
npm run phase4:smoke:tenant-membership-deny
npm run phase4:smoke:tenant-entitlements
npm run phase4:smoke:garrido-resolve
npm run phase4:smoke:tenant-web-health
npm run phase5:smoke:worker-health
```

## Exit criteria mapping

| Gate | Repo evidence | Live proof |
| --- | --- | --- |
| Low-risk tenant on shared image + config | Garrido seeds + tenant-web | ⏳ |
| API/RLS/UI agree on identity + entitlements | Nest endpoints + strangler `tenant-api.ts` | ⏳ |
| Unknown/spoofed/cross-tenant deny | Contract tests + deny smokes | ⏳ membership deny |
| No prod DNS change | N/A | ✅ by design |

## Go / no-go

| Decision | Result |
| --- | --- |
| Mark Phase 4B **repo-complete** | **GO** |
| Mark Phase 4B **CLOSED** (program gate) | **NO-GO** until staging checklist |
| Prod tenant cutover | **NO-GO** |
| Phase 5B (pgmq) | **Separate gate** |

## Next

1. Operator completes staging checklist above.
2. Append `IMPLEMENTATION-LOG.md` on clean host.
3. Update `STATUS.md` to Phase 4B CLOSED when all live smokes pass.
4. Proceed Phase 5B queue semantics.
