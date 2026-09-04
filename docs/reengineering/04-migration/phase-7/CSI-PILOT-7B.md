# Phase 7B — CSI pilot (selected)

Selected: **2026-09-04**  
Hostname (prod): **`csi.impulsionando.com.br`**  
Staging rehearsal Host: **`csi.stg.impulsionando.com.br`**  
Internal path: **`/csi`**  
Status: **SELECTED — staging CSI HTML PASS on clean host; prod DNS flip still BLOCKED**  
7F: **PARKED**

## Why CSI

- Declared client in `infra/subdomains/clients.json`
- Non-clinical (unlike Chrismed / RioMed)
- Smaller blast radius than apex `impulsionando.com.br`
- Operator priority: first real tenant for reengineering cutover

## Brutal truth (read this)

| Claim | Reality today |
| --- | --- |
| “Flip CSI DNS to clean host now” | **NO** — would break CSI users (no prod env / no CF token in operator vault) |
| What serves CSI HTML on **prod** hostname | **Legacy only** — `impulsionando-core` on `187.77.232.52` |
| What clean host serves for CSI | **Staging SSR** — Swarm `reengineering-csi-core` · Traefik Host `csi.stg.impulsionando.com.br` · Nitro/TanStack from monorepo `/csi` |
| Staging DB for real CSI users | **FORBIDDEN** |
| Prod Nest public hostname | **Does not exist yet** |

So: **CSI is the chosen door.** Staging rehearsal proves the stack; prod cutover waits for prod env + DNS.

## Staging CSI SSR — PASS @ 2026-09-04T11:16Z

| Item | Value |
| --- | --- |
| Service | `reengineering-csi-core` 1/1 on clean `2.25.123.224` |
| Image | `ghcr.io/raygsm/impulsionando-csi-core:5a9fd4c50cb04afcdccef6804480062aadeb17a8-csi7b` (linux/amd64 local-load) |
| Traefik Host | `csi.stg.impulsionando.com.br` (TLS labels set; **public DNS A record NOT created yet** — smoke via `Host:` header) |
| Supabase | Staging project baked at Vite build (`aamorcqznimmleafavai`) — **not** prod |
| Workers | OFF (`COLORS_AUTOMATION_ENABLED=false`, no Pulsonitor) |
| `/healthz` | **200** · `service=impulsionando-csi-core` · `gitSha=5a9fd4c50cb04afcdccef6804480062aadeb17a8` |
| `/csi` | **200** · `text/html` · title contains CSI Invest / Private Intelligence |
| Access gate | Staging basic auth ON (same as other `*.stg` apps) |
| Build scripts | `scripts/build-csi-core-staging.sh` · `scripts/deploy-reengineering-csi-core-clean-host.sh` · `infra/compose/Dockerfile.csi-core` |
| Build gotcha | Must force `NODE_ENV=production` — sourcing full `.env.staging` poisons JSX (`jsxDEV is not a function`) |

### Smoke (no public DNS required)

```bash
# with staging basic auth from operator vault
curl -sS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
  -H 'Host: csi.stg.impulsionando.com.br' http://2.25.123.224/healthz
curl -sS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
  -H 'Host: csi.stg.impulsionando.com.br' -H 'Accept: text/html' \
  http://2.25.123.224/csi -o /tmp/csi.html -w '%{http_code} %{content_type}\n'
```

### Human DNS step (staging public URL) — NOT DONE

Cloudflare zone `impulsionando.com.br` (no API token in operator vault this session):

1. Create **A** `csi.stg` → `2.25.123.224`
2. Proxy: **DNS only** (grey) so Let’s Encrypt HTTP-01 works
3. Wait for Traefik cert · then `https://csi.stg.impulsionando.com.br/csi`

## What we implement NOW (unlock Impulsionando development)

1. Record CSI as official 7B pilot (this file + STATUS + PILOT-SELECTION).  
2. Staging seed `staging:seed:csi-tenant` so Nest/resolve/membership can be rehearsed for a CSI-shaped tenant on **staging**.  
3. tenant-web stub recognizes CSI pilot slug (JSON only — not full UI).  
4. **CSI-capable SSR on clean host** under `csi.stg` (done — see PASS table).  
5. Runbook for the **later** DNS flip when blockers clear.

You can **develop Impulsionando on the new stack / staging now**. CSI cutover is the **first prod door** when ready — not a requirement to start coding Impulsionando features on staging.

## Blockers before prod DNS (`csi.impulsionando.com.br` → `2.25.123.224`)

- [ ] Prod-env Nest API (public host TBD) → **prod** Supabase  
- [ ] Prod-env worker if journeys/AI matter for pilot scope  
- [x] **CSI-capable web** on clean stack (staging Host proven; prod-env image still TODO)  
- [ ] Traefik `Host(csi.impulsionando.com.br)` + TLS with **prod** image/env  
- [ ] Staging CSI seed + allow/deny smokes green  
- [ ] Inventory: webhooks/n8n for CSI refreshed  
- [ ] Written go for observation window (≥24h) + rollback owner online  
- [ ] Cloudflare API token / human flip for **only** `csi` A/CNAME  

## Staging rehearsal commands (safe)

```bash
npm run staging:seed:csi-tenant
# set PHASE7_PILOT_TENANT_ID from seed output into operator secrets (never git)
DRY_RUN=0 npm run phase7:pilot:verify
DRY_RUN=0 npm run phase7:staging:rehearse
./scripts/build-csi-core-staging.sh
IMAGE_TAG=<sha>-csi7b SKIP_PULL=1 ./scripts/deploy-reengineering-csi-core-clean-host.sh
```

## Prod flip commands (DO NOT RUN until blockers green)

1. Promote **prod-env** CSI core image (never staging Supabase behind prod Host).  
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
