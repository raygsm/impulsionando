# Staff / observer rule (Q2) — enumerate before WP-S1-min

Created: **2026-09-04T22:20Z**
Evidence level: **STATIC** (repo). Live precedence on staging is **UNKNOWN** until O1/O2.
Blocks: WP-S1-min, Support `isStaff` unification.
Does **not** close G1.

---

## 1. Three implementations today

### A — `src/lib/auth.ts` `fetchCurrentUser`

```text
metadataSuperAdmin = app_metadata.is_super_admin === true
                  OR app_metadata.platform_role === "super_admin"
metadataStaff      = metadataSuperAdmin OR app_metadata.is_impulsionando_staff === true
isMasterObserver   = RPC is_impulsionando_master_observer(_user) === true
                     (never promoted to staff; no write inheritance)
memberships        = user_roles ⋈ companies
                     (comment: user_profiles does not exist in production)
isSuperAdmin       = metadataSuperAdmin
isImpulsionandoStaff = metadataStaff
                    OR membership where companies.is_master AND role ∈ {admin, gestor}
```

**Does not call** `is_impulsionando_staff`.

### B — `apps/api/src/support/support.service.ts` `isStaff`

```text
isStaff = RPC is_impulsionando_staff(_user) === true  (RPC error → false)
```

No metadata. No master-company heuristic. Gates `PATCH …/status` and widens list/get.

### C — `TenantsService.loadMemberships`

`user_roles` only. No staff concept.

---

## 2. If FPS copies the wrong one

| Copy | Failure |
| --- | --- |
| Only A | Master-company tenant admin looks staff in session; Support PATCH may 403 if RPC is false |
| Only B | Metadata-only operators missing from session staff |
| Unspecified union | Non-reproducible 403s |

Observer must never be collapsed into staff. If both observer and staff sources are true, **record both flags**; writes still require staff.

---

## 3. Proposed Nest function (confirm with O2)

`resolveStaffFlags(userId, appMetadata, memberships) → StaffFlags`

| Flag | True when |
| --- | --- |
| `isSuperAdmin` | metadata super-admin / `platform_role === "super_admin"` |
| `isMasterObserver` | RPC observer true |
| `isImpulsionandoStaff` | super-admin OR metadata staff OR RPC staff OR (master-company + `admin`/`gestor`) |

OR-union of A and B. Do **not** widen to `operador` on master or `admin` on any tenant.

Log `{ userId, sources, flags }` — user id only, no email if avoidable.

---

## 4. Not decided here

Fate of `profiles` / `profile_permissions` · observer as capability vs flag · deleting the master-company heuristic (G1/G2).

## 5. Probe log (fill at implement time)

| Probe | Identity (role only) | Result |
| --- | --- | --- |
| O2a | platform operator | UNKNOWN |
| O2b | tenant admin, non-master | UNKNOWN |
| O2c | tenant admin, master company | UNKNOWN |
| O2d | observer-only | UNKNOWN |
| O1 | `user_profiles` on staging | UNKNOWN |
