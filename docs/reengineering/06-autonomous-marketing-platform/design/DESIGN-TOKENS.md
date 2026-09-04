# Design tokens

Created: **2026-09-04**  
Normative companion: [tokens.reference.json](./tokens.reference.json)  
Colors: [COLOR-SYSTEM.md](./COLOR-SYSTEM.md) · Type: [TYPOGRAPHY.md](./TYPOGRAPHY.md)

CSS names use `--imp-*`. Map to shadcn as specified in the color system. This file is the design reference; production may alias, not rename meaning.

## Color

See COLOR-SYSTEM. Core aliases:

`--imp-ground` `--imp-surface` `--imp-surface-sunken` `--imp-ink` `--imp-ink-muted` `--imp-border` `--imp-action` `--imp-action-hover` `--imp-action-foreground` `--imp-success` `--imp-warning` `--imp-danger` `--imp-info` `--imp-ai-prepared` `--imp-focus-ring`

## Typography

`--imp-font-sans` `--imp-font-mono`  
`--imp-text-h1` … `--imp-text-caption` `--imp-text-kpi`

## Spacing (4px base)

| Token | px | rem |
| --- | --- | --- |
| `--imp-space-0` | 0 | 0 |
| `--imp-space-1` | 4 | 0.25 |
| `--imp-space-2` | 8 | 0.5 |
| `--imp-space-3` | 12 | 0.75 |
| `--imp-space-4` | 16 | 1 |
| `--imp-space-5` | 20 | 1.25 |
| `--imp-space-6` | 24 | 1.5 |
| `--imp-space-8` | 32 | 2 |
| `--imp-space-10` | 40 | 2.5 |
| `--imp-space-12` | 48 | 3 |
| `--imp-space-16` | 64 | 4 |

Rhythm: **tight groups (8–12)**, **section gaps (24–32)**, **more space above a heading than below it** (e.g. 32 above / 12 below).

## Grid

- Dashboard content: 12-column CSS grid, gutter `--imp-space-4` (16px), `--imp-space-6` from 1024.
- Widget spans: 4 / 6 / 8 / 12.
- Do not nest cards in cards.

## Breakpoints

| Token | px | Name |
| --- | --- | --- |
| `--imp-bp-sm` | 320 | mobile min |
| `--imp-bp-md` | 768 | tablet |
| `--imp-bp-lg` | 1024 | desktop |
| `--imp-bp-xl` | 1440 | large desktop |

Match the brief: 320–767 / 768–1023 / 1024–1439 / 1440+.

## Radius

World: generous consumer radius.

| Token | px | Use |
| --- | --- | --- |
| `--imp-radius-sm` | 8 | inputs, badges |
| `--imp-radius-md` | 12 | buttons, nav items |
| `--imp-radius-lg` | 16 | cards, dialogs, sidebar tiles |
| `--imp-radius-xl` | 20 | agent panel |
| `--imp-radius-pill` | 999 | stamp/status chips, primary mobile CTA |

Map shadcn `--radius` to **16px** (`1rem`) so `--radius-md` ≈ 12px.

## Borders

- Default: `1px solid var(--imp-border)`
- Prepared AI: `1px dashed var(--imp-ai-prepared)`
- Focus: not a border — ring (below)
- **Ban:** 4px+ colored left border as a card accent (craft-floor)

## Shadows / elevation

Offset + blur, no neon halo.

| Token | Value | Use |
| --- | --- | --- |
| `--imp-shadow-sm` | `0 1px 2px rgba(28,25,22,0.06)` | rest cards |
| `--imp-shadow-md` | `0 4px 12px rgba(28,25,22,0.08)` | popover, dropdown |
| `--imp-shadow-lg` | `0 12px 32px rgba(28,25,22,0.12)` | modal, agent panel |
| `--imp-shadow-none` | none | tables, full-bleed |

Dark: same offsets, `rgba(0,0,0,0.4)`.

## Opacity

`--imp-disabled: 0.48` (plus `cursor: not-allowed`; do not rely on opacity alone — also reduce contrast via `--imp-ink-muted` on disabled text).  
`--imp-overlay: 0.48` on ink for modal backdrop.

## Icon sizes

| Token | px |
| --- | --- |
| `--imp-icon-sm` | 16 |
| `--imp-icon-md` | 20 |
| `--imp-icon-lg` | 24 |

Touch icons sit in 44×44 targets.

## Control heights

| Token | px | Use |
| --- | --- | --- |
| `--imp-control-sm` | 36 | desktop density only, not mobile |
| `--imp-control-md` | 40 | default |
| `--imp-control-lg` | 44 | mobile primary, icon buttons |

Minimum touch: **44×44**.

## Motion

| Token | Value |
| --- | --- |
| `--imp-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--imp-duration-press` | 140ms |
| `--imp-duration-fade` | 180ms |
| `--imp-duration-panel` | 220ms |
| `--imp-spring-press` | `transform 140ms var(--imp-ease-out)` |

`prefers-reduced-motion: reduce` → durations 0, no spring, agent cursor static.

## Z-index

| Token | z | Layer |
| --- | --- | --- |
| `--imp-z-base` | 0 | page |
| `--imp-z-sticky` | 20 | table header, page header |
| `--imp-z-sidebar` | 30 | desktop sidebar |
| `--imp-z-overlay` | 40 | mobile sheet, modal backdrop |
| `--imp-z-modal` | 50 | dialog |
| `--imp-z-toast` | 60 | sonner |
| `--imp-z-agent` | 45 | agent panel (below modal, above page) |
| `--imp-z-skip` | 70 | skip link |

## Focus ring

```css
outline: 3px solid var(--imp-action);
outline-offset: 2px;
```

Never remove without a visible replacement. Offset color is ground/surface.

## Container widths

| Token | px |
| --- | --- |
| `--imp-container-prose` | 720 |
| `--imp-container-form` | 560 |
| `--imp-container-page` | 1280 |
| `--imp-container-wide` | 1440 |

Home uses full inset; finance/tables use `wide`.

## Shell dimensions

| Token | Value |
| --- | --- |
| `--imp-sidebar-width` | 16rem (256px) |
| `--imp-sidebar-width-icon` | 3.5rem (56px) |
| `--imp-header-height` | 3rem (48px) desktop; 3.5rem (56px) mobile |
| `--imp-bottom-nav-height` | 4rem (64px) including safe-area |
| `--imp-agent-panel-width` | 26rem (416px) |

## Widget sizes

| Size | Columns @ ≥1024 | Min height |
| --- | --- | --- |
| S | 4 | 160px |
| M | 6 | 200px |
| L | 8 | 240px |
| XL | 12 | 280px |

Mobile: all widgets 12 columns, min height auto.

## CSS custom properties (shadcn `--radius`)

Set `--radius: 1rem` in `:root` for `app-web`.
