# Reengineering update canvas — speed plan

Created: **2026-09-03T23:20Z** · Wave 1 landed: **2026-09-03T23:40Z** · Wave 2 closed: **2026-09-04T00:03Z**  
Branch: `cursor/phase6-update-canvas-4675`  
Program SoT: [`../STATUS.md`](../STATUS.md)  
Authority: accepted ADRs → target architecture → STATUS → evidence → product-intake  

> **Purpose:** single operational canvas for finishing the program as fast as possible **without** skipping quality gates.  
> Product-intake is input only — it does **not** authorize Phase 7, prod DNS, clinical/payments autonomy, or closing a phase on scaffolding.

---

## 1. Snapshot (truth)

| Item | Value |
| --- | --- |
| Overall | Phases **0–6 CLOSED (staging)** · Phase **7 NOT STARTED** |
| Live API | `https://api.stg.impulsionando.com.br` · image `…-phase6exit` · SHA `c4c9530a…` |
| Wave 1 (repo) | **LANDED** — allowlist/budgets/agents route/pilot consume/effects membership/worker sink |
| Wave 2 (staging) | **CLOSED** — promote + `phase6:staging:verify` **2/2 PASS** |
| Contracts | **47/47** PASS (`test:phase6:contracts`) |
| Phase 6 CLOSED? | **Yes (staging)** @ 2026-09-04T00:03Z |

### Residuals (non-blocking)

| Item | State |
| --- | --- |
| Approvals store | In-memory MVP OK for Phase 6 close |
| Effect worker | Sink only (ledger/log, no domain writes) |
| GHCR push of `…-phase6exit` | Optional |
| Durable `reengineering_ai_approvals` | Optional follow-up |

---

## 2. Phase scoreboard

| Phase | Gate | State | Residual (non-blocking unless noted) |
| --- | --- | --- | --- |
| 0 Discovery | CLOSED | ✅ | Restore RPO/RTO numeric; residual workflow debt |
| 1 Foundation | CLOSED | ✅ | Auth allow/deny CHARACTERIZED E2E still open historically |
| 2 Platform | CLOSED | ✅ | External alerts deferred |
| 3 Nest API | CLOSED | ✅ | Support pilot live |
| 4A Resolve | CLOSED | ✅ | — |
| 4B Config/FE | CLOSED (staging) | ✅ | Web apps = stubs; richer entitlements seed optional |
| 5A–5G Workers | CLOSED (staging) | ✅ | Optional GHCR push of local-load tags; sink ≠ real providers |
| **6A–6F AI** | **CLOSED (staging)** | ✅ | See §3 — Wave 2 evidence |
| V1–V7 verticals | Not started as waves | ⬜ | After Phase 6 platform spine |
| **7 Cutover** | Blocked | ⬜ | Requires explicit authorization (Phase 6 CLOSED alone ≠ cutover) |

---

## 3. Phase 6 task canvas — CLOSED

Exit gate (all met @ 2026-09-04T00:03Z):

1. Security never prompt-only ✅  
2. One real-data tenant-isolated agent proven (allow **and** deny) ✅  
3. Sensitive actions blocked or approval-gated (API + worker sink) ✅  
4. Kill switch + cost/budget controls work ✅  
5. Staging live smoke for 6C–6F (not DRY_RUN alone) ✅  

### Evidence

| Item | Value |
| --- | --- |
| Promoted SHA | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Images | `…-api:…-phase6exit` · `…-worker:…-phase6exit` (local-load amd64) |
| Verify | `npm run phase6:staging:verify` · **PASS=2 FAIL=0** |
| Allow | capabilities/policy/tools/metrics/chat/agents **200** · effects create **201** |
| Deny | agents **403** · chat cross-tenant refuse |

### Packages

| Wave | State |
| --- | --- |
| 6A Gateway + policy | ✅ CLOSED |
| 6B Tool registry | ✅ CLOSED |
| 6C Real-data READ pilot | ✅ CLOSED |
| 6D Tenant agent | ✅ CLOSED |
| 6E Gated effects | ✅ CLOSED (worker = sink) |
| 6F Evals + ops | ✅ CLOSED |

Wave 1 lanes A–D and Wave 2 promote+prove are complete. Detail: [`phase-6/README.md`](./phase-6/README.md) · [`phase-6/WAVE-2-CLOSE.md`](./phase-6/WAVE-2-CLOSE.md).

---

## 4. Next speed tracks (Wave 3 — after Phase 6 CLOSED)

Do **not** start Phase 7 cutover here. Parallel vertical foundations:

| Track | Focus | Gate |
| --- | --- | --- |
| **V1-core** | Universal CRM contracts from intake (objects/pipelines) as Nest modules strangler | contracts + staging only |
| **Web-strangler** | Upgrade `tenant-web` from stub → TanStack Start shell for one hostname | 4B already closed; additive |
| **Comm-real** | Replace sink with allowlisted staging providers | no real blasts |
| **Payments-track** | Separate gate — intake only until authorized | blocked |
| **7A paper** | Cutover playbook draft (docs only) | no DNS |

Intake priority after AI close (from product-intake, not execution license):

1. Universal CRM master  
2. Partner commissions engine (ledger)  
3. Enjoy/Lopito vertical (after CRM spine)  
4. Canonical URL enforcement in shared routing  
5. Per-tenant agent identity (display) on top of Phase 6 gateway  

---

## 5. Quality bar (non-negotiable)

| Check | Required |
| --- | --- |
| Contracts | green before promote |
| Smoke | live, not only `DRY_RUN=1` |
| Tenant isolation | allow **and** deny |
| Release identity | full SHA on image; no `latest` |
| Evidence | STATUS + phase-6 README + clean-host log |
| Secrets | never in git/chat/docs |
| Phase close | no scaffold-only / HTTP-200-only closes |
| Hosts | clean only; legacy deny |

---

## 6. Immediate next actions (ordered)

| # | Action | Owner type | Blocks |
| --- | --- | --- | --- |
| 1 | Optional GHCR push of `…-phase6exit` | human | non-blocking |
| 2 | Optional durable approvals migration | agents | non-blocking |
| 3 | Open V1 CRM contracts track | agents | after explicit intake gate |
| 4 | Phase 7 | humans only | explicit auth — **not started** |

---

## 7. Forbidden (speed does not override)

- Prod DNS / apex / tenant cutover  
- Dokploy or wipe on `187.77.232.52`  
- `db push` / reset prod  
- Mechanical move of all legacy routes  
- Autonomous AUTO_SAFE / clinical / investment / payment AI  
- Treating product-intake as implement-now license  
- Treating Phase 6 close as Phase 7 authorization  

---

## 8. Doc sync checklist (this canvas revision)

| Doc | Action |
| --- | --- |
| `STATUS.md` | Phase 6 **CLOSED (staging)** — done |
| `ACCELERATION-BOARD.md` | P6 CLOSED; Wave 2 PASS |
| `phase-6/README.md` | CLOSED + Wave 2 evidence — done |
| `clean-host/HOST.md` + `IMPLEMENTATION-LOG.md` | …-phase6exit — done |

---

## 9. Definition of “fast done” for Phase 6

**Met:** Wave 1 code + Wave 2 staging proof satisfying §3 exit gate, evidenced in STATUS.

Anything beyond that is Wave 3+ product strangler under separate intakes and gates.
