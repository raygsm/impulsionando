# Phase 6 Wave 2 — parallel close plan

Created: **2026-09-03T23:50Z**  
Program SoT: [`../../STATUS.md`](../../STATUS.md) · Canvas: [`UPDATE-CANVAS.md`](./UPDATE-CANVAS.md)

> Goal: CLOSE Phase 6 as fast as possible with parallel lanes.  
> Quality bar unchanged: live allow+deny + evidence. No Phase 7.

## Parallel lanes (act now)

| Lane | Work | Parallel? | Owner | Blocker in this cloud agent |
| --- | --- | --- | --- | --- |
| **V** | `phase6:staging:verify` matrix + smoke deny extensions | yes | agent (repo) | none — **shipping now** |
| **O** | Operator orchestrator script (promote → env → verify) | yes | agent (repo) | none — **shipping now** |
| **D** | Deploy scripts optional `PHASE6_CHAT=1` env-adds | yes | agent (repo) | none — **shipping now** |
| **G** | GHCR workflow_dispatch build API+worker for merge SHA | yes | human | agent `gh` is read-only |
| **P** | SSH promote API+worker on clean host `2.25.123.224` | after G | human/agent w/ key | **no SSH key / Docker** here |
| **E** | Set `AI_CHAT_ENABLED` + `AI_TENANT_AGENT_*` on Swarm | with P | human/Dokploy | needs host access |
| **S** | Live verify allow+deny+effects+metrics | after P+E | agent/human | needs `PHASE6_AI_BEARER` |
| **C** | Evidence CLOSE in STATUS / phase-6 / clean-host log | after S | agent | blocked on S |

## Critical path (serialized)

```text
[G] GHCR push SHA ──┐
                    ├─→ [P] promote API+worker ─→ [E] AI flags ─→ [S] live verify ─→ [C] CLOSE
[V]+[O]+[D] repo ───┘ (ready in parallel before promote)
```

## Exact close checklist

1. Merge/push Wave 1 code to `reengineering/program` (or build from this PR branch SHA).
2. `workflow_dispatch` `.github/workflows/reengineering-ghcr-api.yml` (+ worker workflow) with that ref.
3. On operator machine with SSH key `id_ed25519_impulsionando`:
   ```bash
   IMAGE_TAG=<full-sha>-phase6cdef PHASE6_CHAT=1 \
     ./scripts/phase6-wave2-close.sh
   ```
   Or stepwise: deploy API + worker, then `DRY_RUN=0 npm run phase6:staging:verify`.
4. Required env (names only; values in operator secrets file, never git):
   - `PHASE6_AI_BEARER` (or `PHASE5G_OPS_BEARER`)
   - `PHASE6_AI_TENANT_ID` (membership allow)
   - `PHASE6_AI_DENY_TENANT_ID` (membership deny — different tenant)
   - Swarm: `AI_CHAT_ENABLED=true`, optional `AI_TENANT_AGENT_TENANT_ID`/`ENABLED`
5. Matrix PASS → update `STATUS.md` Phase 6 **CLOSED** + clean-host `IMPLEMENTATION-LOG.md`.

## This environment (2026-09-03T23:50Z)

| Capability | State |
| --- | --- |
| Docker | **missing** |
| SSH key `~/.ssh/id_ed25519_impulsionando` | **missing** |
| Staging operator secrets | **missing** |
| Repo Wave 1 code | present on branch |
| Contracts | 47/47 |

## Wave 2 result (2026-09-04T00:03Z) — CLOSED

Operator machine with SSH + Docker completed promote:

- Images `…-phase6exit` from SHA `c4c9530a…` local-loaded to `2.25.123.224`
- `phase6:staging:verify` **PASS=2 FAIL=0**
- Phase 6 marked **CLOSED (staging)** in `STATUS.md` · Phase 7 still not started

