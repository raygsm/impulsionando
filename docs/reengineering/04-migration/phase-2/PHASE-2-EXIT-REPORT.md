# Phase 2 Exit Report

**Status: CLOSED**

Report date: **2026-09-02**  
Branch: `reengineering/program` (implementation) · workflow on `main`  
Product owner: Raygs  
Operator: Cauã / Agent

## Verdict

# Phase 2 is CLOSED

Staging platform path is proven on clean host `2.25.123.224`: Dokploy + Traefik + Swarm, GHCR SHA images, DNS LIVE, rollback drill PASS, Nest API promoted from GHCR (Phase 3 carry-over closes the promote path for real app images).

**Deferred (non-blocking):** external alert routing (PagerDuty/Slack) — documented in [`OBSERVABILITY-MINIMUM.md`](./OBSERVABILITY-MINIMUM.md). Formal RPO/RTO numeric drill fields in [`STAGING-RESTORE-EVIDENCE.md`](./STAGING-RESTORE-EVIDENCE.md) remain UNKNOWN until operator records backup timestamps; staging data is present and verified (`companies=313`).

## Exit criteria — final status

| # | Criterion | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Clean host inventory + Dokploy | **CLOSED** | [`clean-host/HOST.md`](./clean-host/HOST.md) · Dokploy v0.30.3 |
| 2 | Traefik + staging DNS | **CLOSED** | `stg` / `api.stg` / `dokploy.stg` LIVE — [`STAGING-HOSTNAMES.md`](./STAGING-HOSTNAMES.md) |
| 3 | GHCR SHA publish path | **CLOSED** | Placeholder drill [`ROLLBACK-DRILL.md`](./ROLLBACK-DRILL.md) · API image [`GHCR-AND-PROMOTE.md`](./GHCR-AND-PROMOTE.md) · workflow `reengineering-ghcr-api.yml` on `main` |
| 4 | Rollback to known SHA | **CLOSED** | A→B→A PASS `647308e7…` |
| 5 | Staging Supabase wired | **CLOSED** | ref `aamorcqznimmleafavai` · `npm run verify:staging-supabase` OK |
| 6 | Health / runtime identity | **CLOSED** | `/health` returns `gitSha` on placeholder and Nest API |
| 7 | Deploy without manual config rewrite | **CLOSED** | `scripts/deploy-reengineering-api-clean-host.sh` + `docker service update --image` |
| 8 | Observability minimum | **CLOSED** (minimum) | [`OBSERVABILITY-MINIMUM.md`](./OBSERVABILITY-MINIMUM.md) — external alerts deferred |

## Go / no-go

| Decision | Result |
| --- | --- |
| Mark Phase 2 **Concluída** | **GO** |
| Prod DNS cutover | **NO-GO** (Phase 7) |
| Legacy VPS wipe | **NO-GO** |

## Evidence (2026-09-02)

| Item | Value |
| --- | --- |
| GHCR API image | `ghcr.io/raygsm/impulsionando-api:b58d4c111b0b37bc48dacad3a7e12c1506f9d6e1` |
| Workflow run | [33575721274](https://github.com/raygsm/impulsionando/actions/runs/33575721274) |
| Swarm promote | clean-host log 2026-09-02T00:38Z |
| Live API health | `gitSha=badfb94d01cec685736bc1377f008adf3acd863b` |
| Placeholder smoke | `npm run phase2:smoke:placeholder` OK |
