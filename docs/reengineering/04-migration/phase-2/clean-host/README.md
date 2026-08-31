# Clean host VPS — implementation log

**Host:** `2.25.123.224` (`srv1942777`)  
**Role:** Phase 2 budget option — Dokploy control + staging (ADR-006)  
**Not:** legacy prod `187.77.232.52`

## Rules for agents / operators

1. **Every** mutation on this VPS (install, config, firewall, Docker service, Traefik route, app deploy) gets a dated entry in [`IMPLEMENTATION-LOG.md`](./IMPLEMENTATION-LOG.md).
2. Update [`HOST.md`](./HOST.md) when identity/facts change (OS, listeners, Dokploy version).
3. **No secrets** in this folder (passwords, tokens, swarm join tokens, DB URIs, service_role keys).
4. Never install Dokploy or wipe on the **legacy** VPS from this track.
5. Managed Supabase stays **outside** this host (ADR-004). `dokploy-postgres` here is Dokploy control plane only.
6. Authority: `docs/reengineering/STATUS.md` + ADRs. This folder is **evidence**, not a license to skip gates.

## Index

| File | Purpose |
| --- | --- |
| [`HOST.md`](./HOST.md) | Current observed identity (IP, OS, SSH, ports) |
| [`IMPLEMENTATION-LOG.md`](./IMPLEMENTATION-LOG.md) | Chronological mutations |
| [`../CLEAN-INFRA-TOPOLOGY.md`](../CLEAN-INFRA-TOPOLOGY.md) | Topology plan + inventory summary |
| [`../README.md`](../README.md) | Phase 2 board |

## Quick access

- Dokploy UI: `http://2.25.123.224:3000` (admin created in Dashboard — not recorded here)
- SSH: `ssh -i ~/.ssh/id_ed25519_impulsionando root@2.25.123.224`
