# Clean host — current identity

Recorded: **2026-08-30** (post Dokploy install). Update when facts change. **No secrets.**

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
| Dokploy UI | `http://2.25.123.224:3000` |
| Traefik | Installed with Dokploy (`traefik:v3.6.7` pulled at install) |
| Public listeners (observed) | `22` (sshd), `80`/`443` (Traefik/docker-proxy), `3000` (Dokploy) |
| Dokploy internal DB | Swarm service `dokploy-postgres` (Postgres 16) — **not** Impulsionando app data |
| App Supabase | Managed external — staging ref `kyiczxtcoexnvcqgrgkr` (restore open) |
| Legacy prod (deny) | `187.77.232.52` — do not mutate from Phase 2 clean-host work |

## Intended role

Shared **Server A**: Dokploy control plane + future staging app workloads. Production app containers and prod DNS stay off this box until later gates / separate prod-clean host.
