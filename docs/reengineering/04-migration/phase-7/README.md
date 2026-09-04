# Phase 7 — board

Status: **IN PROGRESS — 7A staging only** (opened 2026-09-04)  
Wave 0 prep: **LANDED**  
Prod DNS: **FORBIDDEN** until 7A PASS + 7B auth  
7F: **PARKED**  
Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Authority: [`../PHASE-7-CUTOVER.md`](../PHASE-7-CUTOVER.md) · [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 7

## Goal

Move production traffic from legacy (`187.77.232.52`) onto the target stack **gradually**, with rehearsal + rollback, then freeze legacy writers.  
**Not** building CRM / payments / clinical / product modules.

## Docs

| Doc | Use |
| --- | --- |
| [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md) | Parallel lanes, waves, serialize rules |
| [`CUTOVER-PLAYBOOK.md`](./CUTOVER-PLAYBOOK.md) | Owners, go/no-go, observation window |
| [`STAGING-REHEARSAL-RUNBOOK.md`](./STAGING-REHEARSAL-RUNBOOK.md) | 7A ordered commands + staging Traefik/Dokploy rollback (Wave 3 PAPER) |
| [`EVIDENCE-7A.md`](./EVIDENCE-7A.md) | 7A result table (empty until rehearsal filled — not PASS) |
| [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md) | What breaks if one hostname moves |
| [`LEGACY-WRITE-FREEZE.md`](./LEGACY-WRITE-FREEZE.md) | 7E freeze runbook — that flow only; 7F PARKED (Wave 3 PAPER) |
| [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) | Known-good tags + revert steps |
| [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md) | Dual-observe old vs new SHA |
| [`PILOT-SELECTION.md`](./PILOT-SELECTION.md) | Low-risk criteria (human picks for 7B) |
| [`RECONCILIATION-CHECKLIST.md`](./RECONCILIATION-CHECKLIST.md) | 7C checklist + command stubs (run after 7B) |
| [`GATES.md`](./GATES.md) | Wave gates |

## Subphase board

| ID | Focus | State |
| --- | --- | --- |
| **Wave 0** | Paper + staging tooling | **LANDED** |
| **7A** | Staging cutover rehearsal | **PASS** @ 2026-09-04T00:30Z |
| **7B** | One low-risk tenant/flow pilot | NOT STARTED — needs hostname |
| **7C–7E** | Recon / expand / freeze | NOT STARTED (paper ready) |
| **7F** | Retirement | **PARKED** |

## Tooling

```bash
npm run phase7:staging:rehearse
DRY_RUN=0 npm run phase7:staging:rehearse
# after worker lands:
# npm run phase7:pilot:verify
```
