# Phase 7 — release identity (dual-observe)

Created: **2026-09-04** · Status: **Wave 0**

## Why

During cutover you must prove traffic hit the **intended** runtime. HTTP 200 alone is not release identity.

## Staging CSI core SSR (7B rehearsal)

`GET` Traefik Host `csi.stg.impulsionando.com.br` `/healthz` returns JSON:

- `status: ok`
- `service: impulsionando-csi-core`
- **`gitSha`** — must match Swarm image / `GIT_SHA` build arg

`GET /csi` must return **HTML 200** (not tenant-web JSON stub). HTTP 200 alone on `/healthz` is not CSI UI proof.

Public DNS for `csi.stg` may lag Traefik Host — Host-header smoke against `2.25.123.224` is valid staging evidence.

## Dual-observe during 7B pilot

| Check | Old (legacy) | New (clean) |
| --- | --- | --- |
| Edge target | DNS/CF → `187.77.232.52` (or prior) | DNS/CF → clean / Traefik |
| Version surface | Phase 0: often weak (`commit: unknown` on some fronts) | Nest `/health` `gitSha` |
| Who serves hostname | Nginx → core/Docker | Dokploy Swarm services |

### Pilot checklist

1. Before flip: record DNS answer + legacy version marker if any.  
2. After flip: record DNS answer + clean `/health` gitSha (and API Host if separate).  
3. During window: sample both identities; abort if hostname still hits unexpected origin.  

## Env names (no values)

| Name | Use |
| --- | --- |
| `GIT_SHA` | Swarm API service — must match image build |
| `PHASE3_API_BASE` | Smoke/rehearse base URL (staging) |
| `PHASE7_EXPECTED_GIT_SHA` | Optional rehearse assert (full SHA) |

## Gaps / UNKNOWN

- Prod Nest API public hostname may not exist until 7B/7D design — fill in playbook before flip.  
- Legacy public SHA endpoints often 404 — do not treat missing legacy SHA as PASS.  
