# Phase 7 — parallel speed plan (7F deferred)

Created: **2026-09-04**  
Program SoT: [`../../STATUS.md`](../../STATUS.md) · Board: [`README.md`](./README.md)  
Authority: [`../PHASE-7-CUTOVER.md`](../PHASE-7-CUTOVER.md)

> Goal: finish 7A–7E as fast as possible with parallel prep lanes.  
> Quality bar unchanged: staging allow+deny + evidence. **No prod DNS in Wave 0.**  
> **7F Retirement = PARKED** (later gate).

## Parallel vs serialize

| May run in parallel | Must stay serial |
| --- | --- |
| Inventories, playbooks, checklists, verify scripts | Opening Phase 7 in STATUS |
| Staging dress rehearsal (`*.stg` only) | First prod hostname flip (7B) |
| Release-identity / dual-observe docs | Expanding more hostnames (7D) |
| Pilot-tenant criteria (human picks later) | Legacy write freeze (7E) after pilot OK |
| Rollback kit docs | **7F wipe / revoke** (parked) |

## Wave model

```text
Wave 0 (parallel, LANDED): Inv | Play | Recon | Id | Rb | Pilot
        │
        ▼
Wave 1 (serialize): human auth 7A → staging rehearsal → 7A PASS
        │
        ▼
Wave 2 (serialize): human pick pilot → one hostname flip → observation window
        │
        ▼
Wave 3: 7C recon → 7D one-by-one → 7E freeze
        │
        ╳ ── 7F PARKED (later)
```

## Wave 0 lanes (this landing)

| Lane | Output | State |
| --- | --- | --- |
| **Inv** | [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md) | LANDED |
| **Play** | [`CUTOVER-PLAYBOOK.md`](./CUTOVER-PLAYBOOK.md) | LANDED |
| **Recon** | `npm run phase7:staging:rehearse` · [`scripts/phase7-staging-rehearse-all.mjs`](../../../../scripts/phase7-staging-rehearse-all.mjs) | LANDED |
| **Id** | [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md) | LANDED |
| **Rb** | [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) | LANDED |
| **Pilot** | [`PILOT-SELECTION.md`](./PILOT-SELECTION.md) | LANDED |

## Waves 1–3

See [`GATES.md`](./GATES.md). Do not execute until human authorization.

## Definition of done

| Milestone | Meaning |
| --- | --- |
| **Wave 0 done** | Docs + rehearse script landed; STATUS Phase 7 still NOT STARTED; no prod mutations |
| **7A–7E usable done** | 7A PASS → 7B one tenant → 7C → optional 7D → 7E freeze; say **7F PARKED**, not Phase 7 CLOSED |
| **7F later** | Separate approval + backup/restore evidence |

## Explicit exclusions

- Prod DNS before 7A PASS + written auth  
- Dokploy / wipe / deploy on `187.77.232.52`  
- Building CRM/UI as a Phase 7 requirement  
- Big-bang all tenants  
- Secrets in git/docs  
- Claiming Phase 7 CLOSED while 7F unfinished  
