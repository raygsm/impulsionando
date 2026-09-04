# Handoff checklist

Created: **2026-09-04**  
Frontend implementers: if an item is not in this folder, **do not invent it** — mark OPEN and ask.

## Tokens and type

- [ ] CSS variables from [DESIGN-TOKENS.md](./DESIGN-TOKENS.md) / [tokens.reference.json](./tokens.reference.json)
- [ ] Source Sans 3 + Source Code Pro self-hosted, latin-ext
- [ ] `--radius: 1rem`; control heights 40/44
- [ ] Light default; dark after-hours tokens

## Color and tenant

- [ ] Impulso `#C81E3A` as default action
- [ ] Tenant primary → validated action or fallback + banner
- [ ] Semantic colors locked
- [ ] Contrast ≥4.5:1 on text and essential controls
- [ ] Logo fallback initials

## Shell

- [ ] Keep shadcn sidebar + inset + header
- [ ] Seven areas in fixed order
- [ ] Bottom nav `<768`; sheet 768–1023
- [ ] Scope chip always when agent exists
- [ ] No template presets, Geist, Vercel analytics, demo verticals

## Home

- [ ] Region order: briefing → agent entry → queue → funnel → optional widgets → NBA → module health
- [ ] Unknown ≠ 0
- [ ] Restaurant / clinic / real-estate = same layout, different widgets/terms

## Components

- [ ] Anatomy/states in [COMPONENT-SYSTEM.md](./COMPONENT-SYSTEM.md)
- [ ] Prepared AI dashed + **Aprovar** only as action fill in panel
- [ ] Three agents visually distinct

## Screens

- [ ] Priority P0–P3 in [SCREEN-SPECS.md](./SCREEN-SPECS.md)
- [ ] Help uses Nest tickets only
- [ ] Client agent not mounted in `app-web`

## Responsive / a11y

- [ ] Breakpoints 320 / 768 / 1024 / 1440
- [ ] PT-BR overflow tested
- [ ] Keyboard + skip link + landmarks
- [ ] 200% zoom reflow
- [ ] `prefers-reduced-motion`

## Copy

- [ ] [PT-BR-COPY-DECK.md](./PT-BR-COPY-DECK.md)
- [ ] No English buttons in product UI

## Template

- [ ] [NEXTJS-TEMPLATE-DESIGN-MAP.md](./NEXTJS-TEMPLATE-DESIGN-MAP.md)

## Security / program

- [ ] No privileged data in the browser by design
- [ ] No ADR/phase skip; ADR-009 still Proposed until accepted
- [ ] Artifacts are **synthetic**

## Open items (do not close in UI)

See below. Label in code comments `OPEN` / `UNKNOWN` / `REQUIRES PRODUCT DECISION`.

## Open product decisions

| ID | Item | Label |
| --- | --- | --- |
| O1 | Password-reset public host (ADR-008) | `REQUIRES PRODUCT DECISION` |
| O2 | Skip allowed on onboarding steps | `OPEN` |
| O3 | Undo after AI execute | `UNKNOWN` (hide if no API) |
| O4 | Single vs dual Lead identity (growth vs customers) | `REQUIRES PRODUCT DECISION` |
| O5 | Staff switching into tenant vs Impulsionito scope | `REQUIRES PRODUCT DECISION` |
| O6 | Clinic document noun (prontuário vs documento) | `OPEN` |
| O7 | Dark mode as v1 shipped preference vs later | `OPEN` (tokens specified either way) |
| O8 | Commissioned logomark geometry | `OPEN` (wordmark meanwhile) |
| O9 | Rich-text allowed tags | `REQUIRES PRODUCT DECISION` |
| O10 | Exact production entitlement slugs | `UNKNOWN` |
| O11 | User enumeration on login/reset | `REQUIRES PRODUCT DECISION` |
| O12 | Request-access flow from forbidden widgets | `OPEN` |

## Visual artifacts

High-fidelity HTML (not low-fi markdown) lives in [artifacts/](./artifacts/). Labelled **Dados ilustrativos**. Not CHARACTERIZED live UI.
