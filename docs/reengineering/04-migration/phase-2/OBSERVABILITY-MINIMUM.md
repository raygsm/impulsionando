# Observability minimum (Phase 2)

Opened: **2026-09-02**  
Status: **MINIMUM MET — external alert routing deferred**

## In scope (Phase 2 exit)

| Signal | Mechanism | Evidence |
| --- | --- | --- |
| Release identity | `/health` returns `gitSha` (full commit SHA) | Nest `api.stg` · placeholder `stg` |
| Deploy traceability | GHCR image tagged with full SHA only (ADR-007) | `ghcr.io/raygsm/impulsionando-api:<sha>` |
| Failed deploy observable | Swarm `docker service ps` shows task errors; Traefik returns 502/503 when no healthy backend | clean-host ops |
| Rollback path | Redeploy previous SHA image (no rebuild on VPS) | [`ROLLBACK-DRILL.md`](./ROLLBACK-DRILL.md) PASS |
| Correlation | Nest API returns `correlationId` in JSON envelopes | Support + tenant resolve smokes |

## Deferred (post Phase 2 — not a gate blocker)

| Item | Status | Notes |
| --- | --- | --- |
| PagerDuty / Slack / email alert destinations | **UNKNOWN** | Configure when Phase 5 worker + prod-adjacent SLOs are in scope |
| Centralized log aggregation (Loki/Datadog) | **UNKNOWN** | Dokploy/Traefik container logs available via `docker service logs` |
| Uptime synthetic checks | **UNKNOWN** | Manual smokes + GitHub Actions workflow_dispatch suffice for staging |

## Operator checks (staging)

```bash
curl -fsS https://api.stg.impulsionando.com.br/health
npm run phase2:smoke:placeholder
npm run phase3:smoke:support-live
npm run phase4:smoke:tenant-resolve
```
