# Dashboard V1

Created: **2026-09-04** · State: **PROPOSED — first product implementation target**
Product: [`PRODUCT-MODEL.md`](./PRODUCT-MODEL.md) · Modules: [`CAPABILITY-MODULES.md`](./CAPABILITY-MODULES.md)

## 1. Goal

Deliver one useful, data-backed dashboard for every company before building advanced automation.

Dashboard V1 must let an owner answer in one place:

1. What happened?
2. What needs attention today?
3. Where are customers entering and leaving the lifecycle?
4. What operational constraint affects growth?
5. What does the business agent recommend next?

It is not a portfolio of legacy dashboards. The six legacy `dashboards.*`, three `insights.*`, cockpits, radar and 57 staff health pages are inputs to consolidate, not routes to reproduce.

## 2. Information architecture

Navigation positions stay invariant. Items inside them are capability-driven.

| Area | Always visible | Optional destinations |
| --- | --- | --- |
| **Home** | Daily overview, action queue, business agent | — |
| **Growth** | Overview, leads, campaigns, retention | Attribution, segments, experiments |
| **Customers** | Contacts and timeline | CRM pipelines, opportunities, conversations |
| **Operations** | Daily tracking and tasks | Agenda, sales/orders, fulfillment, inventory |
| **Management** | Company and team | ERP group: finance, billing, payments, products, inventory, documents and reports |
| **Help** | Tickets and product help | Knowledge base |
| **Settings** | Profile, company, access | Modules, integrations, agent configuration |

An unavailable module does not leave a broken navigation item. Upgrade discovery is separate from operational navigation.

## 3. Home composition

### Row 1 — business state

| Widget | Always | Source | Purpose |
| --- | --- | --- | --- |
| Daily briefing | Yes | Aggregated dashboard query + agent summary | Plain-language state of the business |
| Attention queue | Yes | Tasks, overdue follow-ups, integration/module health | Prioritized work, not raw notifications |
| Business agent | Yes | Tenant business-agent session | Ask, explain, prepare an action |

### Row 2 — growth funnel

| Widget | Always | Minimum data |
| --- | --- | --- |
| Acquisition | Yes | New leads by period and source |
| Follow-up | Yes | Uncontacted and overdue leads, response time |
| Conversion | Yes | Qualified and converted counts/value |
| Retention | Yes | Active, at-risk, inactive and reactivated customers |

When campaign spend or attribution is not integrated, show “source unavailable” / **UNKNOWN**. Do not calculate a false ROI from incomplete data.

### Row 3 — optional operational signals

The manifest selects from:

- agenda today, cancellations and no-shows;
- orders pending, delayed or ready;
- service/fulfillment blockers;
- stock low/out;
- accounts receivable and overdue;
- accounts payable due;
- billing failures;
- team workload and overdue tasks;
- unread conversations and failed deliveries;
- open/urgent tickets.

Modules determine availability; role capabilities determine visibility.

### Row 4 — next-best actions

Actions are deterministic before they are AI-generated:

- contact unhandled leads;
- follow up overdue opportunities;
- confirm tomorrow's appointments;
- resolve failed communication deliveries;
- collect overdue receivables;
- replenish items that block sales;
- reactivate eligible inactive customers;
- complete missing module/integration setup.

The agent may explain, rank or draft these actions. It does not invent them from prompt context.

## 4. Required detail pages

Dashboard V1 includes functional destinations, not only cards.

| Area | V1 pages | Write scope |
| --- | --- | --- |
| Growth | Overview, leads, campaigns index/detail, retention audiences | Create/edit lead and campaign metadata; schedule/send deferred unless adapter ready |
| Customers | Contacts index/detail, interaction timeline, follow-ups | Create/update contacts and follow-up tasks |
| Operations | Today, tasks, optional agenda/order summary | Task lifecycle; module writes only when migrated |
| Management | Team, company setup, module status, integration status | Team/config changes capability-gated |
| Management → ERP | Finance summary, payables, receivables, products, inventory, documents, billing summary | Migrated module writes only; otherwise read/degraded state |
| Help | Ticket list/detail/create | Existing Nest Support API |
| AI | Agent conversation/history, prepared actions, approvals | Read/recommend/prepare first |

## 5. Growth data contract

Dashboard V1 needs one read model rather than browser fan-out to many tables:

```ts
interface GrowthOverview {
  period: { from: string; to: string; timezone: string }
  acquisition: {
    leads: number
    bySource: Array<{ source: string; leads: number; qualified: number }>
    campaignSpend?: Money | UnknownMetric
  }
  followUp: {
    uncontacted: number
    overdue: number
    medianFirstResponseMinutes?: number | UnknownMetric
  }
  conversion: {
    qualified: number
    converted: number
    value?: Money | UnknownMetric
  }
  retention: {
    active: number
    atRisk: number
    inactive: number
    reactivated: number
  }
  freshness: DataFreshness[]
}
```

Every metric identifies its source and freshness. The API returns an explicit unknown/degraded state rather than substituting zero.

## 6. Campaigns in V1

V1 manages the business concept of a campaign even before every channel is integrated:

| Field | Meaning |
| --- | --- |
| Name, objective, owner | Operational identity |
| Audience/segment reference | Who it targets |
| Start/end and state | Draft, planned, active, paused, completed |
| Source/channel labels | How responses should be attributed |
| Offer/message summary | What is being communicated |
| Leads, conversions and value | Outcomes when linked data exists |
| Cost | Optional/imported until ad adapters exist |
| Workflow template reference | Future automation extension |

V1 may create, edit and measure campaign metadata. It must not claim that a campaign was sent when no channel adapter executed it.

## 7. Communication connection surface

Communication is prominent, but provider selection is intentionally deferred.

Settings → Integrations → Communications shows:

- channel: WhatsApp / email;
- connection state: unavailable, not configured, configuring, ready, degraded, suspended;
- sender identity (masked);
- last successful health check;
- last delivery and failure summary;
- permissions and owner;
- “Connect” action through an adapter-specific setup flow when one exists.

The dashboard depends on a generic `MessagingPort`, not on Evolution, Z-API, Meta Cloud API or another vendor.

V1 email scope:

- template library;
- template versions and variables;
- preview/test to an allowlisted staging sink;
- association with lifecycle event or future workflow;
- delivery-state visibility.

Advanced journeys and visual workflow editing are deferred.

## 8. Agent surface

The internal business agent appears in:

- global header/command entry;
- Home daily briefing;
- contextual “Ask about this” actions on widgets and detail pages;
- prepared-action review;
- approvals queue when gated effects open.

The agent response must surface:

- active tenant and user-visible agent identity;
- sources/freshness where facts are data-backed;
- capability unavailable/degraded states;
- whether the output is information, recommendation, prepared action or executed action;
- audit/correlation reference for an execution.

## 9. Empty, setup and degraded states

These are product states, not error afterthoughts.

| State | Example | Required response |
| --- | --- | --- |
| Empty | No leads yet | Explain capture options and provide a permitted first action |
| Configuring | WhatsApp entitled but not connected | Setup checklist; do not show messaging metrics |
| Degraded | Provider connected but health failing | Preserve history/read access, show failure and remediation |
| Forbidden | Operator lacks finance access | No finance values in payload or HTML |
| Unknown | Campaign spend unavailable | Explicit UNKNOWN and source requirement |
| Error | Query failed | Correlation ID and retry; no fabricated fallback data |

## 10. Responsive behavior

The dashboard remains the same product on desktop and mobile:

- desktop: persistent navigation, configurable-width widget grid;
- tablet: collapsible navigation, two-column grid;
- mobile: fixed primary areas, one-column priority order, agent and action queue reachable without horizontal scrolling.

Responsive mode may reorder widgets for usability but cannot change authorization or module availability.

## 11. V1 acceptance criteria

| # | Criterion |
| --- | --- |
| 1 | Two tenants with different niche presets receive the same shell but different server-generated manifests |
| 2 | Two roles in one tenant receive different data and actions; forbidden values never reach HTML |
| 3 | Core growth metrics include source/freshness and distinguish zero from UNKNOWN |
| 4 | At least CRM/contacts, tasks, tickets and one operational module provide real staging data |
| 5 | Every company has a configured internal business agent that can explain the dashboard using authorized tools |
| 6 | WhatsApp provider can remain undecided without blocking the dashboard; the connection port and states are stable |
| 7 | A module can move from configuring → active → degraded without redeploying the app |
| 8 | No dashboard component imports a privileged Supabase client or provider SDK |
| 9 | Every write is authorized, validated, audited and idempotent where replay is possible |
| 10 | Full-SHA `app-web` image is deployed and rollback to the prior route owner is rehearsed |

## Explicitly deferred

- Drag-and-drop dashboard customization;
- tenant-specific dashboard layouts;
- autonomous mass messaging;
- permanent WhatsApp provider decision;
- workflow builder;
- advanced attribution and ad-spend integrations;
- complete vertical operations inside Dashboard V1.
