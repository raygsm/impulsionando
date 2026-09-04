# Phase 7 — cutover playbook (7A paper)

Created: **2026-09-04** · Status: **DRAFT — Wave 0**  
Owners: **Cauã** (technical) · product owner TBD per pilot  
SoT: [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md)

## Purpose

Single checklist for staging rehearsal (7A) and later one-tenant prod pilot (7B).  
Does **not** authorize prod DNS by itself.

## Roles

| Role | Name | Responsibility |
| --- | --- | --- |
| Cutover lead | Cauã | Go/no-go, observation window, rollback call |
| API watcher | Cauã | `/health` + gitSha on clean + pilot path |
| DNS/edge operator | Cauã (or Raygs if zone access) | Single-hostname flip + revert |
| Incident scribe | Cauã | Evidence to `phase-7/` + clean-host log (no secrets) |

## Observation window (default)

| Context | Duration | Abort if |
| --- | --- | --- |
| Staging rehearsal (7A) | 15–30 min | health fail, wrong gitSha, allow/deny fail |
| Prod pilot (7B) | **≥ 24 h** (lead may extend) | auth break, cross-tenant leak, write to wrong runtime, P0 user report |

## Go / no-go (must all be true)

### Before 7A (staging)

- [ ] Wave 0 docs + `phase7:staging:rehearse` present  
- [ ] Clean host API `/health` returns expected `gitSha`  
- [ ] Operator secrets file present locally (never git)  
- [ ] Explicit human: “open Wave 1 / 7A” recorded in STATUS  

### Before 7B (prod one hostname)

- [ ] **7A PASS** evidenced  
- [ ] Pilot hostname + tenant chosen per [`PILOT-SELECTION.md`](./PILOT-SELECTION.md)  
- [ ] Written authorization (chat/email/STATUS) for **that hostname only**  
- [ ] [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) reviewed; revert owner online  
- [ ] Dual-observe plan per [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md)  

## Staging rehearsal steps (7A)

1. Record baseline: `curl -sS https://api.stg.impulsionando.com.br/health`  
2. `DRY_RUN=0 npm run phase7:staging:rehearse` → matrix PASS (or document SKIP reasons)  
3. Optional: simulate Traefik Host swap on **staging** hostname only (never prod)  
4. Run rehearsal again; confirm gitSha unchanged or intentional  
5. Practice rollback once on staging (revert Traefik/env; confirm health)  
6. Append evidence to STATUS + this folder (timestamp, SHA, PASS/FAIL — no secrets)

## Prod pilot steps (7B) — after auth only

1. Capture pre-flip: DNS/edge target for **one** hostname → legacy  
2. Flip that hostname → clean stack (Cloudflare / Traefik — exact path from inventory)  
3. Verify: public path hits new identity; `phase7:pilot:verify` when implemented  
4. Hold observation window; scribe timeline  
5. Pass → proceed 7C; Fail → execute rollback kit immediately  

## Communication

- Announce start/end of window to owners  
- On abort: state “rolled back to legacy” + timestamp + SHA observed  

## Forbidden

- Big-bang multi-hostname  
- Touching legacy VPS except read-only inventory  
- 7F retirement during pilot  
