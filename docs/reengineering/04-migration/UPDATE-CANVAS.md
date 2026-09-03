# Reengineering update canvas — speed plan

Created: **2026-09-03T23:20Z**  
Branch: `reengineering/program` (planning on `cursor/phase6-update-canvas-4675`)  
Program SoT: [`../STATUS.md`](../STATUS.md)  
Authority: accepted ADRs → target architecture → STATUS → evidence → product-intake  

> **Purpose:** single operational canvas for finishing the program as fast as possible **without** skipping quality gates.  
> Product-intake is input only — it does **not** authorize Phase 7, prod DNS, clinical/payments autonomy, or closing a phase on scaffolding.

---

## 1. Snapshot (truth)

| Item | Value |
| --- | --- |
| Overall | Phases **0–5 CLOSED (staging)** · Phase **6 IN PROGRESS** · Phase **7 NOT STARTED** |
| Live API | `https://api.stg.impulsionando.com.br` · image `…-phase6a` · SHA `67e10951…` |
| Live tenant-web | `https://tenant.stg.impulsionando.com.br` |
| Worker | Swarm internal · outbox/comm/journey **ON** · AI effect handler **noop** |
| Staging Supabase | `aamorcqznimmleafavai` |
| Clean host | `2.25.123.224` · Dokploy v0.30.3 |
| Legacy prod | `187.77.232.52` — **deny** mutate from this track |
| Phase 6 contracts | 44/44 in repo |
| Combined promote `…-phase6cdef` | **UNKNOWN** / aborted |
| Phase 6 CLOSED? | **No** |

### Critical honesty

| Claim in older docs | Reality |
| --- | --- |
| `GET /ai/agents/:tenantId` exists | Service exists; **HTTP route missing** in `ai.controller.ts` |
| Phase 6 “scaffolding done” | 6A/6B staging-live; 6C–6F mostly **repo-only** |
| ACCELERATION-BOARD 4B “staging pending” | **Stale** — 4B staging CLOSED per STATUS |
| Web apps are TanStack Start | Still **health/strangler stubs** |

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
| **6A–6F AI** | **OPEN** | 🟡 | See §3 — **critical path** |
| V1–V7 verticals | Not started as waves | ⬜ | After Phase 6 platform spine |
| **7 Cutover** | Blocked | ⬜ | Requires Phase 6 CLOSED + explicit authorization |

---

## 3. Phase 6 task canvas (critical path)

Exit gate (must all be true before CLOSED):

1. Security never prompt-only  
2. One real-data tenant-isolated agent proven (allow **and** deny)  
3. Sensitive actions blocked or approval-gated (API + worker evidence)  
4. Kill switch + cost/budget controls work  
5. Staging live smoke for 6C–6F (not DRY_RUN alone)

### 6A Gateway + policy

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6A-1 | Kill switch + chat refuse | ✅ staging | — |
| 6A-2 | Capabilities / policy / tools endpoints | ✅ staging | — |
| 6A-3 | Enforce `AI_CAPABILITY_ALLOWLIST` | ❌ missing | **Lane A** |
| 6A-4 | Enforce rate/token/cost budgets (`AI_BUDGET_EXCEEDED`) | ❌ partial | **Lane A** |
| 6A-5 | Server-side `AiChatContextAssembly` from actor (not client) | ❌ partial | **Lane A** |

### 6B Tool registry

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6B-1 | Risk classes + Zod I/O + FORBIDDEN non-exec | ✅ | — |
| 6B-2 | Auth recheck Support/Journeys/active context | ✅ partial | — |
| 6B-3 | Membership wrap on host-only resolve in chat path | ❌ | **Lane A** |
| 6B-4 | Optional `POST /ai/tools/execute` | defer | only if exit ops need it |

### 6C Real-data READ pilot

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6C-1 | Deterministic grounded pilot + freshness/degraded | ✅ repo | — |
| 6C-2 | Promote API with `AI_CHAT_ENABLED` + live smoke | ❌ **UNKNOWN** | **Lane P (ops)** sequential after code |
| 6C-3 | Cross-tenant deny via chat | ❌ **UNKNOWN** | **Lane P** after 6C-2 |

### 6D Tenant agent

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6D-1 | Agent config schema + env seed service | ✅ scaffolding | — |
| 6D-2 | Wire `GET /api/v1/ai/agents/:tenantId` | ❌ **missing route** | **Lane B** |
| 6D-3 | Pilot **consumes** agent prompt/model/allowlist | ❌ peek-only | **Lane B** |
| 6D-4 | Staging seed env + allow/deny smoke | ❌ **UNKNOWN** | **Lane P** |
| 6D-5 | Full RAG product | out of MVP | defer |

### 6E Gated effects

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6E-1 | Approval create/get/staff decide API | ✅ scaffolding | — |
| 6E-2 | `assertMembership` on create | ❌ | **Lane C** |
| 6E-3 | Worker `ai.effect.execute` sink handler (not noop) | ❌ | **Lane C** |
| 6E-4 | Durable approval store (survive restart) | ❌ in-memory | **Lane C** (larger) |
| 6E-5 | Live create→decide→job smoke | ❌ **UNKNOWN** | **Lane P** |

### 6F Evals + ops

| Task ID | Work | State | Parallel lane |
| --- | --- | --- | --- |
| 6F-1 | Offline eval fixtures + contracts | ✅ repo | — |
| 6F-2 | In-memory metrics + redaction | ✅ repo | — |
| 6F-3 | Populate tokens/cost estimates when available | ❌ partial | **Lane D** |
| 6F-4 | Smoke includes `/ai/metrics` + agents + effects | ❌ partial | **Lane D** |
| 6F-5 | Canary wiring | UNKNOWN OK for MVP close if documented | defer |

---

## 4. Parallel execution plan (speed + quality)

### Principle

- **Parallelize repo work** that does not share the same files.  
- **Serialize promote + live proof** (one Swarm promote, then smokes).  
- **Never** mark CLOSED without allow+deny evidence.  
- Subagents = one lane each; parent merges + runs contracts before promote.

### Wave 1 — repo close gaps (4 parallel subagents)

```text
Lane A — Policy hardening
  files: ai-policy.service.ts, ai-pilot.service.ts, tools/registry.ts
  deliver: allowlist + budgets + context assembly + membership on resolve

Lane B — Agent consume
  files: ai.controller.ts, ai.service.ts, ai-pilot.service.ts (coordinate merge)
  deliver: GET /ai/agents/:tenantId + pilot applies agent config

Lane C — Effects durability path
  files: ai-effects.service.ts, apps/worker job-consumer.ts
  deliver: membership on create + worker sink handler for ai.effect.execute
  note: durable DB table can be Lane C.2 if time; else document in-memory MVP + follow-up

Lane D — Smoke + contracts
  files: scripts/smoke-reengineering-ai-gateway.mjs, tests/reengineering/ai-*.ts
  deliver: extend smoke (agents, effects, metrics); keep test:phase6:contracts green
```

**Merge rule:** Lane B owns `ai-pilot.service.ts` agent-consume hunks; Lane A lands budgets first or rebase onto B. Prefer sequential PR order: A → B → C → D if file conflicts, else true parallel with rebase.

### Wave 2 — promote + prove (sequential, one operator)

```text
1. Build amd64 API (+ worker if C landed)
2. Local-load or GHCR → Swarm reengineering-api / reengineering-worker
3. Set AI_CHAT_ENABLED + AI_TENANT_AGENT_* seed (no secrets in git)
4. Live smoke: capabilities/policy/tools/metrics/chat grounded
5. Agents allow + deny
6. Effects create → staff decide → worker log / ledger
7. Cross-tenant deny chat
8. Update STATUS + phase-6 README + clean-host IMPLEMENTATION-LOG
9. Only then mark Phase 6 CLOSED
```

### Wave 3 — after Phase 6 CLOSED (next speed tracks)

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
| Contracts | `npm run test:phase6:contracts` green before promote |
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
| 1 | Implement Wave 1 Lanes A–D | agents (parallel) | Phase 6 close |
| 2 | Re-run `test:phase6:contracts` | CI/agent | promote |
| 3 | Promote `…-phase6cdef` (or successor) | human/ops SSH | live proof |
| 4 | Live smokes + deny tests | agent+ops | STATUS CLOSED |
| 5 | Optional GHCR push of current SHA tags | human | non-blocking |
| 6 | Open V1 CRM contracts track | agents | after 6 CLOSED |
| 7 | Phase 7 | humans only | after 6 CLOSED + explicit auth |

---

## 7. Forbidden (speed does not override)

- Prod DNS / apex / tenant cutover  
- Dokploy or wipe on `187.77.232.52`  
- `db push` / reset prod  
- Mechanical move of all legacy routes  
- Autonomous AUTO_SAFE / clinical / investment / payment AI  
- Claiming Phase 6 CLOSED on current `…-phase6a` alone  
- Treating product-intake as implement-now license  

---

## 8. Doc sync checklist (this canvas revision)

| Doc | Action |
| --- | --- |
| `STATUS.md` | Point to this canvas; keep Phase 6 IN PROGRESS |
| `ACCELERATION-BOARD.md` | Refresh tracks; add P6 + parallel lanes |
| `phase-6/README.md` | Link canvas; note missing agents route |
| `04-migration/README.md` | Link canvas as operational board |

---

## 9. Definition of “fast done” for Phase 6

**Fast done ≠ all product agents / RAG / real LLM.**  
**Fast done =** Wave 1 code + Wave 2 staging proof satisfying §3 exit gate, evidenced in STATUS.

Anything beyond that is Wave 3+ product strangler under separate intakes and gates.
