# Phase 7 — reconciliation checklist (7C)

Created: **2026-09-04** · Run **after** 7B pilot is stable  
Author Wave 0; command stubs Wave 3 PAPER. Execute Wave 3 after human auth.  
No secrets.

## Scope

Prove the pilot tenant/flow on the new stack matches authority expectations before expanding (7D) or freezing legacy writes (7E).

## Command stubs (no secrets)

Load operator secrets locally (path only — never commit values):

```bash
# Optional: export PHASE3_API_BASE for staging smokes
export PHASE3_API_BASE="https://api.stg.impulsionando.com.br"
```

### Health / identity

```bash
# Staging (always safe for regression after prod pilot if stg untouched)
curl -sS https://api.stg.impulsionando.com.br/health
curl -sS -o /dev/null -w "%{http_code}\n" https://api.stg.impulsionando.com.br/health

# Pilot public hostname — replace HOST after 7B auth (do not use legacy IP as target of truth)
curl -sS -I "https://<pilot-hostname>/"
# If Nest API serves pilot traffic on a dedicated Host:
curl -sS "https://<pilot-api-host>/health"
```

Record `gitSha` / edge target per [`RELEASE-IDENTITY.md`](./RELEASE-IDENTITY.md).

### Nested staging regress (clean stack still healthy)

```bash
npm run phase5:staging:verify
npm run phase6:staging:verify
# Or combined rehearsal harness:
npm run phase7:staging:rehearse
DRY_RUN=0 npm run phase7:staging:rehearse
```

### Pilot verify (post-7B)

```bash
# Intended entry — implement / wire when Wave 2 tooling lands; until then mark SKIP + manual rows below
npm run phase7:pilot:verify
```

If the script is missing from `package.json`, do **not** invent a pass: run the checklist rows manually and note `phase7:pilot:verify = SKIP (not landed)`.

Env names only (values local): `PHASE3_API_BASE`, `PHASE7_EXPECTED_GIT_SHA`, pilot tenant/host identifiers used by the verify script when present.

## Checklist

| Area | Check | Command stub / method | Pass criteria | Result |
| --- | --- | --- | --- | --- |
| Auth | Login / session for pilot users | Manual + `phase7:pilot:verify` when landed | Can access; no cross-tenant | |
| Tenant resolve | Host → tenant id | Manual Host probe / verify script | Matches expected; spoof deny | |
| Membership | Allow + deny | Verify script or API allow+deny probes | Allow 200-class; deny 403 | |
| Data read | Critical read paths for pilot | Documented sample vs pre-flip | Parity vs pre-flip sample | |
| Jobs | Outbox / queue for pilot | Staging: `phase5:staging:verify`; prod: pilot job sample | No stuck poison for pilot scope | |
| Webhooks | Ingress for pilot providers | Staging webhook checks / pilot ingress | Accepted + ledger/log as designed | |
| Comms | Sink/allowlist only | Comm smoke / allowlist review | No real blast outside allowlist | |
| AI (if enabled) | Capabilities + tenant isolation | `phase6:staging:verify` + pilot allow/deny | Allow + deny | |
| Side effects | Legacy vs new | Inventory + freeze prep | No double-send / double-charge | |
| Identity | gitSha / edge | `curl …/health` + DNS/edge notes | Dual-observe matches playbook | |
| Staging regress | Clean `*.stg` still green | `npm run phase5:staging:verify` · `phase6:staging:verify` | PASS | |
| Pilot harness | Aggregated pilot matrix | `npm run phase7:pilot:verify` | PASS or documented SKIP | |

## Evidence

Record timestamp, hostname (not secrets), PASS/FAIL per row in STATUS or `phase-7/EVIDENCE-7C.md` when executed.

## Non-goals

- Full CRM product parity  
- All tenants  
- 7F wipe  
- Marking rows PASS from this paper alone  
