# Color system

Created: **2026-09-04**  
World: App de balcão · WCAG 2.2 AA floor · extra care for PT-BR, currency, tables.

## Why these colors

| Role | Choice | Why |
| --- | --- | --- |
| Action **Impulso** `#C81E3A` | Carmine red | Consumer-app rule: the only saturated color you can press. Not the discarded navy/orange rocket. Not iFood `#EA1D2C` (close but cooler/less orange). Contrast **5.67:1** on white (AA normal text). Error red is a separate darker hue so action ≠ danger. |
| Ground **Stone** `#F3EFE8` | Warm tinted ground | Required by the chosen world (counter, paper, indoor mixed light). Not cream+serif: type is sans; accent is carmine not terracotta. |
| Ink `#1C1916` | Warm black | Reads as Sharpie on paper, not cool SaaS navy. **17.5:1** on white. |
| Semantic greens/ambers/blues | Recalibrated | Meet ≥4.5:1 on white and stone. Tenant cannot override them. |

**Strategy:** Restrained — stone + paper + ink, with one action field (buttons, active nav, focus). Color is not sprinkled as decoration.

**Scene:** Owner at the balcão under indoor mixed fluorescent/tungsten. **Light is default.** Dark is after-hours.

## Impulsionando core palette (light)

| Token | HEX | RGB | OKLCH | HSL | Role |
| --- | --- | --- | --- | --- | --- |
| `--imp-ground` | `#F3EFE8` | 243 239 232 | `oklch(0.953 0.010 81.8)` | `hsl(38 31% 93%)` | Canvas |
| `--imp-surface` | `#FFFFFF` | 255 255 255 | `oklch(1.000 0.000 89.9)` | `hsl(0 0% 100%)` | Cards, popovers |
| `--imp-surface-sunken` | `#EBE6DD` | 235 230 221 | `oklch(0.928 0.012 82)` | `hsl(39 26% 89%)` | Wells, table header |
| `--imp-ink` | `#1C1916` | 28 25 22 | `oklch(0.216 0.007 67.4)` | `hsl(30 12% 10%)` | Text |
| `--imp-ink-muted` | `#5C564E` | 92 86 78 | `oklch(0.456 0.015 75.2)` | `hsl(34 8% 33%)` | Secondary text |
| `--imp-border` | `#E4DFD6` | 228 223 214 | `oklch(0.905 0.013 82.4)` | `hsl(39 20% 87%)` | Hairlines |
| `--imp-action` | `#C81E3A` | 200 30 58 | `oklch(0.538 0.200 19.9)` | `hsl(350 74% 45%)` | Primary actions |
| `--imp-action-hover` | `#A81830` | 168 24 48 | `oklch(0.473 0.176 19.7)` | `hsl(350 75% 38%)` | Hover |
| `--imp-action-foreground` | `#FFFFFF` | 255 255 255 | — | — | On action |
| `--imp-secondary` | `#EBE6DD` | 235 230 221 | — | — | Secondary fill |
| `--imp-secondary-foreground` | `#1C1916` | — | — | — | On secondary |

Neutral scale (warm stone, not cool gray):

| Token | HEX | Use |
| --- | --- | --- |
| `--imp-neutral-50` | `#F3EFE8` | ground |
| `--imp-neutral-100` | `#EBE6DD` | sunken |
| `--imp-neutral-200` | `#E4DFD6` | border |
| `--imp-neutral-300` | `#CFC8BC` | disabled border |
| `--imp-neutral-400` | `#9A9286` | placeholder **≥4.5:1 on white** — if not, darken (see contrast table) |
| `--imp-neutral-500` | `#5C564E` | muted text |
| `--imp-neutral-700` | `#3A362F` | emphasis |
| `--imp-neutral-900` | `#1C1916` | ink |
| `--imp-neutral-950` | `#120F0D` | dark ink |

Placeholder `#7A7368` on `#FFFFFF` is the production placeholder (target ≥4.5). Do not use `#9A9286` for placeholder text.

## Semantic colors (not tenant-overridable)

| Token | HEX | Meaning | Icon pair (required) |
| --- | --- | --- | --- |
| `--imp-success` | `#0F7A4B` | Success, paid, executed OK | check-circle |
| `--imp-warning` | `#8A5A00` | Warning, overdue-soon | alert-triangle |
| `--imp-danger` | `#B42318` | Error, failed, destructive | alert-octagon |
| `--imp-info` | `#185FA5` | Information, configuring | info |
| `--imp-configuring` | `#185FA5` | Module CONFIGURING | loader |
| `--imp-degraded` | `#8A5A00` | DEGRADED integration | unlink |
| `--imp-suspended` | `#5C564E` | SUSPENDED / DISABLED | pause-circle |
| `--imp-unknown` | `#5C564E` | Unknown data (not zero) | help-circle |
| `--imp-ai-recommend` | `#185FA5` | RECOMMEND | sparkles (Lucide, not a robot) |
| `--imp-ai-prepared` | `#6B2D5B` | PREPARED — not executed | file-pen |
| `--imp-ai-executed` | `#0F7A4B` | EXECUTED | stamp/check |
| `--imp-ai-approval` | `#C81E3A` | APPROVAL_REQUIRED (uses action) | shield |

Foreground on solid semantic fills: `#FFFFFF` except warning and unknown (use `#FFFFFF` on `#8A5A00` — check 5.93:1) and prepared (`#FFFFFF` on `#6B2D5B` — 9.76:1).

Tinted surfaces (10% wash) for banners: mix 12% semantic + 88% surface. Text on wash uses the **solid** semantic hex, not a lighter tint.

## Contrast ratios (verified 2026-09-04, relative luminance)

| Foreground | Background | Ratio | Gate |
| --- | --- | --- | --- |
| `#C81E3A` | `#FFFFFF` | **5.67** | AA normal |
| `#C81E3A` | `#F3EFE8` | **4.95** | AA normal |
| `#FFFFFF` | `#C81E3A` | **5.67** | AA normal (button label) |
| `#1C1916` | `#FFFFFF` | **17.50** | AAA |
| `#1C1916` | `#F3EFE8` | **15.27** | AAA |
| `#5C564E` | `#FFFFFF` | **7.25** | AAA |
| `#5C564E` | `#F3EFE8` | **6.33** | AA |
| `#0F7A4B` | `#FFFFFF` | **5.38** | AA |
| `#8A5A00` | `#FFFFFF` | **5.93** | AA |
| `#B42318` | `#FFFFFF` | **6.57** | AA |
| `#185FA5` | `#FFFFFF` | **6.52** | AA |
| `#6B2D5B` | `#FFFFFF` | **9.76** | AA |
| `#079455` (rejected) | `#FFFFFF` | 3.91 | **FAIL** — do not use |

Large text (≥18.66px bold or ≥24px) may use 3:1; this product still prefers 4.5:1 for essential UI.

## Dark mode

| Token | HEX | Notes |
| --- | --- | --- |
| `--imp-ground` | `#1A1714` | After-hours shop |
| `--imp-surface` | `#241F1B` | Paper still lighter than ground |
| `--imp-ink` | `#F6F1EA` | |
| `--imp-ink-muted` | `#B7AFA6` | Must remain ≥4.5 on surface |
| `--imp-border` | `#3A332C` | |
| `--imp-action` | `#F97187` | Lightened carmine for contrast on dark |
| `--imp-action-foreground` | `#1C1916` | Dark ink on light action (do not use white) |
| Semantic | Lighten L until ≥4.5 on `#241F1B` | Keep hue; do not neon |

**UNKNOWN** until implemented: exact dark semantic hexes beyond action. Implementer must measure; do not ship muted-on-dark below 4.5.

## shadcn mapping

| shadcn | Impulsionando |
| --- | --- |
| `--background` | `--imp-ground` |
| `--foreground` | `--imp-ink` |
| `--card` / `--popover` | `--imp-surface` |
| `--primary` | `--imp-action` **or tenant action** |
| `--primary-foreground` | `--imp-action-foreground` |
| `--secondary` | `--imp-secondary` |
| `--muted` | `--imp-surface-sunken` |
| `--muted-foreground` | `--imp-ink-muted` |
| `--accent` | sunken (hover wash), **not** a second brand color |
| `--destructive` | `--imp-danger` |
| `--border` / `--input` | `--imp-border` |
| `--ring` | `--imp-action` |
| `--sidebar` | `--imp-surface` (light paper rail) |
| `--sidebar-primary` | action |
| `--sidebar-foreground` | ink |
| `--sidebar-border` | border |

`--accent` in shadcn must **not** mean tenant accent paint. Tenant accent, when allowed, is `--imp-tenant-accent` for optional highlights (charts of the tenant series, avatar ring) and **never** for text, errors, or fills of essential controls.

## Tenant branding behavior

### May override

- `--imp-action` / `--imp-action-hover` / `--imp-action-foreground` (from tenant primary)
- `--imp-tenant-accent` (from tenant accent) for **non-essential** highlights only
- Logo file, company name, agent name/avatar

### Must not override

- Ground, surface, ink, muted, border
- All semantic colors including AI states except APPROVAL_REQUIRED (approval CTA follows action)
- Focus ring **geometry** (thickness, offset); ring **color** follows action after validation
- Sidebar topology and radius scale

### Generating accessible shades

1. Parse tenant primary to OKLCH.
2. Build a 50–900 scale by walking L (0.97 → 0.25) at chroma `min(C, 0.18)` (cap chroma to avoid neon).
3. Pick **action** as the step with contrast ≥ **4.5:1** against white **and** against stone. Prefer the step nearest the requested hue.
4. **Foreground** on action: if white contrast ≥ 4.5 use white; else use ink; if neither works, fail closed.

### Contrast fallback

If no step meets 4.5:1 on white:

1. Do not apply the tenant color.
2. Keep Impulso `#C81E3A`.
3. Show a non-blocking banner: **Cor da marca ajustada para leitura** (see copy deck).
4. Offer Settings → Branding with the failing hex named.

### Invalid / inaccessible tenant color

| Input | Behavior |
| --- | --- |
| Missing | Impulso |
| Not a color | Impulso + banner |
| `#FFF` / `#000` as primary | Reject; Impulso |
| Alpha < 1 | Flatten on white, then validate |
| Same as danger `#B42318` ±5ΔE | Shift hue 12° or fallback; never alias error |

### Logo fallback

1. `logo_url` image, max 32×32 in sidebar, 40×40 header mobile, `object-fit: contain` on stone.
2. `onError` → initials tile: 32px rounded-xl (`--imp-radius-md`), action fill, action-foreground letters, `aria-hidden` if name is beside it.
3. Missing name → “Empresa” (copy deck). Never broken-image icon.

### Charts

- Tenant action may color **one** series (the tenant’s own performance).
- Axes, grid, unselected series: neutrals.
- Status series (paid / overdue / failed): semantic colors, not tenant.
- Unknown points: gap + “Sem dados”, never a zero line that looks like a value.
- Nonvisual: table or definition list with the same numbers.

### Light/dark tenant

Tenant primary is re-validated in both themes. A color that passes light may fail dark; generate a lightened action for `.dark` independently. If dark fails, Impulso dark action `#F97187` + banner.

## Usage restrictions

- Do not use action color for body text links in paragraphs if underline + ink can work; in-app text links may use action if ≥4.5 and not competing with a primary button in the same cluster.
- Do not encode AI confidence as opacity of action color.
- Color-blind: every status badge includes a Lucide icon and a text label.
- Do not place `#C81E3A` text on `#B42318` fills.
