# Phase 4B — Garrido low-risk tenant pilot

Created: **2026-09-02**  
Status: **REPO-READY** — staging deploy + live smokes pending operator

## Pilot choice

**Garrido** (`garrido` / `garrido.impulsionando.com.br` → `/garrido`)

| Criterion | Garrido |
| --- | --- |
| Clinical/payment surface | None identified |
| Route count | ~21 public routes |
| Custom domain | Path + subdomain on staging |
| Chrismed/RioMed exclusion | Per `PHASE-4-TENANTS.md` |

## Staging seeds (operator)

```bash
npm run staging:seed:garrido-tenant
npm run staging:seed:garrido-config
npm run staging:seed:membership   # optional — for auth smokes
```

## Verification

```bash
npm run phase4:smoke:garrido-resolve
npm run phase4:smoke:tenant-web-health
npm run test:phase4b:contracts
```

## Rollback rehearsal (staging)

1. Note current Swarm image SHA for `reengineering-tenant-web` and `reengineering-api`.
2. Deploy pilot config seed.
3. Run smokes above.
4. `docker service update --rollback reengineering-tenant-web` (or prior SHA).
5. Re-run `phase4:smoke:tenant-resolve` — Chrismed/Garrido resolve unchanged.

## Exit evidence for 4B-7

- [ ] Garrido resolves on `api.stg` (`subdomain=garrido`)
- [ ] Typed config returns locale/branding via `GET /tenants/:id/config`
- [ ] `tenant-web` health live on clean host (optional strangler hostname)
- [ ] Rollback rehearsed with documented prior SHA

## Not in scope

- Prod DNS for Garrido
- Full TanStack route migration from monolith (strangler continues incrementally)
