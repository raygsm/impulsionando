# Legacy prod front promote — `08e7178a`

Date: 2026-08-31 (operator Cauã, agent session). Host: `187.77.232.52` (legacy prod). **Not** clean host `2.25.123.224`.

## Why URLs stayed on the old build

1. GitHub **Production Front** run [33394482763](https://github.com/raygsm/impulsionando/actions/runs/33394482763) built SHA `08e7178a55a501b095a870f06428065d7db1f70a`, SCPed the tarball, and `docker build`ed `impulsionando-core:08e7178a…`.
2. Promote **failed** (`exit 40`): in-container `fetch /impulsionando-front-sha.txt` returns SPA HTML (null bytes), not the marker file. Workflow rolled Docker `impulsionando-core:latest` back to `80e20d11`.
3. That compose service has **no host port**. Public Nginx does **not** use it.
4. Live origin (stale vs Phase 0 map `:3490` / systemd `:3000`) is Nginx → `127.0.0.1:3488` → container `core-bfdc-canary` image `ghcr.io/raygsm/impulsionando-core:bfdc9dd8…` (parent of this commit). That is why domains kept serving `/assets/index-eFfTFF45.js`.

## What was changed (no secrets)

| Surface | Before | After |
| --- | --- | --- |
| Public canary `:3488` | `bfdc9dd8` (stopped, renamed `core-bfdc-canary-pre-08e7178a…`) | `core-bfdc-canary` = `impulsionando-core:08e7178a55a501b095a870f06428065d7db1f70a` · `127.0.0.1:3488->3000` |
| systemd `impulsionando-core` `:3000` (Grupo EVR leftover) | `current` → `recovery-ebcc52f0…` | `current` → `recovery-08e7178a…` |

Rollback image left stopped: `core-bfdc-canary-pre-08e7178a55a501b095a870f06428065d7db1f70a`.

## Public proof (2026-08-31)

- Apex / CSI / CHRISMED / WMP / Colors / RioMed HTML: `/assets/index-Bbnm2IVl.js` (not `index-eFfTFF45.js`).
- Apex footer identity: `v. 08e7178`.
- CHRISMED: forest hero + Oliver FAB. CSI: Investito FAB only (no Impulsionito).
- `/impulsionando-front-sha.txt` still **404/SPA** — TanStack catch-all. Marker exists **on disk** inside the image (`/app/.output/public/impulsionando-front-sha.txt` = full SHA).

## Apex cache wipe (fixed 2026-08-31)

Cause: `/etc/nginx/conf.d/impulsionando-static-assets.conf` `location /` sent both `Cache-Control: no-store…` and `Clear-Site-Data: "cache"` on **every** response, including hashed `/assets/*` (no dedicated `/assets/` location). That wiped the browser cache on each HTML visit and made Cloudflare `BYPASS` the JS. CSI (no those headers) was already cacheable (`cf-cache-status: HIT`).

Change (nginx `-t` + `reload` only; upstream `:3488` / SSL / tenant routing untouched):

- Backup: `impulsionando-static-assets.conf.bak-20260831-142055-pre-cache-fix`
- Removed `Clear-Site-Data "cache"` from page responses (2026-08-30 canary leftover).
- Added `location /assets/` → `Cache-Control: public, max-age=31536000, immutable`
- HTML `location /` → `Cache-Control: no-cache, must-revalidate` only

Before (apex HTML + JS): `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` + `Clear-Site-Data: "cache"`; JS also had a second `public, immutable` and `cf-cache-status: BYPASS`.

After: HTML `no-cache, must-revalidate` (no Clear-Site-Data); `/assets/index-Bbnm2IVl.js` and `/assets/styles-DwvD1Nef.css` single `public, max-age=31536000, immutable`, `cf-cache-status: HIT`. Apex still 200, still `index-Bbnm2IVl.js` (`08e7178a`).

Users who already loaded apex under the wipe headers should **hard-refresh once**; later visits can reuse hashed assets.

## Still open / follow-up (2026-08-31 auto-publisher)

Production Front now publishes **`core-bfdc-canary` on `127.0.0.1:3488`** (the Nginx origin), not the unmapped compose `impulsionando-core`. `src/server.ts` serves `/impulsionando-front-sha.txt` so the health check can pass. **Automatic deploy starts after this workflow + server change is on `main`.** Until then, push to main still runs the old promote path if the YAML on GitHub is unchanged.

- Apex Nginx still has a one-off `sub_filter` for the old hashed file `index-eFfTFF45.js` (harmless now; unused).
- `revela` stays on `:3017`; `crismedia` on `172.16.1.5:3000`.
