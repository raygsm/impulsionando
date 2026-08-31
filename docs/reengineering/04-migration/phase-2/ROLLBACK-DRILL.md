# Phase 2 — placeholder rollback drill (P2-F)

Opened: **2026-08-31**  
Status: **RUNBOOK READY — execute after ≥2 SHA tags exist in GHCR**  
Authority: [`GHCR-AND-PROMOTE.md`](./GHCR-AND-PROMOTE.md), ADR-007

**Hard rule:** no secrets, PATs, or connection strings in this file. Prefer Dokploy UI over SSH rewrite.

## Goal

Prove rollback = **redeploy previous known-good SHA** (same image, no rebuild).

## Preconditions

1. PR landing workflow on default branch merged ([`#100`](https://github.com/raygsm/impulsionando/pull/100) or successor).
2. Two successful `workflow_dispatch` publishes, e.g. SHA-A and SHA-B:
   - `ghcr.io/raygsm/impulsionando-reengineering-placeholder:<40-hex-A>`
   - `ghcr.io/raygsm/impulsionando-reengineering-placeholder:<40-hex-B>`
3. Dokploy registry login for GHCR (human vault — not in git).
4. Placeholder service reachable for smoke (`:8088` and/or Traefik Host).

## Drill steps

| Step | Action | Record |
| --- | --- | --- |
| 1 | Deploy **SHA-A** via Dokploy (image tag = full SHA). | Deploy time UTC, digest if shown |
| 2 | Smoke: `npm run phase2:smoke:placeholder` with `PLACEHOLDER_EXPECT_SHA=<A>` | Pass/fail + observed `gitSha` |
| 3 | Deploy **SHA-B** the same way (no rebuild). | Deploy time UTC |
| 4 | Smoke with `PLACEHOLDER_EXPECT_SHA=<B>` | Pass/fail |
| 5 | **Rollback:** redeploy **SHA-A** (same tag/digest as step 1). | Deploy time UTC |
| 6 | Smoke with `PLACEHOLDER_EXPECT_SHA=<A>` | Must match A again |
| 7 | Append results to [`clean-host/IMPLEMENTATION-LOG.md`](./clean-host/IMPLEMENTATION-LOG.md) | This drill row |

## Pass criteria

- [ ] SHA-B `/health` shows B’s `gitSha`
- [ ] After rollback, `/health` shows A’s `gitSha` again
- [ ] No rebuild on the VPS for rollback
- [ ] No use of `latest` as authority

## Evidence log

| Date (UTC) | SHA-A | SHA-B | Rollback OK? | Operator | Notes |
| --- | --- | --- | --- | --- | --- |
| _pending_ | | | | | Waiting GHCR on `main` |

## Related

- Smoke script: `npm run phase2:smoke:placeholder`
- Clean host: [`clean-host/HOST.md`](./clean-host/HOST.md)
- Status: [`../../STATUS.md`](../../STATUS.md)
