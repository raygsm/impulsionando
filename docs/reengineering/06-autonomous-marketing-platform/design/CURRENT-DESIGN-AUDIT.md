# Current design audit

Created: **2026-09-04**  
Classification: **KEEP / REFINE / REPLACE / REMOVE / UNKNOWN**  
Evidence: STATIC unless noted. Incumbent visuals are **anti-reference** for identity (stakeholder 2026-09-04: mark and UI discarded). Template skeleton is **pinned**.

## 1. Impulsionando identity

| Item | Evidence | Class | Notes |
| --- | --- | --- | --- |
| Name Impulsionando | Product, legal, domains | **KEEP** | Only binding brand asset |
| PNG mark (rocket, pixel I/P, orbital swoosh, “TECNOLOGIA”) | `public/brand/impulsionando/logo.png` | **REPLACE** | Discarded; do not ship in `app-web` |
| `LogoImpulsionando` white-card-on-dark rule | `src/components/brand/LogoImpulsionando.tsx` | **REPLACE** | Tied to the discarded full-color PNG |
| Wordmark “Impulsionando Tecnologia” alt | same | **REFINE** | Product UI: “Impulsionando”; institutional may keep descriptor |

## 2. Logos and brand assets

| Item | Path | Class |
| --- | --- | --- |
| Tenant logos (RioMed, WMP, Colors, ChrisMed) | `public/brand/*` | **KEEP** as tenant-owned files; **REMOVE** as Impulsionando identity |
| Per-tenant CSS palettes | `src/styles/tokens-tenants.css` | **REPLACE** | Runtime CSS variables for primary/accent only; no per-tenant stylesheets |
| White-label architecture comment | same file | **KEEP** as intent; implementation changes |

## 3. Typography

| Item | Evidence | Class |
| --- | --- | --- |
| Inter Variable (legacy) | `src/styles.css` `@fontsource-variable/inter` | **REPLACE** → Source Sans 3 |
| Inter via `next/font` (`app-web`) | `apps/app-web/src/app/layout.tsx` | **REPLACE** |
| Geist (template audit) | NEXTJS-PRESET-AUDIT | **REMOVE** |
| `font-feature-settings: cv02…` on Inter | `src/styles.css` | **REMOVE** with Inter; Source Sans 3 uses `tnum` on data |

## 4. Colors

| Item | Evidence | Class |
| --- | --- | --- |
| Navy + glow blue + orange | `src/styles.css` `:root` `--primary` / `--brand-orange` | **REPLACE** |
| Hero / primary / accent gradients | `--gradient-hero` etc. | **REMOVE** |
| Forced blue scrollbars `#1E3A8A` | `src/styles.css` P4 block | **REMOVE** |
| Semantic success/warning/destructive | tokens-core + shadcn | **REFINE** | Recalibrate to AA on warm ground; lock against tenant override |
| Template default near-black primary | `apps/app-web/src/app/globals.css` | **REPLACE** with Impulso / tenant action |
| Template presets tangerine / brutalist / soft-pop | `apps/app-web/src/styles/presets/` | **REMOVE** from product identity (optional internal playground only) |
| WhatsApp official green button | `.btn-whatsapp` | **KEEP** as third-party exception |

## 5. Legacy dashboard

| Item | Evidence | Class |
| --- | --- | --- |
| Dark “premium executive” sidebar | `--sidebar: oklch(0.22 0.08 260)` | **REPLACE** | Consumer-app light rail |
| Competing shells (ChrisMed, Marocas, Demo, app Sidebar) | `src/components/*Shell*` | **REMOVE** as pattern; one shell |
| 576 authenticated routes / dual RBAC | CURRENT-STATE-AND-GAPS | **REPLACE** via Phase 8 — out of visual scope |
| Direct Supabase from UI (~32%) | same | **REMOVE** as a design assumption: UI never implies privileged data |

## 6. Navigation

| Item | Evidence | Class |
| --- | --- | --- |
| Invariant 7 areas | `DASHBOARD-V1.md`, `app-sidebar-nav.tsx` | **KEEP** |
| shadcn Sidebar + inset + trigger | `apps/app-web` layout | **KEEP** skeleton **RESTYLE** |
| `SidebarGroupLabel` “Áreas” | nav component | **REFINE** | Unnecessary eyebrow; heading should speak (craft-floor) — use `aria-label` on nav instead |
| Disabled items when `!item.enabled` | same | **KEEP** behavior **REFINE** copy |
| Lucide area icons | same | **KEEP** with mapping in IA |
| Command menu | missing in `app-web` | **MISSING** → add per component system |
| Tenant switcher | not in current shell | **MISSING** if multi-membership; `REQUIRES PRODUCT DECISION` if single-tenant session |

## 7. UI primitives

| Item | Evidence | Class |
| --- | --- | --- |
| shadcn New York + Radix | `components.json`, `src/components/ui/*`, `apps/app-web/src/components/ui/*` | **KEEP** as implementation family **RESTYLE** |
| Button 44px-class heights (`h-10` mobile) | `src/components/ui/button.tsx` | **KEEP** **REFINE** radius + action-only fill |
| Module state view | `apps/app-web` states | **KEEP** contract **RESTYLE** |
| Area widgets | `area-widgets` | **REFINE** to widget catalog |
| Sonner toasts | both trees | **KEEP** **RESTYLE** |

## 8. Tenant branding (legacy)

| Item | Class | Notes |
| --- | --- | --- |
| Name + logo in sidebar | **KEEP** | Fallback initials tile |
| Primary/accent CSS per slug | **REPLACE** | Contrast-validated runtime tokens |
| Dark medical / gold real-estate skins that re-theme the whole chrome | **REMOVE** | Destroys one-product recognition and often contrast |

## 9. Next.js dashboard template

Pin `15e0a081bc1acad2b47adc638471b6e67fa36f10`. Full map: [NEXTJS-TEMPLATE-DESIGN-MAP.md](./NEXTJS-TEMPLATE-DESIGN-MAP.md).

| Item | Class |
| --- | --- |
| App Router shell, Sidebar, Header, Sheet mobile | **KEEP** |
| Visual identity, Geist, demo verticals, fake auth, Vercel analytics | **REMOVE** |
| KPI-four-up + sparkline as Home | **REMOVE** as structure |
| Agent UI | **MISSING** |

## 10. Accessibility

| Item | Evidence | Class |
| --- | --- | --- |
| WCAG thresholds in `contrast.config.json` | `/_authenticated/**` normal **4.0** | **REPLACE** → **4.5** everywhere essential |
| Radix focus rings | primitives | **KEEP** **REFINE** to 3px action-colored ring on stone offset |
| Template a11y | audit | **UNKNOWN** until tests |
| Inter on dense PT-BR | observed | **REFINE** via Source Sans 3 + overflow rules |

## 11. Inconsistent component behavior

| Finding | Class |
| --- | --- |
| Two component trees (`src/components/ui` vs `apps/app-web/src/components/ui`) | **REFINE** | `app-web` is the target; do not keep dual visual truth |
| Legacy Button vs template Button | **REPLACE** with one restyled shadcn button |
| Chat/agent experiences fragmented (Oliver, Impulsionito HTTP, Nest gateway) | **REPLACE** with AI-EXPERIENCE states on Nest gateway only |

## 12. Duplicate dashboard patterns

| Finding | Class |
| --- | --- |
| Demo shell, tenant shells, template default dashboard | **REMOVE** extras; one Home |
| Template CRM/finance demo screens | **REMOVE** | Impulsionando screens are specified here, not imported as product |

## 13. Mobile

| Item | Class |
| --- | --- |
| Sidebar → sheet `<768` (`use-mobile`) | **KEEP** |
| Persistent thumb bar | **MISSING** → add for the 7 areas (More overflow) |
| Long PT-BR labels in collapsed icon sidebar | **UNKNOWN** live | Specify truncation + tooltip |

## 14. Dark mode

| Item | Class |
| --- | --- |
| `.dark` tokens in legacy and template | **REFINE** | Recast as after-hours stone, not cool OLED navy |
| Default | **REPLACE** assumption | Light is default operating scene |

## 15. Information density

| Item | Class |
| --- | --- |
| Template generous consumer padding | **KEEP** as world **REFINE** tables to dense-but-touchable |
| Legacy dense enterprise tables | **REFINE** | Keep density for finance; not the whole chrome |
| Unknown-as-zero risk | **KEEP** the product rule (never display unknown as 0) |

## 16. Agent / chat

| Item | Class |
| --- | --- |
| `AgentChatBridge` on dashboard layout | **KEEP** mount point **RESTYLE** |
| Nest AI gateway | **KEEP** as behavior authority |
| Legacy Impulsionito HTTP routes | **REMOVE** as target (AI-OPERATING-MODEL) |
| Client-facing agent in `app-web` | **REMOVE** | Belongs on `tenant-web` |
| Scope/tenant/agent identity in chrome | **MISSING** |

## Visual references (incumbent — anti-reference)

- Discarded mark: `public/brand/impulsionando/logo.png` (rocket + pixels + TECNOLOGIA lockup).
- Tenant example of a wide horizontal logo that must shrink: `public/brand/riomed/logo.png`.
- Template look (do not ship): slate sidebar, four KPI cards, Inter, black primary — see direction canon sketch and `globals.css` `:root`.

No live screenshot of a finished Impulsionando `app-web` Home exists. **UNKNOWN** as CHARACTERIZED product UI.

## Audit summary

Keep the **skeleton, Radix behavior, invariant IA, Lucide, module-state contract, and Nest-as-authority**. Replace **identity, type, color, dark executive chrome, per-tenant CSS forks, template presets, and decorative KPI Home**. Remove **gradients, forced blue scrollbars, demo verticals, dual shells, and confidence theatre**.
