# Dokploy / clean-host deploy notes

**Do not** install or target legacy VPS `187.77.232.52` from here.

Live Dokploy: `http://2.25.123.224:3000` (v0.30.3). Evidence: [`docs/reengineering/04-migration/phase-2/clean-host/`](../../docs/reengineering/04-migration/phase-2/clean-host/).

## Placeholder service (Phase 2 smoke)

Image: `ghcr.io/<owner>/impulsionando-reengineering-placeholder:<full-git-sha>`  
Dockerfile: [`../compose/Dockerfile.placeholder`](../compose/Dockerfile.placeholder)

Endpoints inside container (`8080`):

- `GET /` — human-readable SHA
- `GET /health` — JSON `{ ok, service, gitSha }`
- `GET /ready` — JSON `{ ready, service, gitSha }`

### Swarm deploy example (Traefik on `dokploy-network`)

Replace `IMAGE` with the GHCR SHA tag. No secrets required for the placeholder.

```bash
docker service create \
  --name reengineering-placeholder \
  --replicas 1 \
  --network dokploy-network \
  --publish published=8088,target=8080,mode=host \
  --label traefik.enable=true \
  --label traefik.swarm.network=dokploy-network \
  --label 'traefik.http.routers.reeng-ph.rule=Host(`placeholder.staging.local`)' \
  --label traefik.http.routers.reeng-ph.entrypoints=web \
  --label traefik.http.routers.reeng-ph.service=reeng-ph \
  --label traefik.http.services.reeng-ph.loadbalancer.server.port=8080 \
  IMAGE
```

Smoke (no DNS yet):

```bash
curl -sS http://127.0.0.1:8088/health
curl -sS -H 'Host: placeholder.staging.local' http://127.0.0.1/health
```

Prefer creating the same app in the **Dokploy UI** once GHCR credentials are linked — this CLI path is for first platform proof only.

## Prefer Dokploy UI for product services

Product apps (`platform-web`, `tenant-web`, `app-web`, `api`, `worker`) deploy as **new** GHCR SHA images — never the legacy monolith tree from `187.77.232.52`.
