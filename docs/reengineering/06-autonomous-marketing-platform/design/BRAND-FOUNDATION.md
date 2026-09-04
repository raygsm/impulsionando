# Brand foundation

Created: **2026-09-04**  
World: **App de balcão** · Seed `06654ec7`  
Binding asset: the name **Impulsionando** only.

## Brand purpose

Help physical businesses grow through operations they can see and control: acquire, follow up, convert, fulfill, collect, retain — with AI that prepares work and humans who stamp it.

## Personality

| Trait | In product | Not |
| --- | --- | --- |
| Growth | Next action is obvious; progress is earned | Rockets, “10x”, fake charts |
| Intelligence | Sources, freshness, prepared work | Oracles, confidence % |
| Trust | Contrast, receipts, approval | Glass, neon, hidden risk |
| Practicality | Counter-height controls, plain Portuguese | Jargon, empty dashboards |
| Operational clarity | One structure for every company | Custom apps per tenant |
| Modern automation | Agent as apprentice | Childish robot mascot |
| Human control | Stamp / approve / undo / handoff | Autopilot theatre |
| Confidence | Direct sentences, stable layout | Arrogant claims |
| Simplicity | One action color | Simplistic toy UI |

## Voice

- Speak like a competent manager at the counter, not a Silicon Valley pitch.
- Short sentences. Name the object and the next step.
- Portuguese that a restaurant owner and a clinic receptionist both understand.
- Never claim a number we do not have. Say **Sem dados** or **Indisponível**.

## Tone by surface

| Surface | Tone |
| --- | --- |
| Dashboard | Calm, specific, operational |
| Errors / degraded | Honest, recoverable, no blame |
| Finance | Precise, cautious, never playful |
| AI | Transparent about state (reading / recommending / prepared / needs approval) |
| Public tenant | The business’s voice, not Impulsionando’s admin voice |
| Staff / Impulsionito | Institutional, scoped, never chatty about tenant PII |

## Emotional attributes

- Relief: “I know what to do this morning.”
- Control: “Nothing important ran without me.”
- Pride: “The company looks professional to customers.”
- Not: hype, fear, gamification, cuteness.

## Visual principles

1. **One pressable color.** Impulso carmine (or the tenant’s validated primary) appears only on actions, active nav, and focus. Decoration uses stone, paper, and ink.
2. **Paper on stone.** Warm ground, white surfaces, soft large radius — a consumer app, not an executive war room.
3. **Tickets, not tiles of metrics.** A KPI is a labelled fact with a destination. Four identical hero-metric cards are banned as page structure.
4. **Stamp, don’t glow.** Approval is a deliberate filled button, not a shimmer.
5. **Same store, different sign.** Logo, name, and action color change; aisles never do.
6. **Light is the shop.** Dark is after-hours, still paper-on-stone, never cyber.

## Wordmark

Until a commissioned mark exists (`OPEN`):

- Letters: **Impulsionando** (sentence case, never `IMPULSIONANDO TECNOLOGIA` lockup in product UI).
- Face: Source Sans 3 ExtraBold, tracking `-0.02em`, color ink (or white on action).
- Clear space: 0.5× cap-height on all sides.
- Minimum digital size: 18px cap-height; below that, use the “I” fallback tile (rounded square, action fill, white “I”).
- Do not place the discarded PNG rocket/pixel mark in `app-web`.

Descriptor line **Tecnologia** is institutional-only, not in the dashboard chrome.

## Photography / illustration

| Use | Direction |
| --- | --- |
| Institutional | Real Brazilian physical businesses (counter, clinic waiting, shop floor). No stock handshakes, no neon city, no generated “happy team with laptop”. Label synthetic images **Imagem ilustrativa**. |
| Dashboard | No photography in the shell. Empty states use a single-line illustration in ink + stone (storefront shutter, empty clip, quiet agenda) — not 3D robots. |
| Tenant public | Tenant-owned photos. Fallback: stone + wordmark, never a fake interior. |

## Iconography

- Library: **Lucide**, 1.75px stroke, 24px default, optical 20px in dense tables.
- Corner radius of icons follows Lucide; do not mix filled cartoon sets.
- Status is **icon + label**, never color alone.
- WhatsApp / Instagram / official partner marks: use official brand assets in their reserved buttons only.

## Motion personality

- One authored family: **spring on press** (action buttons, nav item, stamp).
- Duration: 140–200ms ease-out for color/opacity; 200ms spring for press (`translateY(1px)` already in shadcn button — keep, do not add bounce).
- Agent streaming: cursor pulse 1.2s, respects `prefers-reduced-motion` (static “…”).
- No page-wide entrance choreography. No confetti. No gradient wipes.

## Correct usage

- Tenant logo in the sidebar header; Impulsionando wordmark as a 12px caption “via Impulsionando” (not a second competing logo).
- Primary button in action color; secondary is ink outline on paper.
- AI prepared card: dashed border, mulberry label **Preparada — não executada**, action color only on **Aprovar**.
- Finance tables: tabular figures, ink, no action-colored numbers unless the cell is a link.

## Incorrect usage

- Navy sidebar + orange rocket + Inter (discarded identity).
- Action color as a full sidebar, hero gradient, or chart rainbow.
- Glassmorphism, neon outlines, crypto grids, childish robot avatars.
- Tenant primary as error/success.
- Decorative KPI row with zeros for unknown APIs.
- Mixing admin chrome into the public client-facing agent.
- “Impulsionito” labelled on a tenant Home.

## Photography of the world (for designers)

The quality bar for finish is the Impeccable catalog world **warm consumer app surface** (craft level, not composition). Composition is the existing `app-web` shell. Do not copy catalog photography into the product.
