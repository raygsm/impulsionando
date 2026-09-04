# Screen specifications

Created: **2026-09-04**  
Each screen: purpose, actor, entry, hierarchy, actions, data, permissions, states, mobile, a11y.  
Synthetic artifact content is labelled; bind Nest. Unbuilt APIs → UNKNOWN states.

Shared a11y: `h1` unique, skip link, 44px targets, `lang="pt-BR"`.

---

## Authentication and onboarding

### Login

- Purpose: session for `app-web`.
- Actor: any user.
- Entry: `/login`, expired session redirect.
- Hierarchy: wordmark, `h1` Entrar, form (email, password, submit), link Esqueci a senha.
- Main: Entrar (action color). Secondary: reset.
- Data: Supabase SSR cookies via `@impulsionando/auth` — **not** template toast-JSON.
- Permissions: n/a.
- Empty/error: invalid credentials inline; network error retry. No user enumeration (`OPEN` to product: currently treat as generic “Não foi possível entrar”).
- Mobile: single column, 16px inputs.
- A11y: autocomplete email/current-password; errors in `aria-live`.

### Password reset

- Purpose: request and confirm reset.
- Actor: user.
- Entry: login link; email link host **OPEN** (ADR-008 host undecided — `REQUIRES PRODUCT DECISION`).
- Hierarchy: wordmark, instructions, email or new password fields.
- Main: Enviar / Definir senha.
- States: success “Se o e-mail existir, enviaremos instruções” (do not confirm existence unless product says otherwise — `REQUIRES PRODUCT DECISION`).
- Mobile: same.

### Onboarding — company / niche

- Purpose: pick blueprint (restaurant, clinic, real estate, other).
- Actor: tenant admin.
- Entry: first login with incomplete onboarding flag (`UNKNOWN` exact flag).
- Hierarchy: stepper (1–n), `h1`, radio cards (not nested).
- Main: Continuar.
- Data: Nest tenants. Do not `if (tenant===chrismed)`.
- Mobile: stacked radios 44px.

### Onboarding — business information

- Fields: name, phone, address (minimal). Logo optional.
- Main: Continuar. Secondary: Pular (`OPEN` if skip allowed).

### Onboarding — team and roles

- Invite emails + role. Skip allowed with caption.
- Forbidden: inviting to roles the actor cannot grant.

### Onboarding — module recommendations

- Blueprint-based checklist. Toggles cosmetic until Nest entitlements exist.
- Main: Continuar.

### Onboarding — integration setup

- Provider-neutral cards: WhatsApp, email, calendar. States configuring/not connected. Never “conectado” without backend receipt.

### Onboarding — agent setup

- Agent display name, avatar (initials fallback). Caption: apprentice, does not execute without approval.

### Onboarding — review and confirmation

- Summary list. Main: Concluir. Creates configuring Home.

### Onboarding — readiness report

- Checklist of modules/states. CTA: Ir para o início.

---

## Dashboard

### Empty new company

- Actor: admin.
- Hierarchy: briefing empty, agent entry, queue empty, funnel UNKNOWN, NBA = complete setup.
- Main: Completar configuração.

### Configured restaurant

- Same regions; widgets W09–W11 if entitled; terms: pedidos, mesas/`OPEN` terminology, estoque.

### Configured medical clinic

- Widgets W09, W13, W19; terms: pacientes, consultas, faltas.

### Configured real estate

- W18, W05, W19; terms: interessados, visitas, documentos.

### Many enabled modules

- Optional widgets wrap; health strip if any degraded. Nav children appear; top-level still 7.

### Few enabled modules

- Hide optional widgets; funnel may be UNKNOWN; do not fill with decorative charts.

### Degraded communications

- Banner W20 + W12 degraded; queue may include “fila de envio parada” if API says so.

### Restricted finance access

- W14/W15 forbidden; Management finance routes forbidden state, not 404.

---

## Growth and CRM

### Growth overview `/growth`

- Funnel full width + campaign widget + attribution UNKNOWN if missing.
- Main: Ir para leads.

### Leads `/growth/leads`

- Filters + table/list. Main: Novo lead if capability else disabled.
- Detail `/growth/leads/:id` or customers lead detail — **one object model**; `REQUIRES PRODUCT DECISION` if two IDs exist. UI: single Contact/Lead detail template.

### Lead detail

- Header name+status, timeline, NBA, agent “prepare follow-up”.
- Forbidden fields hidden with “Sem permissão”, not blank.

### CRM pipeline `/customers/pipeline`

- Columns = stages; cards = opportunities; mobile: stage picker + list (not 5-column drag).
- Drag desktop only; keyboard move via menu.

### Contact detail

- Profile, activities, timeline, communications. Agent sources listed.

### Campaigns / campaign detail

- List + status badges. Detail: metrics UNKNOWN if no API; never 0 sends.

### Retention audiences

- Segments list; empty CTA. Builder = segmentation component.

### Follow-up queue `/growth/follow-up`

- Same as attention queue filtered to follow-ups. Main: registrar atividade.

---

## Operations

### Today `/operations`

- Agenda strip + tasks + workload snapshot.

### Tasks

- List/board toggle; mobile list-only. Assignee avatars.

### Team workload

- People rows; forbidden if no team capability.

### Agenda

- Day/week; clinic vs restaurant uses same chrome, different event titles.

### Orders

- Table; status badges; restaurant terms.

### Inventory alerts

- Table of SKUs below threshold; UNKNOWN stock is not 0.

---

## Management

### Finance overview

- Payables/receivables widgets + links. Dense tables. Restricted roles: forbidden.

### Payables / Receivables

- Tables, filters, row → detail. Destructive: confirm.

### Products/services / Inventory / Documents

- Catalog table; inventory qty `tnum`; documents expiry dates `pt-BR`.

### Billing / Payments

- Tenant’s Impulsionando plan billing vs customer payments: **two screens**, labelled. Nest is processor — UI never “charges the card” in the browser.

### Modules

- Grid of modules with state badges and entitlements. Toggle is **request**, not instant, unless API says so (`UNKNOWN`).

### Integrations

- Provider-neutral; health; last success; degraded banner.

---

## Help

### Ticket list

- Table from Nest `support_tickets` only (not legacy sessions).

### Ticket detail

- Thread, status, agent handoff marker.

### Create ticket

- Subject, body, optional attach; main Enviar.

---

## AI

### Internal business-agent conversation

- Panel; scope chip; sources; states READ/RECOMMEND/PREPARED.

### Prepared action / Approval / Execution result

- See [AI-EXPERIENCE.md](./AI-EXPERIENCE.md).

### Human handoff

- Confirm ticket created.

### Impulsionito staff view

- Same panel chrome; chip **Impulsionito · plataforma**; no tenant action color; never auto-load cross-tenant rows.

### Client-facing agent

- **Not in `app-web`**. Public surface: tenant colors, no sidebar, consumer copy. Config screen in Settings → Agent (admin) only.

---

## Priority for implementation

P0: Login, Home states, Help tickets, Agent panel READ.  
P1: Growth/Customers shells.  
P2: Operations/Management shells.  
P3: Onboarding polish, public agent.
