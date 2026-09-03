# Staging access gate (clean host Traefik)

Opened: **2026-09-03**  
Host: `2.25.123.224` (clean) — **not** legacy `187.77.232.52`  
Related: [`STAGING-HOSTNAMES.md`](./STAGING-HOSTNAMES.md)

## Goal

Keep Cloudflare **DNS only** (grey cloud) for `stg` / `api.stg` / `tenant.stg` so Let’s Encrypt HTTP-01 keeps working, while the **public internet cannot freely use** staging FE hosts.

**Preferred gate:** Traefik **basic auth** middleware on Swarm routers.  
**Not** the gate: Cloudflare orange-cloud / CF Access (those break or complicate ACME and hide real client IPs).

## What is gated

| Host | Service | Default |
| --- | --- | --- |
| `api.stg.impulsionando.com.br` | `reengineering-api` | **ungated** — Bearer JWT smokes need a free `Authorization` header |
| `tenant.stg.impulsionando.com.br` | `reengineering-tenant-web` | gated when apply script runs |
| `stg.impulsionando.com.br` | `reengineering-placeholder` | gated by default (`INCLUDE_STG=1`) |

`dokploy.stg` is out of scope here (separate Dokploy UI / CF proxy). Worker has no public Traefik Host.

**Why API is ungated:** HTTP Basic and Bearer JWT both use the `Authorization` header. Gating `api.stg` breaks Phase 4B/5 staff/job/ops smokes. Gate FE hosts only; keep API behind app auth + RLS.

## One-time: set the password (operator)

From a trusted machine (password never committed; hash generated **on the host**):

```bash
STAGING_BASIC_AUTH_USER=ops \
STAGING_BASIC_AUTH_PASS='choose-a-long-secret-12+' \
./scripts/apply-staging-access-gate-clean-host.sh
```

Rotate: run the same command with a new `STAGING_BASIC_AUTH_PASS`.  
Disable: `DISABLE=1 ./scripts/apply-staging-access-gate-clean-host.sh`  
Skip placeholder: `INCLUDE_STG=0 … ./scripts/apply-staging-access-gate-clean-host.sh`  
Also gate API (rarely wanted): `INCLUDE_API=1 … ./scripts/apply-staging-access-gate-clean-host.sh`

### What the script does on the host

1. Writes APR1 htpasswd to `/etc/dokploy/traefik/dynamic/staging-basic-auth.htpasswd` (mode `600`).
2. Writes middleware file `/etc/dokploy/traefik/dynamic/staging-access-gate.yml` referencing that `usersFile` (Traefik file provider already watches this directory).
3. Attaches Swarm labels on **tenant-web** (+ placeholder when `INCLUDE_STG=1`):
   - `traefik.http.routers.<name>.middlewares=staging-basic-auth@file`
   - same for `*-secure` routers
4. By default **detaches** middleware from `reengineering-api` (`INCLUDE_API=0`). Set `INCLUDE_API=1` to attach API.

No plaintext password is stored. Do not copy host htpasswd / YAML into git.

## Deploy scripts

`scripts/deploy-reengineering-api-clean-host.sh` and  
`scripts/deploy-reengineering-tenant-web-clean-host.sh`:

| Service | `STAGING_ACCESS_GATE` default | Behavior |
| --- | --- | --- |
| **API** | `0` | Never attach Basic (matches ungated live policy). `1` forces attach; `auto` attaches only if gate YAML exists (avoid unless you really want Basic on API). |
| **tenant-web** | `auto` | Attach middleware labels **only if** `staging-access-gate.yml` exists on the host; `1` always; `0` never |

## Operator checks

FE unauthenticated (expect **401**):

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://tenant.stg.impulsionando.com.br/health
```

FE authenticated:

```bash
curl -fsS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
  https://tenant.stg.impulsionando.com.br/health
```

API (ungated by default — no `-u`):

```bash
curl -fsS https://api.stg.impulsionando.com.br/health
```

### Smokes vs Basic auth

- **API smokes** (`api.stg`): use Bearer JWT in `Authorization`. Do **not** add Basic — the gate is off on API by design.
- **tenant-web smoke** (`tenant.stg`): Traefik Basic is required when the gate is live. Prefer:
  - `curl -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS"` for manual FE checks, or
  - `scripts/smoke-reengineering-tenant-web-health.mjs` with `STAGING_BASIC_AUTH_USER` / `STAGING_BASIC_AUTH_PASS` set (adds `Authorization: Basic …` only; public `https://tenant.stg…` Host comes from the URL, so Basic does not break Host matching).
- Local / Swarm-direct Host override (`Host: garrido…`) is a separate path; do not mix public gated URL + Host override expectations.

Creds live in `~/.config/impulsionando/staging-operator-secrets.env` (not git). `phase5:staging:verify` loads that file when present (fills missing keys only).

## Alternative: IP allowlist

Use when the operator set is a fixed office/VPN CIDR and basic auth is undesirable (e.g. browser UX). Still keep **grey DNS**.

Example Traefik file middleware (host-only; do not commit real IPs if sensitive):

```yaml
http:
  middlewares:
    staging-ip-allowlist:
      ipAllowList:
        sourceRange:
          - "203.0.113.10/32"   # replace with operator / VPN egress
          - "198.51.100.0/24"
```

Attach with labels on **FE** routers (prefer not on API), e.g. `traefik.http.routers.reeng-tenant-web-secure.middlewares=staging-ip-allowlist@file`  
(or chain: `staging-basic-auth@file,staging-ip-allowlist@file`).

Caveats:

- Grey cloud required so Traefik sees the real client IP (orange cloud shows CF edges unless you trust `X-Forwarded-For` carefully).
- Laptop IP changes → lockouts; prefer VPN egress CIDR.
- Does not replace app auth / RLS; only shrinks who can reach the edge.

## DNS reminder

| Record | Proxy | Why |
| --- | --- | --- |
| `stg`, `api.stg`, `tenant.stg` | **DNS only** | LE HTTP-01 + real client IP for allowlists |
| Gate | Traefik middleware on FE | Hide staging FE from casual public use; API ungated for Bearer smokes |

## Safety

- Clean host only (`2.25.123.224`).
- No prod DNS changes.
- No secrets in git / chat / evidence logs (record “gate applied”, not credentials).
