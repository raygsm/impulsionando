# Phase 2 — parallel workboard (planning)

Opened: **2026-08-30**  
Status: **PLANNING AUTHORIZED** — ADRs 001–008 Aceitas / Aceita-com-condições; Aceita ≠ provision Dokploy / DNS / Nest / wipe VPS today  
Phase overview: [`../PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md)

## Exit criteria (implementation — later)

A single commit passes CI → one immutable GHCR image (full SHA) → deploys to **staging on clean infra** without manual SSH rewrite → fails observably → rolls back to a known previous image. External smoke proves domain, TLS, runtime, release SHA, and critical surface — not only HTTP 200.

## Authorization boundary (2026-08-30)

| Allowed now | Forbidden until explicit Phase 2 implementation gate |
| --- | --- |
| Planning docs, inventories, cost/capacity notes | Provision Dokploy / Traefik / clean hosts |
| Naming staging DNS *plans* (no zone edits) | Change Cloudflare / prod DNS / apex cutover |
| GHCR/CI promote *design* (no prod publish path) | Bootstrap Nest / monorepo mechanical move |
| Wire *plans* for staging Supabase (after P1-I restore) | `db push` / reset / corrective prod schema |
| Rollback / health drill *runbooks on paper* | Wipe or reinstall legacy VPS `187.77.232.52` |
| Observability minimum *spec* | Touch prod publishers / re-enable contained workflows |

Legacy VPS remains **rollback-only**. Prod today is split-brain (nginx → host Node `ebcc52f0` on `:3000`; Docker `impulsionando-core:latest` = `80e20d11`; public apex often `commit:unknown`) — do not “fix” with wipe. See [`STATUS.md`](../../STATUS.md).

## Residual Phase 1 (blocks full Phase 2 *implementation*)

| Residual | Owner | Doc |
| --- | --- | --- |
| Human staging restore + RPO/RTO | Human | [`../phase-1/STAGING-RESTORE-PLAN.md`](../phase-1/STAGING-RESTORE-PLAN.md) |
| Auth/tenant allow+deny baseline non-prod | Human / agent assist | Phase 1 board P1-J |

Phase 2 **planning** may proceed in parallel; provisioning waits on residual + human gate.

## Parallel tracks

| ID | Track | Mode | Gate | Output |
| --- | --- | --- | --- | --- |
| **P2-A** | Staging Supabase wiring | **plan-only** until P1-I restore proven; then **human-gated** project bind | ADR-004; no secrets in Git | Named staging project ref; env inventory (names only); app↔staging mapping; no prod credentials in staging |
| **P2-B** | Clean host inventory | **plan-only** / **human-gated** quotes | ADR-006 | Size/region/cost for control / staging / prod-clean; what stays on legacy |
| **P2-C** | Dokploy control plane plan | **plan-only**; install **human-gated** | ADR-006 Aceita-com-condições | Install runbook on clean host only; networks; no app business logic on control plane |
| **P2-D** | GHCR / CI promote path | **plan-only**; CI enable **human-gated** | ADR-007 Aceita | Build-once → `GHCR:<full-sha>` → staging → promote same SHA; forbid `latest` as authority — [`GHCR-AND-PROMOTE.md`](GHCR-AND-PROMOTE.md) |
| **P2-E** | Traefik + Cloudflare staging DNS | **plan-only**; DNS edits **human-gated** | ADR-006; no prod apex | Staging hostnames, Traefik as origin, Cloudflare edge; prod DNS untouched |
| **P2-F** | Health / rollback drill | **plan-only** until staging runtime exists; then **human-gated** rehearsal | Exit criterion | Readiness gates; previous SHA redeploy; drill record (timestamp + SHAs) |
| **P2-G** | Observability minimum | **plan-only**; ship with first staging deploy | TARGET-STACK | Structured logs, correlation IDs, per-service health/readiness, release identity, actionable alert stub |

Topology detail: [`CLEAN-INFRA-TOPOLOGY.md`](CLEAN-INFRA-TOPOLOGY.md). Platform intent: [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md), [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md).

## Track notes (planning depth)

### P2-A — Staging Supabase wiring

- Depends on P1-I: isolated restore into a **non-prod** Supabase project (ADR-004: managed Supabase stays outside Dokploy).
- Record project name/ref, region, and which env var *names* staging apps will use — never connection strings or service-role values in docs.
- Staging must not receive unrestricted production credentials; anonymized/approved data only.
- Auth/tenant baseline (P1-J) runs against this surface before trusting Phase 2 app deploys.

### P2-B — Clean host inventory

- Preferred: separate control / staging / prod-clean (see topology doc).
- Budget option: control + staging shared with hard resource limits; **production always isolated** from staging and from legacy VPS.
- Inventory unknowns: exact sizes, IPs, provider SKUs — mark **UNKNOWN** until human quotes.

### P2-C — Dokploy control plane

- Install only on **clean** infrastructure — never on legacy VPS (ADR-006).
- Control plane pulls GHCR images; manages domains, env, lifecycle; does not select commit per tenant.
- Workers are independent services (not children of SSR/API).
- Nest/API bootstrap remains Phase 3; Phase 2 may host placeholder/minimal images only when implementation is gated.

### P2-D — GHCR / CI promote

- Replaces multi-publisher mess documented in [`../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md`](../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md).
- `latest` and local `build-info.ts` are not release authority.
- No production publish workflows from planning docs alone.

### P2-E — Traefik / Cloudflare staging DNS

- Plan hostnames for staging only (e.g. staging apex / app / tenant patterns — exact names **UNKNOWN** until chosen).
- Cloudflare = edge; Traefik = sole origin `80`/`443` on clean staging (and later prod-clean).
- Prod zone cutover is Phase 7 / explicit gate — not Phase 2 planning.

### P2-F — Health / rollback drill

- Service-specific health and readiness; provider HTTP 200 ≠ healthy.
- Rollback = redeploy previous immutable SHA; never depends on reversing a destructive migration.
- First successful drill is evidence for Phase 2 exit — not a paper checklist alone.

### P2-G — Observability minimum

- Structured logs + correlation across HTTP/jobs/webhooks.
- Release identity (full SHA, build time, environment) on every deployable.
- Alerts: deploy failure, readiness fail, rollback needed — destinations **UNKNOWN** until chosen.

## Explicit non-goals (this board)

- Nest scaffold / `apps/api` (Phase 3).
- Mechanical monorepo move of all routes (ADR-001 conditions).
- Physical split of all three webs in production (ADR-008 / Phase 4+).
- Retiring legacy VPS (Phase 7).
- Re-enabling contained GitHub workflows without recorded decision.

## Shared authority

`docs/reengineering/` SoT. Conflict order: accepted ADRs → `02-target-architecture/` → `STATUS.md` → evidence → legacy `docs/` / `mem/`.
