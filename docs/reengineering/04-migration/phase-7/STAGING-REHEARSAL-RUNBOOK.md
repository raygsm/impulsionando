# Phase 7 — staging rehearsal runbook (7A)

Created: **2026-09-04** · Status: **PAPER — Wave 3** (execute only after human opens Wave 1)  
Hosts in scope: clean **`2.25.123.224`** + public `*.stg` only.  
**Forbidden target:** `187.77.232.52` (legacy prod) — no SSH, no Dokploy, no Traefik, no wipe.  
No secrets in this doc. Operator secrets stay in `~/.config/impulsionando/staging-operator-secrets.env` (never git).

Companion evidence: [`EVIDENCE-7A.md`](./EVIDENCE-7A.md) · rollback: [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) · gates: [`GATES.md`](./GATES.md)

## Preconditions

- [ ] Human recorded: open Phase 7 **IN PROGRESS (7A staging only)** in [`STATUS.md`](../../STATUS.md)
- [ ] Local checkout on `reengineering/program` (or authorized SHA)
- [ ] Operator secrets file present locally
- [ ] You can reach `api.stg` / `tenant.stg` from the workstation
- [ ] If Swarm/Traefik will change: plan to append [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md)

## Ordered commands

Copy results into [`EVIDENCE-7A.md`](./EVIDENCE-7A.md). Do not mark gate PASS until the table is filled.

### 0 — Refuse legacy (sanity)

```bash
# Must NOT be used in this runbook. If your muscle memory starts typing this IP, stop.
# 187.77.232.52  → out of scope for 7A
echo "7A target host: 2.25.123.224 (clean) only"
```

### 1 — Baseline health (staging)

```bash
curl -sS https://api.stg.impulsionando.com.br/health
curl -sS -o /dev/null -w "%{http_code}\n" https://api.stg.impulsionando.com.br/health

# tenant-web may sit behind staging basic-auth; use operator env if required (do not paste creds)
curl -sS https://tenant.stg.impulsionando.com.br/health
```

Record `gitSha` from API JSON. Optionally assert:

```bash
export PHASE7_EXPECTED_GIT_SHA="<full-sha-from-STATUS-or-HOST>"
```

### 2 — Dry rehearsal matrix

From repo root:

```bash
npm run phase7:staging:rehearse
```

Default is `DRY_RUN=1` — safe print / dry paths. Confirm script refuses non-staging bases.

### 3 — Live staging rehearsal

```bash
DRY_RUN=0 npm run phase7:staging:rehearse
```

Expect nested Phase 5 / Phase 6 verifies unless `PHASE7_SKIP_PHASE5=1` / `PHASE7_SKIP_PHASE6=1` (document SKIP in evidence).

Standalone equivalents (optional, same staging base):

```bash
npm run phase5:staging:verify
npm run phase6:staging:verify
```

### 4 — Optional: practice Traefik / Dokploy swap (**staging Host only**)

**Only** on clean host `2.25.123.224`. Record pre-change labels/Host rules in operator notes **before** edit.

Example pattern (adjust service/labels to match current Swarm; do **not** invent prod Hosts):

```bash
ssh root@2.25.123.224 'docker service ls'
ssh root@2.25.123.224 'docker service inspect reengineering-api --pretty'   # note Traefik Host
# Dokploy UI alternative: https://dokploy.stg.impulsionando.com.br — edit staging service only
```

Practice swap options (pick one; keep blast radius to `*.stg`):

1. Temporarily point a **staging** Host label at placeholder vs API (or reverse), **or**
2. `docker service update` env on `reengineering-api` (e.g. harmless marker) then restore.

After change:

```bash
curl -sS https://api.stg.impulsionando.com.br/health
DRY_RUN=0 npm run phase7:staging:rehearse
```

### 5 — Rollback practice (required for 7A)

Restore the exact Traefik Host / Swarm env noted in step 4 (or Dokploy prior revision).

```bash
# Example restore shape — replace with recorded pre-change values (no secrets in chat/git)
ssh root@2.25.123.224 'docker service update … reengineering-api'   # restore prior image/env/labels
curl -sS https://api.stg.impulsionando.com.br/health
DRY_RUN=0 npm run phase7:staging:rehearse
```

Confirm `gitSha` matches known-good in [`ROLLBACK-KIT.md`](./ROLLBACK-KIT.md) (or intentional new promote documented in clean-host log).

### 6 — Evidence close-out

1. Fill [`EVIDENCE-7A.md`](./EVIDENCE-7A.md) result table.  
2. If Swarm/Traefik mutated: append clean-host `IMPLEMENTATION-LOG.md` (+ `HOST.md` if identity changed).  
3. Update [`STATUS.md`](../../STATUS.md) only when parent declares **7A PASS** — this runbook does not auto-pass.  
4. Do **not** open 7B / prod DNS from this file alone.

## Out of scope

| Action | Why |
| --- | --- |
| SSH / mutate `187.77.232.52` | Legacy prod; 7A is staging only |
| Prod Cloudflare flips | Wave 2 (7B) after 7A PASS + auth |
| 7E write freeze / 7F wipe | Later gates; freeze runbook is paper until authorized |
| Committing operator `.env` / secrets | Forbidden |

## Abort

Any FAIL on health, wrong `gitSha`, or allow/deny in live rehearse → restore staging edge immediately (step 5), scribe evidence, do not proceed to 7B.
