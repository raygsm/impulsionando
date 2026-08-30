# End-to-end journey registry

## Registry

| ID | Journey | Priority | Current evidence | Characterization |
| --- | --- | --- | --- | --- |
| J-01 | Domain, release, and tenant resolution | P0 | `STATIC` + partial `LIVE` | Partial public GET only |
| J-02 | Signup, login, session, authorization, and password reset | P0 | `STATIC` | Pending |
| J-03 | Onboarding, company membership, role, and module activation | P0 | `STATIC` | Pending |
| J-04 | Impulsionando acquisition, lead, trial, and conversion | P0 | `STATIC` | Pending |
| J-05 | Checkout, payment, webhook, subscription, refund, and reconciliation | P0 | `STATIC` + canonical providers `DECLARED` | Pending LIVE characterization |
| J-06 | WhatsApp, e-mail, Meta, and notification delivery | P0 | `STATIC` | Pending |
| J-07 | Scheduled automation, outbox, worker, and n8n execution | P0 | `STATIC` | Pending |
| J-08 | Chrismed scheduling, care, records, documents, and fiscal flow | P0 | `STATIC` | Pending |
| J-09 | Colors catalog, order, affiliate, sales-webhook, automation, and AI flow | P0 | `STATIC` | Pending |
| J-10 | WMP quote, proposal, contract, operation, whereabouts, and evidence flow | P0 | `STATIC` | Pending |
| J-11 | Ana Madu catalog, order, PIX, and artisan request | P0 | `STATIC` | Pending |
| J-12 | RioMed catalog, quote, sale, service, event, and AI flow | P0 | `STATIC` | Pending |
| J-13 | Support ticket, incident status, and subscriber notification | P0 | `STATIC` | Pending |
| J-14 | AI conversation and tool/action boundary | P0 risk | `STATIC` | Pending |
| J-15 | Release promotion, routing change, validation, and rollback | P0 operational | partial `LIVE` | Pending in staging |
| J-16 | Backup generation, isolated restore, and disaster recovery | P0 operational | partial `LIVE` | Failed/not proven |

## J-01 — Domain, release, and tenant resolution

**Actor:** visitor, authenticated browser, monitoring system, or webhook provider.

```text
DNS/Cloudflare
→ VPS public IP
→ Nginx server/location selection
→ upstream port/process/container
→ release artifact
→ TanStack hostname/route resolution
→ tenant public or application surface
```

**Known inputs:** hostname, path, method, forwarded protocol/host headers, cookies.

**Known implementation surfaces:** Cloudflare configuration (`UNKNOWN` live export), Nginx (`LIVE` snapshot), `infra/subdomains/clients.json`, `src/lib/subdomain.ts`, tenant route shells, `/api/public/version`, health and release markers.

**Expected output:** the requested valid domain serves the intended tenant from one identifiable release. Unknown or unauthorized hosts fail safely.

**Known failure modes:** split-brain releases, root and nested paths using different upstreams, stale static files, missing runtime environment, proxy-header divergence, unknown subdomain fallback, release markers not served.

**Missing proof:** complete host/prefix-to-SHA map, Cloudflare export, custom-domain ownership, spoofed-host behavior, consistent tenant context, rollback.

## J-02 — Signup, login, session, authorization, and password reset

**Actors:** prospective user, existing user, tenant staff, tenant admin, platform admin.

```text
login/signup/reset route
→ Supabase Auth operation
→ session cookie/token
→ auth middleware/attacher
→ membership/company resolution
→ role/capability decision
→ authenticated route or redirect
→ RLS/application authorization on every data action
```

**Known surfaces:** `src/routes/auth.tsx`, `admin.login.tsx`, `empresa.login.tsx`, tenant-specific login routes, `reset-password.tsx`, `reset-password-sent.tsx`, `auth.update-password.tsx`, `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `_authenticated` routes.

**Expected output:** a valid user receives the correct tenant-bound session and only authorized capabilities. Invalid, expired, cross-tenant, or underprivileged access is denied without leaking data.

**Known failure modes to characterize:** white screen/SSR mismatch, redirect loop, stale session, missing membership, wrong default company, role escalation, browser-supplied company ID, reset-token replay, tenant A accessing tenant B.

**Missing proof:** canonical session contract, membership selection, MFA expectation, allow/deny matrix, password reset E2E, audit events, session revocation.

## J-03 — Onboarding, membership, role, and module activation

**Actors:** new customer, invited user, tenant admin, platform admin.

```text
trial/signup/invite
→ identity creation or acceptance
→ company/tenant creation or lookup
→ membership and initial role
→ plan/module/feature configuration
→ branding/domain/publication configuration
→ integration setup
→ initial authenticated destination
```

**Known surfaces:** `onboarding-guiado.tsx`, `onboarding-site.tsx`, `_authenticated/comecar.tsx`, company/admin routes, company/module/settings tables, provisioning-health functions.

**Expected output:** repeated execution is idempotent, partial failure is recoverable, and the user cannot choose another tenant or privileged role through client input.

**Missing proof:** authoritative provisioning function, transaction boundary, invite behavior, duplicate signup handling, cleanup/retry policy, module defaults, audit trail.

## J-04 — Impulsionando acquisition, lead, trial, and conversion

**Actors:** anonymous visitor, lead, sales/operations staff.

```text
landing/plans/contact/trial
→ form or CTA
→ validation and consent
→ lead/customer record
→ deduplication and funnel state
→ notification or CRM activity
→ sales follow-up, signup, or checkout
```

**Known surfaces:** apex marketing routes, contact/trial/checkout routes, CRM and funnel tables/functions, marketing notification hooks, WhatsApp/e-mail endpoints.

**Expected output:** one attributable lead/customer state with consent and an observable follow-up result.

**Missing proof:** canonical lead table, dedupe key, consent retention, notification ownership, source attribution, failure/retry behavior, handoff into onboarding/payment.

## J-05 — Checkout, payment, webhook, subscription, refund, and reconciliation

**Actors:** customer, tenant/platform billing operator, payment provider.

```text
plan/product/checkout selection
→ server-side price and tenant validation
→ payment intent/order creation
→ provider checkout or PIX response
→ signed provider webhook
→ replay/idempotency check
→ transactional state transition
→ subscription/invoice/order activation
→ receipt and notifications
→ reconciliation, refund, or recovery path
```

**Known surfaces:** checkout routes, `src/lib/mercadopago.functions.ts`, payment utilities/config, Paddle modules (non-canonical), payment HTTP routes, Mercado Pago and initial-checkout Edge Functions, refund Edge Function, webhook idempotency helper, Colors MaisFy-oriented webhooks.

**External systems (canonical intent — `DECLARED`):** see [`../phase-0/PAYMENTS-CANONICAL.md`](../phase-0/PAYMENTS-CANONICAL.md).

- Impulsionando SaaS → Mercado Pago  
- Tenant commerce → tenant-owned gateway via Core  
- Colors → MaisFy (not MP parallel checkout)  
- CHRISMED → Mercado Pago **segregated** from Core  
- Paddle → not canonical  
- Monetizze/PerfectPay → Colors history/ops only  

**Expected output:** money and internal state reconcile exactly once. Browser values never decide authoritative price, tenant, plan, or paid status.

**Known failure modes:** duplicate webhook, out-of-order events, unsigned event, wrong tenant / wrong MP account (Core vs CHRISMED), timeout after provider success, internal success before provider confirmation, refund divergence, sandbox/production confusion, Colors traffic incorrectly routed to MP.

**Missing proof:** live prod/sandbox account homologation, event contracts, signature verification, idempotency keys, source-of-truth tables, reconciliation job, refund authorization, test fixtures, named credential owners (without secrets in Git).

## J-06 — WhatsApp, e-mail, Meta, and notification delivery

**Actors:** user, tenant operator, automated journey, external channel provider.

```text
business event or manual action
→ recipient/consent/template resolution
→ tenant channel configuration
→ dispatch/outbox record
→ n8n, worker, or direct adapter
→ provider
→ delivery/status callback
→ delivery event, retry, dedupe, and audit
```

**Known surfaces:** communication endpoints, public send endpoint, e-mail endpoint/templates, n8n dispatch and callback modules, Evolution/WhatsApp services, Meta tenant hooks, communication tables, Chrismed communication Edge Function.

**Expected output:** the correct tenant identity sends one authorized message to a consented recipient, with status and failure visible.

**Missing proof:** active provider and instance inventory, credentials owner, opt-in/opt-out rules, templates, sender identity, retry limits, dedupe keys, fallback-human behavior, PII retention.

## J-07 — Scheduled automation, outbox, worker, and n8n execution

**Actors:** scheduler, worker, n8n, platform operator.

```text
schedule or committed business event
→ authenticated trigger or durable queue/outbox
→ bounded claim/lease
→ idempotent handler
→ database and/or integration action
→ completion, retry, dead letter, or reconciliation
→ metrics and audit
```

**Known surfaces:** 41 cron/tick candidates, public hooks, outbox processor, Pulsonitor worker, Colors automation worker, n8n dispatch/callbacks, GitHub scheduled workflows.

**Expected output:** one logical action despite retries or concurrent callers; web lifecycle and worker lifecycle remain independent in the target.

**Known current risk:** the legacy runtime may start web and workers together. A web-only diagnostic previously started workers accidentally, demonstrating the coupling risk.

**Missing proof:** scheduler identity, active jobs, frequency, lock/lease behavior, batch bounds, timeout, retry/dead letter, side effects, external consumers, owners.

## J-08 — Chrismed scheduling, care, records, documents, and fiscal flow

**Actors:** visitor, patient, professional, clinic/occupational operator, Chrismed admin.

```text
public clinic/professional/specialty surface
→ specialty decision/request or appointment selection
→ patient identity/contact
→ professional/resource availability
→ appointment or event
→ attendance/teleconsultation/record
→ document delivery or Drive/Storage synchronization
→ payment/payout/fiscal/communication where applicable
```

**Known public surfaces:** clinic, specialties, doctors, exams, home care, occupational medicine, events, scheduling, teleconsultation, checkout, account, documents.

**Known operational surfaces:** patient management, professional onboarding/finance/records, appointments, protocols, teleconsultation, occupational management, event check-in, fiscal, WhatsApp, Google Drive, payouts.

**Expected output:** the correct patient and authorized professional can complete the care flow without exposing another patient’s medical or fiscal information.

**Missing proof:** canonical appointment and patient records, professional membership, conflict prevention, token behavior, record access, document bucket/Drive policies, consent, retention, fiscal ownership, incident path.

## J-09 — Colors catalog, order, affiliate, webhook, automation, and AI flow

**Actors:** visitor, customer, affiliate, Colors operator, sales provider, AI user.

```text
brand/catalog/product
→ account or purchase intent
→ order/payment provider
→ sales webhook
→ deduplicated order/opportunity state
→ tracking/account display
→ affiliate attribution/commission
→ automation and communication
```

Parallel AI path:

```text
user question
→ Iris chat endpoint
→ tenant/user context
→ model/tools/data
→ answer or controlled action
```

**Known surfaces:** product, account, order, tracking, affiliate, event, agenda routes; Colors sales-provider webhooks; automation tick/worker; Colors contacts/opportunities tables; Iris endpoint.

**Missing proof:** canonical order/payment source, webhook signatures, attribution window, commission reconciliation, automation scheduler, AI data/tool boundaries, production provider ownership.

## J-10 — WMP quote, proposal, contract, operation, whereabouts, and evidence

**Actors:** customer/company, partner, DJ, WMP operator.

```text
public packages/quote/partner entry
→ lead or briefing
→ proposal creation and delivery
→ acceptance
→ contract token/signature
→ agenda and equipment allocation
→ operation/event execution
→ whereabouts update and evidence upload
→ completion, communication, and financial follow-up
```

**Known surfaces:** packages, quote, company, DJ, partner, proposal, contract, agenda, equipment, operation, briefing evidence, whereabouts, conversation protocol, Millito chat.

**Expected output:** proposal, accepted commercial terms, contract, assigned resources, and evidence refer to the same authorized customer/event and cannot be accessed by guessing a token or ID.

**Missing proof:** proposal-to-contract state machine, token entropy/expiry, signature authority, equipment conflicts, location consent, evidence Storage policy, completion and billing transition, owner.

## J-11 — Ana Madu catalog, order, PIX, and artisan request

**Actors:** shopper, customer, artisan/operator.

```text
catalog/product detail
→ order composition
→ server-side price/availability validation
→ PIX/payment creation
→ payment confirmation
→ order fulfillment state
→ customer communication
```

Alternative path: product or customization request → artisan request → follow-up.

**Known surfaces:** catalog, product detail, order, PIX order, artisan request, media migration, Anita chat.

**Missing proof:** data tables, price authority, inventory, PIX provider, webhook/reconciliation, customer identity, fulfillment, media ownership, AI boundary.

## J-12 — RioMed catalog, quote, sale, service, event, and AI

**Actors:** buyer/hospital, patient, vendor, technician, RioMed operator.

```text
product/catalog or quote entry
→ cart/quote
→ checkout or sales follow-up
→ order/event state
→ delivery/warranty/service
→ receivables and communication
```

**Known surfaces:** products, cart, quote token, checkout, vendors, hospitals, support/service, warranties, abandoned carts, overdue receivables, broadcasts, FX updates, events, Medicito upload/chat.

**Missing proof:** canonical commerce records, quote-token authorization, currency source, checkout provider, warranty ownership, service workflow, broadcast consent, AI upload/data retention.

## J-13 — Support ticket, incident status, and subscriber notification

**Actors:** public user, authenticated user, support operator, status subscriber, incident operator.

```text
support request or monitoring event
→ ticket/incident validation
→ ownership and priority
→ response/update
→ status publication
→ subscriber/webhook dispatch
→ retry, unsubscribe, closure, and audit
```

**Known surfaces:** public support ticket endpoint, support/admin routes, status pages/RSS/badges, subscriber preferences, status webhooks, maintenance and reliability hooks/tables.

**Missing proof:** support system of record, abuse control, PII handling, SLA, incident owner, subscriber consent, webhook retry limits, public/private incident separation.

## J-14 — AI conversation and controlled action

**Actors:** user, tenant operator, patient/customer where applicable, AI model, tool executor.

```text
authenticated or public chat request
→ abuse/rate and identity check
→ tenant and capability context
→ approved data retrieval
→ model inference
→ answer OR registered tool proposal
→ authorization re-check
→ execution/approval
→ audit, cost, feedback, and retention
```

**Known assistants:** Impulsionito, Iris, Anita, Medicito, Millito, Investito and other AI-related admin surfaces (Oliver, Maruquito, plus related admin/capability surfaces).

**Static inventory (not characterization):** [`../phase-0/AI-ASSISTANTS-INVENTORY.md`](../phase-0/AI-ASSISTANTS-INVENTORY.md) — 8 conversational runtimes + related AI surfaces cataloged from code; evidence level `STATIC`. Journey status remains **not CHARACTERIZED**.

**Expected output:** an answer or explicitly authorized action constrained to the current tenant and actor.

**Missing proof (still open after inventory):** live public exposure, rate limits, cost owner, retention, evals, prompt-injection controls, approval gates, allow/deny tests for tools and tenant isolation, production model confirmation, coupling of `core_ai_*` brains to niche runtimes. Inventory covers static providers/models/tools/data-source *paths* only — see inventory for hypotheses vs proven policy.

## J-15 — Release promotion, routing, validation, and rollback

**Actors:** Cauã and Raygs as approvers; CI/CD and deployment runtime as machines.

```text
reviewed commit
→ validated build
→ immutable SHA artifact/image
→ staging deployment
→ health/readiness and journey smoke
→ human promotion approval
→ production routing
→ external verification of domain/runtime/SHA
→ observation window
→ rollback to known artifact when necessary
```

**Current reality:** multiple GitHub workflows, a VPS publisher, Docker/systemd runtimes, Nginx, static directories, and divergent releases. Seven mutable workflows are contained.

**Missing proof:** one publisher, staging, immutable image promotion, database compatibility, complete host/SHA checks, rehearsed rollback, production owner/runbook.

## J-16 — Backup, isolated restore, and disaster recovery

**Actors:** backup scheduler, data owner, incident commander, recovery operator.

```text
defined backup scope
→ consistent snapshot/dump
→ encrypted storage and retention
→ integrity verification
→ isolated restore
→ application consistency checks
→ measured RPO/RTO
→ documented recovery decision
```

**Current reality:** VPS backup artifacts exist, but the last recorded daily workflow failed before the intended dump. A restorable Supabase backup has not been proven.

**Missing proof:** managed Supabase backup policy, point-in-time recovery, Storage coverage, n8n/Evolution state, encryption/access, isolated restore environment, restore test, measured RPO/RTO, owner.

