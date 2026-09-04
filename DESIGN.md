---
name: Impulsionando
description: Autonomous marketing operations for physical Brazilian businesses — one dashboard, tenant configuration, human-stamped AI.
colors:
  ground: "#F3EFE8"
  surface: "#FFFFFF"
  ink: "#1C1916"
  ink-muted: "#5C564E"
  border: "#E4DFD6"
  action: "#C81E3A"
  action-hover: "#A81830"
  action-foreground: "#FFFFFF"
  success: "#0F7A4B"
  warning: "#8A5A00"
  danger: "#B42318"
  info: "#185FA5"
  ai-prepared: "#6B2D5B"
typography:
  body:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  kpi:
    fontFamily: "Source Sans 3, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Overview

Authenticated `app-web` is **App de balcão**: warm stone canvas, paper cards, Source Sans 3, and a single action color (Impulso carmine or a contrast-safe tenant primary) only where something can be pressed. The Next.js shadcn sidebar/header skeleton is kept; Home is briefing → agent entry → attention queue → funnel, never four decorative KPIs. AI prepares; humans approve. Public tenant and Impulsionito use the same tokens with different chrome. Full authority: `docs/reengineering/06-autonomous-marketing-platform/design/`.

# Colors

Stone ground `#F3EFE8`, paper `#FFFFFF`, ink `#1C1916`, muted `#5C564E`. Action `#C81E3A` on light (5.67:1 on white). Semantic success/warning/danger/info are locked. Tenant may override action only after AA validation; otherwise Impulso plus a banner.

# Typography

Source Sans 3 (OFL, latin-ext, tabular nums on data). No Inter, Geist, or display serif. Body 16px; captions 12px minimum; buttons sentence case PT-BR.

# Layout

Sidebar 256px / icon 56px; header 48–56px; bottom nav below 768px; 12-column grid; widgets 4/6/8/12. Seven invariant areas. Niches change widgets and words, not aisles.

# Elevation & Depth

Hairline borders and small offset shadows (`0 1px 2px` rest, larger for modal/agent). No glass, neon glow, or gradient hero.

# Shapes

16px cards, 12px controls, 8px inputs, pills for badges. Prepared AI uses a dashed mulberry border, not a glow.

# Components

shadcn/Radix restyled. Primary fill is action-only. Agent panel always shows `{agent} · {tenant}` or **Impulsionito · Impulsionando**. Unknown data renders **Sem dados**, never `0`.

# Do's and Don'ts

Do: one product, honest states, stamp-to-approve, PT-BR, 44px targets, WCAG 2.2 AA.  
Don't: navy-orange rocket identity, template presets, per-tenant layout forks, confidence percentages, Impulsionito on tenant Home, admin chrome on the public agent.
