# Staging hostname plan (Phase 2)

Opened: **2026-08-30**  
Updated: **2026-08-31**  
Status: **LIVE** — DNS + Traefik wired on clean host  
Authority: [`CLEAN-INFRA-TOPOLOGY.md`](./CLEAN-INFRA-TOPOLOGY.md), ADR-006

## Origin

Clean host Traefik: `2.25.123.224` (ports `80`/`443`). Zone: **Cloudflare** `impulsionando.com.br` (NS authoritative).

## Live staging names

| Purpose | Hostname | DNS | Origin |
| --- | --- | --- | --- |
| Placeholder / smoke | `stg.impulsionando.com.br` | A → `2.25.123.224` (DNS only) | Traefik → `reengineering-placeholder` |
| API (temp: same placeholder until Nest image) | `api.stg.impulsionando.com.br` | A → `2.25.123.224` (DNS only) | Traefik → placeholder `/health` today |
| Dokploy UI | `dokploy.stg.impulsionando.com.br` | A → CF proxy IPs (orange cloud) | Traefik → `dokploy:3000` |

### Smoke (2026-08-31)

```text
http://stg.impulsionando.com.br/health → 200 gitSha=647308e7…
https://stg.impulsionando.com.br/health → 200
http://api.stg.impulsionando.com.br/health → 200
https://api.stg.impulsionando.com.br/health → 200
https://dokploy.stg.impulsionando.com.br/ → 200 (via Cloudflare)
```

## Cloudflare rules

1. **Only** `*.stg` / `stg` hostnames — never prod apex / tenant cutover.
2. Prefer **DNS only** (grey) for `stg` + `api.stg` so Let’s Encrypt HTTP-01 works cleanly.
3. `dokploy.stg` is currently **Proxied** — if TLS/login flakes, switch to DNS only.
4. ACME email on Traefik set to `stg-ops@impulsionando.com.br` (replace if you want a real inbox).

## Decision log

| Date (UTC) | Decision | Owner |
| --- | --- | --- |
| 2026-08-30 | Draft pattern; zone TBD | Agent |
| 2026-08-31 | Zone = Cloudflare `impulsionando.com.br`; records `stg`, `api.stg`, `dokploy.stg` | Cauã |
| 2026-08-31 | Traefik Host rules + LE for stg/api.stg; dokploy.yml Host | Agent |
