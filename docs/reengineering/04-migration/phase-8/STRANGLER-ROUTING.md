# Phase 8 — strangler routing

Created: **2026-09-04**
Authority: ADR-008 · [`../../03-platform/DOKPLOY.md`](../../03-platform/DOKPLOY.md) · [`../phase-4/PHASE-4B-FRONTEND-BOUNDARIES.md`](../phase-4/PHASE-4B-FRONTEND-BOUNDARIES.md)

How the legacy authenticated monolith and the new `app-web` coexist without ever serving the same path from two implementations, and how a slice is rolled back without reverting code.

## 1. The failure this prevents

Two owners for one route is the classic way a strangler migration produces data corruption: two implementations of the same write, diverging validation, two audit trails, and no way to say which one a user hit. The mechanism below makes single ownership a **mechanical property**, checked in CI, rather than a discipline.

## 2. One canonical authenticated host

| Environment | Host | State |
| --- | --- | --- |
| Staging | `app.stg.impulsionando.com.br` | **Proposed** — needs the Cloudflare A record to `2.25.123.224` (grey/DNS-only), same pattern as the pending `stg.csi` record |
| Production | `app.impulsionando.com.br` | **Later** — Phase 7 authority, not Phase 8 |

Both the legacy authenticated area and `app-web` are served under the **same host**, split by path prefix. This is deliberate and it is the reason the split is by path and not by hostname:

- **Session continuity.** Supabase auth state is origin-scoped. Two hosts means two logins, or a token hand-off mechanism nobody wants to own. One host means a user crossing from a legacy screen to a migrated one stays signed in.
- **Cookie scope.** The `@supabase/ssr` cookie (F3) is host-scoped; one host makes it work for both sides during coexistence.
- **Rollback granularity.** Flipping one prefix back to legacy is a config change, not a DNS change.

ADR-008 leaves the canonical password-reset host **OPEN**. Phase 8 must close it before S1 ships, because password reset currently redirects to `https://impulsionando.com.br/reset-password` — an apex path that will not be owned by `app-web`.

## 3. The route ownership manifest

Single source of truth, committed to the repo:

```jsonc
// infra/routing/app-route-ownership.json
{
  "version": 1,
  "host": { "staging": "app.stg.impulsionando.com.br" },
  "default": "legacy",
  "prefixes": [
    { "prefix": "/healthz",  "owner": "app-web", "slice": "F1" },
    { "prefix": "/support",  "owner": "legacy",  "slice": "P2", "plannedOwner": "app-web" },
    { "prefix": "/crm",      "owner": "legacy",  "slice": "P4", "plannedOwner": "app-web" }
  ]
}
```

Three consumers, one file:

| Consumer | Uses it to |
| --- | --- |
| Traefik router config (generated) | Route `PathPrefix(...)` to `app-web` or to the legacy service |
| Legacy monolith (build-time import) | 308-redirect any prefix it does not own — defense in depth if Traefik and the manifest ever drift |
| `npm run phase8:routes:check` (CI) | Fail when a prefix has zero owners, two owners, or overlaps another prefix ambiguously |

**Rule:** a prefix has exactly one `owner`. `plannedOwner` is documentation, never routing.

## 4. Session continuity during coexistence

```text
Phase A (today)          legacy writes session to localStorage only
Phase B (F3 lands)       legacy writes localStorage AND the SSR cookie; app-web reads the cookie
Phase C (legacy retired) cookie only
```

Phase B is the coexistence window and it is the risky one, because it touches login for every user.

| Guard | Detail |
| --- | --- |
| Flag | Cookie writing is behind a flag, staging first |
| Rollback | Stop writing the cookie; `localStorage` remains authoritative; `app-web` prefixes flip back to `legacy` |
| Sign-out | Must clear both. A sign-out that clears one is a security defect, and it is tested as one |
| Refresh | Token refresh must not race between the two writers; one writer owns refresh at a time |
| Proof | A user signs in on a legacy path, navigates to a migrated path, and is still authenticated with the same session id — recorded in the S1 evidence file |

## 5. Per-slice cutover procedure

Repeated identically for every slice, which is the point:

| Step | Action | Reversible by |
| --- | --- | --- |
| 1 | Deploy `app-web` SHA carrying the new slice, prefix still `legacy` | nothing needed — inert |
| 2 | Run the slice's parity, allow/deny, idempotency checks against staging | — |
| 3 | Flip the prefix to `app-web` in the manifest; deploy the generated Traefik config and the legacy image that imports it | step 6 |
| 4 | Observation window: correlation-ID traces, error rate, audit rows | — |
| 5 | Delete the legacy route files and their `*.functions.ts` | a revert commit |
| 6 | **Rollback (if needed before step 5):** flip the prefix back to `legacy`, redeploy. No code revert, no data migration. | — |

Steps 3 and 5 are deliberately separate. The window between them is the cheap rollback window; once step 5 lands, rollback costs a revert.

## 6. What must not happen

| Anti-pattern | Why it is banned |
| --- | --- |
| Routing a prefix by user, tenant or cookie value | ADR-008: the proxy never selects a different implementation per tenant. Two behaviours for the same path is exactly the corruption risk this design exists to prevent. |
| Keeping the legacy route "just in case" after step 5 | It becomes a second writer nobody tests |
| A slice that migrates the read but leaves the write on legacy | Split-brain on the same entity; either migrate the aggregate or do not start |
| Hostname-per-slice | Breaks session continuity and multiplies certificates |
| Editing the Traefik config by hand on the host | Drift from the manifest; the manifest is the source of truth |

## 7. Interaction with Phase 7

Phase 7 moves **tenant public hostnames** onto the new stack. Phase 8 moves **authenticated product paths** onto `app-web`. They are orthogonal and can run at the same time:

| | Phase 7 | Phase 8 |
| --- | --- | --- |
| Unit of movement | hostname | path prefix |
| Target app | `tenant-web` (currently the legacy Nitro image for the CSI pilot) | `app-web` |
| Environment | staging → production | **staging only** |
| Rollback | DNS / Traefik host rule | manifest prefix flip |

The one coupling: a tenant whose public site has moved under Phase 7 still uses the legacy authenticated app until Phase 8 migrates the relevant prefixes. That is expected and must be visible in the tenant's cutover record ([`../../templates/TENANT-CUTOVER-TEMPLATE.md`](../../templates/TENANT-CUTOVER-TEMPLATE.md)).
