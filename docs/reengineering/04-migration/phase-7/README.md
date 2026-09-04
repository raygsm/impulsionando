# Phase 7 — board

Status: **IN PROGRESS** — **7A PASS** · **7B = CSI** · staging HTML **PASS** · prod-shaped Host-header **PASS** · prod DNS **BLOCKED**  
Wave 0: **LANDED** · 7F: **PARKED**  
Impulsionando staging development: **UNLOCKED**  
Program SoT: [`../../STATUS.md`](../../STATUS.md)

## Goal

Move production traffic from legacy (`187.77.232.52`) onto the target stack **gradually**.  
**Not** building full CRM as a Phase 7 gate.

## Docs

| Doc | Use |
| --- | --- |
| [`TENANT-CUTOVER-STORY.md`](./TENANT-CUTOVER-STORY.md) | Stupid-simple flux: old → staging VPS → prod → no legacy |
| [`CSI-PILOT-7B.md`](./CSI-PILOT-7B.md) | **7B = CSI** — blockers, staging unlock, later DNS |
| [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md) | Parallel lanes |
| [`CUTOVER-PLAYBOOK.md`](./CUTOVER-PLAYBOOK.md) | Owners, go/no-go |
| [`STAGING-REHEARSAL-RUNBOOK.md`](./STAGING-REHEARSAL-RUNBOOK.md) | 7A commands |
| [`EVIDENCE-7A.md`](./EVIDENCE-7A.md) | 7A PASS evidence |
| [`PILOT-SELECTION.md`](./PILOT-SELECTION.md) | CSI decision record |
| [`GATES.md`](./GATES.md) | Wave gates |
| [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md) | Hostname dependencies |
| [`LEGACY-WRITE-FREEZE.md`](./LEGACY-WRITE-FREEZE.md) | 7E paper |
| [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) | Revert |
| [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md) | Dual-observe |
| [`RECONCILIATION-CHECKLIST.md`](./RECONCILIATION-CHECKLIST.md) | 7C |

## Subphase board

| ID | Focus | State |
| --- | --- | --- |
| **Wave 0** | Paper + tooling | **LANDED** |
| **7A** | Staging rehearsal | **PASS** |
| **7B** | CSI pilot | **SELECTED** — staging SSR **PASS** · prod-shaped Host-header **PASS** · prod DNS **BLOCKED** |
| **7C–7E** | Recon / expand / freeze | NOT STARTED |
| **7F** | Retirement | **PARKED** |

## Tooling

```bash
npm run staging:seed:csi-tenant
npm run phase7:staging:rehearse
DRY_RUN=0 npm run phase7:staging:rehearse
DRY_RUN=0 npm run phase7:pilot:verify
./scripts/build-csi-core-staging.sh
IMAGE_TAG=<sha>-csi7b SKIP_PULL=1 ./scripts/deploy-reengineering-csi-core-clean-host.sh
# prod-shaped Host-header only (no CF flip):
./scripts/build-csi-core-prod.sh
ALLOW_PROD_CSI_HOST=1 SERVICE_NAME=reengineering-csi-core-prod \
  TRAEFIK_HOST=csi.impulsionando.com.br STAGING_ACCESS_GATE=0 SKIP_PULL=1 \
  IMAGE_TAG=<sha>-csi7bprod ./scripts/deploy-reengineering-csi-core-clean-host.sh
```
