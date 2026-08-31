# Phase 2 — placeholder rollback drill (P2-F)

Opened: **2026-08-31**  
Status: **DRILL COMPLETE — PASS**  
Authority: [`GHCR-AND-PROMOTE.md`](./GHCR-AND-PROMOTE.md), ADR-007

**Hard rule:** no secrets, PATs, or connection strings in this file.

## Goal

Prove rollback = **redeploy previous known-good SHA** (same image, no rebuild).

## Evidence (2026-08-31 UTC)

| Field | Value |
| --- | --- |
| SHA-A (main merge of PR #100) | `647308e7bed44576c794211e44952c0cf93b03df` |
| SHA-A digest | `sha256:04ffacfc8aafc37a32f254c9b1347e048dc64d394fdd159ae456d6cb6ecec914` |
| SHA-B (`reengineering/program` wiring commit) | `7db6ceaf0aaf4fe9db2478da5d10597dd4c07c3f` |
| SHA-B digest | `sha256:a6daa06fe41cc719d5659610280331ca5aca0917e7269ecd85f7dbaa438027e4` |
| Image | `ghcr.io/raygsm/impulsionando-reengineering-placeholder` |
| Workflow runs | [A 33433542700](https://github.com/raygsm/impulsionando/actions/runs/33433542700) · [B 33433588827](https://github.com/raygsm/impulsionando/actions/runs/33433588827) |
| Host | `2.25.123.224` service `reengineering-placeholder` |
| Method | `docker service update --image …:<full-sha>` (GHCR pull; no rebuild on VPS) |
| Post-drill live | SHA-A · `npm run phase2:smoke:placeholder` OK |
| Follow-up | Swarm `--update-order start-first` (host-mode port 8088) |

### Pass checklist

- [x] SHA-B `/health` showed B’s `gitSha` (`7db6ceaf…`)
- [x] After rollback, `/health` showed A’s `gitSha` again (`647308e7…`)
- [x] No rebuild on the VPS for rollback
- [x] No use of `latest` as authority

## Evidence log

| Date (UTC) | SHA-A | SHA-B | Rollback OK? | Operator | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-08-31 ~20:00–20:02Z | `647308e7…` | `7db6ceaf…` | **YES** | Agent | A→B→A; interim `stop-first` caused port-in-use retries; then converged. `start-first` set after. |

## Remaining Phase 2 (not this drill)

- Public staging DNS + TLS (human Cloudflare)
- Prefer Dokploy UI as day-2 path (this drill used Swarm CLI with GHCR)
- Alert destinations (P2-G)

## Related

- Smoke: `npm run phase2:smoke:placeholder`
- Log: [`clean-host/IMPLEMENTATION-LOG.md`](./clean-host/IMPLEMENTATION-LOG.md)
- Status: [`../../STATUS.md`](../../STATUS.md)
