# Clean infra topology (Phase 2 planning)

Opened: **2026-08-30**  
Status: **PLAN ONLY** — ADR-006 Aceita-com-condições; does not authorize provisioning  
Authority: [`../PHASE-2-PLATFORM.md`](../PHASE-2-PLATFORM.md), [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md), [`../../05-governance/adrs/ADR-006-dokploy-clean-infra.md`](../../05-governance/adrs/ADR-006-dokploy-clean-infra.md)

## Purpose

Recommend where Dokploy, Traefik, application containers, and staging live relative to the **legacy** production VPS — without wiping or repurposing that VPS as “prep.”

## Recommended topology (preferred)

Three operationally separate environments + external managed data:

```text
Internet
  → Cloudflare (DNS, proxy, WAF, edge rate limits)
      │
      ├─ staging.*.  → Staging server (Traefik → app containers)
      └─ (prod cutover later) → Clean production server (Traefik → app containers)

Dokploy control server
  → pulls GHCR:<full-sha>
  → manages deploy / domains / env / lifecycle
  → does NOT run tenant business traffic as primary app host

Managed Supabase (staging project + prod project)
  → outside VPS / Dokploy runtime (ADR-004)
```

| Environment | Responsibility | Must not become |
| --- | --- | --- |
| **Dokploy control plane** | Deployment control, service lifecycle, non-secret config orchestration | Application origin for public prod traffic; Git build machine; source of business rules |
| **Staging server** | Production-like validation: migrations job, smoke/E2E, rollback rehearsals | Prod data dump without approved anonymization; unrestricted prod credentials |
| **Clean production server** | Traefik + prod application containers only when cutover is gated | Build host; staging; legacy coexistence host; silent dual-publish with old VPS |
| **Managed Supabase** | PostgreSQL, Auth, Storage, Realtime, Queues when approved | Installed inside Dokploy or on app VPS |

Exact host sizes, regions, IPs, and monthly cost: **UNKNOWN** until human quotes (track P2-B).

## What stays on the legacy VPS

Host: `187.77.232.52` (live evidence 2026-08-30).

| Stays (until Phase 7) | Why |
| --- | --- |
| Current public prod traffic path | nginx → host Node / Docker split-brain; rollback source |
| Existing Nginx maps, release directories, Compose stacks | Evidence + controlled rollback — not cleaned as Phase 2 prep |
| Contained / residual publishers inventory | See [`../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md`](../../01-current-state/phase-0/DEPLOYMENT-PUBLISHERS.md) |
| Evolution / n8n / worker units as currently running | Characterize; do not migrate blindly in Phase 2 planning |

| Must not happen on legacy VPS | Why |
| --- | --- |
| Install Dokploy “to clean things up” | Mixes control plane with split-brain; violates ADR-006 |
| Wipe / reinstall / disk cleanup as prep | Destroys rollback; Objective forbids destructive cleanup before cutover |
| Point staging DNS at legacy | Contaminates validation with unknown release identity |
| Use Docker `latest` / host Node SHA as GHCR authority | Not immutable promote path (ADR-007) |

Observed split-brain (do not “fix” in Phase 2):

- nginx → host Node often `ebcc52f0` on `:3000`
- Docker `impulsionando-core:latest` ≈ `80e20d11`
- Public apex often `commit:unknown`
- GitHub `main` tip is **not** what apex reliably serves

## Budget-constrained option (shared control + staging)

If three servers are not affordable initially:

```text
Server A (shared): Dokploy control plane + staging workloads
  → explicit CPU/RAM/disk limits for Dokploy vs staging apps
  → staging Traefik still sole origin for staging hostnames
  → no production application containers on Server A

Server B (required): Clean production only
  → Traefik + prod containers when cutover gated
  → isolated from staging and from legacy VPS

Legacy VPS: unchanged rollback role until Phase 7
```

Rules under budget option:

1. **Production remains isolated** from staging and from the Dokploy UI host’s staging workloads.
2. Resource limits are written before first install (numbers **UNKNOWN** until sized).
3. Sharing control + staging is an explicit ADR-006 allowance — not a license to put prod on the same box.
4. If load or blast-radius evidence shows control-plane incidents take down staging validation, split to three servers before prod cutover.

## Service placement (target — when implementation gated)

Aligned with [`DOKPLOY.md`](../../03-platform/DOKPLOY.md); Nest/`api` appears in Phase 3, physical front split Phase 4+:

| Service | Staging (Phase 2+) | Clean prod (later gates) | Legacy VPS |
| --- | --- | --- | --- |
| `platform-web` / `tenant-web` / `app-web` | Same topology reduced | Traefik public | Current monolith surfaces |
| `api` | After Phase 3 pilot | Traefik as configured | N/A until cutover |
| `worker-*` | Internal only | Internal only | Existing workers until replaced |
| n8n / Evolution | Restricted / internal; migrate carefully | Same | Live until proven replacement |
| Supabase | Staging project | Prod project | Outside all VPS |

Hostname resolves **tenant configuration**, never a different application commit. All tenants on a service share one immutable image SHA.

## Network model (staging first)

- Cloudflare = public edge authority for staging hostnames once DNS is **human-gated**.
- Traefik = single origin router on clean staging (and later clean prod); only Traefik binds host `80`/`443`.
- Apps on internal Docker networks; no unnecessary public host ports.
- Unknown/unowned hostnames fail safe.
- Prod apex / tenant DNS cutover is **not** part of Phase 2 planning exit — Phase 7 / separate gate.

## Transition sketch (not a schedule)

1. **Now:** plan + inventory; legacy untouched; Phase 1 residual restore/auth.
2. **Phase 2 implement (gated):** provision clean hosts → Dokploy → GHCR promote to staging → drills.
3. **Phases 3–6:** product strangler on clean staging → selective prod promote of same SHAs.
4. **Phase 7:** traffic cutover; legacy retire after rollback window.

No date commitments in this doc. Capacity and cost approval are human gates before step 2.

## Open UNKNOWN items

- Provider and SKUs for control / staging / prod-clean
- Whether budget option (shared A) is chosen
- Staging hostname scheme and Cloudflare zone ownership details (no secrets)
- Whether any existing non-prod host can be reused — default assume **no** reuse of legacy VPS
