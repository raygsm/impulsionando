# Phase 3 Exit Report

**Status: CLOSED**

Report date: **2026-09-02** (closed)
Branch: `reengineering/program`  
Product owner: Raygs  
Operator: Cauã / Agent

## Verdict

# Phase 3 is CLOSED

The Nest Support pilot is **LIVE** on `api.stg.impulsionando.com.br`, promoted from **GHCR** with full SHA tag, public create **HTTP 201**, staff list **HTTP 200**, non-staff PATCH **403** (expected), TanStack strangler wired, CRM schema adapter deployed.

**Still not authorized by this track alone:** prod DNS cutover, legacy VPS wipe, `db push`/reset prod, mechanical move of all TanStack routes.

## Exit blockers — final status

| # | Blocker | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Nest Support pilot LIVE on clean host | **CLOSED** | Swarm `reengineering-api` **1/1** on `2.25.123.224` |
| 2 | CRM schema adapter | **CLOSED** | [`SUPPORT-SCHEMA-ADAPTER.md`](./SUPPORT-SCHEMA-ADAPTER.md) |
| 3 | Public create smoke | **CLOSED** | POST **201** |
| 4 | `support_ticket_seq` workaround | **CLOSED** | explicit `ticket_code` on insert |
| 5 | TanStack strangler | **CLOSED** | `support-api.ts` + `create-ticket.ts` |
| 6 | GHCR SHA promote | **CLOSED** | `ghcr.io/raygsm/impulsionando-api:b58d4c111b0b37bc48dacad3a7e12c1506f9d6e1` · run [33575721274](https://github.com/raygsm/impulsionando/actions/runs/33575721274) · Swarm promote 2026-09-02 |
| 7 | Staff list + update-status smoke | **CLOSED** | `npm run phase3:smoke:support-live` PASS |

## Residual close checklist

| # | Check | State |
| --- | --- | --- |
| 1 | Image tagged with **full** commit SHA on GHCR | ✅ `b58d4c11…` |
| 2 | Swarm `reengineering-api` 1/1 on `2.25.123.224` | ✅ |
| 3 | `GET https://api.stg.impulsionando.com.br/health` → Nest | ✅ `gitSha=badfb94d…` |
| 4 | Create against staging CRM schema | ✅ POST **201** |
| 5 | List + update-status on `api.stg` | ✅ list **200** · PATCH **403** non-staff |
| 6 | Entry in clean-host `IMPLEMENTATION-LOG.md` | ✅ |

## Go / no-go

| Decision | Result |
| --- | --- |
| Mark Phase 3 **Concluída** | **GO** |
| Prod DNS / legacy wipe / prod db push | **NO-GO** |

## Next

Phase 4 closed — tenant resolve. Phase 5 worker beyond skeleton.
