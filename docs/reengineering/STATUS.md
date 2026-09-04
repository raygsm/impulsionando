# Status do Programa

Atualizado em: 2026-09-04T22:00Z (Phase 6 **CLOSED**; Phase 7 **IN PROGRESS** — **7A PASS**; **7B = CSI** — staging SSR Host **`stg.csi…`**; `stg.<tenant>` host-recognition **code fix** (redeploy pending); prod-shaped Host-header **PASS**; **prod DNS flip BLOCKED**; **7F PARKED**. Phase 8 **PLANNING** — Nest-first plan rebaselined on paper, gate **G0 pending**; autonomous-marketing product + canonical database models **PROPOSED** (draft expand SQL in `packages/database/canonical/`, not applied); first CRM/Growth slice **PLANNED — BLOCKED**, no gate moved)

Operational canvas: [`04-migration/UPDATE-CANVAS.md`](04-migration/UPDATE-CANVAS.md)  
Phase 6 Wave 2: [`04-migration/phase-6/WAVE-2-CLOSE.md`](04-migration/phase-6/WAVE-2-CLOSE.md)  
Phase 7 board: [`04-migration/phase-7/README.md`](04-migration/phase-7/README.md) · plan [`04-migration/phase-7/PARALLEL-SPEED-PLAN.md`](04-migration/phase-7/PARALLEL-SPEED-PLAN.md) · gates [`04-migration/phase-7/GATES.md`](04-migration/phase-7/GATES.md)  
Phase 8 board: [`04-migration/phase-8/README.md`](04-migration/phase-8/README.md) · slices [`04-migration/phase-8/SLICE-CATALOG.md`](04-migration/phase-8/SLICE-CATALOG.md) · gates [`04-migration/phase-8/GATES.md`](04-migration/phase-8/GATES.md)

## Estado geral

**FASES 0–6 CONCLUÍDAS (staging). FASE 7 IN PROGRESS (7A staging rehearsal). Sem cutover de DNS prod. 7F PARKED.**

| Fase | Estado | Evidência |
| --- | --- | --- |
| 4B | **Concluída (staging)** | tenant.stg LIVE · smokes PASS |
| 5A+5B | **CLOSED (staging)** | ledger SELECT **PASS** · enqueue/dup/poison **PASS** |
| 5C | **CLOSED (staging)** | event-outbox live smoke **PASS** |
| 5D | **CLOSED (staging)** | webhook ingress **PASS** |
| 5E | **CLOSED (staging)** | communication sink **ON** |
| 5F | **CLOSED (staging)** | CRM invite journey **PASS** |
| 5G | **CLOSED (staging)** | ops metrics + drill **PASS** · owners Cauã |
| **5 (gate)** | **CLOSED (staging exit)** | `phase5:staging:verify` **8/8 PASS** @ 2026-09-03T03:40Z |
| **6 (gate)** | **CLOSED (staging)** | Wave 2 live proof @ 2026-09-04T00:03Z — see below |
| 6A–6F | **CLOSED with Phase 6** | gateway/tools/pilot/agents allow+deny/effects create/metrics |
| **7** | **IN PROGRESS** | **7A PASS** · **7B = CSI** · staging SSR **PASS** · prod-shaped Host-header **PASS** · prod DNS **BLOCKED** · **7F PARKED** |
| **8** | **PLANNING — NOT STARTED** | Wave 0 planning **LANDED** 2026-09-04 (paper only) · gate **G0 pending** — see below |

## Phase 6 staging close (2026-09-04T00:03Z)

| Item | Value |
| --- | --- |
| Promoted SHA | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| API image | `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (local-load amd64) |
| Worker image | `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` (local-load amd64) |
| Runtime `/health` | **200** · `gitSha=c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Verify | `npm run phase6:staging:verify` · **PASS=2 FAIL=0** |
| Flags | `AI_CHAT_ENABLED=true` · tenant agent seed enabled |
| Method | `docker save\|gzip\|ssh docker load` + `SKIP_PULL=1` · `PHASE6_CHAT=1` |
| Residuals (non-blocking) | Approvals MVP in-memory OK per Wave 2 plan · effect worker = sink (no domain writes) · GHCR push of `…-phase6exit` optional · durable `reengineering_ai_approvals` migration may be applied separately |

### Verify matrix

| Check | Result |
| --- | --- |
| 6A–6F gateway matrix (capabilities/policy/tools/metrics/chat/agents allow/effects create) | **PASS** |
| 6D agents deny + chat cross-tenant refuse | **PASS** |

## Phase 7 — IN PROGRESS · 7A PASS · 7B = CSI (staging + prod-shaped Host-header PASS; prod DNS BLOCKED)

| Item | Value |
| --- | --- |
| 7A | **PASS** @ 2026-09-04T00:30Z — [`phase-7/EVIDENCE-7A.md`](04-migration/phase-7/EVIDENCE-7A.md) |
| **7B pilot** | **`csi.impulsionando.com.br`** — [`phase-7/CSI-PILOT-7B.md`](04-migration/phase-7/CSI-PILOT-7B.md) |
| 7B staging SSR | **PASS** (Host corrected 2026-09-04) — Swarm `reengineering-csi-core` · Host **`stg.csi.impulsionando.com.br`** (`stg` first; never `csi.stg…`) · `/csi` HTML **200** · `/healthz` gitSha `5a9fd4c5…` · image `…-csi7b` local-load |
| 7B `stg.<tenant>` recognition | **Code fix** — `getTenantSubdomain` maps `stg.csi…` → slug `csi` (bare `stg…` stays platform). Live browser fallback clear **UNKNOWN** until CSI image rebuild/redeploy — see [`CSI-PILOT-7B.md`](04-migration/phase-7/CSI-PILOT-7B.md) |
| 7B prod-shaped Host-header | **PASS** @ 2026-09-04T11:28Z — Swarm `reengineering-csi-core-prod` · Host `csi.impulsionando.com.br` · `/healthz`+`/csi` **200** · image `…-csi7bprod` · prod Supabase ref baked · **no CF flip** |
| 7B prod DNS flip | **BLOCKED** — Cloudflare token / human flip pending; Nest prod host + remaining pilot blockers still open |
| Staging CSI seed | `npm run staging:seed:csi-tenant` → company `CSI Invest` / subdomain `csi` (staging) |
| Impulsionando development | **UNLOCKED on staging / new stack** — do not wait for CSI DNS |
| Prod DNS / apex | **FORBIDDEN** until CF flip authorized (+ remaining blockers in CSI-PILOT-7B) |
| Legacy VPS | **FORBIDDEN** |
| 7F | **PARKED** |

## Phase 8 — PLANNING (Impulsionando core app on the new stack)

Wave 0 = **paper only**. No code, no infra mutation, no production anything. Phase 8 is **staging-only** by definition and is orthogonal to Phase 7 (Phase 7 moves hostnames; Phase 8 moves authenticated route prefixes).

| Item | Value |
| --- | --- |
| Authority | [`04-migration/PHASE-8-CORE-APP.md`](04-migration/PHASE-8-CORE-APP.md) · board [`phase-8/README.md`](04-migration/phase-8/README.md) |
| Wave 0 planning | **LANDED** 2026-09-04 — rebaselined to one Nest-authority path; frontend is accepted runtime presentation/thin BFF; no implementation authorization |
| Product model proposal | **PROPOSED** 2026-09-04 — one invariant dashboard, capability modules, niche blueprints/onboarding compiler, mandatory tenant business agent, optional client agent, governed Impulsionito — [`06-autonomous-marketing-platform/README.md`](06-autonomous-marketing-platform/README.md) |
| First product slice plan | **PLANNED — BLOCKED** — Unit A Nest common/session/modules/manifest/read proof → Unit B Contact/Lead/Task/Opportunity/Conversion/Growth + agent READ; blocked on accepted frontend landing, product/DB decisions, G0/G1/G2/G3 and P-DB-06 — [`phase-8/first-product-slice/README.md`](04-migration/phase-8/first-product-slice/README.md) |
| Canonical database redesign | **PROPOSED — logical models + draft expand SQL** — corpus in [`packages/database/canonical/`](../../packages/database/canonical/); **not applied**; apply blocked until DB1–DB4 — [`06-autonomous-marketing-platform/database/README.md`](06-autonomous-marketing-platform/database/README.md) |
| Measured scope (STATIC) | 576 `_authenticated` route files = 206 tenant product + 283 platform staff + 87 one-tenant bespoke; 12 `_command`; 1,476 `createServerFn` call sites |
| Phase 8 technical target | Modular Nest API is product/domain authority; `apps/app-web` is presentation/thin BFF. ADR-002 currently keeps TanStack; draft ADR-009/PR #151 proposes Next.js. The accepted frontend ADR at implementation time governs; no draft silently replaces it. |
| Proposed product modules | Adds/reframes `contacts`, `growth`, `campaigns`, `tasks`, `dashboard`, `modules`, `blueprints`, `onboarding` and three agent kinds; **not authoritative until accepted** — [`06-autonomous-marketing-platform/NESTJS-REFORMULATION.md`](06-autonomous-marketing-platform/NESTJS-REFORMULATION.md) |
| Consolidation budget | ~295 staff routes → ≈35–45 screens; the **57** `admin.*-health` pages collapse into one parameterized surface — [`phase-8/CORE-APP-SCOPE.md`](04-migration/phase-8/CORE-APP-SCOPE.md) §4 |
| Deferred (**V-lane**) | Vertical packs (imobiliária, contabilidade, EHR, fiscal, affiliates, cervejaria/restaurante, eventos, educação, marketplace) + one-tenant ops (ChrisMed, WMP, Marocas, RioMed, Revela) — bound to each tenant's Phase 7 cutover |
| Next gate | **G0** — human: accept scope + consolidation budget, choose `app.stg.impulsionando.com.br`, close the ADR-008 password-reset host — [`phase-8/GATES.md`](04-migration/phase-8/GATES.md) |
| Blocking decision | **RBAC ADR** (capability model) before slice S2 — [`phase-8/DATA-AND-IDENTITY-PLAN.md`](04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md) §3 |
| Prod | **FORBIDDEN** in Phase 8 — production cutover stays Phase 7 authority |

## Próximo gate

1. **Develop Impulsionando** on staging (Nest / tenant-web / product) — authorized. Scoped plan: **Phase 8** ([`04-migration/PHASE-8-CORE-APP.md`](04-migration/PHASE-8-CORE-APP.md)); opens at gate **G0**.  
2. Rebuild/redeploy CSI staging image with `stg.<tenant>` host recognition, then confirm browser no longer shows “Domínio não reconhecido” on `stg.csi…`.  
3. Add Cloudflare **A** `stg.csi` → `2.25.123.224` (grey / DNS-only) for public staging URL (human — no CF token this session). Do **not** create `csi.stg`.  
4. When remaining blockers green: Cloudflare flip **only** `csi` → clean (prod-shaped service already Host-proven).  
5. Then 7C–7E. **7F PARKED.**

## Phase 5 staging verify matrix (2026-09-03T03:40Z) — **8/8 PASS**

`npm run phase5:staging:verify` against `https://api.stg.impulsionando.com.br` — retained as Phase 5 authority.

## Evidência corrente

| Item | Value |
| --- | --- |
| Staging ref | `aamorcqznimmleafavai` |
| Live API | `https://api.stg.impulsionando.com.br` |
| Live tenant-web | `https://tenant.stg.impulsionando.com.br` |
| API image (local-load) | `ghcr.io/raygsm/impulsionando-api:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| Worker image (local-load) | `ghcr.io/raygsm/impulsionando-worker:c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b-phase6exit` |
| Runtime gitSha (API) | `c4c9530ab55f1bcb9ba7db6a10ef9e76265c870b` |
| Clean host | `2.25.123.224` |
| Integration owners | Cauã — [`04-migration/phase-5/INTEGRATION-REGISTRY.md`](04-migration/phase-5/INTEGRATION-REGISTRY.md) |
