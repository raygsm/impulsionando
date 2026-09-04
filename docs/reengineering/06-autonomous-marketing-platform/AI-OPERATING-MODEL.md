# AI operating model

Created: **2026-09-04** · State: **PROPOSED**
Technical authority: [`../02-target-architecture/AI-READINESS.md`](../02-target-architecture/AI-READINESS.md) · Phase 6 evidence: [`../04-migration/phase-6/README.md`](../04-migration/phase-6/README.md)

## 1. Product rule

Every company receives an internal business agent. A company may also enable a separate client-facing agent. Impulsionito is the parent/platform operations agent.

All three use the shared AI runtime. They are configurations and policy scopes, not separate application instances and not necessarily separate model providers.

| Agent kind | Required population | Audience / frontend | Default scope |
| --- | --- | --- | --- |
| `platform_parent` — Impulsionito | **One for the platform**, not one per tenant | Authorized Impulsionando staff in `app-web` staff console | Platform catalog, operational health, aggregate metrics, support and explicitly delegated tenant operations |
| `tenant_internal` — Business Agent | **One configuration for every tenant** | Authorized tenant users in `app-web` | One tenant, further limited by the requesting user's capabilities |
| `tenant_client` — Client Agent | Optional per tenant | Final consumers / anonymous or consumer-authenticated in `tenant-web` | Public business knowledge and consumer/session-owned resources only |

## 2. Impulsionito

Impulsionito is the functional operator of the Impulsionando platform:

- tenant lifecycle and configuration;
- plan/module/readiness status;
- integration and service health;
- support and incidents;
- aggregate adoption, growth and operational metrics;
- agent registry, usage, cost and errors;
- delegated support for a specific tenant when an authorized staff user requests it.

### What “context from all businesses” means safely

It may include:

- tenant registry and configured capabilities;
- health/readiness/degraded state;
- aggregate or de-identified portfolio metrics;
- support state and incidents;
- billing/plan operational status under staff capability;
- agent/runtime telemetry.

It does **not** mean loading all leads, messages, medical details, documents, payment details or raw customer rows into a standing prompt.

Raw tenant data is accessed only through a tenant-scoped tool call that carries:

1. authenticated staff actor;
2. declared reason and tenant target;
3. required platform and data capability;
4. bounded input/output schema;
5. audit and correlation ID;
6. retention/redaction policy;
7. result minimization.

The model cannot elevate itself from portfolio context to tenant detail.

## 3. Internal business agent

One durable configuration per tenant, always present.

### Dashboard V1 responsibilities

| Class | Examples |
| --- | --- |
| READ | Explain growth metrics, list overdue follow-ups, summarize agenda/receivables, find a customer |
| RECOMMEND | Rank today's actions, identify retention opportunities, suggest a campaign audience |
| PREPARE | Draft a follow-up, email template, task list or campaign brief |
| HUMAN_REQUIRED | Hand off a customer conversation or operational exception |

Execution is added later through existing Phase 6 classes:

- `AUTO_SAFE`: reversible, bounded and idempotent;
- `APPROVAL_REQUIRED`: consequential but supported;
- `FORBIDDEN`: denied regardless of prompt.

`PREPARE` is a product behavior, not a new execution-risk class: it maps to Phase 6 `RECOMMEND` while returning a typed, non-executed draft. The existing accepted classes remain authoritative until a later ADR changes them.

The agent's effective tools are:

```text
agent configured tools
  ∩ tenant enabled modules
  ∩ integration readiness
  ∩ requesting user's capabilities
  ∩ environment safety policy
  ∩ tool risk policy
```

## 4. Client-facing agent

Optional and unique in identity, knowledge and policy for each business.

### Allowed capability families

- public FAQ, business hours and services;
- catalog/service discovery;
- lead qualification and consent capture;
- appointment availability and booking when enabled;
- order/support status owned by the authenticated consumer;
- ticket creation and human handoff.

### Denied by default

- tenant dashboard or staff data;
- other consumers' records;
- internal notes, margins, campaign audiences or team details;
- arbitrary customer lookup;
- refunds, discounts, payment changes or schedule overrides without explicit governed tools;
- clinical diagnosis, investment recommendations or unsupported claims;
- arbitrary HTTP, SQL or provider credentials.

Anonymous sessions receive only public tools. Consumer-authenticated sessions receive resource-scoped tools after ownership is revalidated by the API.

## 5. Agent registry

Phase 6 currently serves a seeded agent configuration and keeps approvals/telemetry in memory. Product operation requires durable state.

```ts
interface AgentDefinition {
  id: string
  tenantId: string | null
  kind: 'platform_parent' | 'tenant_internal' | 'tenant_client'
  displayName: string
  status: 'draft' | 'active' | 'degraded' | 'suspended'
  policyVersion: string
  promptVersion: string
  modelProfile: string
  knowledgeSourceIds: string[]
  allowedToolIds: string[]
  handoffPolicyId: string
  retentionPolicyId: string
}
```

Provider credentials are referenced by a server-side credential binding. They are never returned, embedded in prompts, or stored in agent definitions.

Required durable records:

- agent definition and version;
- knowledge-source registry and freshness;
- conversation/session metadata;
- tool call request/result/audit;
- prepared action and approval state;
- token/cost/latency/outcome telemetry;
- feedback and evaluation result.

## 6. Context assembly

Context is assembled server-side for every turn:

```text
request
  → authenticate actor/session
  → resolve tenant and agent kind
  → compute actor capabilities and tenant entitlements
  → select policy and tool registry
  → fetch minimal fresh context through authorized queries
  → invoke provider
  → validate tool request
  → re-authorize tool at execution time
  → audit and return
```

Rules:

- prompt text is not authorization;
- model output is untrusted input;
- every tool revalidates tenant, actor, capability and resource ownership;
- stale/absent facts are labelled, not invented;
- sensitive fields are redacted before provider invocation;
- conversation memory cannot widen authorization;
- changing active tenant creates a new context boundary.

## 7. Knowledge

| Knowledge class | Example | Isolation |
| --- | --- | --- |
| Platform public | Product docs and module descriptions | Shared |
| Platform operational | Runbooks, service health, tenant registry | Staff only |
| Tenant business | Services, policies, playbooks, templates | One tenant |
| Tenant operational | CRM, agenda, finance summaries | One tenant + user capability |
| Consumer | Consumer-owned appointment/order/ticket | One consumer/session |

RAG indexes, if used, are tenant-isolated. Shared vectors never contain tenant-private content.

## 8. Delegation

Delegation is a runtime call, not agent-to-agent free conversation.

```text
Impulsionito
  → requests `delegate.tenant_summary`
  → gateway verifies staff actor + target tenant + reason
  → executes tenant-scoped read tools
  → returns minimized structured result
  → records audit
```

The parent does not receive a child's credentials or bypass its policy. A business agent may prepare a handoff to the client agent or a human, but cannot silently impersonate either.

## 9. WhatsApp and email

The agent talks to a generic communication port:

```ts
interface MessagingPort {
  connectionStatus(tenantId: string, channel: Channel): Promise<ChannelStatus>
  prepare(message: MessageIntent): Promise<PreparedMessage>
  dispatch(approved: ApprovedMessage): Promise<DeliveryReceipt>
}
```

Dashboard V1 supports `connectionStatus` and `prepare`. `dispatch` remains sink/allowlisted staging until a provider and operational gate are accepted.

Email templates are versioned content with declared variables. The agent may draft a version; an authorized user approves publication or sending according to policy.

## 10. Reformulation of the existing AI module

| Existing asset | Keep | Change |
| --- | --- | --- |
| Capabilities/policy/tools endpoints | Yes | Scope by `AgentKind` and durable policy version |
| `SupabaseAuthGuard` + tenant membership | Yes | Add capability and resource guards |
| Tool risk classes | Yes | Add `PREPARE` as product behavior or represent it as non-executing recommendation output |
| Deterministic stub provider | Yes for tests | Add provider adapter behind environment policy |
| Tenant agent seed | No as product storage | Replace with durable registry and compiler-produced agent config |
| In-memory telemetry | No for operations | Persist sampled telemetry and aggregate metrics |
| In-memory approvals | No for consequential actions | Durable approval store before real effects |
| Effect worker sink | Yes as safety default | Add real handlers only per separately approved action |

This is an extension of Phase 6, not a replacement.

## 11. Tests and gates

Required tests for every agent kind:

- allow: authorized fact/tool in the correct scope;
- deny: cross-tenant, cross-consumer and missing capability;
- prompt injection: content cannot alter tool scope;
- stale context: response marks unknown/degraded;
- tool tampering: model-supplied tenant/resource identifiers are ignored or revalidated;
- secret redaction;
- cost/rate limit and kill switch;
- human handoff;
- audit correlation;
- provider failure degrades without fabricating success.

Impulsionito additionally requires a test proving portfolio summary access does not imply raw tenant-row access.

## 12. Explicit prohibitions

- One omniscient prompt containing all tenant data;
- a model or provider key as authorization;
- per-tenant `service_role` exposure;
- arbitrary SQL or unrestricted HTTP tools;
- client-facing agent sharing the internal agent's tool registry;
- tenant agents calling each other directly;
- silent execution of communication, payment, suspension, clinical or investment actions;
- claims that a message was sent or an action occurred without an execution receipt.
