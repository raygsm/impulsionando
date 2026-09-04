# Responsive guidelines

Created: **2026-09-04**

## Breakpoints

| Name | Range | Nav | Notes |
| --- | --- | --- | --- |
| Mobile | 320–767 | Bottom bar + top bar | One column |
| Tablet | 768–1023 | Hamburger sheet (no bottom bar) | 2-col widgets |
| Desktop | 1024–1439 | Sidebar 256 / icon 56 | 12-col grid |
| Large | 1440+ | Sidebar expanded default | Briefing+queue row |

## Principles

- **Reflow, don’t scale-to-unreadable.** Body stays ≥16px; captions ≥12px.
- **Thumb first on mobile:** primary CTA in view; agent in header; bottom nav clear of content (`padding-bottom: 64px + safe-area`).
- **Same IA.** No mobile-only areas.

## Long Portuguese labels

- Nav: 2 lines max then truncate; tooltip on collapsed.
- Buttons: allow wrap to 2 lines at 320; min height 44.
- Test strings: `Acompanhamento`, `Reativação`, `Configurações`, `Recebíveis`, `Não foi possível carregar`.

## Long company names

- Sidebar: truncate 1 line; full name in tooltip and header.
- Header: `truncate` with `min-w-0`.

## Missing logos

- Initials tile always reserved 32px so layout doesn’t jump.

## Financial tables

- Horizontal scroll with fade hint; freeze first column (name) if possible.
- Do not drop “Valor” column.

## Dense CRM pipelines

- Mobile: stage `<select>` + card list. Desktop: columns.
- Card titles wrap 2 lines.

## Charts

- Mobile: full width, height 200; legend below. Toggle **Ver tabela**.

## Agent conversations

- Mobile full-screen sheet; composer `position: sticky` bottom above safe-area; don’t cover with bottom nav (hide bottom nav while agent open).

## Forms

- 1 column <1024; 2 column optional ≥1024 for address blocks only.
- Datetime: native on mobile if Radix calendar fails touch — prefer Radix with large hit targets.

## Many vs few modules

- Few: extra whitespace OK; do not add fake widgets.
- Many: widgets wrap; health strip first if degraded.

## Keyboard-only

- All breakpoints: visible focus, no `outline: none`.
- Bottom nav is in tab order after skip link and header.

## 200% zoom

- At 320 CSS px × 200% zoom, content reflows in one column; no horizontal page scroll except tables.
- Sticky header may stack; accept wrapping.

## Touch

- 44×44; 8px gap between adjacent targets.

## Landscape phones

- Bottom nav remains; agent sheet uses 100dvh.
