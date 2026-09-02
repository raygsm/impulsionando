# Clean host — current identity

Recorded: **2026-09-01** (Phase 3 Nest API LIVE on `api.stg`). Update when facts change. **No secrets.**

| Field | Value |
| --- | --- |
| Public IPv4 | `2.25.123.224` |
| Hostname | `srv1942777` |
| Provider | Hostinger (KVM) — SKU/cost UNKNOWN |
| OS | Ubuntu **24.04.4 LTS** (Noble) |
| Kernel | `6.8.0-137-generic` |
| Resources | 1 vCPU · ~3.8 GiB RAM · 48G root disk |
| SSH | `root@2.25.123.224` · key `id_ed25519_impulsionando` (pubkey auth OK) |
| Docker | Present; Swarm manager advertise `2.25.123.224` |
| Dokploy | **v0.30.3** · service `dokploy` 1/1 |
| Dokploy UI | `http://2.25.123.224:3000` · also `https://dokploy.stg.impulsionando.com.br` |
| Traefik | Installed with Dokploy (`traefik:v3.6.7`); ACME email `stg-ops@impulsionando.com.br` |
| Public listeners (observed) | `22` (sshd), `80`/`443` (Traefik), `3000` (Dokploy), **`8088`** (placeholder host publish) |
| Placeholder app | Swarm `reengineering-placeholder` · GHCR SHA `647308e7…` · Host **`stg.impulsionando.com.br`** only (+ `placeholder.staging.local`) · `/health` full `gitSha` |
| Nest API (Phase 3 pilot) | Swarm **`reengineering-api`** · image `reengineering-api:phase3-local` (local tag; GHCR `badfb94d…` built, push pending) · Host **`api.stg.impulsionando.com.br`** · port **3100** · `/health` `gitSha=badfb94d01cec685736bc1377f008adf3acd863b` · service `impulsionando-api` |
| Staging DNS | Cloudflare zone `impulsionando.com.br` — `stg` / `api.stg` → `2.25.123.224` (DNS only); `dokploy.stg` proxied |
| App Supabase | Managed external — staging ref **`aamorcqznimmleafavai`** |
| Legacy prod (deny) | `187.77.232.52` — do not mutate from Phase 2 clean-host work |

## Intended role

Shared **Server A**: Dokploy control plane + future staging app workloads. Production app containers and prod DNS stay off this box until later gates / separate prod-clean host.
