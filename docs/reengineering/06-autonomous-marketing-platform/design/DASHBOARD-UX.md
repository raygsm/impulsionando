# Dashboard UX

Created: **2026-09-04**  
Universal dashboard — **one layout**. Niches change widgets, terms, and tenant action color, not structure.

## Why this hierarchy

Morning work is interruption-heavy. The first viewport must answer: **What needs me, on this company, right now?** Growth exploration is a second beat. Decorative KPI galleries fail that job (and copy the template we must restyle).

Pinned region order (header and nav are chrome):

1. Header (tenant, scope, user)
2. Navigation (sidebar / mobile bar)
3. Daily briefing
4. Internal agent **entry** (not the full transcript)
5. Attention queue
6. Growth funnel snapshot
7. Optional operational widgets
8. Next-best actions
9. Module setup / degraded (only if any module is not ACTIVE)

## Shell

```
┌──────────┬─────────────────────────────────────────────┐
│ Brand    │ Tenant name                    [Agent] [User]│
│ nav      ├─────────────────────────────────────────────┤
│ Home     │ h1 Início                                   │
│ Growth   │ [Briefing  —  master ticket]                │
│ …        │ [Agent entry card]                          │
│          │ [Attention queue]                           │
│          │ [Funnel 4] [NBA]                            │
│          │ [Optional widgets…]                         │
└──────────┴─────────────────────────────────────────────┘
```

Large desktop (≥1440): briefing + queue share a row (briefing 8 cols, queue 4). Desktop 1024–1439: stack briefing, then queue. Mobile: stack all; agent entry is the dock button + one-line prompt.

## Region specs

### Header

- Height 48/56. Left: sidebar trigger. Center-left: tenant name (truncate). Right: **scope chip** (agent name + company), then user menu.
- Staff: chip reads **Impulsionito · Impulsionando** and never a tenant nickname without tenant id visible.

### Navigation

See [INFORMATION-ARCHITECTURE.md](./INFORMATION-ARCHITECTURE.md).

### Daily briefing

- Purpose: one paragraph + 3 bullets of **today**, from Nest manifest. UNKNOWN if no API.
- Data: greeting first name, date `pt-BR`, counts only if known.
- Click: none on the container; bullets link to queue items.
- Agent: “Explique o briefing” suggested prompt.
- Empty new company: “Ainda não há movimento hoje. Complete a configuração.” + CTA to onboarding.

### Internal agent entry

- Purpose: launch the apprentice. Never looks like Impulsionito.
- Shows agent **display name**, tenant name, status (ready / degraded / unavailable).
- One suggested prompt field; submit opens panel.
- Click: opens agent panel (right on desktop, sheet on mobile).

### Attention queue

- Purpose: human work, newest/overdue first.
- Rows: icon, title, reason, time, severity (icon+label).
- Click: object detail. Agent: “Prepare um follow-up” on the row.
- Do not invent items. Empty: “Nada precisa de você agora.”

### Growth funnel

- Four stages: Aquisição · Follow-up · Conversão · Retenção. (Reativação is Growth area, not a fifth Home tile.)
- Each stage is a **ticket**, not a hero metric: label, value or **Sem dados**, destination.
- Required module: `crm` / `marketing` as entitled. Missing attribution: UNKNOWN, not `0`.

### Optional operational widgets

Hidden if `NOT_ENTITLED`. If entitled but not ACTIVE: show module-state card, not fake data. Catalog: [WIDGET-CATALOG.md](./WIDGET-CATALOG.md).

### Next-best actions

- 1–3 actions. Each has verb, object, destination or **prepared** AI card.
- Action color only on the primary NBA button.

### Module setup / degraded

- Banner list, not a toast. Each line: module name, state badge, link to Settings → Modules / Integrations.

## Permission behavior

Finance widgets: `FORBIDDEN` state with explanation, **not** omitted-only (omission hides the denial). Cosmetic UI checks; Nest is authority.

## Synthetic data in artifacts

All numbers in HTML artifacts are **synthetic** and labelled. Implementers must bind Nest; never copy artifact figures as defaults.

## Mobile

- Bottom nav; briefing first; queue second; funnel as horizontal scroll of four tickets with snap; widgets stacked.
- Do not hide queue behind “more”.

## Keyboard

- Skip link “Ir para o conteúdo”.
- Regions are `main` / `nav` / `complementary` (agent).
- Queue is a list; each row is a link.

## What Home is not

- Not four equal KPI cards with sparklines.
- Not a chatbot full-bleed.
- Not a different layout for restaurants vs clinics.
