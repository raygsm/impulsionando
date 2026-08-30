# AI assistants inventory (J-14)

**Date:** 2026-08-30  
**Evidence level:** `STATIC` (code/config/docs read-only)  
**Journey:** [J-14](../product-map/JOURNEYS.md) — AI conversation and controlled action  
**Backlog:** [VALIDATION-BACKLOG task 16](../product-map/VALIDATION-BACKLOG.md)  
**Clarification:** Cauã — high-priority inventory; not Phase 6 build ([CLARIFICATIONS-2026-08-30](../product-map/CLARIFICATIONS-2026-08-30.md) #9)

## Phase 6 gate (reminder)

Per [`AI-READINESS.md`](../../02-target-architecture/AI-READINESS.md): do **not** start operational AI platform work until canonical auth, tested isolation, audit trail, durable queue, idempotency, and observability exist. This document inventories legacy surfaces only. It does **not** authorize Phase 6, tool registries, Nest, Dokploy, or new AI features.

**Status of J-14:** inventory started (`STATIC`). Journey remains **not CHARACTERIZED** (no live auth/deny, rate/cost, retention, eval, or approval-gate proof).

## Method

- Searched `src/routes/api/**` chat/upload routes, Vercel AI SDK (`ai`, `@ai-sdk/*`), agent keys, `core_ai_*`, and niche assistant names.
- Cross-checked [`API-ENDPOINTS.md`](API-ENDPOINTS.md) AI/chat rows and [`INTEGRATIONS.md`](INTEGRATIONS.md) IA row.
- **Auth signal** below = heuristic for **caller/end-user** identity enforcement on the chat surface. Provider `Authorization: Bearer` toward OpenAI is **not** end-user auth (API-ENDPOINTS “detectado” on Anita/Investito is likely that false positive).
- Model IDs and env **names** only — no secret values.
- Risk classes are **hypotheses** mapped to AI-READINESS action classes (`READ` / `RECOMMEND` / `AUTO_SAFE` / `APPROVAL_REQUIRED` / `HUMAN_REQUIRED` / `FORBIDDEN`).

## Shared stack (STATIC)

| Item | Path / signal | Notes |
| --- | --- | --- |
| LLM resolver | `src/lib/impulsionito/providers.server.ts` | Canonical runtime provider = OpenAI via `@ai-sdk/openai-compatible`; default model id `gpt-4o-mini`; env `OPENAI_API_KEY` (name only) |
| Omnichannel ledger | `src/lib/agents/omnichannel.server.ts` + RPCs `communication_ingest_inbound` / `communication_record_outbound` | Shared conversation persistence; uses `supabaseAdmin` |
| Typed agent keys | `OmnichannelAgentKey` | `impulsionito-core`, `colors-iris`, `chrismed-oliver`, `wmp-millito`, `marocas-maruquito`, `anamadu-anita` |
| Untyped agent keys in routes | `riomed-medicito`, `csi-investito` | Used at runtime but **absent** from `OmnichannelAgentKey` union — type/ledger drift (`STATIC`) |
| Per-company AI config tables | `core_ai_brains`, `core_ai_brain_knowledge`, `core_ai_brain_events` | Admin CRUD via `src/lib/ai-brain.functions.ts` (`requireSupabaseAuth`); not the public chat runtimes |

---

## Conversational assistants

### 1. Impulsionito (core)

| Field | Value |
| --- | --- |
| Name | Impulsionito |
| Tenant / product | Impulsionando Core / public + authenticated dock |
| Entry route / files | `POST /api/impulsionito/chat` → `src/routes/api/impulsionito/chat.ts`; prompt assembly `src/lib/impulsionito/context-engine.server.ts`; financial enrich `src/lib/impulsionito/financial-context.server.ts`; UI dock `src/components/impulsionito/ImpulsionitoDock.tsx`; WA channel `src/routes/api/communication/whatsapp/impulsionando.ts`; Meta `src/routes/api/public/hooks/meta-impulsionando.ts`; admin IC `src/routes/_authenticated/admin.impulsionito.centro-inteligencia.tsx` |
| Auth signal (heuristic) | **Partial.** Chat accepts anonymous web session (`x-impulsionando-session` or ephemeral). Optional `Authorization: Bearer` loads authenticated financial knowledge via Supabase claims. No hard login gate on POST. |
| Apparent data sources | Hardcoded `CORE_MASTER_BRAIN` in chat route; authenticated path reads `core_company_access_policy` (+ related financial knowledge) via admin client; omnichannel history |
| Tools / actions | No AI SDK `tool()` registry on this route. Prompt-only guidance; mock stream fallback if provider missing. |
| Provider / model | `resolveProvider({})` → OpenAI; default model id `gpt-4o-mini` (override via llm config if present) |
| Risk class (hypothesis) | Mostly `READ` / `RECOMMEND`. Staff financial context injection elevates sensitivity. Prompt claims `FORBIDDEN` on inventing payment state — **prompt is not a security control**. |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 2. Maruquito (Marocas niche on Impulsionito route)

| Field | Value |
| --- | --- |
| Name | Maruquito |
| Tenant / product | Marocas |
| Entry route / files | Same `src/routes/api/impulsionito/chat.ts` — pathname `/marocas` or `/marocas/*` → `agentKey: marocas-maruquito`, tenant `marocas` |
| Auth signal (heuristic) | Same as Impulsionito (anonymous + optional Bearer financial path) |
| Apparent data sources | Hardcoded `MAROCAS_BRAIN`; omnichannel ledger; no separate Marocas inventory tools visible on this route |
| Tools / actions | None visible |
| Provider / model | Same `resolveProvider` / OpenAI default |
| Risk class (hypothesis) | `READ` / `RECOMMEND` (ops guidance; inventing prices/access codes claimed forbidden by prompt) |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 3. Íris (Colors Saúde)

| Field | Value |
| --- | --- |
| Name | Íris / Iris |
| Tenant / product | Colors Saúde |
| Entry route / files | `POST /api/colors/iris/chat` → `src/routes/api/colors/iris/chat.ts`; Meta omnichannel `src/routes/api/public/hooks/meta-colors.ts` (WhatsApp / Instagram / Facebook); admin runtime peek via `src/lib/colors-admin.functions.ts` (`agent_key colors-iris`) |
| Auth signal (heuristic) | **Web chat: none** beyond client session header. **Meta webhook:** HMAC `x-hub-signature-256` vs env secret name `COLORS_META_APP_SECRET` (provider auth, not end-user). |
| Apparent data sources | `companies` (lookup by hardcoded CNPJ document), `knowledge_articles` (`audience=staff`, published); omnichannel history. Meta path may insert `support_tickets`. |
| Tools / actions | No AI SDK tools on web chat. Meta path: intent heuristics can **auto-open** `support_tickets` (`ensureSupportTicket`) — side effect outside model tool registry. |
| Provider / model | `resolveProvider({ llm: { provider: "openai" }, allowFallback: false })` on web; Meta uses `resolveProvider({})` |
| Risk class (hypothesis) | Web: `READ` / `RECOMMEND`. Meta ticket open: **`AUTO_SAFE` or `APPROVAL_REQUIRED`** (hypothesis) — writes without human approval gate visible in code. Staff knowledge articles fed into public/customer channels = leakage risk. |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 4. Annita / Anita (Ana Madú)

| Field | Value |
| --- | --- |
| Name | Annita (code/UI also “Anita”) |
| Tenant / product | Ana Madú |
| Entry route / files | `POST /api/anamadu/anita/chat` → `src/routes/api/anamadu/anita/chat.ts`; gemology corpus `src/lib/anamadu/gemology.ts`; catalog fetch `/api/anamadu/catalog`; bridge UI `src/components/anamadu/AnaMaduOurivesBridge.tsx` |
| Auth signal (heuristic) | **None** for end-user. Session header `x-anamadu-session`. OpenAI Bearer is provider credential only. |
| Apparent data sources | Static `ANA_MADU_GEMOLOGY_KNOWLEDGE`; live catalog via internal fetch to `src/routes/api/anamadu/catalog.ts`; omnichannel ledger (`anamadu-anita`) |
| Tools / actions | No AI SDK tools. Multimodal: accepts up to 3 inline `data:image/*;base64` images. Catalog injection is server-side fetch, not a model tool. |
| Provider / model | OpenAI-compatible; hardcoded `MODEL_ID = 'gpt-4o-mini'`; env `OPENAI_API_KEY` |
| Risk class (hypothesis) | `READ` / `RECOMMEND`. Ourives pricing claimed human-only (`HUMAN_REQUIRED` by prompt). Multimodal + public endpoint = abuse/cost risk. |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 5. Medicito (RioMed)

| Field | Value |
| --- | --- |
| Name | Medicito |
| Tenant / product | RioMed |
| Entry route / files | `POST /api/riomed/medicito/chat` → `src/routes/api/riomed/medicito/chat.ts`; upload `POST /api/riomed/medicito/upload` → `src/routes/api/riomed/medicito/upload.ts`; tools `src/lib/riomed/medicito-tools.server.ts`; UI `src/components/riomed/MedicitoConcierge.tsx`, `src/routes/riomed.medicito.tsx` |
| Auth signal (heuristic) | **Weak.** Chat: session header `x-riomed-session` (or ephemeral). Upload: requires valid session format + per-session rate cap (20/hour). No Supabase user auth on these routes. |
| Apparent data sources | `communication_tenants` (slug `rio-med`), `communication_agent_runtime` (`riomed-medicito`), `riomed_products`, `riomed_sellers`, `riomed_medicito_uploads`, Storage bucket `riomed-medicito-images`, `riomed_seller_leads`, `riomed_support_tickets`, `audit_logs` |
| Tools / actions | AI SDK tools with `stopWhen: stepCountIs(5)`: `search_inventory`, `get_product_by_sku`, `list_available_sellers`, **`create_lead`**, **`create_support_ticket`**. Multimodal via prior upload id. |
| Provider / model | OpenAI only (`allowFallback: false`); model from `communication_agent_runtime.model_policy.model` when set, else provider default |
| Risk class (hypothesis) | Inventory tools: `READ`. **`create_lead` / `create_support_ticket`: `AUTO_SAFE` or `APPROVAL_REQUIRED`** — real DB writes from a public-ish session with admin client. Clinical diagnosis claimed `FORBIDDEN` by prompt only. **Highest write-risk assistant in this inventory.** |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 6. Milito / Millito (WMP)

| Field | Value |
| --- | --- |
| Name | Milito (visible brand); code paths still `millito` / `wmp-millito` |
| Tenant / product | WMP — Wagner Miller Produções |
| Entry route / files | `POST /api/wmp/millito/chat` → `src/routes/api/wmp/millito/chat.ts` |
| Auth signal (heuristic) | **None** beyond `x-wmp-session` / ephemeral |
| Apparent data sources | `wmp_whereabouts_entries` (published future agenda); omnichannel history; fixed system responses for export/close flow |
| Tools / actions | No AI SDK tools. Server-side conversation close + protocol/token URL for export registration (`closeConversationForExternalIdentity`) — **not** model-invoked tools |
| Provider / model | `resolveProvider({})` → OpenAI default |
| Risk class (hypothesis) | Chat: `READ` / `RECOMMEND`. Export/registration handoff: `HUMAN_REQUIRED` / system-controlled. Related WMP visual analysis is a separate surface (below). |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 7. Investito (CSI)

| Field | Value |
| --- | --- |
| Name | Investito |
| Tenant / product | CSI Invest |
| Entry route / files | `POST /api/csi/investito/chat` → `src/routes/api/csi/investito/chat.ts`; UI `src/components/csi/InvestitoDock.tsx` |
| Auth signal (heuristic) | **None** beyond `x-csi-session` / ephemeral. OpenAI Bearer = provider only. |
| Apparent data sources | System prompt only (no live portfolio/order API wired in this file); omnichannel ledger (`csi-investito` — **not** in typed `OmnichannelAgentKey`) |
| Tools / actions | None. Prompt forbids simulating financial orders. |
| Provider / model | OpenAI-compatible; hardcoded `MODEL_ID = 'gpt-4o-mini'` |
| Risk class (hypothesis) | `READ` / `RECOMMEND` (educational concierge). Personalized investment advice / order execution claimed `FORBIDDEN` by prompt. Regulatory/compliance residual risk if treated as advice. |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

### 8. Oliver (Chrismed)

| Field | Value |
| --- | --- |
| Name | Oliver |
| Tenant / product | Chrismed |
| Entry route / files | Server fn `askOliver` in `src/lib/oliver-chat.functions.ts` (no dedicated `/api/.../chat` file); UI `src/components/chrismed/ChrismedOliverPanel.tsx`; WA `src/routes/api/communication/whatsapp/chrismed.ts` + `src/lib/oliver-omnichannel.functions.ts`; Meta IG `src/routes/api/public/hooks/meta-chrismed.ts` |
| Auth signal (heuristic) | **Web `askOliver`:** no `requireSupabaseAuth` on the `createServerFn`. Channels: WhatsApp/Meta paths use omnichannel ingest; Meta signature path present on related hooks (verify separately per hook). |
| Apparent data sources | Large hardcoded system prompt (services/prices/routes embedded in source); omnichannel for channel paths |
| Tools / actions | None via AI SDK tools. `generateText` Q&A only. |
| Provider / model | OpenAI-compatible; model env name `CHRISMED_OLIVER_MODEL` or default `gpt-4o-mini`; key from `OPENAI_API_KEY` or file path `/run/secrets/openai_api_key` (path only) |
| Risk class (hypothesis) | `READ` / `RECOMMEND` for admin/scheduling guidance. Clinical interpretation / prescription: claimed `FORBIDDEN` by prompt — health-data sensitivity still high. Hardcoded prices in prompt may drift from live checkout. |
| Evidence level | `STATIC` |
| Phase 6 | Gate closed — inventory only |

---

## Related AI capability surfaces (not niche “named assistants”)

These are in-scope for J-14 risk awareness but are **not** the six named product assistants. Evidence `STATIC` / some `UNKNOWN` live usage.

| Surface | Paths | Auth signal (heuristic) | Behavior sketch | Risk class (hypothesis) |
| --- | --- | --- | --- | --- |
| Core AI brain admin | `src/lib/ai-brain.functions.ts`; tables `core_ai_*` | `requireSupabaseAuth` + staff/company membership | Configure prompts/knowledge/events per company | Config `READ`/`WRITE` (admin); runtime coupling to public chats = `UNKNOWN` |
| WMP briefing evidence analysis | `src/lib/wmp/evidence-analysis.server.ts`; `src/routes/api/wmp/briefing.$id.evidence.ts` | Route-level auth = `UNKNOWN` (needs separate static trace) | Vision `generateText` + structured output on Storage `wmp-briefing-evidence` | `RECOMMEND` (ops pre-diagnosis) |
| Executive briefing | `src/lib/executive-briefing.functions.ts`; `/admin/executive-briefing` | Under `_authenticated` UI | Summarization via OpenAI | `READ` / `RECOMMEND` (staff) |
| Tenant insights | `src/lib/tenant-insights.functions.ts`; used from admin tenant 360 | Under authenticated admin surfaces | LLM narrative over tenant metrics | `READ` / `RECOMMEND` |
| Talentos CV extract | `src/lib/talentos-ai.functions.ts` | Authenticated talentos flow | Structured extraction via gateway helper | `READ` |
| AI generator (implantação) | `src/lib/ai-generator.functions.ts`; `core.nova-implantacao` | Authenticated | Content generation; historical Lovable gateway import still referenced in file | `RECOMMEND` |
| Impulsionito IC local store | `src/lib/impulsionito-ic/*`; admin centro-inteligencia | Authenticated admin UI | Prompt versions, learnings, LLM config panels | Config governance — not live inference proof |

---

## Summary table

| # | Assistant | Product | Primary entry | Caller auth (heuristic) | Model tools / writes | Provider (visible) | Risk hypothesis | Evidence |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Impulsionito | Core | `/api/impulsionito/chat` | Optional Bearer enrich; chat open | None | OpenAI / `gpt-4o-mini` default | READ/RECOMMEND | STATIC |
| 2 | Maruquito | Marocas | same route via `/marocas` | Same | None | OpenAI | READ/RECOMMEND | STATIC |
| 3 | Íris | Colors | `/api/colors/iris/chat` (+ Meta) | Web none; Meta HMAC | Meta may insert tickets | OpenAI | READ/RECOMMEND + write side-effect | STATIC |
| 4 | Annita | Ana Madú | `/api/anamadu/anita/chat` | None | Catalog fetch; multimodal | OpenAI `gpt-4o-mini` | READ/RECOMMEND | STATIC |
| 5 | Medicito | RioMed | `/api/riomed/medicito/chat` (+ upload) | Session only | **5 tools incl. lead/ticket writes** | OpenAI | READ + AUTO_SAFE/APPROVAL_REQUIRED | STATIC |
| 6 | Milito | WMP | `/api/wmp/millito/chat` | None | System export/close | OpenAI | READ/RECOMMEND | STATIC |
| 7 | Investito | CSI | `/api/csi/investito/chat` | None | None | OpenAI `gpt-4o-mini` | READ/RECOMMEND | STATIC |
| 8 | Oliver | Chrismed | `askOliver` server fn (+ WA/Meta) | Web fn unauthenticated | None | OpenAI (+ `CHRISMED_OLIVER_MODEL`) | READ/RECOMMEND; clinical FORBIDDEN-by-prompt | STATIC |

**Count:** **8** conversational assistants with dedicated runtime entry points (6 named J-14 niches + Maruquito + Oliver). Plus **6+** related AI capability surfaces.

## Top static risks (not live-proven)

1. **Medicito tool writes** (`create_lead`, `create_support_ticket`) from a weakly authenticated public chat using `supabaseAdmin` — strongest Phase 0 AI risk toward `AUTO_SAFE` / `APPROVAL_REQUIRED` without proven policy engine.
2. **Broad anonymous chat surfaces** (Impulsionito, Iris, Anita, Millito, Investito, Oliver web) — cost, abuse, prompt-injection, and data-exfiltration exposure without proven rate/cost tenants.
3. **Íris Meta auto-ticket creation** + **staff `knowledge_articles`** injected into customer-facing prompts.
4. **Shared central OpenAI credential scope** (`impulsionando_central` / `OPENAI_API_KEY`) across niches — blast radius and attribution gaps.
5. **Security-by-prompt** for clinical (Oliver/Iris/Medicito) and financial (Investito/Impulsionito) boundaries — conflicts with AI-READINESS (“Prompt não é controle de segurança”).
6. **Agent-key type drift** (`riomed-medicito`, `csi-investito` outside `OmnichannelAgentKey`) — ledger/runtime consistency unknown.

## Still UNKNOWN (blocks CHARACTERIZED)

- Live public exposure / WAF / rate limits per host  
- Cost owner, quotas, retention, evals  
- Deny tests for tool auth and tenant isolation  
- Whether `core_ai_brains` prompts actually drive niche runtimes  
- Production model ids vs code defaults  
- Approval gates for any write path  

## Cross-links

- Target policy classes: [`AI-READINESS.md`](../../02-target-architecture/AI-READINESS.md)  
- Endpoint catalog AI/chat rows: [`API-ENDPOINTS.md`](API-ENDPOINTS.md)  
- Integrations IA row: [`INTEGRATIONS.md`](INTEGRATIONS.md)  
- Product journeys: [`JOURNEYS.md` J-14](../product-map/JOURNEYS.md)  
- Backlog task 16: [`VALIDATION-BACKLOG.md`](../product-map/VALIDATION-BACKLOG.md)
