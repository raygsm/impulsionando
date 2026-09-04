# Component system

Created: **2026-09-04**  
Implementation family: **shadcn/Radix (New York)** restyled to App de balcão. Anatomy follows Radix; visuals follow tokens. Do not introduce a second primitive library.

Shared rules for every control:

- States: rest, hover, active, focus-visible, disabled, loading, error (if input).
- Focus: 3px action ring, 2px offset.
- Touch: 44×44 minimum.
- Color: **one action fill** — primary buttons and active nav only.
- Keyboard: Radix defaults unless noted.
- Do not use color as the only state.

---

## Foundations

### Page container

- Anatomy: `header` + `main` (inset padding 16/24).
- Max width `--imp-container-page` except tables `--imp-container-wide`.
- Incorrect: centered marketing column for Home.

### Grid / Stack

- Grid 12 col; Stack `flex flex-col gap-4|6`.
- Incorrect: nested cards; equal-size icon+title+text cards as page structure.

### Separator

- 1px `--imp-border`. Decorative `role="none"`; semantic `hr` between sections.

### Scroll

- Native overlay scrollbars (OS). **Do not** force brand-colored scrollbars.
- Sticky table header `z-sticky`.
- Agent transcript: only the transcript pane scrolls, not the whole app.

### Focus

- Skip link first in body.
- `:focus-visible` only (not mouse `:focus`).
- Modals: Radix focus trap; return focus to opener.

---

## Navigation

### Sidebar

- Anatomy: header (logo+name), `nav` list, footer (plan/module hint optional).
- Variants: expanded 256px, icon 56px, mobile sheet.
- Active: action-tinted wash + action icon, **not** a filled action block for the whole row (too loud). Text stays ink; indicator 3px pill on the leading edge **or** action-colored icon — if using the edge, keep it 3px not 4px+ craft-ban... craft-floor bans colored border-left **above 1px** on cards. For nav, use **background wash + weight 600**, not a fat bar.
- Disabled: muted + tooltip.
- A11y: `nav aria-label="Áreas principais"`; `aria-current="page"`.
- Keyboard: arrows per shadcn sidebar; `Cmd+B` collapse.
- Incorrect: dark navy executive rail; per-tenant reordering.

### Mobile navigation

- Bottom bar `<768`: 5 slots. Active: action color on icon+label.
- Sheet for Mais and hamburger.
- Labels 12px, 1 line, truncate.

### Breadcrumbs

- `nav aria-label="Trilha"`; last item `aria-current`. Separator `/`. Hide on Home. Collapse to `…` on mobile keeping last two.

### Tabs

- Radix tabs; active: ink + 2px action underline.
- Keyboard: arrows, Home/End.
- Incorrect: pills in action fill for every tab.

### Command menu

- Anatomy: input, groups, empty.
- `role="dialog"`; query label. No privileged results.

### Tenant switcher

- Combobox of memberships. Checkmark current. Omit if single.

### User menu

- Avatar initials, name, email caption, theme, sair.

---

## Data display

### Cards

- Anatomy: optional header, body, optional footer.
- Elevation `shadow-sm`; radius 16; padding 16/20.
- Variants: default, dashed (prepared AI), sunken.
- Incorrect: nested card; gradient fill; glass.

### KPI cards

- Anatomy: **number first** (kpi type), label **below** (caption). Optional delta with icon+text (up/down).
- One destination chevron.
- Unknown: em dash + Sem dados, never 0.
- Incorrect: four KPIs as the only Home structure; sparkline-only.

### Charts

- Recharts/shadcn chart restyle: neutrals + one action series.
- Title, legend, table alternative (`<table class="sr-only">` or visible toggle **Ver tabela**).
- Empty/error/unknown as shared states.

### Tables

- 14px, `tnum` on numeric cols, row height ≥44px.
- Sticky header; zebra **not** required; hover wash sunken.
- Sort: button in header, `aria-sort`.
- Bulk: checkbox column; action bar sticky.
- Mobile: convert to stacked definition rows **or** horizontal scroll with shadow hint — finance **scroll** (do not hide columns without a column picker).
- Empty: illustration + CTA.

### Lists

- 44px rows; leading icon; trailing meta.

### Timelines

- Vertical line stone; dots semantic; content ink.

### Funnel

- Four tickets in a row; connecting chevrons decorative `aria-hidden`.
- Each ticket = KPI card compact.

### Progress

- Determinate bar stone track, ink fill (not action, unless the progress **is** the action).
- `role="progressbar"` valuemin/max/now.

### Status badges

- Pill; icon + text; semantic colors; 12px/600.

### Activity feed

- List + timeline hybrid; relative time with `datetime`.

### Empty states

- Title, one sentence, one primary CTA, optional secondary.
- No 3D robot.

---

## Inputs

Shared: label 14/600 above; hint caption; error caption + `aria-invalid` + `aria-describedby`. 16px font on mobile.

### Text field / textarea / select / combobox

- Height 40/44; radius 8; border 1px; focus ring.
- Select: Radix; combobox: cmdk/Radix.

### Date/time

- Radix calendar + time. `pt-BR` format display; ISO in data.

### Currency

- InputMode decimal; mask `R$`; store minor units per API contract `UNKNOWN` until Nest specifies; UI shows formatted BRL.

### Search

- Leading icon; `type="search"`; Escape clears.

### Filters

- Chip row + sheet on mobile. Applied chips removable.

### File upload

- Dropzone + button; list of files; progress; errors named.

### Rich text / template editor

- Toolbar buttons labelled; templates as inserts, not hidden HTML. `REQUIRES PRODUCT DECISION` on allowed tags.

### Segmentation builder

- Rows of field / operator / value; AND/OR labelled in Portuguese. Keyboard-add row.

---

## Feedback

### Toast

- Sonner; 4s default; error persists until dismiss; `role="status"` / `alert` for errors.

### Inline validation

- On blur for required; on submit for all.

### Alert / Banner

- Icon + title + body + optional action. Semantic. Banner at top of `main`, not toast, for degraded modules.

### Modal / Confirmation

- Radix dialog; title `h2`; destructive: danger button + type-name confirm for irreversible finance/delete.
- Esc / overlay close **except** destructive (explicit buttons only).

### Loading / skeleton

- Stone pulse; `prefers-reduced-motion`: static wash.
- Page-level: header already visible.

### Error / retry

- Message + Tentar de novo. No raw stack to operators.

### Degraded status

- Banner + badge; agent may explain; cannot pretend healthy.

---

## AI components

### Agent launcher

- Header icon button; `aria-label="Abrir assistente {nome}"`.
- Badge if prepared actions pending (count + text in tooltip).

### Agent panel

- Anatomy: **scope chip** (agent · tenant), transcript, composer, footer (handoff, stop).
- Width 416px desktop; sheet mobile.
- Variants: internal (stone), Impulsionito (same chrome + chip **Impulsionito · plataforma**), never client-facing here.

### Conversation

- User bubbles: sunken; agent: surface + border. Streaming: live region polite.
- Meta: sources, freshness (“atualizado às 14:02” or **pode estar desatualizado**).

### Suggested prompts

- 3 max chips; not action-filled (outline).

### Source references

- List of titles; click opens allowed record. No raw SQL.

### Tool activity

- Collapsible “O que o assistente consultou”; states running/done/failed.

### Prepared action

- Dashed mulberry border; label **Preparada — não executada**; payload summary; buttons **Aprovar** (action fill) **Descartar** (ghost).

### Approval request

- Same + risk sentence; finance extra warning.

### Execution receipt

- Success badge **Executada**; id; undo if API supports (`UNKNOWN` if not — hide undo).

### Human handoff

- Button **Falar com pessoa**; creates Help ticket with transcript id; confirmation.

### Agent unavailable / degraded

- Panel still opens; honest state; link Help.

### Scope / tenant indicator

- Always visible in panel header and app header. Color: internal = ink chip; Impulsionito = ink chip + word Impulsionito; client-facing (public) = tenant action on **public** chrome only.

---

## Correct / incorrect (global)

Correct: paper cards, one red (or tenant) press, stamp for approval, Sem dados.  
Incorrect: neon agent, gradient buttons, nested cards, unknown as 0, Impulsionito on tenant Home, glass overlays.
