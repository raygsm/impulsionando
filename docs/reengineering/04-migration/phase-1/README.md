# Phase 1 — parallel workboard

Opened: 2026-08-30  
Status: **CLOSING** — ADRs Aceitas; Support piloto aceito; residual = staging restore + auth/tenant baseline

## Exit criteria

ADRs **Aceitas** ✅ · contratos ✅ · piloto Support ✅ · **staging restore + auth/tenant tests non-prod** ⏳

## Forbidden until later gates

- Nest bootstrap / `apps/api` (Phase 3 after Phase 1 residual + Phase 2 healthy)
- Monorepo mechanical move of all routes
- Dokploy / Traefik / DNS cutover / VPS wipe on **legacy** VPS
- `db push` / reset / corrective prod migrations

## Parallel tracks

| ID | Track | Status | Output |
| --- | --- | --- | --- |
| P1-A | Day-0 residual workflow containment | **done** | CONTAINMENT — 163 disabled / 46 active / 18 residual |
| P1-B | ADR acceptance | **done** | Aceita recorded 2026-08-30 |
| P1-C…G | Contracts | **done** | tenant / RBAC / HTTP / events / migrations |
| P1-H | Support pilot | **done + accepted** | [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) |
| P1-I | Staging restore plan | **plan done; execute ⏳** | [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) |
| P1-J | Auth/tenant baseline tests non-prod | **in flight** | [`AUTH-TENANT-BASELINE-TESTS.md`](AUTH-TENANT-BASELINE-TESTS.md) |

## Human next

1. Run staging Supabase restore drill (checklist in STAGING-RESTORE-PLAN).
2. Run auth/tenant allow/deny against staging (not prod) — matrix + how-to in [`AUTH-TENANT-BASELINE-TESTS.md`](AUTH-TENANT-BASELINE-TESTS.md).
3. Continue Phase 2 **planning** in [`../phase-2/`](../phase-2/) — no legacy VPS wipe.

## Shared authority

`docs/reengineering/` SoT. Conflict order: accepted ADRs → target architecture → STATUS → evidence → legacy docs.
