# Impulsionito Universal Runtime Contract

## Status
Normative architecture contract for Impulsionando Core and all tenant agent instances.

## Principle
Impulsionito is the continuous intelligence and execution layer of the ecosystem. Tenant agents are scoped instances of the same runtime, inheriting security, observability, lifecycle, journey, learning and action-governance capabilities while adding tenant-specific knowledge, brand, modules and business rules.

## Presence
Impulsionito or the tenant agent must be contextually available across:
- public discovery and registration;
- authentication and onboarding;
- acceptance of terms and contracts;
- checkout and billing;
- dashboards and configuration;
- CRM, ERP, POS, inventory and communication modules;
- support, tickets and financial restriction flows;
- customer-facing tenant experiences.

The UI pattern is a persistent, dismissible, minimizable assistant surface with compact presence and an expandable workspace. It must never be purely decorative.

## Context envelope
Every agent turn receives a server-derived context envelope containing only authorized data:
- tenant/company identity;
- actor identity and role;
- current route/screen/module;
- current workflow/onboarding step;
- enabled modules and capability maturity state;
- subscription/billing access state;
- relevant CRM lifecycle state;
- relevant operational KPIs;
- open tasks, tickets and alerts;
- active journeys and recent automation outcomes;
- approved knowledge scope;
- permitted actions and execution risk class.

Never trust client-supplied tenant, role or permission claims without server validation.

## Universal behavior
The agent must be capable of:
1. explaining the current screen and fields;
2. explaining terms, policies and responsibilities in plain language without replacing the source document;
3. identifying incomplete onboarding/configuration;
4. teaching unused capabilities;
5. interpreting dashboards and KPIs;
6. detecting risks and opportunities;
7. recommending the next best action;
8. executing authorized reversible actions;
9. opening or updating tickets when automation cannot safely resolve the issue;
10. escalating to human assistance only after safe automated resolution paths are exhausted or when policy requires human review.

## Agent hierarchy
- Impulsionito: Core/global control-plane intelligence.
- Tenant agent: scoped operational instance for each Impulsionando customer.
- End-customer agent: tenant agent acting for that tenant's customers within the tenant's policies and data boundary.

No tenant agent may access another tenant's private data or actions.

## Examples of tenant autonomy
### Hospitality/bar/retail
When POS/commerce data exists and consent/policy allow it, the tenant agent may identify consumption patterns, recommend retention actions and enqueue an approved voucher/offer journey. Automatic issuance or dispatch requires a configured campaign policy, eligibility rules, budget/discount limits, audit event and idempotency key.

### Health
Oliver may interpret operational messages and trigger deterministic workflows such as agenda blocks only when the sender, rule, scope and conflict checks are validated. Clinical, safety-sensitive or legally restricted decisions remain subject to the corresponding human/policy gate.

### Communication
Agents may read and classify messages from configured tenant mailboxes/channels and draft or send responses only within explicit sender, template, scope and risk policies. Secrets and credentials are never exposed to the model context.

## Action governance
Every executable capability is classified:
- READ: inspect and explain;
- RECOMMEND: propose an action;
- AUTO_SAFE: execute reversible, bounded, idempotent actions;
- APPROVAL_REQUIRED: prepare action and request authorized approval;
- HUMAN_REQUIRED: escalate because regulation, safety or policy requires it;
- FORBIDDEN: never execute.

Each execution records:
- tenant;
- actor/request source;
- agent instance;
- capability;
- input hash;
- policy decision;
- idempotency key;
- execution result;
- rollback/recovery reference when applicable;
- timestamps and correlation IDs.

## Learning
Learning is controlled, not self-modifying production code.
The agent may continuously create learnings, summaries, improvement proposals and capability proposals from observed outcomes. Promotion into global behavior requires evidence and the Core capability/review pipeline. Tenant-specific learning remains tenant-scoped unless explicitly generalized and reviewed.

## Proactivity
The agent continuously looks for actionable conditions such as:
- lead without follow-up;
- stalled opportunity;
- abandoned checkout;
- customer inactivity;
- churn risk;
- unused contracted module;
- failing workflow/integration;
- expiring credential/configuration;
- low stock or unusual consumption when the module supports it;
- overdue ticket/SLA;
- billing state requiring guidance;
- campaign opportunity backed by permitted data.

Proactive messages must be useful, frequency-controlled and consent-aware.

## Customer adoption loop
Observe -> Explain -> Guide -> Assist -> Execute (when authorized) -> Measure -> Learn -> Recommend next step.

The objective is not merely support. It is activation, adoption, retention and measurable business improvement.

## Human escalation
Before escalation the agent should attempt all safe capabilities available in its scope. Escalation is immediate when legal, clinical, financial-risk, security, privacy or explicit policy rules require a person.

When escalating, include a concise case summary, attempted actions, evidence, severity and recommended next action so the human does not restart diagnosis.

## Required integrations
The runtime should consume and coordinate, where configured:
- communication_agent_runtime;
- core_agent_instance_profiles;
- core_agent_work_items;
- core_agent_messages;
- core_agent_learnings;
- core_agent_committees and reviews;
- core_chat_scope_policies;
- core_client_chat_scopes;
- core_chat_execution_guards;
- crm_contact_lifecycle and history;
- n8n_workflow_registry and tenant_workflow_state;
- communication conversations/messages/templates;
- support tickets;
- billing/service access state;
- module/version rollout state;
- tenant knowledge and approved documents;
- analytics and operational metrics.

## Definition of done
An Impulsionito-enabled screen is not complete unless:
- the assistant knows the user's authorized context;
- it can explain the screen accurately;
- it can identify the next useful action;
- it can execute at least the permitted relevant safe actions or route them correctly;
- it cannot cross tenant/role boundaries;
- its actions are audited;
- its proactive behavior is rate-limited and consent-aware;
- human escalation preserves context;
- usage/outcome can be measured.
