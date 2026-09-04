# Phase 7B — CSI pilot (selected)

Selected: **2026-09-04**  
Hostname: **`csi.impulsionando.com.br`**  
Internal path: **`/csi`**  
Status: **SELECTED — DNS flip BLOCKED until prod web surface exists**  
7F: **PARKED**

## Why CSI

- Declared client in `infra/subdomains/clients.json`
- Non-clinical (unlike Chrismed / RioMed)
- Smaller blast radius than apex `impulsionando.com.br`
- Operator priority: first real tenant for reengineering cutover

## Brutal truth (read this)

| Claim | Reality today |
| --- | --- |
| “Flip CSI DNS to clean host now” | **NO** — would break CSI users |
| What serves CSI HTML today | **Legacy only** — `impulsionando-core` on `187.77.232.52` (`/csi` + Investito) |
| What clean host has | Nest `api.stg` + **tenant-web JSON stub** + worker (staging DB) |
| Staging DB for real CSI users | **FORBIDDEN** |
| Prod Nest public hostname | **Does not exist yet** |

So: **CSI is the chosen door.** We do **not** open it on the new house until the new house can show CSI (or an approved strangler).

## What we implement NOW (unlock Impulsionando development)

1. Record CSI as official 7B pilot (this file + STATUS + PILOT-SELECTION).  
2. Staging seed `staging:seed:csi-tenant` so Nest/resolve/membership can be rehearsed for a CSI-shaped tenant on **staging**.  
3. tenant-web stub recognizes CSI pilot slug (JSON only — not full UI).  
4. Runbook for the **later** DNS flip when blockers clear.

You can **develop Impulsionando on the new stack / staging now**. CSI cutover is the **first prod door** when ready — not a requirement to start coding Impulsionando features on staging.

## Blockers before prod DNS (`csi.impulsionando.com.br` → `2.25.123.224`)

- [ ] Prod-env Nest API (public host TBD) → **prod** Supabase  
- [ ] Prod-env worker if journeys/AI matter for pilot scope  
- [ ] **CSI-capable web**: migrate `/csi` (+ Investito) to tenant-web/app-web **or** deploy prod-env SSR that serves `/csi`  
- [ ] Traefik `Host(csi.impulsionando.com.br)` + TLS  
- [ ] Staging CSI seed + allow/deny smokes green  
- [ ] Inventory: webhooks/n8n for CSI refreshed  
- [ ] Written go for observation window (≥24h) + rollback owner online  

## Staging rehearsal commands (safe)

```bash
npm run staging:seed:csi-tenant
# set PHASE7_PILOT_TENANT_ID from seed output into operator secrets (never git)
DRY_RUN=0 npm run phase7:pilot:verify
DRY_RUN=0 npm run phase7:staging:rehearse
```

## Prod flip commands (DO NOT RUN until blockers green)

1. Promote prod-shaped images to clean (or dedicated prod) Swarm.  
2. Add Traefik Host for `csi.impulsionando.com.br` → CSI web service.  
3. Dual-observe ([`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md)).  
4. Cloudflare: point **only** `csi` A/CNAME → clean.  
5. `PHASE7_ALLOW_PROD=1 PHASE7_PILOT_HOSTNAME=csi.impulsionando.com.br DRY_RUN=0 npm run phase7:pilot:verify`  
6. Watch window → 7C. Abort → [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md).

## Explicit exclusions

- Apex / www / app as this pilot  
- Using staging Supabase behind prod CSI hostname  
- Dokploy / wipe on legacy `187.77.232.52`  
- 7F retirement  
