# Phase 7 — rollback kit

Created: **2026-09-04** · Status: **Wave 0**  
Owner: Cauã · No secrets.

## When to use

Any failed observation window (7A staging or 7B prod pilot): restore previous edge target immediately.

## Known-good staging identities (as of Phase 7B CSI SSR)

| Surface | Identity |
| --- | --- |
| API image | `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| Worker image | `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| CSI core SSR image | `ghcr.io/raygsm/impulsionando-csi-core:f03ea76efda53c02e3957290780040b79a7caf1a-csi7b-prodjsx` |
| Runtime gitSha (CSI `/healthz`) | `f03ea76efda53c02e3957290780040b79a7caf1a` |
| Clean host | `2.25.123.224` |
| Staging API | `https://api.stg.impulsionando.com.br` |
| Staging CSI Host | `csi.stg.impulsionando.com.br` (Traefik; public DNS pending) |

Update this table when a newer SHA is promoted **before** a rehearsal or pilot.

## Staging CSI SSR revert

1. `docker service update --rollback reengineering-csi-core` **or** `docker service rm reengineering-csi-core` (removes Traefik Host).  
2. Confirm `*.stg` Nest/tenant-web still healthy.  
3. Log in clean-host `IMPLEMENTATION-LOG.md`.

## Staging revert (7A practice)

1. If Traefik Host / Swarm service env was changed for rehearsal: restore previous Host rule / env from Dokploy or `docker service update` notes (record the pre-change values **before** edit — no secrets in git).  
2. Confirm `GET /health` → `ok` + expected `gitSha`.  
3. Re-run `DRY_RUN=0 npm run phase7:staging:rehearse`.  
4. Log timestamp + result in clean-host `IMPLEMENTATION-LOG.md` if Swarm mutated.

## Prod revert (7B) — hostname only

1. Cloudflare / DNS: point **that one hostname** back to pre-flip target (legacy origin / prior CNAME).  
2. Do **not** change other tenants.  
3. Verify public `curl -I` / browser hits legacy again.  
4. Confirm clean stack still healthy for `*.stg` (unaffected).  
5. Scribe: abort reason, time, who flipped, who reverted.

## Who runs revert

| Step | Owner |
| --- | --- |
| Call abort | Cutover lead (Cauã) |
| DNS/edge revert | DNS/edge operator |
| Verify health | API watcher |
| Evidence | Incident scribe |

## Forbidden

- “Fix forward” by wiping legacy  
- Changing apex / all tenants during abort  
- Deleting volumes or revoking prod credentials (7F)  
