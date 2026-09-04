# Phase 7 — human gates (Waves 1–3)

Created: **2026-09-04** · Updated: **2026-09-04T11:16Z**

## Wave 1 — 7A staging rehearsal

**State: PASS** @ 2026-09-04T00:30Z — [`EVIDENCE-7A.md`](./EVIDENCE-7A.md).

## Wave 2 — 7B one-tenant pilot

**Selected:** `csi.impulsionando.com.br` — [`CSI-PILOT-7B.md`](./CSI-PILOT-7B.md) · [`PILOT-SELECTION.md`](./PILOT-SELECTION.md).

**Staging CSI SSR: PASS** @ 2026-09-04T11:16Z — Swarm `reengineering-csi-core` · Host `csi.stg` · `/csi` HTML 200.

**Prod DNS flip BLOCKED** until prod-env CSI image + Cloudflare flip for **only** `csi` (staging Supabase behind prod Host forbidden).

Meanwhile: Impulsionando staging development **UNLOCKED**.

When blockers clear:

1. Fill go/no-go in CSI runbook.  
2. Flip **only** `csi` hostname.  
3. Observation window ≥24h.  
4. `phase7:pilot:verify` with prod flags only when authorized.  
5. Abort → rollback kit.

## Wave 3 — 7C / 7D / 7E

**Blocked on:** 7B pilot window PASS.

1. Execute [`RECONCILIATION-CHECKLIST.md`](./RECONCILIATION-CHECKLIST.md) (7C).  
2. Expand hostnames **one at a time** (7D).  
3. Freeze legacy writers (7E) per [`LEGACY-WRITE-FREEZE.md`](./LEGACY-WRITE-FREEZE.md).  
4. **Stop. Do not start 7F.**

## 7F — PARKED

Retirement / wipe / credential revoke on legacy requires separate approval after 7A–7E + backup/restore evidence.
