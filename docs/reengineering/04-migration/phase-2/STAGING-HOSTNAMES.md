# Staging hostname plan (Phase 2)

Opened: **2026-08-30**  
Status: **PLAN — DNS human-gated** (no Cloudflare edits from agents without explicit OK)  
Authority: [`CLEAN-INFRA-TOPOLOGY.md`](./CLEAN-INFRA-TOPOLOGY.md), ADR-006

## Origin

Clean host Traefik: `2.25.123.224` (ports `80`/`443`). Dokploy UI stays on `:3000` until a hostname is assigned.

## Proposed staging names (pick / confirm)

Exact public names **UNKNOWN** until Cloudflare zone choice. Suggested pattern:

| Purpose | Proposed hostname | Origin |
| --- | --- | --- |
| Dokploy UI | `dokploy.staging.<zone>` | `2.25.123.224:3000` (or Traefik → dokploy) |
| Placeholder smoke | `placeholder.staging.<zone>` | Traefik → `reengineering-placeholder` |
| Later platform-web | `www.staging.<zone>` | future image |
| Later app-web | `app.staging.<zone>` | future image |
| Later api | `api.staging.<zone>` | Phase 3 |

Until DNS exists, smoke uses:

- Direct: `http://2.25.123.224:8088/health` (host-published placeholder, if deployed)
- Traefik + Host header: `curl -H 'Host: placeholder.staging.local' http://2.25.123.224/health`

## Cloudflare rules (when human edits)

1. **Only** staging hostnames — never prod apex / tenant prod cutover.
2. Proxied A/AAAA → `2.25.123.224` (or CNAME to a staging record pointing there).
3. SSL: full/strict once Let’s Encrypt via Traefik works; set real ACME email (replace install default `test@localhost.com`).
4. Record chosen names here and in [`clean-host/HOST.md`](./clean-host/HOST.md) — no API tokens in git.

## Decision log

| Date (UTC) | Decision | Owner |
| --- | --- | --- |
| 2026-08-30 | Draft pattern above; zone suffix TBD | Agent draft / Cauã confirm |
