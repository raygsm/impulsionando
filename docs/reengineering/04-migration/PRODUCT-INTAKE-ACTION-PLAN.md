# Product intake → reengineering action plan

Created: **2026-09-02**  
Status: **ACTIVE PLAN — implementation remains phase-gated**  
Product input: root [`../../../product-intake/`](../../../product-intake/) on `reengineering/program`  
Program authority: accepted ADRs → target architecture → [`../../STATUS.md`](../../STATUS.md) → evidence → product intake

## Decision

The root product intake describes a multi-vertical SaaS platform, complete tenant products, an AI operating layer, and regulated financial/health capabilities. It is **not one implementation batch**.

The program will absorb it in this order:

```text
Phase 4A tenant resolve (closed)
→ Phase 4B tenant/configuration foundation
→ Phase 5 async/integration platform
→ one low-risk end-to-end journey
→ Phase 6 governed AI platform
→ vertical migration waves
→ Phase 7 production cutover and legacy retirement
→ separately gated regulated/product-depth tracks
```

This preserves the strangler strategy. Reusable capabilities become Core modules; tenant differences remain configuration, policy, content, provider selection, and branding.

## Product and operational objectives

The implementation must optimize simultaneously for:

1. **Smooth user experience** — one coherent navigation and identity model; progressive workflows; mobile and accessibility; no infrastructure concepts exposed to normal users.
2. **Low operating cost** — modular monolith first; managed Supabase; one shared worker platform; reuse provider adapters; no premature microservices.
3. **Reliable behavior** — durable jobs, idempotency, replay protection, outbox, reconciliation, explicit degraded states, and evidence-backed rollback.
4. **Maintainable code** — bounded domain modules, versioned contracts, configuration instead of tenant conditionals, shared UI/domain packages, and explicit ownership.
5. **Security by construction** — server-side authorization, RLS defense in depth, least privilege, tenant deny tests, auditable sensitive actions, and no secrets in clients/logs.
6. **Product truth** — no mock data in production, no AI-invented operational facts, and no “ready” claim without deployed-environment evidence.

## Architecture principles

### Keep

- pnpm workspace modular monolith.
- TanStack Start frontends: `platform-web`, `tenant-web`, `app-web`.
- NestJS/Fastify modular API as business-rule authority.
- Managed Supabase for PostgreSQL, Auth, Storage, Realtime where justified, and queues initially.
- Independent worker lifecycle.
- GHCR immutable full-SHA images, Dokploy/Traefik, Cloudflare.
- n8n as auxiliary visual orchestration, never domain state authority.

### Avoid

- Per-tenant application forks.
- `if tenant === ...` spread through UI or business logic.
- One worker/service per workflow without an operational reason.
- Business transitions controlled only by n8n, frontend, or prompt text.
- Premature event-sourcing, Kubernetes, Kafka, or microservice extraction.
- Implementing the full ERP/CRM/Payments/AI catalog before a proven vertical.

## Canonical component boundaries

| Component | Owns | Does not own |
| --- | --- | --- |
| Identity & Access | session, MFA/step-up, security policy | tenant business rules |
| Tenants & Memberships | canonical tenant ID, aliases, membership, branding/config | tenant-specific forks |
| Plans & Entitlements | plan catalog, modules, limits, feature flags | frontend-only authorization |
| CRM & Lifecycle | leads, contacts, pipelines, journey state, attribution | channel delivery |
| Support | tickets, SLA, support timeline | payment disputes/business ledgers |
| Events & Outbox | versioned event envelope, durable publication | arbitrary workflow logic |
| Jobs & Worker | queue consumption, retry, DLQ, leases, idempotency | HTTP request lifecycle |
| Communications | intents, consent, templates, delivery status, cooldown | CRM stage authority |
| Automations | schedules and governed reactions | source-of-truth records |
| Integrations | provider adapters, credentials references, webhook verification | domain state machines |
| Billing & Subscriptions | SaaS plans, recurrence, dunning, suspend/reactivate | marketplace wallet/split |
| Orders & Catalog | product/SKU/offer/order lifecycle | payment-provider internals |
| Inventory | stock state, reservation, release, movement history | AI predictions as truth |
| ERP & Finance | AP/AR, postings, cash flow, reconciliation | legal interpretation |
| Fiscal | invoice intent, provider adapter, retries, storage | tax advice |
| Agenda & Reservations | availability, capacity, holds, booking conflict rules | vertical presentation |
| Audit & Compliance | immutable sensitive-action evidence, retention class | general debug logs only |
| AI Runtime | gateway, tools, policy, approvals, RAG boundary, cost/evals | direct SQL/service-role access |
| Observability | health, backlog, failure/latency, release identity | deployment authorization |

## Phase 4B — tenant and configuration foundation

Phase 4A closed the staging hostname-resolution slice. Phase 4B completes the original Phase 4 product/platform intent.

### Work packages

| ID | Work | Acceptance evidence |
| --- | --- | --- |
| 4B-1 | Canonical tenant identity and alias policy | duplicate/alias inventory; deterministic lookup; no silent merge |
| 4B-2 | Membership/RBAC binding to canonical tenant | allow/deny contract and live staging tests |
| 4B-3 | Plans, modules, limits, entitlements | versioned contract; server-side enforcement |
| 4B-4 | Typed tenant configuration | branding, locale, timezone, currency, module/provider/template references |
| 4B-5 | Feature flags | audited server-side resolution; default-deny unknown capabilities |
| 4B-6 | Frontend runtime boundaries | `platform-web` / `tenant-web` / `app-web` deployable independently |
| 4B-7 | Low-risk tenant slice | common image; configuration-only differences; rollback rehearsal |
| 4B-8 | RioMed identity discovery | read-only `rio-med` vs `riomed` mapping and migration proposal |

### Exit gate

- A low-risk tenant is served by shared images and typed configuration.
- The API, RLS, and UI agree on tenant identity and entitlements.
- Unknown/spoofed/cross-tenant contexts fail safely.
- No production DNS change is required to close 4B.

## Phase 5 — async and integration platform

### Phase 5A — worker artifact

- Complete `apps/worker` bootstrap and readiness.
- Build/publish GHCR full-SHA image.
- Deploy independent staging Swarm service.
- Prove worker failure does not affect API/SSR.

### Phase 5B — queue semantics

- Staging `pgmq` queue only after migration approval.
- Versioned job envelope: `jobId`, `type`, `schemaVersion`, `tenantId`, `correlationId`, timestamps.
- Visibility timeout, bounded retry/backoff, idempotency key, poison-message handling, DLQ.
- Publish → consume → duplicate-delivery → single-effect smoke.

### Phase 5C — event/outbox contract

- API commits domain state and outbox record transactionally.
- Worker publishes/dispatches after commit.
- Initial event catalog:
  - `support.ticket.created`;
  - `invite.created`;
  - `invite.link_clicked`;
  - `account.first_login`;
  - `communication.requested`;
  - `communication.delivered`;
  - `communication.failed`.
- Event names and payloads follow Phase 1 envelope/versioning.

### Phase 5D — secure webhook boundary

- Signature/origin validation.
- Schema validation.
- Replay-window and duplicate rejection.
- Safe payload retention/redaction.
- Fast acknowledgment with durable processing.
- Audit and correlation from ingress through side effect.

### Phase 5E — communication platform

- Email and WhatsApp adapter interfaces.
- Tenant-branded versioned templates.
- Intent → consent/policy → outbox → worker → provider → delivery status.
- Opt-out, cooldown/frequency caps, deduplication, and provider failure mapping.
- No real-recipient staging sends except an explicit allowlist.

### Phase 5F — first product proof

Implement the **90-day CRM invitation journey in staging** as the first intake-aligned proof:

```text
select synthetic/test contact
→ create expiring/revocable invite
→ dispatch through sink/allowlisted channels
→ record click
→ API updates CRM journey state
→ first login/action cancels incompatible reminders
→ support handoff retains authorized context
```

n8n may react to committed events and request actions. It must not own canonical CRM state.

### Phase 5G — operational readiness

- Integration registry: owner, environment, credential reference, status, runbook.
- Queue backlog, oldest job age, failure rate, retry/DLQ and provider latency.
- Safe replay/recovery tooling.
- One provider outage drill proving public API and frontend remain healthy.

### Phase 5 exit gate

- 5A–5G evidenced in staging.
- At least one full async journey passes duplicate/retry/failure tests.
- No migrated worker co-starts with SSR/API.
- Each live integration has an owner and recovery runbook.

### Explicit Phase 5 exclusions

- Full Impulsionando Payments marketplace, split, wallet, payout, anticipation, Turbo.
- Full ERP/CRM rebuild.
- Production campaign blast.
- Autonomous AI actions.
- Clinical, investment, or production cutover.

## Phase 6 — governed AI platform

### Phase 6A — gateway and policy

- Provider-independent gateway.
- Environment/tenant capability switches and kill switch.
- Server-side context assembly.
- Rate/token/cost budgets.
- Prompt/model/version traceability.

### Phase 6B — tool registry

- READ, RECOMMEND, AUTO_SAFE, APPROVAL_REQUIRED, FORBIDDEN risk classes.
- Runtime input/output validation.
- Authorization rechecked in every tool.
- No arbitrary SQL, service-role key, or unrestricted HTTP access.

### Phase 6C — real-data read pilot

- Impulsionito reads tenant/support/journey state from canonical API.
- Answers include source freshness/degraded state.
- Unsafe or unavailable facts are refused, not invented.

### Phase 6D — first tenant agent

- One configured tenant instance using the shared gateway/tool registry.
- Tenant-isolated knowledge/RAG where necessary.
- Prefer a non-regulated READ-only workflow before health, money movement, or investments.

### Phase 6E — gated effects

- Sensitive writes require explicit approval.
- Tool execution is auditable and idempotent.
- Long tasks use Phase 5 queues.

### Phase 6F — evaluation and operations

- Offline evaluation suite.
- Canary and rollback.
- Cost/latency/quality telemetry by capability and tenant.
- Retention/redaction policy.

### Phase 6 exit gate

- Security never relies on prompt instructions alone.
- One real-data agent is proven without cross-tenant leakage.
- Sensitive actions are blocked or approval-gated.
- Kill switch and cost controls work.

### Explicit Phase 6 exclusions

- Omniscient Impulsionito across unfinished domains.
- Per-tenant unrestricted provider keys.
- Investment recommendations/orders without regulatory mode and approval.
- Clinical diagnosis or unsupported health claims.
- Autonomous payment/suspension/fiscal actions.

## Vertical migration waves

Vertical waves occur after their shared foundations are proven. They do not change Phase 7 into a feature-development phase.

| Wave | Shared product | Candidate order | Rationale |
| --- | --- | --- | --- |
| V1 | CRM + lifecycle + communications | Impulsionando 90-day journey | exercises platform spine with low regulatory risk |
| V2 | Property/service operations | Marocas | existing domain footprint; agenda/work-order/RBAC proof |
| V3 | Commerce/order/fulfillment | Colors → Ana Madú | shared orders, inventory, payment status, logistics |
| V4 | Hospitality | On Tap → Raoni | one PDV/comanda/KDS/taps/reservations Core, configured twice |
| V5 | B2B inventory intelligence | Rio Beer | import/data quality before recommendations |
| V6 | Medical-equipment commerce | RioMed | canonical identity first; sales/rental/stock before Medicito |
| V7 | Regulated wealth | CSI | legal mode, KYC/suitability, licensed data adapters first |

Every wave follows:

```text
audit → preserve → contract → implement shared core → configure tenant
→ allow/deny + E2E → stage → reconcile → promote → verify
```

## Phase 7 — cutover only

### Work packages

| ID | Work | Acceptance evidence |
| --- | --- | --- |
| 7A | Cutover playbook | completed in staging with known rollback |
| 7B | Low-risk production pilot | one tenant/flow, explicit owner and observation window |
| 7C | Reconciliation | data, jobs, integrations and user journey parity |
| 7D | Gradual traffic/DNS | measurable shift; old/new release identity visible |
| 7E | Legacy write freeze | no hidden writer/publisher dependency |
| 7F | Retirement | backup/restore evidence, approvals, credentials revoked |

### Phase 7 exit gate

- Every public domain and required flow runs on the target architecture.
- No production workflow depends on legacy runtime.
- Rollback window is closed formally.
- Legacy removal is backed by restore evidence.

### Explicit Phase 7 exclusions

- Building missing ERP, CRM, Payments, AI, clinical, or investment features.
- Using the product-intake “all modules PASS” north star as the migration gate.

## Separately gated product programs

### Impulsionando Payments

Required before design implementation:

- architecture ADR;
- provider capability validation;
- legal/regulatory/accounting review;
- payment-facilitator/sub-acquirer determination;
- KYB/KYC responsibility;
- PCI scope;
- chargeback, reserve, payout and reconciliation ownership;
- immutable double-entry ledger specification.

Phase 5 may build generic payment adapter/webhook primitives only.

### Revenue share

Requires:

- signed commercial definition of percentage/fixed-variable rule;
- authoritative revenue source;
- cancellation/refund treatment;
- transparent calculation memory;
- ERP/fiscal/reconciliation dependencies;
- dispute and adjustment process;
- legal/accounting/tax approval.

### Regulated verticals

- CSI/Open Finance/B3/suitability and recommendations.
- Clinical records, prescriptions, telehealth, health-data retention.
- Fiscal automation across jurisdictions.

Each needs its own risk, compliance, data-source, authorization, and go-live gate.

## Cost and quality strategy

| Decision | Cost/quality effect |
| --- | --- |
| Modular monolith before services | lower infrastructure/operations cost; transactional consistency |
| Managed Supabase + pgmq initially | avoids operating PostgreSQL/queue clusters |
| One independent worker deployment | isolation without service sprawl |
| Adapter interfaces | providers can change without rewriting domain logic |
| Shared vertical modules | prevents duplicate On Tap/Raoni/tenant implementations |
| Config-driven tenant-web | one build and cache strategy for many brands |
| Outbox/idempotency/DLQ | lower incident cost and safe retries |
| Read-only AI first | reduces security, liability and support burden |
| Explicit regulated tracks | prevents accidental fintech/health scope |

## Decision checkpoints

Human approval is required for:

1. Phase 4B low-risk pilot tenant.
2. First Phase 5 outbound provider and recipient allowlist.
3. Any staging DB migration.
4. Phase 6 first tenant agent and enabled tools.
5. Impulsionando Payments program inclusion.
6. Revenue-share commercial formula.
7. Any regulated vertical implementation.
8. Every production cutover.

## Global definition of done

For any slice:

- contract and runtime validation;
- server-side authorization;
- tenant allow and deny tests;
- idempotency where side effects exist;
- audit/correlation;
- staging E2E;
- observable degraded/failure behavior;
- full-SHA artifact;
- rollback/recovery;
- deployed-environment verification;
- user-facing UX/accessibility acceptance;
- evidence linked from the phase board.

`IMPLEMENTED` ≠ `TESTED` ≠ `DEPLOYED` ≠ `VERIFIED`.
