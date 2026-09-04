# Data, events and automation

Created: **2026-09-04** · State: **PROPOSED**
Data authority: [`../04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md`](../04-migration/phase-8/DATA-AND-IDENTITY-PLAN.md) · Events contract: [`../04-migration/phase-1/CONTRACT-EVENTS-JOBS.md`](../04-migration/phase-1/CONTRACT-EVENTS-JOBS.md)

## 1. Goal

Create stable data and event seams now so advanced follow-up, retention, WhatsApp and workflow automation can be implemented later without rewriting the dashboard or product modules.

Dashboard V1 does **not** require a complete automation engine. It requires:

- canonical lifecycle facts;
- reliable domain events;
- deterministic action candidates;
- provider-neutral communication intents;
- durable jobs/outbox;
- explicit readiness and delivery state.

## 2. Canonical entities

Prefer adapters over destructive consolidation of the legacy schema.

| Entity | Owns | Must not own |
| --- | --- | --- |
| Tenant | Company identity, niche, locale, configuration | User authorization or provider credentials |
| Membership | User↔tenant relationship and role assignment | Mutable profile metadata as authorization |
| Contact | Person/organization identity, contact points, consent | Lead pipeline or every niche record |
| Lead | Acquisition record, source, campaign, qualification | Canonical contact identity |
| Opportunity | Commercial lifecycle and expected value | Invoice/payment truth |
| Interaction | Authorized communication/activity fact | Provider credential |
| Task | Human/agent-prepared work and completion | Workflow definition |
| Campaign | Objective, audience reference, period, state, outcome links | Provider execution claim |
| Appointment | Time/resource commitment | Clinical record |
| Order | Commercial commitment and fulfillment state | Provider settlement |
| Receivable/Payable | Financial obligation | Provider payment event |
| Payment | Provider-neutral collection/settlement state | Billing contract rules |
| Document | Metadata and domain link | Unscoped file access |
| RetentionSignal | Evidence that a contact is active/at-risk/inactive/eligible | Final autonomous decision |

## 3. Lifecycle and attribution

Every conversion-capable module links outcomes to the customer lifecycle:

```text
source → campaign → lead → contact → opportunity
  → appointment/order/contract
  → fulfilled/attended
  → receivable/payment
  → repeat/inactivity/reactivation
```

Attribution may be incomplete. Store facts and confidence/source rather than manufacturing certainty.

Required cross-domain references:

- `tenantId`;
- `contactId`;
- optional `leadId`, `opportunityId`, `campaignId`;
- source/medium/campaign identifiers when present;
- originating event and correlation ID;
- occurred-at timestamp and business timezone.

## 4. Initial event catalog

Names are proposals; contracts must be versioned before implementation.

### Acquisition and CRM

- `contact.created`, `contact.updated`, `contact.consent_changed`;
- `lead.captured`, `lead.qualified`, `lead.assigned`;
- `opportunity.created`, `opportunity.stage_changed`, `opportunity.won`, `opportunity.lost`;
- `task.created`, `task.due`, `task.completed` (follow-up is a task purpose/link, not a separate event namespace);
- `campaign.created`, `campaign.activated`, `campaign.completed`;
- `retention.risk_detected`, `retention.reactivation_eligible`, `retention.reactivated`.

### Operations and ERP

- `appointment.booked`, `appointment.confirmed`, `appointment.cancelled`, `appointment.no_show`, `appointment.completed`;
- `order.created`, `order.confirmed`, `order.fulfilled`, `order.cancelled`;
- `inventory.low`, `inventory.movement_recorded`;
- `receivable.created`, `receivable.overdue`, `receivable.settled`;
- `invoice.issued`, `billing.payment_failed`, `billing.service_state_changed`;
- `document.added`.

### Communications and platform

- `communication.requested`, `communication.prepared`, `communication.dispatched`, `communication.delivered`, `communication.failed`;
- `ticket.created`, `ticket.status_changed`;
- `module.configured`, `module.activated`, `module.degraded`, `module.disabled`;
- `integration.ready`, `integration.degraded`;
- `agent.action_prepared`, `agent.action_approved`, `agent.action_executed`, `agent.action_failed`.

Events describe facts that already occurred. Requests to make something happen are **commands/jobs**, not past-tense events.

## 5. Event envelope

Use and extend the existing Phase 5 contract:

```ts
interface DomainEvent<T> {
  eventId: string
  eventType: string
  eventVersion: number
  tenantId: string
  aggregateType: string
  aggregateId: string
  occurredAt: string
  actor: { kind: 'user' | 'agent' | 'system'; id: string }
  correlationId: string
  causationId?: string
  data: T
}
```

Sensitive data is minimized. Events carry identifiers and necessary facts, not full records or credentials.

## 6. Automation seam

Future automation evaluates:

```text
domain event
  → eligible workflow definitions
  → tenant/module/policy/readiness check
  → deterministic condition evaluation
  → action request
  → safe execution or approval
  → result event and audit
```

Dashboard V1 implements only:

- event production;
- a registry of future trigger/action types;
- deterministic daily action candidates;
- prepared communication/campaign actions;
- approval UI over the existing gated-effects model;
- sink/allowlisted execution in staging.

Deferred:

- visual workflow builder;
- arbitrary tenant scripts;
- unrestricted n8n workflow generation;
- mass communication;
- autonomous payment, suspension or fiscal actions.

## 7. Integration ports

| Port | Stable responsibility | Provider decision |
| --- | --- | --- |
| `MessagingPort` | Connection, prepare, dispatch, delivery receipt | WhatsApp provider **deferred**; email adapter may start with staging sink |
| `PaymentPort` | Intent, status, refund request, webhook normalization | Existing Paddle/Mercado Pago adapters to reconcile |
| `CalendarPort` | External calendar sync | Deferred |
| `DocumentPort` | Store/read signed document references | Supabase Storage with scoped policies |
| `AutomationPort` | Publish event or request auxiliary orchestration | n8n auxiliary, not domain authority |
| `ModelPort` | Provider-independent inference/streaming | Existing Phase 6 adapter |

Product modules import ports, never provider SDKs.

The accepted target architecture names Evolution API as an available WhatsApp transport. “Provider deferred” here means Dashboard V1 does not make Evolution—or any vendor—the product contract or activate a production channel. An existing transport may later implement `MessagingPort` after its own connection, security and operational gate.

## 8. Supabase and security rules

- RLS on every table in an exposed schema.
- Browser clients never receive service-role credentials.
- Authorization data comes from trusted server state/app metadata, not user-editable metadata.
- Views exposed to clients use `security_invoker = true` where supported, or access is revoked and the view kept private.
- Privileged/security-definer functions should live in a private/unexposed schema; existing exposed functions require review per slice.
- UPDATE policies include the necessary SELECT visibility.
- Storage upsert requires INSERT + SELECT + UPDATE policies.
- The Nest service-role client bypasses RLS, so server tenant/capability guards and deny tests remain mandatory.

## 9. Dashboard read models

Dashboard projections may be materialized or queried, but each must declare:

- source tables/events;
- tenant filter;
- refresh/freshness;
- timezone;
- unknown/degraded semantics;
- reconciliation procedure;
- backfill strategy;
- authorization at aggregate and drill-down levels.

Do not expose a platform aggregate view to tenants. Impulsionito's portfolio aggregates and tenant dashboard aggregates are separate contracts.

## 10. Idempotency and replay

| Operation | Requirement |
| --- | --- |
| Lead capture | Same source event/idempotency key creates one lead |
| Message dispatch | Same approved intent produces at most one provider attempt per policy |
| Payment webhook | Replay updates one normalized payment state |
| Appointment booking | Concurrent claims cannot double-book |
| Inventory movement | Replay cannot double-decrement |
| Billing cycle | Same cycle key cannot duplicate invoices |
| Agent effect | Approval/execution has one durable effect record |

Every handler is safe under at-least-once delivery before it is connected to automation.

## 11. Health and observability

Each adapter and workflow exposes:

- configured vs ready;
- last successful operation;
- last failure category and correlation ID;
- queue/outbox lag;
- retry/DLQ count;
- rate/cost signals when relevant;
- manual remediation path.

A green HTTP endpoint is not enough. Dashboard module readiness consumes these signals and can become `DEGRADED`.
