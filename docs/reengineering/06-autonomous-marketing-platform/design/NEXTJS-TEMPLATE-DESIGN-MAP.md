# Next.js template design map

Created: **2026-09-04**  
Source: `https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git` @ `15e0a081bc1acad2b47adc638471b6e67fa36f10`  
Product audit: [`../NEXTJS-PRESET-AUDIT.md`](../NEXTJS-PRESET-AUDIT.md)  
Classification: **REUSE / RESTYLE / RESTRUCTURE / REMOVE / MISSING**

The template does **not** dictate IA, branding, or Home composition.

| Element | Class | Impulsionando treatment |
| --- | --- | --- |
| App Router layouts | **REUSE** | Keep `(dashboard)` / `(auth)` split |
| `SidebarProvider` + `Sidebar` + `SidebarInset` | **REUSE** | Pinned skeleton |
| Sidebar visual (slate/black primary) | **RESTYLE** | Stone paper rail, Source Sans 3, action color |
| Header 48px + trigger | **REUSE** | Add scope chip; tenant name truncate |
| Theme `data-theme-preset` tangerine/brutalist/soft-pop | **REMOVE** | One product theme + tenant action |
| Light/dark CSS variables | **RESTYLE** | Warm stone / after-hours |
| Cards | **RESTYLE** | Radius 16, shadow-sm, no nested KPI theatre |
| KPI four-up + sparkline Home | **RESTRUCTURE** | Briefing → agent → queue → funnel |
| Charts | **RESTYLE** | One action series; table alt; no fake demo data |
| Tables | **RESTYLE** | 44px rows, tnum, pt-BR |
| Forms / Field | **REUSE** | Labels PT-BR, 16px mobile |
| Auth screens (toast JSON, Google button) | **REMOVE** | Real Supabase SSR |
| Demo verticals (CRM/finance/patient/kanban/mail) | **REMOVE** | Our screens only |
| Geist font | **REMOVE** | Source Sans 3 |
| Vercel Analytics | **REMOVE** | |
| Mobile sidebar sheet | **REUSE** | Add bottom bar `<768` |
| `use-mobile` 768 | **REUSE** | Match our tablet rule |
| Command menu (if present in template) | **RESTYLE** or **MISSING** in stripped import — add |
| Accessibility Radix | **REUSE** | Raise contrast; add tests |
| Density | **RESTYLE** | Consumer padding on chrome; dense tables |
| Agent UI | **MISSING** | Build per AI-EXPERIENCE |
| Tenant switcher | **MISSING** | |
| Module states | **MISSING** in template | Keep `app-web` ModuleStateView, restyle |
| Healthz/ready | **MISSING** in template | Keep Impulsionando probes |
| Account switcher demo users | **REMOVE** | |
| `/dashboard` → `/dashboard/default` | **REMOVE** | Home is `/dashboard` |

## Shell

REUSE structure. RESTYLE tokens. RESTRUCTURE children of `main`.

## Sidebar

REUSE behavior (collapse, sheet, cookie). RESTYLE visuals. RESTRUCTURE items from `DashboardManifest`, not `sidebar-items.ts`.

## Header

REUSE. MISSING: agent launcher, scope chip.

## Theme

REMOVE presets. RESTYLE variables.

## Cards / charts / tables / forms

RESTYLE. REMOVE demo datasets.

## Auth

REMOVE template auth. REPLACE with product login spec.

## Mobile

REUSE sheet. MISSING bottom bar.

## Accessibility / density / agent

Template a11y **UNKNOWN** live. Density: do not copy demo dashboard emptiness. Agent: MISSING.
