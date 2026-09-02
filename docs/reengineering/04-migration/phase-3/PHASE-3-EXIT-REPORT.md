# Phase 3 Exit Report

**Status: IN PROGRESS — pilot LIVE; residuals block close**

Report date: **2026-09-01**  
Branch: `reengineering/program`  
Product owner: Raygs  
Operator: Cauã / Agent

## Verdict

# Phase 3 is IN PROGRESS

The Nest Support pilot is **LIVE** on `api.stg.impulsionando.com.br`, public create returns **HTTP 201**, the TanStack strangler is wired (`abrir-ticket` → `create-ticket` → Nest when `PHASE3_API_BASE`), and the CRM schema adapter plus explicit `ticket_code` workaround are deployed and evidenced.

**Close is blocked until:** GHCR image publish + Swarm promote with **full git SHA** (not local tag `reengineering-api:phase3-local`); staff **list** + **update-status** smoke on `api.stg` with Bearer JWT (`SUPPORT_SMOKE_ACCESS_TOKEN` or test user).

**Still not authorized by this track alone:** prod DNS cutover, legacy VPS wipe, `db push`/reset prod, mechanical move of all TanStack routes.

## Exit blockers — final status

| # | Blocker | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Nest Support pilot LIVE on clean host | **CLOSED** | Swarm `reengineering-api` **1/1** on `2.25.123.224` (`srv1942777`); Traefik Host `api.stg.impulsionando.com.br` → `:3100`; `GET /health` → Nest `impulsionando-api` · `gitSha=phase3-tcode-1830` (not Phase 2 placeholder) — [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) 2026-08-31T21:12Z–2026-09-01T~00:30Z |
| 2 | CRM schema adapter (contracts ↔ staging `support_tickets`) | **CLOSED** | Adapter doc + Nest service mapping — [`SUPPORT-SCHEMA-ADAPTER.md`](./SUPPORT-SCHEMA-ADAPTER.md); create smoke against CRM columns **201** |
| 3 | Public create smoke (`POST /api/v1/support/tickets`) | **CLOSED** | **HTTP 201** · idempotency replay OK · `protocol=IMP-P3-YYYYMMDD-<8hex>` — clean-host log 2026-08-31T21:30Z |
| 4 | `support_ticket_seq` 42501 workaround | **CLOSED** (workaround) | Explicit `ticket_code` on insert bypasses sequence DEFAULT; operator GRANT on staging remains **optional** follow-up — adapter doc §Sequence |
| 5 | TanStack strangler (`abrir-ticket` path) | **CLOSED** | `src/routes/api/public/support/create-ticket.ts` delegates to Nest when `PHASE3_API_BASE` set; `src/lib/reengineering/support-api.ts`; `.env.staging.example` — [`../../../../packages/api-client/README.md`](../../../../packages/api-client/README.md) |
| 6 | GHCR SHA promote | **OPEN** | Workflow `.github/workflows/reengineering-ghcr-api.yml` ready; running image is local tag `reengineering-api:phase3-local` — checklist item #1 ⏳ |
| 7 | Staff list + update-status smoke (JWT) | **OPEN** | Smoke script validates JWT shape; `.env.staging` `SUPPORT_SMOKE_ACCESS_TOKEN` is **not** a JWT (32 chars — ignored). Set `TEST_USER_PASSWORD` or paste fresh `access_token` from staging sign-in. Create smoke **201** ✅ |

## Completed tracks

| ID | Track | Status |
| --- | --- | --- |
| P3-A | `apps/api` Nest bootstrap + Support module | **done** |
| P3-B | Contracts create / list / update-status | **done** (`@impulsionando/contracts`) |
| P3-C | Staging CRM schema adapter | **done** (documented + deployed) |
| P3-D | Swarm + Traefik deploy on clean host | **done** |
| P3-E | Public create smoke (201) | **done** |
| P3-F | TanStack strangler (`abrir-ticket` → Nest) | **done** |
| P3-G | GHCR SHA promote | **pending** |
| P3-H | Staff list / update-status live smoke | **pending** |

## Go / no-go after this report

| Decision | Result |
| --- | --- |
| Mark Phase 3 **Concluída** | **NO-GO** — items 6–7 OPEN |
| Treat Support pilot as **LIVE** on staging edge | **GO** |
| Continue Phase 3 residuals in parallel with Phase 4 seed | **GO** |
| Phase 4 tenant resolve (`GET /api/v1/tenants/resolve`) | **AUTHORIZED** (seed started 2026-09-01) — [`../phase-4/README.md`](../phase-4/README.md) |
| Prod DNS / legacy wipe / prod db push | **NO-GO** |

## Residual close checklist

| # | Check | State |
| --- | --- | --- |
| 1 | Image tagged with **full** commit SHA on GHCR (not `latest`) | ⏳ |
| 2 | Swarm `reengineering-api` 1/1 on `2.25.123.224` | ✅ |
| 3 | `GET https://api.stg.impulsionando.com.br/health` → Nest | ✅ |
| 4 | Create against staging CRM schema (adapter mapping) | ✅ POST **201** |
| 5 | List + update-status (staff) on `api.stg` | ⏳ |
| 6 | Entry in clean-host `IMPLEMENTATION-LOG.md` | ✅ |

When rows 1 and 5 are ✅, update this report to **Status: CLOSED** and sync [`../../STATUS.md`](../../STATUS.md).

## Next

Phase 4 — tenant resolve hostname → tenant in Nest + shared package ([`../phase-4/README.md`](../phase-4/README.md)).
