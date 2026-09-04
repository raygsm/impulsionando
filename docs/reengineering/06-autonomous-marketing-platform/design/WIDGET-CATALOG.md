# Widget catalog

Created: **2026-09-04**  
Every widget uses the **same state machine**. Do not display unknown data as zero.

## Shared states

| State | UI | Click |
| --- | --- | --- |
| Loading | Skeleton matching size; `aria-busy` | none |
| Empty | Caption + optional CTA | CTA |
| Error | Retry button | retry |
| Forbidden | Lock icon + “Sem permissão” | none or request access `OPEN` |
| Configuring | Info badge + Settings link | Settings → Modules |
| Degraded | Warning badge + Integrations | Integrations |
| Unknown-data | Help icon + **Sem dados** (never `0`) | none, or “O que falta?” help |
| Active | Real values | destination |

Agent: unless noted, “Explique este cartão” is available when Active or Unknown.

Sizes: S/M/L/XL from tokens.

---

## W01 — Daily briefing

| Field | Value |
| --- | --- |
| Purpose | Orient the morning |
| Data | Greeting, date, 3 highlights |
| Module | Home (always if session) |
| Capability | `context` / briefing API — UNKNOWN if missing |
| Sizes | XL, L |
| Destination | Highlight targets |
| Agent | Summarize today; do not execute |
| Mobile | Full width, 3 bullets max |

## W02 — Attention queue

| Field | Value |
| --- | --- |
| Purpose | Human work list |
| Data | Ranked items: title, reason, due, severity |
| Module | Home |
| Capability | queue/manifest — UNKNOWN if missing |
| Sizes | M, L |
| Destination | Item object |
| Mobile | Full list, 5 visible + “Ver todas” |

## W03 — Agent entry

| Field | Value |
| --- | --- |
| Purpose | Open internal agent with identity visible |
| Data | Agent name, tenant, health |
| Module | Agent entitlement / flags |
| Capability | `GET /api/v1/ai/agents/:tenantId` |
| Sizes | S, M |
| Destination | Opens panel |
| Unavailable | Degraded/unavailable card, handoff to Help |

## W04 — Funnel: Aquisição

Leads in / channel. Module `crm` or `marketing`. Destination `/growth/leads`. UNKNOWN cost if no attribution.

## W05 — Funnel: Follow-up

Overdue and due today. Module `crm`. Destination `/growth/follow-up`.

## W06 — Funnel: Conversão

Won/scheduled. Module `crm`. Destination `/growth/conversion`.

## W07 — Funnel: Retenção

At-risk / winback eligible. Module `crm`/`marketing`. Destination `/growth/retention`.

## W08 — Next-best actions

1–3 verbs. Mix of links and PREPARED cards. Size M/L.

## W09 — Agenda today

**Restaurant/clinic/real-estate when agenda enabled.** Appointments today, no-shows if known. Module `agenda`. Destination `/operations/agenda`. Empty: “Nenhum compromisso hoje.”

## W10 — Orders / fulfillment

Restaurant/store. Open orders, delayed. Module `sales`/`ops`. Destination `/operations/orders`.

## W11 — Inventory alerts

Low stock. Module `inventory`. Destination `/operations/inventory`. Never show 0 remaining if the API is unknown — **Sem dados**.

## W12 — Conversations

Provider-neutral unread/failed. Communications flags. Destination provider-neutral inbox **UNKNOWN** if no Nest inventory — show configuring/degraded, never “WhatsApp conectado” without a receipt.

## W13 — Tickets (support)

Open tickets count. Help API exists. Destination `/help`.

## W14 — Payables due

Finance. Module `finance`. Forbidden for non-finance roles. Destination `/management/finance/payables`. Currency `tnum`.

## W15 — Receivables due

Same as W14, receivables.

## W16 — Team workload

Tasks per person (names the user can see). Module `ops`. Destination `/operations/workload`.

## W17 — Campaign performance

Sends/replies if known. Module `marketing`. Attribution missing → UNKNOWN. Destination `/growth/campaigns`.

## W18 — Pipeline snapshot

Counts per stage. Module `crm`. Destination `/customers/pipeline`.

## W19 — Documents expiring

Real-estate/clinic. Module `documents`. Destination `/management/documents`.

## W20 — Module health strip

List of non-ACTIVE entitled modules. Size XL. Destination Settings.

---

## Blueprint defaults (not forks)

| Blueprint | Default optional widgets (in addition to W01–W08, W13, W20) |
| --- | --- |
| Restaurant | W10, W11, W09 (no-shows) |
| Medical clinic | W09, W13, W19 |
| Real estate | W05/W18, W19, W16 |

Terms swap via copy deck (`leads` vs `pacientes` vs `interessados`) — same widget IDs.

## Click rules

- Whole card is clickable only if a single destination exists; otherwise the title is the link and the body is static.
- Forbidden cards are not clickable.

## Charts inside widgets

Optional; if used, include a table alternative. No sparklines as the only content.
