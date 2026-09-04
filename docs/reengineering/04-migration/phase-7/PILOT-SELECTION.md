# Phase 7 — pilot selection (paper)

Created: **2026-09-04** · Status: **Wave 0 — human picks before 7B**  
No prod tenant UUIDs or secrets in this file.

## Criteria (all required)

| # | Rule |
| --- | --- |
| 1 | **Single** public hostname (not apex, not catch-all `*`) |
| 2 | **Non-clinical** (exclude Chrismed, RioMed, Colors clinical paths, etc.) |
| 3 | **Non-payment-heavy** for first pilot (no MP/Paddle critical path) |
| 4 | Named **product owner** available during observation window |
| 5 | Named **technical owner** (default Cauã) for rollback |
| 6 | Staging analogue exists or can be rehearsed on `*.stg` |
| 7 | Inventory row filled in [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md) |

## Shortlist template (fill at Wave 2 auth)

| Candidate hostname | Why low-risk | Owner | Decision |
| --- | --- | --- | --- |
| _(TBD)_ | | | pending |
| _(TBD)_ | | | pending |

## Operator env names (values only in local secrets)

| Name | Meaning |
| --- | --- |
| `PHASE7_PILOT_HOSTNAME` | Public host being flipped |
| `PHASE7_PILOT_TENANT_ID` | Tenant UUID for allow smokes |
| `PHASE7_DENY_TENANT_ID` | Different tenant — deny path |
| `PHASE7_PILOT_BEARER` | Staging/prod-shaped JWT as authorized |

## Explicitly excluded from first pilot

- `chrismed.*`, `riomed.*`, clinical custom domains  
- Apex `impulsionando.com.br` / `www` / `app`  
- `n8n.impulsionando.com.br`  
- Any hostname without written authorization  

## Decision record (blank until human)

| Field | Value |
| --- | --- |
| Chosen hostname | |
| Authorized by | |
| Date | |
| Observation window | |
| Link to STATUS / chat | |
