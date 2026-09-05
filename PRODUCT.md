# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owners, managers, and operators of physical Brazilian businesses (restaurants, medical clinics, real-estate offices, stores, service companies) who run marketing and operations from one place, often between serving customers.

Other confirmed audiences:

- Finance operators (payables, receivables, billing) with restricted views
- Professionals/specialists (agenda, fulfillment)
- Tenant administrators (branding, modules, team, integrations)
- Impulsionando staff (tenants, plans, health, Impulsionito)
- Final consumers on the public tenant surface (booking, catalog, client-facing agent) — distinct from the authenticated dashboard

## Product Purpose

Impulsionando is an autonomous marketing operations platform for physical businesses. It helps a company run the full commercial lifecycle on one shared product:

Acquire → qualify → follow up → convert → schedule/sell/fulfill → collect → retain → reactivate → learn and improve

Success is operational clarity: the right person sees the next real action, with honest module and data states, without a custom dashboard per company.

## Positioning

Every tenant receives the **same dashboard structure and design system**. Variation is configuration (name, logo, allowed brand colors, terminology, enabled modules, niche blueprint, agent name/avatar, widgets), never a forked application, never a changed information architecture.

Governed AI prepares and recommends; humans approve and execute. Three agents must never be confused: the tenant internal business agent, the optional public client-facing agent, and Impulsionito (staff-only platform parent).

## Operating Context

- Authenticated work happens in `app-web` (Next.js dashboard; ADR-009 Proposed, not Aceita, not deployed).
- Public consumer experience lives on `tenant-web` (or a future public-web), visually distinct from admin.
- Institutional Impulsionando (plans, explanation, lead capture) is a third surface with the Impulsionando brand, not a tenant skin.
- NestJS API is domain/authorization authority. UI module checks are cosmetic. Unknown data must never render as zero.
- Shell skeleton may come from the MIT Next.js shadcn admin preset (`15e0a081bc1acad2b47adc638471b6e67fa36f10`); its visual identity is not Impulsionando’s.
- Daily work is dense, Brazilian-Portuguese, often on mobile, often interrupted.

## Capabilities and Constraints

Confirmed:

- Invariant primary areas: Home, Growth, Customers, Operations, Management, Help, Settings
- Module states: NOT_ENTITLED, CONFIGURING, READY, ACTIVE, DEGRADED, SUSPENDED, DISABLED — plus loading, empty, error, forbidden, unknown-data
- Tenant branding may change name, logo, primary color, and allowed accent; it must not change IA, nav positions, component behavior, a11y, interaction, security, page hierarchy, or responsive rules
- AI action states: READ, RECOMMEND, PREPARED (not executed), APPROVAL_REQUIRED, EXECUTED, FAILED, FORBIDDEN, HUMAN_HANDOFF
- Product UI language is Brazilian Portuguese; design documentation may be English
- Do not invent Nest/business modules, claim unbuilt APIs, or present mock data as real
- Phase 8 is planning; G0 pending; no prod DNS; no frontend access to privileged data

Open / inferred (labelled, not invented as closed product):

- Exact production entitlement slug strings: UNKNOWN
- Whether dark mode is a v1 product requirement or a system capability: OPEN (design for both; ship light as the default operating scene)
- New logomark geometry: CLOSED (2026-09-04) — forward-impulse mark at `apps/app-web/public/brand/impulsionando/mark.svg` (+ `mark.png`); name **Impulsionando** remains binding

- Staff chrome: keep the same dashboard skeleton; restyle everything required for staff vs tenant distinction without forking IA

## Brand Commitments

Binding:

- The name **Impulsionando**
- Personality requested by product: growth, intelligence, trust, practicality, operational clarity, modern automation, human control; confidence without arrogance; simplicity without looking simplistic
- Avoid: generic AI-startup neon, excessive gradients, crypto clichés, childish robots, dense enterprise ugliness, decorative fake charts, excessive glassmorphism, low-contrast gray, tenant colors that destroy usability
- Current logo, rocket/pixel mark, navy+orange gradient identity, and legacy dashboard visuals are **not** binding. Stakeholder direction (2026-09-04): the existing mark and UI are discarded; they are audit evidence only.

## Evidence on Hand

- Product model: `docs/reengineering/06-autonomous-marketing-platform/`
- Phase 8 IA: `docs/reengineering/04-migration/PHASE-8-CORE-APP.md` and `phase-8/`
- Incumbent tokens (anti-reference): `src/styles.css`, `src/styles/tokens-core.css`, `src/styles/tokens-tenants.css`
- Incumbent mark (discarded): legacy rocket/pixel assets if present
- Current mark: `apps/app-web/public/brand/impulsionando/mark.svg` (sidebar) and `mark.png` (raster reference)

- Tenant marks (tenant-owned, not Impulsionando identity): `public/brand/{riomed,wmp,colors,chrismed}/`
- Shadcn New York primitives exist in `src/components/ui/` and `apps/app-web/src/components/ui/`
- Next.js preset audit: `docs/reengineering/06-autonomous-marketing-platform/NEXTJS-PRESET-AUDIT.md`
- No customer testimonials, pricing, or live dashboard screenshots of the target product exist in this program. Do not fabricate them.

## Product Principles

1. One product, many companies — configuration, never forks.
2. Honest state over decorative data — unknown is unknown; AI does not execute by looking successful.
3. Daily work first — briefing, attention, next action, then exploration.
4. Human control of automation — prepare, approve, execute, undo, handoff.
5. Readable under interruption — Portuguese labels, currency, dense tables, mobile, keyboard, and contrast are product, not polish.

## Accessibility & Inclusion

Floor: WCAG 2.2 AA for all essential text and controls. Extra care (not a waiver of AA) for Brazilian Portuguese overflow, currency/tabular figures, dense tables, color-blind usage, 200% zoom, and 44px touch targets. Stakeholder asked for “the best”; AA is the gate, AAA for body and financial figures where feasible without harming density.
