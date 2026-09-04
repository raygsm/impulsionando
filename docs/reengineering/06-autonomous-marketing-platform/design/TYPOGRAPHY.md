# Typography

Created: **2026-09-04**

## Why these faces

| Face | Role | Why |
| --- | --- | --- |
| **Source Sans 3** (variable 400–800) | UI, headings, labels, buttons, agent messages | Humanist sans that still reads as a **counter app**, not a startup poster. Adobe SIL OFL. Excellent Latin Extended (ã, ç, õ, á). Designed for UI. Tabular lining figures for BRL. **Not** Inter, Geist, Plus Jakarta, DM Sans, Outfit, or Space Grotesk (Impeccable default cluster + discarded Inter). Roundness of the world is carried by **radius and pill actions**, not a bubbly typeface, so finance and CRM stay sharp. |
| **Source Code Pro** | IDs, SHAs, ticket numbers, JSON debug (staff) | Matching foundry; OFL; not an IDE costume on marketing copy. |

No separate display face in v1. The wordmark is Source Sans 3 ExtraBold. A commissioned display face is `OPEN`.

## Licensing

- Source Sans 3: [SIL Open Font License 1.1](https://github.com/adobe-fonts/source-sans)
- Source Code Pro: SIL OFL 1.1
- Self-host in the app (`next/font/local` or `@fontsource-variable/source-sans-3` + latin-ext). **Do not** runtime-hotlink Google Fonts in production (privacy, performance, CSP).

## Loading strategy

1. Preload the variable roman file; `font-display: swap`.
2. Subsets: `latin` + `latin-ext` (mandatory for PT-BR).
3. Weights used: 400, 600, 700, 800 (wordmark). Italic 400 for quotes/agent excerpts only.
4. Fallback stack (never show Inter as the intended face):

```css
--imp-font-sans: "Source Sans 3", "Source Sans 3 Variable", "Segoe UI",
  "Helvetica Neue", Arial, sans-serif;
--imp-font-mono: "Source Code Pro", ui-monospace, "SFMono-Regular", Menlo, monospace;
```

5. Metrics: enable `"tnum"` and `"ss01"` on `.imp-num`, tables, KPIs, currency. Body leaves default (proportional).

## Type scale (rem @ 16px root)

| Token | Size | Line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `--imp-text-display` | `clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem)` | 1.15 | 700 | `-0.02em` | Rare; login brand, empty-home title. Cap **2.25rem** (36px) in app-web — not marketing hero. |
| `--imp-text-h1` | `1.5rem` (24px) | 1.25 | 700 | `-0.02em` | Page title |
| `--imp-text-h2` | `1.25rem` (20px) | 1.3 | 600 | `-0.015em` | Section |
| `--imp-text-h3` | `1.125rem` (18px) | 1.35 | 600 | `-0.01em` | Card title |
| `--imp-text-body` | `1rem` (16px) | 1.5 | 400 | 0 | Body, agent messages |
| `--imp-text-body-sm` | `0.875rem` (14px) | 1.45 | 400 | 0 | Secondary body, tables |
| `--imp-text-label` | `0.875rem` (14px) | 1.3 | 600 | 0 | Form labels, nav |
| `--imp-text-caption` | `0.75rem` (12px) | 1.4 | 400 | `0.01em` | Captions, timestamps. **Minimum 12px.** |
| `--imp-text-kpi` | `1.75rem` (28px) | 1.1 | 700 | `-0.02em` | KPI number (`tnum`) |
| `--imp-text-kpi-sm` | `1.25rem` | 1.15 | 700 | `-0.015em` | Compact KPI |

Mobile: h1 stays 1.5rem; do not shrink body below 16px. Captions stay 12px.

## Role recipes

| Role | Recipe |
| --- | --- |
| Headings | h1–h3 as above; no all-caps section eyebrows |
| Body | 16px / 1.5 / 400 / ink; measure **65–75ch** on prose; dashboard widgets are not prose |
| Labels | 14px / 600; always visible; never placeholder-as-label |
| Captions | 12px muted; timestamps relative + `datetime` |
| Tables | 14px body-sm; `tnum`; `white-space: nowrap` on currency; wrap on names |
| KPIs | kpi size + caption label underneath (not eyebrow above) |
| Financial values | `tnum`; `pt-BR` `Intl.NumberFormat`; prefix `R$`; align **end**; negative in danger + minus sign, not parentheses-only |
| Agent messages | body 16px; meta caption 12px; code/IDs in mono 13px |
| Buttons | label 14px / 600; do not uppercase |
| Form controls | 16px on mobile (no iOS zoom); 14px optional at desktop `≥1024` if control height stays 40px |

## Portuguese

- Allow 2-line wrap on nav labels (`Acompanhamento`, `Reativação`). Collapsed sidebar uses icons + tooltips, not 9px condensed type.
- `ã õ ç` must not clip; test `Configuração`, `não`, `comunicação`.
- Hyphenation: `hyphens: auto; lang=pt-BR` on prose only, not on buttons or KPIs.

## Performance

- One variable family + one mono file.
- No more than two families on a page.
- Do not load italic until an agent transcript needs it (`unicode-range` or lazy).
