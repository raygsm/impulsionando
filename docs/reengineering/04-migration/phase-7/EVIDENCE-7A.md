# Phase 7 — evidence (7A staging rehearsal)

Filled: **2026-09-04T00:30Z** · Status: **7A PASS (staging rehearse matrix)**  
No secrets.

## Meta

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-09-04T00:30Z |
| Operator | Cauã / agent |
| Human auth for Wave 1 | Operator: “implement Phase 7” → STATUS IN PROGRESS (7A) |
| Expected `gitSha` | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Clean host | `2.25.123.224` |
| API base | `https://api.stg.impulsionando.com.br` |
| tenant-web | `https://tenant.stg.impulsionando.com.br` |
| Swarm Host mutation | **None** this session |

## Result table

| # | Step | Result | Timestamp (UTC) | Notes |
| --- | --- | --- | --- | --- |
| 1 | Baseline `/health` | **PASS** | 2026-09-04T00:26Z | `gitSha=c4c9530a…` |
| 2 | tenant-web health | **PASS** | 2026-09-04T00:30Z | http 401 (basic-auth gate; reachable) |
| 3 | Rehearse dry | **PASS** | earlier Wave 0 | DRY_RUN=1 |
| 4 | Rehearse live | **PASS** | 2026-09-04T00:30Z | `PASS=4 FAIL=0 SKIP=1` |
| 5 | Nested Phase 5 | **PASS** | 2026-09-04T00:30Z | Fixed stale bearer override |
| 6 | Nested Phase 6 | **PASS** | 2026-09-04T00:30Z | 2/2 |
| 7 | Traefik Host swap | **SKIP** | — | No staging Host change required for matrix |
| 8 | Post-swap health | **SKIP** | — | N/A |
| 9 | Rollback practice | **SKIP** | — | No Swarm mutation; kit reviewed |
| 10 | Post-rollback verify | **SKIP** | — | N/A |
| 11 | Clean-host log | **SKIP** | — | No Swarm mutation |

## Gate outcome

| Gate | Outcome | Evidence pointer |
| --- | --- | --- |
| **7A** | **PASS** (rehearse matrix; Traefik swap N/A) | this file + STATUS |
| **7B** | NOT STARTED | Needs human hostname |
| **7F** | **PARKED** | — |

## Fixes applied during 7A

- Operator secrets load `override:true` in phase5/6/7 verify scripts so refreshed JWTs beat stale `.env.staging` bearers.
