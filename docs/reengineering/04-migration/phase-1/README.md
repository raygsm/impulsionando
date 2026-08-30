# Phase 1 — parallel workboard

Opened: 2026-08-30  
Status: **IN EXECUTION** (Phase 0 CLOSED)

## What Phase 1 is

Define **limits and executable contracts** before scaffolding. Exit when: ADRs **Aceitas**, contracts written, pilot module chosen, auth/tenant baseline tests planned/running in **non-prod**.

## Forbidden until later gates

- Nest bootstrap / `apps/api` creation (Phase 3 after Phase 1+2)
- Monorepo mechanical move of all routes
- Dokploy / Traefik / DNS cutover / VPS wipe (Phase 2+)
- `db push` / reset / corrective prod migrations
- Payment, clinical, or AI as first pilot

## Parallel tracks

| ID | Track | Status | Output |
| --- | --- | --- | --- |
| P1-A | Day-0 residual workflow containment | **done** | [`../../01-current-state/phase-0/CONTAINMENT.md`](../../01-current-state/phase-0/CONTAINMENT.md) — **163** disabled / **46** active; **18** residual name-matches remain |
| P1-B | ADR acceptance packet | **done** | [`../../05-governance/ADR-ACCEPTANCE-PACKET.md`](../../05-governance/ADR-ACCEPTANCE-PACKET.md) — human Aceita pending |
| P1-C | Tenant + membership identity | **done** | [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md) |
| P1-D | RBAC / capabilities | **done** | [`CONTRACT-RBAC.md`](CONTRACT-RBAC.md) |
| P1-E | HTTP API conventions | **done** | [`CONTRACT-HTTP-API.md`](CONTRACT-HTTP-API.md) |
| P1-F | Events, jobs, idempotency, audit | **done** | [`CONTRACT-EVENTS-JOBS.md`](CONTRACT-EVENTS-JOBS.md) |
| P1-G | Migration expand/contract | **done** | [`CONTRACT-MIGRATIONS.md`](CONTRACT-MIGRATIONS.md) |
| P1-H | Support pilot (J-13) | **done** | [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) |
| P1-I | Staging Supabase + restore plan | **done** | [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) |

## Human next (unblocks Phase 1 exit)

1. Sign Aceita/Defer on [`ADR-ACCEPTANCE-PACKET.md`](../../05-governance/ADR-ACCEPTANCE-PACKET.md) with Raygs.
2. Review/accept [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) as the Phase 1 pilot scope.
3. Execute staging restore checklist when ready ([`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) — docs-only until you run it).
4. Optionally triage the **18** remaining residual mutative name-matches in [`RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt`](../../01-current-state/phase-0/RESIDUAL-ACTIVE-MUTATIVE-WORKFLOWS.txt) (not a Phase 1 exit blocker if preserve/known-safe).

## Shared authority

`docs/reengineering/` SoT. Conflict order: accepted ADRs → target architecture → STATUS → evidence → legacy docs.
