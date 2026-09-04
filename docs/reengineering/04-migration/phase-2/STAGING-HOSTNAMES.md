# Staging hostname plan (Phase 2)

Opened: **2026-08-30**  
Updated: **2026-09-03**  
Status: **LIVE** — DNS + Traefik wired on clean host  
Authority: [`CLEAN-INFRA-TOPOLOGY.md`](./CLEAN-INFRA-TOPOLOGY.md), ADR-006

## Origin

Clean host Traefik: `2.25.123.224` (ports `80`/`443`). Zone: **Cloudflare** `impulsionando.com.br` (NS authoritative).

## Live staging names

| Purpose | Hostname | DNS | Origin |
| --- | --- | --- | --- |
| Placeholder / smoke | `stg.impulsionando.com.br` | A → `2.25.123.224` (DNS only) | Traefik → `reengineering-placeholder` |
| Nest API | `api.stg.impulsionando.com.br` | A → `2.25.123.224` (DNS only) | Traefik → `reengineering-api` `:3100` |
| tenant-web | `tenant.stg.impulsionando.com.br` | A → `2.25.123.224` (DNS only; **LIVE** 2026-09-03) | Traefik → `reengineering-tenant-web` `:3300` |
| CSI core SSR (7B staging) | `csi.stg.impulsionando.com.br` | **A pending** (Traefik Host **LIVE** 2026-09-04; smoke via Host header) | Traefik → `reengineering-csi-core` `:3000` |
| Dokploy UI | `dokploy.stg.impulsionando.com.br` | A → CF proxy IPs (orange cloud) | Traefik → `dokploy:3000` |

### Access gate (staging hide)

Public staging app hosts stay **grey cloud** for Let’s Encrypt. Edge lock is Traefik basic auth (optional IP allowlist) — **not** CF proxy. See [`STAGING-ACCESS-GATE.md`](./STAGING-ACCESS-GATE.md).

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
2. Prefer **DNS only** (grey) for `stg` + `api.stg` + `tenant.stg` so Let’s Encrypt HTTP-01 works cleanly.
3. `dokploy.stg` is currently **Proxied** — if TLS/login flakes, switch to DNS only.
4. ACME email on Traefik set to `stg-ops@impulsionando.com.br` (replace if you want a real inbox).
5. Do **not** orange-cloud staging app hosts to “hide” them — use the Traefik access gate instead.

## Decision log

| Date (UTC) | Decision | Owner |
| --- | --- | --- |
| 2026-08-30 | Draft pattern; zone TBD | Agent |
| 2026-08-31 | Zone = Cloudflare `impulsionando.com.br`; records `stg`, `api.stg`, `dokploy.stg` | Cauã |
| 2026-08-31 | Traefik Host rules + LE for stg/api.stg; dokploy.yml Host | Agent |
| 2026-09-03 | Staging access gate = Traefik basic auth (`staging-basic-auth@file`); grey DNS retained; IP allowlist documented as alternative | Agent |
| 2026-09-04 | Traefik Host `csi.stg` → CSI Nitro SSR (`reengineering-csi-core`); Cloudflare A `csi.stg` deferred (no API token) | Agent |
