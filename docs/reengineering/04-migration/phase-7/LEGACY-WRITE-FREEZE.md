# Phase 7 — legacy write freeze (7E runbook)

Created: **2026-09-04** · Status: **PAPER — Wave 3** (execution later)  
Authority: [`../PHASE-7-CUTOVER.md`](../PHASE-7-CUTOVER.md) · inventory [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md)  
No secrets. **Do not execute until 7B pilot window PASS + human auth for 7E.**

## Goal

After a hostname/flow is live on the clean stack and reconciled (7C), **stop writers for that flow only** on legacy (`187.77.232.52` / `srv1777313`) so dual-publish / double-send cannot continue.

## Definitions

| Term | Meaning |
| --- | --- |
| **Freeze** | Disable or divert publishers that still write or side-effect for the **moved** hostname/tenant/flow on legacy |
| **Read-only inventory** | SSH/`systemctl`/`docker ps`/n8n UI inspection **without** stopping services or wiping — OK anytime under inventory refresh |
| **Wipe / retirement** | Volume delete, Nginx teardown, credential revoke — **7F PARKED**; never part of 7E |
| **Scope** | One moved hostname (or explicitly listed flow set) — not apex, not all tenants, not n8n host wholesale |

## Preconditions (all required)

- [ ] 7A PASS (staging rehearsal evidenced)
- [ ] 7B pilot observation window PASS for **this** hostname
- [ ] 7C reconciliation rows PASS (or documented SKIP with lead sign-off)
- [ ] [`LEGACY-DEPENDENCY-INVENTORY.md`](./LEGACY-DEPENDENCY-INVENTORY.md) refreshed for this hostname (UNKNOWN boxes closed or accepted)
- [ ] Written human auth: “freeze writers for \<hostname\> only”
- [ ] Rollback path still valid ([`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md)) if freeze reveals a missed dependency

## Explicit non-goals

- **No wipe** (7F PARKED) — no `rm -rf`, volume prune, full Nginx retirement, mass credential revoke
- No Dokploy install / Swarm mutate on legacy
- No freeze of unrelated tenants/hostnames “while we’re here”
- No secrets in evidence docs

---

## Runbook — freeze writers for one moved flow

Record pre-state (service names, enabled timers, webhook URLs **without** tokens) before each change.

### 1. Confirm traffic authority is already new

1. Public DNS/edge for the moved hostname points at clean (not legacy).  
2. Dual-observe per [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md): new path shows expected `gitSha`.  
3. If edge still hits legacy → **stop**; fix cutover first; do not freeze.

### 2. Inventory-driven checklist (from LEGACY-DEPENDENCY-INVENTORY)

Walk each publisher class. Mark N/A only with evidence that the pilot flow never used it.

#### A. Core / SSR writers (`impulsionando-core.service` / `:3000`)

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| A1 | Identify how legacy still resolves the moved Host (Nginx vhost / app tenant map) | Document Host → upstream (no secrets) | |
| A2 | Prefer Host-level deny or tenant disable **for that slug only** over stopping the whole `impulsionando-core` unit | Other tenants unaffected | |
| A3 | If only shared process exists: block writes via app/tenant flag or Nginx return for that Host; do **not** `systemctl stop` core unless lead explicitly accepts blast radius | Freeze scoped | |

#### B. Webhook receivers on legacy

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| B1 | List provider callback URLs still aimed at legacy for the pilot tenant | Inventory row filled | |
| B2 | Repoint provider dashboards to clean ingress **or** disable legacy route for that path | No POSTs land on legacy for pilot | |
| B3 | Confirm clean webhook ledger/log accepts pilot events | Matches 7C webhook row | |

#### C. n8n (`n8n.impulsionando.com.br` → legacy)

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| C1 | Search workflows referencing pilot hostname / tenant slug / legacy webhook URLs | List workflow names/ids (no secrets) | |
| C2 | Disable or retarget **those** workflows only | No active n8n write to legacy for pilot | |
| C3 | Do **not** cut `n8n.` DNS as part of 7E for a single tenant | n8n host remains until separate gate | |

#### D. Side-effect workers (Pulsonitor / Colors / other Docker workers)

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| D1 | Confirm no queued jobs for pilot tenant on legacy workers | Empty / no new jobs after freeze T0 | |
| D2 | Pause or filter consumer for pilot scope only | Other tenants continue | |

#### E. Cron / contained GH workflows / timers

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| E1 | Cross-check Phase 0 WORKFLOW-CATALOG + host crontab/`systemd` timers touching pilot | Inventory updated | |
| E2 | Disable or skip **pilot-scoped** schedules only | No re-enable of contained workflows without recorded decision | |
| E3 | Do not “clean up” unrelated cron as freeze theater | Scope preserved | |

#### F. Front / apex containers

| Step | Action | Pass criteria | Done |
| --- | --- | --- | --- |
| F1 | If pilot is **not** apex: leave `impulsionando-final3-test` / front alone | Apex unchanged | |
| F2 | Apex freeze is **out of band** — separate 7D/7E auth | N/A for low-risk slug pilots | |

### 3. Verify freeze held

| Check | Stub (no secrets) | Pass |
| --- | --- | --- |
| Legacy no longer serves writes for Host | Operator notes / Nginx return / app flag observed | |
| Clean path still healthy | `curl -sS https://api.stg…/health` (staging) or prod API `/health` after 7B | |
| No double-send | Comms/webhook allowlist + ledger sample for pilot | |
| Other tenants | Spot-check one unmoved hostname still on legacy | |

### 4. Evidence

Append to `phase-7/` evidence (or STATUS): timestamp, hostname, which checklist rows applied, PASS/FAIL, operator. Log clean-host only if clean Swarm was touched (usually not for 7E). **No secrets.**

---

## Abort / undo freeze

If a hidden dependency appears:

1. Re-enable the specific writer/route/workflow you disabled (scoped undo).  
2. Do **not** wipe or “fix forward” into 7F.  
3. Optionally roll DNS back per [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) if user impact requires it.  
4. Scribe: what was missed; update inventory.

## Forbidden

- Treating read-only inventory as license to mutate legacy before 7E auth  
- Freezing all of core / all of n8n for one tenant without blast-radius sign-off  
- Any 7F retirement step under the name “freeze”  
- Mutating `187.77.232.52` from the clean-host Phase 2 track as prep  
