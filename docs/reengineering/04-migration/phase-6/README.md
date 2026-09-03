# Phase 6 — Governed AI platform

Opened: **2026-09-03T04:04Z**  
Status: **IN PROGRESS (Wave 1 repo landed 2026-09-03T23:40Z)** — **not CLOSED** (Wave 2 promote pending)

Program SoT: [`../../STATUS.md`](../../STATUS.md)  
Detailed plan: [`../PHASE-6-AI.md`](../PHASE-6-AI.md) · [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 6  
Acceleration board: [`../ACCELERATION-BOARD.md`](../ACCELERATION-BOARD.md)  
Speed canvas (task lanes): [`../UPDATE-CANVAS.md`](../UPDATE-CANVAS.md)

## Goal

Add shared **governed AI** capabilities (gateway, policy, tool registry) without violating tenant isolation, security, or cost predictability. Phase 6 delivers the platform — not the full Impulsionito/Íris/… product catalog.

## Subphases

| Wave | Focus | State |
| --- | --- | --- |
| **6A** | Gateway + policy (kill switch, budgets, capabilities, allowlist) | **IN PROGRESS** — Wave 1 enforced budgets/allowlist/context |
| **6B** | Tool registry + host-resolve membership when tenantId set | **IN PROGRESS** |
| **6C** | Real-data read pilot | Repo ready · staging promote **UNKNOWN** |
| **6D** | First tenant agent | **IN PROGRESS** — `GET /ai/agents/:tenantId` + pilot consumes config |
| **6E** | Gated effects / approval | **IN PROGRESS** — membership on create · worker sink |
| **6F** | Eval + ops telemetry | Repo ready · metrics in smoke · promote **UNKNOWN** |

## Wave 1 note (2026-09-03T23:40Z) — repo lanes A–D

Landed without staging promote (Wave 2 still required):

- **Lane A:** `AI_CAPABILITY_ALLOWLIST` filter · token/rate budget gate (`AI_BUDGET_EXCEEDED`) · server `AiChatContextAssembly`
- **Lane B:** `GET /api/v1/ai/agents/:tenantId` · chat resolves membership + applies agent prompt/model/allowlist
- **Lane C:** effects `assertMembership` on create · worker `ai.effect.execute` sink (ledger + log, **no domain writes**)
- **Lane D:** smoke extends agents/effects when `PHASE6_AI_TENANT_ID` set · contracts **47/47**

Do **not** mark Phase 6 CLOSED. Approvals remain in-memory (durable store deferred).

## 6E note (2026-09-03) — scaffolding IN PROGRESS

Approval-gated sensitive actions; **no autonomous writes** this wave:

- Contracts: `packages/contracts/src/ai-effects.ts` — approval request/decision, `APPROVAL_REQUIRED` exec request shape, status enum, env **names** (`AI_EFFECTS_ENABLED`, `AI_APPROVAL_TTL_SECONDS`), job type `ai.effect.execute`
- Nest: `ai-effects.service.ts` + `AiEffectsController` under `/api/v1/ai/effects` (auth-gated)
  - `POST /requests` → pending (no side effect)
  - `GET /requests/:id` → actor or staff
  - `POST /requests/:id/decide` → **staff** via `is_impulsionando_staff` (Support pattern); approve enqueues Phase 5 job when `AI_EFFECTS_ENABLED`, else `executed=false` + `EFFECTS_DISABLED` / `QUEUE_STUB` on enqueue failure
- Registry: `effect.gated.noop` listed as `APPROVAL_REQUIRED` **non-executable**; FORBIDDEN / AUTO_SAFE still denied
- Contracts: `npm run test:phase6e:contracts` (folded into `test:phase6:contracts`)

Do **not** mark Phase 6 CLOSED. Worker effect handler remains noop (no writes). Staging live smoke for 6E = **UNKNOWN** (no SSH/deploy this wave).

## 6D note (2026-09-03) — scaffolding IN PROGRESS

Additive MVP on the shared gateway (not full RAG / multi-agent product):

- Contracts: `AiTenantAgentConfigSchema` + env **names** (`AI_TENANT_AGENT_*`) in `packages/contracts/src/ai.ts`
- Nest: `apps/api/src/ai/ai-agent.service.ts` · **`GET /api/v1/ai/agents/:tenantId`** on `ai.controller.ts` (auth + membership)
- Chat: pilot **consumes** agent prompt/model/allowlist when seeded+enabled for `body.tenantId`

Do **not** mark Phase 6 CLOSED. Phase 7 / tenant UI agent pages not started.

## In scope (6A/6B wave)

- Contracts: `packages/contracts/src/ai.ts` (risk classes, policy, tool schemas, env **names** only)
- Nest: `apps/api/src/ai/` — capabilities / policy / tools / chat stub
- READ-only tools calling Support / Tenants / Journeys with auth rechecked inside each tool
- Contract tests + smoke (`DRY_RUN=1` default)
- Staging promote of API image only when credentials available (record UNKNOWN if blocked)

## Out of scope (explicit)

| Item | Reason |
| --- | --- |
| Mark Phase 6 CLOSED | Exit gate unmet until 6C–6F proven |
| Phase 7 cutover / prod DNS | Not authorized |
| Real tenant UI agent pages | Later wave |
| Arbitrary SQL / unrestricted HTTP / service-role in prompts | Forbidden by design |
| Write / AUTO_SAFE tools (autonomous) | Still denied — 6E is gate + queue only |
| Per-tenant unrestricted provider keys | Explicit Phase 6 exclusion |

## Evidence checklist (6A/6B)

| # | Check | State |
| --- | --- | --- |
| 1 | Phase 6 README + STATUS **IN PROGRESS** | ✅ this folder |
| 2 | AI contracts + export block | see `packages/contracts/src/ai.ts` |
| 3 | Nest AiModule wired | see `apps/api/src/ai/` |
| 4 | READ tool registry + auth recheck | see `apps/api/src/ai/tools/` |
| 5 | Contract tests | `npm run test:phase6a:contracts` · `test:phase6b:contracts` · `test:phase6d:contracts` · `test:phase6e:contracts` |
| 6 | Smoke DRY_RUN | `npm run phase6:smoke:ai-gateway` (also live **PASS** @ 2026-09-03T04:15Z) |
| 7 | Staging live promote | **PASS** — `docker save\|gzip\|ssh docker load` + `SKIP_PULL=1` → Swarm `reengineering-api` = `…-phase6a` (amd64); `/health` 200; live smoke capabilities/policy/tools 200 + chat 403 refuse |

## Authorization boundary

| Allowed | Forbidden |
| --- | --- |
| Staging/local Nest AI skeleton | Prod DNS / legacy VPS mutate |
| Kill-switch + budget env **names** | Secrets in docs/git/chat |
| READ tools with membership recheck | Prompt-only security / FORBIDDEN tools |
| Chat stub that refuses until policy allows | Claiming Phase 6 CLOSED on scaffolding |
| 6E approval create + staff decide + enqueue | Autonomous AUTO_SAFE / FORBIDDEN writes |
