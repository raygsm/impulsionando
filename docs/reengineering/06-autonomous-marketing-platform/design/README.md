# Impulsionando design system

Created: **2026-09-04**  
Status: **DESIGN AUTHORITY for `app-web` implementation** — not a live product, not a phase gate skip.  
Impeccable: `PRODUCT.md` (repo root) · visual world **App de balcão** (seed `06654ec7`, chosen challenger `digital-design-canon-warm-consumer-app-surface`) · skeleton **pinned** to the imported Next.js shadcn admin shell.

This folder is the handoff the frontend agent must follow. Do not invent UX, layout, visual states, or branding rules that contradict these files.

## Locked direction

| Decision | Value |
| --- | --- |
| Binding name | **Impulsionando** |
| Incumbent logo / navy-orange-rocket / Inter-navy dashboard | **Discarded** (audit evidence only) |
| Visual world | **App de balcão** — warm stone ground, white cards, one saturated action color only where something can be done, humanist sans, generous radius, thumb-first mobile |
| Shell / IA skeleton | Keep the dashboard already added: shadcn `Sidebar` + `SidebarInset` + header + invariant areas |
| Composition of Home | Brief-pinned region order (see [DASHBOARD-UX.md](./DASHBOARD-UX.md)); not the direction-sketch photo |
| Default theme | Light (owner at the counter, indoor mixed light). Dark is a system capability, not the default scene |
| UI language | Brazilian Portuguese |
| Docs language | English (this folder) + PT-BR copy deck |

## Surfaces (do not mix visually)

| Surface | App | Visual register |
| --- | --- | --- |
| Authenticated business dashboard | `app-web` | This system + tenant action color |
| Impulsionando staff / Impulsionito | `app-web` staff scope | Same skeleton; Impulsionando action color; persistent scope chip |
| Public tenant (booking, catalog, client agent) | `tenant-web` | Same tokens family, **no admin chrome** |
| Institutional Impulsionando | platform/public | Impulsionando wordmark + action color; marketing, not dashboard |

## How to use

1. Read [HANDOFF-CHECKLIST.md](./HANDOFF-CHECKLIST.md).
2. Implement tokens from [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) and [tokens.reference.json](./tokens.reference.json).
3. Restyle shadcn per [COMPONENT-SYSTEM.md](./COMPONENT-SYSTEM.md) and [NEXTJS-TEMPLATE-DESIGN-MAP.md](./NEXTJS-TEMPLATE-DESIGN-MAP.md).
4. Never fork layout per tenant or niche. Niches are blueprints: [INFORMATION-ARCHITECTURE.md](./INFORMATION-ARCHITECTURE.md).

## File index

| File | What it owns |
| --- | --- |
| [CURRENT-DESIGN-AUDIT.md](./CURRENT-DESIGN-AUDIT.md) | Incumbent + template, KEEP/REFINE/REPLACE/REMOVE/UNKNOWN |
| [BRAND-FOUNDATION.md](./BRAND-FOUNDATION.md) | Personality, voice, visual principles |
| [COLOR-SYSTEM.md](./COLOR-SYSTEM.md) | Palettes, contrast, tenant rules |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | Faces, scale, loading |
| [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) | All tokens |
| [tokens.reference.json](./tokens.reference.json) | Machine-readable reference (not production code) |
| [INFORMATION-ARCHITECTURE.md](./INFORMATION-ARCHITECTURE.md) | Areas, nav, mobile |
| [DASHBOARD-UX.md](./DASHBOARD-UX.md) | Universal dashboard |
| [WIDGET-CATALOG.md](./WIDGET-CATALOG.md) | Widget contracts |
| [COMPONENT-SYSTEM.md](./COMPONENT-SYSTEM.md) | Components |
| [SCREEN-SPECS.md](./SCREEN-SPECS.md) | Critical screens |
| [AI-EXPERIENCE.md](./AI-EXPERIENCE.md) | Agents and trust states |
| [RESPONSIVE-GUIDELINES.md](./RESPONSIVE-GUIDELINES.md) | Breakpoints and reflow |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG 2.2 AA |
| [CONTENT-GUIDELINES.md](./CONTENT-GUIDELINES.md) | Voice in product |
| [PT-BR-COPY-DECK.md](./PT-BR-COPY-DECK.md) | Strings |
| [NEXTJS-TEMPLATE-DESIGN-MAP.md](./NEXTJS-TEMPLATE-DESIGN-MAP.md) | Preset reuse map |
| [HANDOFF-CHECKLIST.md](./HANDOFF-CHECKLIST.md) | Implementer gate |
| [artifacts/](./artifacts/) | High-fidelity HTML references (synthetic data, labelled) |

## Product sources (do not duplicate)

- [`../PRODUCT-MODEL.md`](../PRODUCT-MODEL.md)
- [`../DASHBOARD-V1.md`](../DASHBOARD-V1.md)
- [`../CAPABILITY-MODULES.md`](../CAPABILITY-MODULES.md)
- [`../AI-OPERATING-MODEL.md`](../AI-OPERATING-MODEL.md)
- [`../NICHE-BLUEPRINTS-AND-ONBOARDING.md`](../NICHE-BLUEPRINTS-AND-ONBOARDING.md)
- [`../../../STATUS.md`](../../../STATUS.md)

## Open labels used in this folder

`OPEN` · `UNKNOWN` · `REQUIRES PRODUCT DECISION` — do not invent business behavior to close them.
