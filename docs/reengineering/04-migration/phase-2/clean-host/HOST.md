# Clean host — current identity

Recorded: **2026-09-04T00:03Z** (live API+worker `…-phase6exit` local-load; Phase 6 Wave 2 CLOSED). Update when facts change. **No secrets.**

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
| Nest API (Phase 3/5/6) | Swarm **`reengineering-api`** · image `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (linux/amd64 **local-load**, 2026-09-04 Phase 6 Wave 2) · Host **`api.stg.impulsionando.com.br`** · port **3100** · `/health` `gitSha=c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` · `AI_CHAT_ENABLED=true` |
| Worker (Phase 5/6) | Swarm **`reengineering-worker`** · image `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (linux/amd64 **local-load**) · **internal only** · `:3200` on `dokploy-network` · outbox/comm/journey **ON** · `ai.effect.execute` sink |
| tenant-web (Phase 4B) | Swarm **`reengineering-tenant-web`** · image `ghcr.io/raygsm/impulsionando-tenant-web:67e109511962f86dbbdea2356bc8486b87a4abc1` (linux/amd64 **local-load**) · Host **`tenant.stg.impulsionando.com.br`** → `:3300` · public `/health` OK · ACME LE issued |
| GHCR cache (not live) | Tags `2620597db79a55bd7d28911ff9714d3d9cbc2745` for api/worker/tenant-web **pulled** 2026-09-03 (digests match workflow); **not** Swarm-promoted — would regress Phase 4B/5 program SHA `67e10951…` |
| Staging DNS | Cloudflare zone `impulsionando.com.br` — `stg` / `api.stg` / **`tenant.stg`** → `2.25.123.224` (DNS only); `dokploy.stg` proxied |
| Staging access gate | Traefik basic auth **ACTIVE** on `tenant.stg` + `stg` (2026-09-03). **`api.stg` ungated** (Bearer JWT smokes). Creds in `~/.config/impulsionando/staging-operator-secrets.env` only (not git). See [`../STAGING-ACCESS-GATE.md`](../STAGING-ACCESS-GATE.md). |
| App Supabase | Managed external — staging ref **`aamorcqznimmleafavai`** |
| Legacy prod (deny) | `187.77.232.52` — do not mutate from Phase 2 clean-host work |

## Intended role

Shared **Server A**: Dokploy control plane + future staging app workloads. Production app containers and prod DNS stay off this box until later gates / separate prod-clean host.
