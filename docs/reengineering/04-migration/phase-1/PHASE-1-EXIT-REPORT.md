# Phase 1 Exit Report

**Status: DRAFT — Phase 1 not closed**

Date drafted: **2026-08-30**  
Branch: `reengineering/program`  
Product owner: Raygs  
Operator: Cauã

## Verdict

# Phase 1 is NOT YET CLOSED

Contracts, ADR Aceita, and Support pilot readiness are done. Exit remains blocked on **staging restore execution** and **auth/tenant baseline green on non-prod**.  
**Aceita does not authorize Nest bootstrap, monorepo mechanical moves, Dokploy install, DNS cutover, or VPS wipe.**

## Exit blockers — current status

| # | Blocker | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Staging Supabase isolated restore + RPO/RTO | **OPEN** — plan only | Plan: [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md). Restore **not** executed. Backup confirmed (Phase 0) ≠ restore proven. |
| 2 | Auth / tenant allow/deny baseline on non-prod | **OPEN** — not yet green | Track P1-J in flight per [`README.md`](README.md). Must run against staging/non-prod only — not prod. |
| 3 | ADRs Aceitas | **CLOSED for Phase 1** | Aceita recorded **2026-08-30** — [`ADR-ACCEPTANCE-PACKET.md`](../../05-governance/ADR-ACCEPTANCE-PACKET.md), [`DECISIONS.md`](../../05-governance/DECISIONS.md). |
| 4 | Contracts P1-C…G | **CLOSED for Phase 1** | See completed table below. |
| 5 | Support pilot (P1-H) | **CLOSED for Phase 1** | Formalized + accepted 2026-08-30 — [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md). Nest still **not** authorized. |

### Not a Phase 1 exit blocker (Phase 2 / 7 risk)

Prod VPS today **does not** serve GitHub `main` tip. Probe identity (2026-08-30): host Node often `ebcc52f0`; Docker core `80e20d11`; apex/app often `commit: unknown`. Do **not** “fix” with wipe on legacy VPS — cutover only under Phase 7 / conscious publish chain. Tracked in [`STATUS.md`](../../STATUS.md).

## Completed tracks (P1-A…I)

| ID | Track | Status | Artifact |
| --- | --- | --- | --- |
| P1-A | Day-0 residual workflow containment | **done** | Containment snapshot: **163** `disabled_manually` / **46** `active` / **18** residual name-matches ([`STATUS.md`](../../STATUS.md); Phase 0 [`CONTAINMENT.md`](../../01-current-state/phase-0/CONTAINMENT.md)) |
| P1-B | ADR acceptance | **done** | Aceita **2026-08-30** — [`ADR-ACCEPTANCE-PACKET.md`](../../05-governance/ADR-ACCEPTANCE-PACKET.md) |
| P1-C | Tenant identity contract | **done** | [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md) |
| P1-D | RBAC contract | **done** | [`CONTRACT-RBAC.md`](CONTRACT-RBAC.md) |
| P1-E | HTTP API contract | **done** | [`CONTRACT-HTTP-API.md`](CONTRACT-HTTP-API.md) |
| P1-F | Events / jobs contract | **done** | [`CONTRACT-EVENTS-JOBS.md`](CONTRACT-EVENTS-JOBS.md) |
| P1-G | Migrations contract | **done** | [`CONTRACT-MIGRATIONS.md`](CONTRACT-MIGRATIONS.md) |
| P1-H | Support pilot | **done + accepted** | [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) |
| P1-I | Staging restore plan | **plan done; execute ⏳** | [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) |

## Residual to mark Phase 1 Concluída

1. Humans execute isolated restore into **staging only**; record numeric RPO/RTO (checklist in [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md)).
2. Auth/tenant allow/deny baseline **green** on non-prod (P1-J) — no prod writes as diagnostics.
3. Update this report from **DRAFT** → closed (date, SHAs, evidence links); sync [`STATUS.md`](../../STATUS.md) Fase 1 → **Concluída**.

## Go / no-go (while DRAFT)

| Decision | Result |
| --- | --- |
| Treat Phase 1 contracts + Aceita + Support pilot as done | **YES** (tracks P1-A…H; P1-I plan only) |
| Mark Phase 1 **Concluída** | **NO-GO** until restore executed + auth/tenant baseline green |
| Phase 2 **planning** board | **AUTHORIZED in parallel** per [`STATUS.md`](../../STATUS.md) — workboard path [`../phase-2/`](../phase-2/) once created |
| Nest bootstrap / `apps/api` / monorepo mechanical move | **NO-GO** — Aceita ≠ implement; Phase 3 after Phase 1 residual exit + Phase 2 staging healthy |
| Dokploy / Traefik / DNS cutover / wipe on **legacy** VPS | **NO-GO** — Phase 2 clean infra only; no legacy wipe |
| `db push` / reset / corrective prod migrations | **NO-GO** |

## Explicit statements

- **Aceita does not start Nest or Dokploy.** Direction recorded ≠ scaffold, provision, or DNS change.
- Support piloto **aceito** = vertical chosen + contract readiness — **not** Nest implementation license ([`PILOT-SUPPORT.md`](PILOT-SUPPORT.md)).
- Backup **confirmed** ≠ restore **proven** until P1-I drill runs on staging.
- HTTP 200 / local build ≠ release proof; prod split-brain (`ebcc52f0` / `80e20d11` / `unknown`) remains Phase 2/7 debt, not a Phase 1 close criterion.
- Temporary authority remains Cauã + Raygs.

## Next

| Path | When |
| --- | --- |
| Close residual (#1–2 above) → finalize this exit report | Required to mark Phase 1 Concluída |
| Phase 2 planning board under [`docs/reengineering/04-migration/phase-2/`](../phase-2/) | **Allowed now in parallel** ([`STATUS.md`](../../STATUS.md): planning of the next phase may run alongside residual close) — Dokploy **clean** infra, GHCR SHA, Traefik staging; **not** on legacy VPS |

Authority: `docs/reengineering/` SoT. Conflict order: accepted ADRs → target architecture → STATUS → evidence → legacy docs.
