# Phase 2 — parallel workboard (planning)

Opened: **2026-08-30**  
Status: **IMPLEMENTATION IN PROGRESS** — Dokploy on clean host; restore/auth residual still parallel  
Phase overview: [`../PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md)

## Exit criteria (implementation — later)

A single commit passes CI → one immutable GHCR image (full SHA) → deploys to **staging on clean infra** without manual SSH rewrite → fails observably → rolls back to a known previous image. External smoke proves domain, TLS, runtime, release SHA, and critical surface — not only HTTP 200.

## Authorization boundary (2026-08-30)

| Allowed now | Forbidden until explicit gate |
| --- | --- |
| Workspace skeleton (`apps/*`, `packages/*`), contracts package | Nest business logic in `apps/api` |
| `workflow_dispatch` GHCR **placeholder** SHA publish | Change Cloudflare / **prod** DNS / apex cutover |
| Staging evidence + env-name inventories | Wipe or reinstall legacy VPS `187.77.232.52` |
| Dokploy on **clean** host `2.25.123.224` | Dokploy on legacy VPS |
| | `db push` / reset / corrective prod schema |
| | Re-enable contained workflows without recorded decision |

**Landed:** workspace scaffold · contracts · GHCR stub workflow · clean host inventory · **Dokploy v0.30.3** + Traefik on `2.25.123.224` (UI `:3000`) · staging Supabase project created (empty; restore open).

## Restore independence (explicit)

| Depends on staging **restore** | Does **not** depend on restore |
| --- | --- |
| P1-I RPO/RTO evidence | Dokploy / Traefik on clean host |
| P1-J auth/tenant live allow/deny on real schema | GHCR placeholder build/publish |
| App bind that needs prod-like tables/RLS | Staging hostname **planning**; admin UI setup |
| Phase 1 **exit** | Placeholder container deploy without Supabase |
| P2-A full data wiring | Env **name** inventory (values later) |

## Residual Phase 1 (blocks Phase 1 *exit*, not all of Phase 2)

| Residual | Owner | Doc |
| --- | --- | --- |
| Human staging restore + RPO/RTO | Human | [`../phase-1/STAGING-RESTORE-PLAN.md`](../phase-1/STAGING-RESTORE-PLAN.md) |
| Auth/tenant allow+deny baseline non-prod | Human / agent assist | Phase 1 board P1-J |

## Parallel tracks

| ID | Track | Mode | Gate | Output |
| --- | --- | --- | --- | --- |
| **P2-A** | Staging Supabase wiring | **partial** — project exists; restore open | ADR-004 | ref `kyiczxtcoexnvcqgrgkr`; bind secrets after restore |
| **P2-B** | Clean host inventory | **done** (budget A) | ADR-006 | `2.25.123.224` Ubuntu 24.04 · 1 vCPU · 4G |
| **P2-C** | Dokploy control plane | **installed** | ADR-006 | Dokploy v0.30.3 · http://2.25.123.224:3000 · human admin signup |
| **P2-D** | GHCR / CI promote path | **stub on branch**; dispatch **blocked** until workflow on default branch | ADR-007 | Local/VPS image `97d167bd` deployed; GHCR publish next |
| **P2-E** | Traefik + Cloudflare staging DNS | Traefik ✅ Host header smoke; DNS **human** | ADR-006 | [`STAGING-HOSTNAMES.md`](STAGING-HOSTNAMES.md) |
| **P2-F** | Health / rollback drill | **partial** — `/health`+`/ready` live; rollback SHA drill not yet | Exit criterion | Redeploy previous SHA still open |
| **P2-G** | Observability minimum | with first staging deploy | TARGET-STACK | logs / readiness / release SHA |

Topology detail: [`CLEAN-INFRA-TOPOLOGY.md`](CLEAN-INFRA-TOPOLOGY.md). **VPS mutation log (mandatory):** [`clean-host/`](clean-host/README.md). Platform intent: [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md), [`../../03-platform/CI-CD.md`](../../03-platform/CI-CD.md).

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
