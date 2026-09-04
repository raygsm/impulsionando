# Accessibility

Created: **2026-09-04**  
Target: **WCAG 2.2 AA**. Extra care (not a waiver): PT-BR overflow, currency, dense tables, 200% zoom, 44px targets. AAA for body/financial figures where density allows (ink on paper already AAA).

Stakeholder asked for “the best”; AA is the **gate**. Contrast.config authenticated routes today use 4.0 — **raise to 4.5**.

## Contrast

- Follow [COLOR-SYSTEM.md](./COLOR-SYSTEM.md) tables.
- Tenant colors fail closed to Impulso.
- Placeholder ≥4.5:1 (`#7A7368` on white, measure before ship).
- Focus ring 3px action on stone offset.

## Focus visibility

- `:focus-visible` ring on all interactive elements.
- Skip link visible on focus, `z-index: 70`.

## Keyboard

- All actions reachable.
- Radix patterns for dialog, tabs, select, combobox, sidebar.
- Pipeline card move via menu (not drag-only).
- Cmd/Ctrl+K command palette; Esc closes layers in order (agent, then modal, then sheet).

## Screen readers

- `html lang="pt-BR"`.
- Controls have accessible names (visible label or `aria-label`).
- Decorative icons `aria-hidden`.
- Live regions: toasts, agent stream (polite), errors (assertive).

## Landmarks

- `header`, `nav` (areas), `main`, `complementary` (agent), `contentinfo` optional.
- One `main` per page.

## Heading hierarchy

- One `h1`. Sections `h2`. Card titles `h3`. Do not skip levels. No fake headings via bold divs.

## Forms

- Label for every input.
- Errors listed and linked via `aria-describedby`.
- Required in text, not color-only asterisk.

## Modals

- `aria-modal`, labelled by title.
- Focus trap; restore focus.
- Destructive: no overlay-click dismiss.

## Tables

- `th scope="col"`.
- Caption or `aria-labelledby`.
- Sort buttons named “Ordenar por valor”.

## Charts

- Text alternative (table or description).
- Color-blind safe: patterns or icons in legends, not hue-only.

## Reduced motion

- Honor `prefers-reduced-motion`.
- No autoplay.
- Agent cursor static.

## Zoom / reflow

- 200% at 320px: WCAG 1.4.10 reflow (except tables/charts exempt as 2D).
- No horizontal scrolling of the **page**.

## Touch targets

- WCAG 2.2 2.5.8: 24px minimum; **product standard 44px**.

## Color-blind

- Status = icon + text.
- Funnel stages named, not only colored.

## AI streaming

- Polite live region on assistant text.
- Don’t announce every token if it floods — announce sentence batches or completion (`REQUIRES` implementation note: batch ~1s).
- State changes (PREPARED, FAILED) announced.

## Authentication

- Errors associated with fields.
- Password reveal button labelled.

## Claims

- This document is **STATIC** guidance. CHARACTERIZED a11y requires tests + browser evidence after implementation. Mark untested as UNKNOWN in evidence.
