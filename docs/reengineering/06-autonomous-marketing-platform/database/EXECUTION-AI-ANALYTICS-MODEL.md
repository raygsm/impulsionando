# Execution, AI and analytics data model

Created: **2026-09-04**
State: **PROPOSED logical model — not migration SQL**
Existing spine: [`../../04-migration/phase-5/README.md`](../../04-migration/phase-5/README.md) · AI authority: [`../../02-target-architecture/AI-READINESS.md`](../../02-target-architecture/AI-READINESS.md)

## 1. Communications

Communications is provider-neutral and linked to Contact/CRM.

| Table | Purpose |
| --- | --- |
| `communications.channel_connections` | Tenant/provider/channel, secret reference, sender identity, readiness/health |
| `communications.channel_identities` | Phone/email/webchat identity, verification, ownership and state |
| `communications.conversations` | Tenant, subject/contact, channel-neutral state, owner/team |
| `communications.conversation_participants` | Contact/user/agent/external party role |
| `communications.messages` | Direction, content reference, sender, occurred-at, classification |
| `communications.message_intents` | Draft/prepared/approved requested communication |
| `communications.delivery_attempts` | Provider attempt, idempotency and status |
| `communications.delivery_events` | Append-only submitted/delivered/read/failed evidence |
| `communications.templates` | Stable template identity/purpose/channel |
| `communications.template_versions` | Immutable published content/variables/policy |
| `communications.handoffs` | Agent/channel→human/team ownership transition |
| `communications.opt_out_events` | Channel/purpose opt-out evidence |
| `communications.routing_rules` | Versioned inbound queue/team/agent routing conditions |

Message content storage and retention depend on classification. Provider credentials are secret references in integration storage, never returned in connections.

WhatsApp, email, SMS, webchat and VoIP share the connection/conversation contracts, but each channel/purpose has its own consent, quiet-hours, recording, retention and regulatory policy. A generic channel type does not imply identical permission.

## 2. Tenant customer-service cases

Platform Support remains distinct from a tenant serving its customer. The tables below are a **future case-engine option pending P-DB-05**. Existing `support_tickets` remains the active platform Support adapter; do not create a second live platform-case authority without an accepted migration bridge.

| Table | Purpose |
| --- | --- |
| `cases.cases` | Explicit scope `platform_support` or `tenant_customer_service`, owner, requester, subject, priority/state |
| `cases.case_messages` | Conversation/history |
| `cases.case_events` | Append-only transition/assignment |
| `cases.sla_policies` | Versioned response/resolution clocks |
| `cases.sla_instances` | Due times, pause/resume and breach |
| `cases.satisfaction_requests/responses` | CSAT/NPS tied to case and program |

The existing Nest Support API remains platform Support until a migration decision maps it.

## 3. Integration connections

| Table | Purpose |
| --- | --- |
| `integrations.providers` | Global adapter/provider registry |
| `integrations.connections` | Tenant/provider/capability, secret reference, state/readiness |
| `integrations.connection_events` | Setup/ready/degraded/suspended history |
| `integrations.external_mappings` | Domain type/ID ↔ provider ID |
| `integrations.webhook_receipts` | Delivery ID, signature result, payload hash, processing state |
| `integrations.rate_limit_state` | Operational projection |
| `integrations.health_checks` | Last health result and correlation |

Connection state:

```text
unavailable → not_configured → configuring → ready → degraded → suspended → disconnected
```

Provider payload retention is explicit. Webhook replay uniqueness includes provider, tenant/connection and provider event ID/hash.

## 4. Canonical eventing

### `eventing.domain_events`

Immutable envelope:

```text
event_id uuid
event_type text
event_version integer
tenant_id uuid
aggregate_type text
aggregate_id uuid/text
aggregate_version bigint/null
occurred_at timestamptz
actor_kind/user-or-agent/system
actor_id
correlation_id
causation_id
payload jsonb (validated, minimized)
classification
```

Each `(event_type, event_version)` points to a registered runtime payload schema, maximum size and redaction policy. JSONB storage does not permit unversioned arbitrary payloads.

### Outbox/inbox

| Table | Purpose |
| --- | --- |
| `eventing.outbox_publications` | Publication state, attempts, lease and last error |
| `eventing.consumer_inbox` | Consumer/event deduplication |
| `eventing.idempotency_records` | Tenant/operation/key, request hash, result reference, expiry |

Domain mutation + audit + event + outbox share one transaction. A request reusing an idempotency key with a different hash is a conflict.

Existing `reengineering_event_outbox` and job ledger remain the adapter/initial implementation.

## 5. Jobs

pgmq remains the transport; canonical metadata provides operational truth:

| Table | Purpose |
| --- | --- |
| `eventing.jobs` | Logical job identity/type/tenant/correlation/state/idempotency |
| `eventing.job_attempts` | Attempt start/result/error classification |
| `eventing.dead_letters` | Terminal failure, payload reference and remediation |
| `eventing.job_effects` | Idempotent external/domain effect receipt |

Unknown job types do not silently succeed. Long-running work never shares SSR lifecycle.

## 6. Automation

Automation is platform-governed; n8n is an auxiliary executor/binding.

| Table | Purpose |
| --- | --- |
| `automation.workflow_definitions` | Stable tenant/global template identity |
| `automation.workflow_versions` | Immutable trigger/condition/action graph |
| `automation.workflow_triggers` | Registered event/schedule/manual trigger |
| `automation.workflow_actions` | Registered typed action and risk class |
| `automation.workflow_runs` | Version, trigger, tenant, correlation and outcome |
| `automation.workflow_step_runs` | Step input/output refs, attempt and result |
| `automation.schedules` | IANA timezone, recurrence, next occurrence |
| `automation.approval_bindings` | Actions requiring roles/capabilities |
| `automation.n8n_bindings` | External workflow ID/version/health only |

No arbitrary scripts/SQL/HTTP stored as tenant workflow steps. Actions call registered application commands. Changes produce new workflow versions.

## 7. Agent registry

### Identity/versioning

| Table | Purpose |
| --- | --- |
| `ai.agent_definitions` | Stable agent identity, kind and scope |
| `ai.agent_versions` | Immutable model profile, prompt/policy/knowledge/tool configuration |
| `ai.agent_activations` | Active version and state |

Recommended kinds/cardinality pending product decision P-DB-09:

```text
platform_parent  — exactly one active Impulsionito
tenant_internal  — exactly one active per active tenant
tenant_client    — zero or one active per tenant initially
```

“Specialized agents” start as versioned skill/tool/knowledge profiles under the tenant agent unless product explicitly approves multiple internal identities.

Do not enforce these cardinalities physically until P-DB-09 is accepted. The underlying model can represent multiple profiles while activation policy constrains the current product.

### Tools and policy

| Table | Purpose |
| --- | --- |
| `ai.tool_definitions` | Stable typed tool identity and owner context |
| `ai.tool_versions` | Input/output schema, capability and risk class |
| `ai.agent_tool_bindings` | Allowed tool/version by agent version |
| `ai.policy_definitions/versions` | Environment, action, budget and approval policy |
| `ai.budget_allocations/usage` | Tenant/agent/provider token/cost limits |

Client and internal agents cannot share effective tool bindings by accident.

### Context and conversations

| Table | Purpose |
| --- | --- |
| `ai.context_sessions` | Actor, tenant, agent, capability snapshot, expiry |
| `ai.conversations` | Scope, participant and retention policy |
| `ai.conversation_messages` | Role/content classification and provider reference |
| `ai.context_sources` | Fact source, freshness, classification and redaction used for a turn |
| `ai.knowledge_sources` | Tenant/platform scope, type, state and freshness |
| `ai.knowledge_documents/chunks` | Document/index references with tenant isolation |

Conversation memory cannot widen authorization.

### Actions, approvals and effects

| Table | Purpose |
| --- | --- |
| `ai.tool_calls` | Request/input hash, authorization decision, result and correlation |
| `ai.prepared_actions` | Typed non-executed draft |
| `ai.approval_requests` | Action/risk/requester/required approver/state/expiry |
| `ai.approval_decisions` | Append-only approver decision/reason |
| `ai.effects` | Idempotent effect lifecycle and receipt |
| `ai.effect_attempts` | Worker attempts/errors/reversal |

State:

```text
prepared → approval_pending → approved → executing → succeeded
                          └→ denied/expired             └→ failed/reversed
```

The current Phase 6 in-memory approval and sink are safe MVPs, not product persistence.

### Telemetry/evaluation

`ai.inference_spans`, `ai.feedback`, `ai.evaluation_runs/results`, `ai.usage_daily`.

Record model/profile/version, tokens, cost, latency, outcome and redaction metadata—never secrets. Raw prompts/tool outputs follow data-class retention.

## 8. Impulsionito delegation

Impulsionito does not have standing raw access to every tenant.

`iam.delegations` + tool call:

```text
staff actor
  → explicit tenant/reason/capability/expiry
  → delegated tool context
  → minimal result
  → audit + tool call record
```

Portfolio analytics use privacy-governed aggregate facts. Delegation is distinct from aggregate access.

## 9. Analytics architecture

Operational screens read context-owned projections. BI/reporting use append-oriented facts and dimensions.

### Dimensions

```text
analytics.dim_tenant
analytics.dim_unit
analytics.dim_date
analytics.dim_party        # minimized/non-PII
analytics.dim_campaign
analytics.dim_channel
analytics.dim_product
analytics.dim_module
analytics.dim_agent
```

### Facts

```text
fact_touchpoint
fact_lead_transition
fact_opportunity_transition
fact_task_completion
fact_communication_delivery
fact_appointment
fact_order
fact_fulfillment
fact_financial_posting
fact_payment
fact_stock_movement
fact_retention_signal
fact_case
fact_agent_usage
```

Every fact carries tenant, unit when applicable, event/business date/timezone, source system/object/record/event, ingestion time, transform version, quality state and optional confidence.

`dim_party` uses a **tenant-scoped pseudonymous analytical key** and never deduplicates or joins a person across tenants. Direct contact details do not enter the analytical dimension.

### Control

| Table | Purpose |
| --- | --- |
| `analytics.projection_definitions` | Owner, source events, contract and freshness SLA |
| `analytics.projection_checkpoints` | Last processed event/time |
| `analytics.projection_runs` | Rebuild/incremental run outcome |
| `analytics.metric_definitions` | Name, exact formula, grain, source, version |
| `analytics.metric_snapshots` | Optional point-in-time computed values |
| `analytics.data_quality_results` | Completeness/freshness/reconciliation |
| `analytics.lineage_edges` | Source→projection/fact lineage |
| `reporting.report_definitions` | Versioned report configuration |
| `reporting.export_requests` | Tenant/user/capability/filter/result/expiry |

## 10. Growth metrics

At minimum:

| Metric | Canonical source |
| --- | --- |
| Leads captured | `lead.captured` facts |
| Source/campaign | Touchpoint/attribution facts |
| Uncontacted | Lead + absence of qualifying interaction |
| Overdue follow-up | Open task past due |
| Qualified | Lead transition |
| Converted | Product-approved conversion event |
| Retention risk | Versioned retention signal |
| Reactivated | Reactivation outcome event |
| Revenue/value | Financial/sales facts with currency and quality state |

BI must answer what happened, why according to available evidence, and what action is supported. It must not produce causal certainty from correlation.

## 11. Data quality and UNKNOWN

`quality_state`:

```text
complete
partial
stale
conflicting
unknown
```

Every dashboard projection returns freshness/quality. Missing campaign spend, currency conversion or provider receipt is UNKNOWN, not zero.

## 12. Retention and deletion

| Data class | Default approach |
| --- | --- |
| Contact PII | Tenant policy + consent/legal basis; anonymizable |
| Communication content | Shorter explicit retention; provider/source classification |
| Financial/fiscal | Legal retention; PII minimization |
| Audit/events | Immutable, minimized, policy retention |
| AI prompts/tool results | Classification-based; not unlimited |
| Analytics facts | Minimized/pseudonymized where possible |
| Files | Checksum/classification/legal hold and deletion evidence |

Tenant closure is a controlled process; no cascade-delete all data.

## 13. Execution anti-patterns

- n8n writes domain tables;
- provider webhooks update multiple contexts directly;
- outbox inserted after commit;
- event payload contains whole customer/payment record;
- provider event ID not deduplicated;
- queue success without an effect receipt;
- mutable workflow definition applied retroactively;
- agent prompt as authorization;
- all-tenant rows loaded into Impulsionito;
- client agent shares internal tools;
- analytics projection is transactional truth;
- BI metric has no formula/version/source/freshness.

## 14. Existing objects to preserve first

```text
reengineering_event_outbox
reengineering_job_idempotency
reengineering_job_effects
reengineering_webhook_ingress
reengineering_communication_delivery
reengineering_crm_journey
reengineering_crm_invite
```

Adapters may preserve `communication_*`, `message_outbox/templates`, `core_ai_brains` and `n8n_*` after staging verification. Parallel authorities are retired capability by capability.
