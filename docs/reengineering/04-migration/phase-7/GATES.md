# Phase 7 — human gates (Waves 1–3)

Created: **2026-09-04**  
Wave 0 is landed. **These gates are BLOCKED until explicit human authorization.**

## Wave 1 — 7A staging rehearsal

**Blocked on:** human says open Phase 7 **IN PROGRESS (7A staging only)**.

1. Update [`STATUS.md`](../../STATUS.md): Phase 7 → IN PROGRESS (7A); still no prod DNS.  
2. Follow [`STAGING-REHEARSAL-RUNBOOK.md`](./STAGING-REHEARSAL-RUNBOOK.md) + [`CUTOVER-PLAYBOOK.md`](./CUTOVER-PLAYBOOK.md).  
3. `DRY_RUN=0 npm run phase7:staging:rehearse` → PASS.  
4. Practice rollback once ([`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md)).  
5. Fill [`EVIDENCE-7A.md`](./EVIDENCE-7A.md); STATUS + clean-host log if Swarm touched.  
6. Gate exit: **7A PASS** (not auto-passed by paper).

## Wave 2 — 7B one-tenant pilot

**Blocked on:** 7A PASS + human picks hostname ([`PILOT-SELECTION.md`](./PILOT-SELECTION.md)) + written auth.

1. Fill decision record in pilot selection.  
2. Flip **one** hostname only.  
3. Observation window ≥ default in playbook.  
4. Live verify allow + deny.  
5. Abort → rollback kit; do not expand.

## Wave 3 — 7C / 7D / 7E

**Blocked on:** 7B pilot window PASS.

1. Execute [`RECONCILIATION-CHECKLIST.md`](./RECONCILIATION-CHECKLIST.md) (7C).  
2. Expand hostnames **one at a time** (7D) with same window pattern.  
3. Freeze legacy writers for moved flows (7E) per [`LEGACY-WRITE-FREEZE.md`](./LEGACY-WRITE-FREEZE.md) + [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md).  
4. **Stop. Do not start 7F.**

## 7F — PARKED

Retirement / wipe / credential revoke on legacy requires separate approval after 7A–7E + backup/restore evidence.
