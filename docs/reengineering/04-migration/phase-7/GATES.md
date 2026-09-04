# Phase 7 — human gates (Waves 1–3)

Created: **2026-09-04** · Updated: **2026-09-04T00:30Z**

## Wave 1 — 7A staging rehearsal

**State: PASS** @ 2026-09-04T00:30Z — [`EVIDENCE-7A.md`](./EVIDENCE-7A.md).

## Wave 2 — 7B one-tenant pilot

**Blocked on:** human picks hostname ([`PILOT-SELECTION.md`](./PILOT-SELECTION.md)) + written auth.

1. Fill decision record in pilot selection.  
2. Flip **one** hostname only.  
3. Observation window ≥ default in playbook.  
4. `DRY_RUN=0 npm run phase7:pilot:verify` (or `PHASE7_RUN_PILOT_VERIFY=1`).  
5. Abort → rollback kit; do not expand.

## Wave 3 — 7C / 7D / 7E

**Blocked on:** 7B pilot window PASS.

1. Execute [`RECONCILIATION-CHECKLIST.md`](./RECONCILIATION-CHECKLIST.md) (7C).  
2. Expand hostnames **one at a time** (7D).  
3. Freeze legacy writers (7E) per [`LEGACY-WRITE-FREEZE.md`](./LEGACY-WRITE-FREEZE.md).  
4. **Stop. Do not start 7F.**

## 7F — PARKED

Retirement / wipe / credential revoke on legacy requires separate approval after 7A–7E + backup/restore evidence.
