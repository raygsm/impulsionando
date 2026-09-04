# Phase 7B — CSI pilot (selected)

Selected: **2026-09-04**  
Hostname (prod): **`csi.impulsionando.com.br`**  
Staging rehearsal Host: **`stg.csi.impulsionando.com.br`** (`stg` first — operator rule; never `csi.stg…`)  
Internal path: **`/csi`**  
Status: **SELECTED — staging CSI HTML PASS + `stg.<tenant>` recognition PASS (image `…f889a87e…-csi7b`); prod-shaped Host-header PASS on clean host; prod DNS flip still BLOCKED**  
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
| What serves CSI HTML on **public** prod hostname | **Still legacy** via Cloudflare (A ≠ clean IP) — users unchanged |
| What clean host serves for CSI | **Two Swarm services:** staging `reengineering-csi-core` (`stg.csi…`) + prod-shaped `reengineering-csi-core-prod` (`csi.impulsionando.com.br` Host-header only) |
| Staging DB for real CSI users | **FORBIDDEN** |
| Prod Nest public hostname | **Does not exist yet** |

So: **CSI is the chosen door.** Staging + prod-shaped Host-header rehearse the stack; **public** prod cutover still waits for Cloudflare flip (+ remaining Nest/ops blockers).

## Staging CSI SSR — PASS @ 2026-09-04T16:01Z (host-recognition image)

| Item | Value |
| --- | --- |
| Service | `reengineering-csi-core` 1/1 on clean `2.25.123.224` |
| Image | `ghcr.io/raygsm/impulsionando-csi-core:f889a87e2b4b878ef4b87e6b49f457ead6894fc3-csi7b` (linux/amd64 local-load; includes `#146` `stg.<tenant>` fix) |
| Prior / rollback | `…64411dbebe72218f6aded32b5442513e12e8730f-csi7b` (pre-fix; showed “Domínio não reconhecido”) |
| Traefik Host | `stg.csi.impulsionando.com.br` (TLS labels set; **public DNS A record NOT created yet** — smoke via `Host:` / dokploy-network) |
| Supabase | Staging project baked at Vite build (`aamorcqznimmleafavai`) — **not** prod |
| Workers | OFF (`COLORS_AUTOMATION_ENABLED=false`, no Pulsonitor) |
| `/healthz` | **200** · `service=impulsionando-csi-core` · `gitSha=f889a87e2b4b878ef4b87e6b49f457ead6894fc3` |
| `/` + `/csi` | **200** · `text/html` · title **CSI Invest — Private Intelligence & Wealth Experience** |
| “Domínio não reconhecido” | **ABSENT** (grep count 0 on `/` and `/csi` with Host `stg.csi…`) |
| Access gate | Staging basic auth ON (same as other `*.stg` apps) |
| Build scripts | `scripts/build-csi-core-staging.sh` · `scripts/deploy-reengineering-csi-core-clean-host.sh` · `infra/compose/Dockerfile.csi-core` |
| Build gotcha | Must force `NODE_ENV=production` — sourcing full `.env.staging` poisons JSX (`jsxDEV is not a function`) |
| Transfer | Prefer `docker save\|gzip` → scp → remote `docker load` (nested gzip\|ssh pipe previously hung) |

### Smoke (no public DNS required)

```bash
# with staging basic auth from operator vault
curl -sS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
  -H 'Host: stg.csi.impulsionando.com.br' http://2.25.123.224/healthz
curl -sS -u "$STAGING_BASIC_AUTH_USER:$STAGING_BASIC_AUTH_PASS" \
  -H 'Host: stg.csi.impulsionando.com.br' -H 'Accept: text/html' \
  http://2.25.123.224/csi -o /tmp/csi.html -w '%{http_code} %{content_type}\n'
```

### Human DNS step (staging public URL) — NOT DONE

Cloudflare zone `impulsionando.com.br` (no API token in operator vault this session):

1. Create **A** name `stg.csi` → content `2.25.123.224` (full name `stg.csi.impulsionando.com.br`)
2. Proxy: **DNS only** (grey cloud — not proxied) so Let’s Encrypt HTTP-01 works
3. Wait for Traefik cert · then `https://stg.csi.impulsionando.com.br/csi`
4. Do **not** create `csi.stg` (wrong order; never existed)

## Prod-shaped Host-header bake — PASS @ 2026-09-04T11:28Z (NO Cloudflare flip)

| Item | Value |
| --- | --- |
| Service | `reengineering-csi-core-prod` 1/1 on clean `2.25.123.224` (**separate** from staging) |
| Image | `ghcr.io/raygsm/impulsionando-csi-core:a5c730f2d0e3e803966eda03cc5c91f05f923524-csi7bprod` (linux/amd64 local-load) |
| Traefik Host | `csi.impulsionando.com.br` · router `reeng-csi-core-prod` · access gate OFF |
| Supabase | **Prod** project ref `arygtqrdpcdkwnuwsgmm` baked at Vite build (staging ref absent in image) |
| Workers | OFF (`COLORS_AUTOMATION_ENABLED=false`, `PULSONITOR_ENABLED=false`) |
| `/healthz` (Host header → clean IP) | **200** · `gitSha=a5c730f2d0e3e803966eda03cc5c91f05f923524` |
| `/csi` (Host header → clean IP) | **200** · `text/html` · CSI Invest / Private Intelligence |
| Public DNS | **Unchanged** — `csi.impulsionando.com.br` still Cloudflare-proxied (not clean IP); asset hashes differ from Host-header bake |
| Scripts | `scripts/build-csi-core-prod.sh` · deploy with `ALLOW_PROD_CSI_HOST=1` |

### Smoke (Host header only — not public DNS proof)

```bash
curl -sS -H 'Host: csi.impulsionando.com.br' http://2.25.123.224/healthz
curl -sS -D- -o /tmp/csi-prod-host.html -H 'Host: csi.impulsionando.com.br' \
  -H 'Accept: text/html' http://2.25.123.224/csi | head
```

## What we implement NOW (unlock Impulsionando development)

1. Record CSI as official 7B pilot (this file + STATUS + PILOT-SELECTION).  
2. Staging seed `staging:seed:csi-tenant` so Nest/resolve/membership can be rehearsed for a CSI-shaped tenant on **staging**.  
3. tenant-web stub recognizes CSI pilot slug (JSON only — not full UI).  
4. **CSI-capable SSR on clean host** under `stg.csi` (done — see PASS table).  
5. Runbook for the **later** DNS flip when blockers clear.

You can **develop Impulsionando on the new stack / staging now**. CSI cutover is the **first prod door** when ready — not a requirement to start coding Impulsionando features on staging.

## Blockers before prod DNS (`csi.impulsionando.com.br` → `2.25.123.224`)

- [ ] Prod-env Nest API (public host TBD) → **prod** Supabase  
- [ ] Prod-env worker if journeys/AI matter for pilot scope  
- [x] **CSI-capable web** on clean stack (staging Host proven)  
- [x] Traefik `Host(csi.impulsionando.com.br)` + **prod-shaped** image on clean host (**Host-header PASS**; public CF flip still TODO)  
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

## Browser host recognition (`stg.<tenant>`) — PASS @ 2026-09-04T16:01Z

Public browsers on `stg.csi.impulsionando.com.br` previously hit Impulsionando `TenantHostFallback` (“Domínio não reconhecido”) even when Traefik + `/csi` SSR were healthy.

| Piece | Behavior |
| --- | --- |
| Bug | `getTenantSubdomain` / `useTenant` used the **first** label → `stg`, not `csi` |
| Landing-only patch | `CUSTOM_HOST_LANDING` / `CSI_STAGING_HOST` already mapped exact host → `/csi` for redirects, but did **not** satisfy `useTenant` |
| Fix | Pattern `stg.<tenant>.impulsionando.com.br` → slug `<tenant>`; bare `stg.impulsionando.com.br` stays platform (not a tenant) |
| Code | `src/lib/subdomain.ts` · `packages/tenant-host/src/index.ts` · tests in `src/lib/subdomain.test.ts` · merged `#146` @ `4f89a2ef` |
| Live | **PASS** — Swarm image `…f889a87e…-csi7b` · `/healthz` gitSha `f889a87e…` · Host `stg.csi…` `/`+`/csi` title CSI Invest · grep “Domínio não reconhecido” **0** · `reengineering-csi-core-prod` **not** redeployed |

## Explicit exclusions

- Apex / www / app as this pilot  
- Using staging Supabase behind prod CSI hostname  
- Dokploy / wipe on legacy `187.77.232.52`  
- 7F retirement  
- Treating bare `stg.impulsionando.com.br` as a customer tenant  
