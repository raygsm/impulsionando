# Next.js dashboard preset audit

Created: **2026-09-04**  
Auditor: frontend agent (Cursor Grok 4.6)  
Recommendation: **ACCEPT WITH CHANGES**

This audit is a gate for importing a third-party dashboard into `apps/app-web`. It does **not** accept ADR-009. Nest remains the API/domain authority.

## Source

| Item | Value |
| --- | --- |
| Repository | `https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git` |
| Requested branch | `main` |
| Exact commit (pinned) | `15e0a081bc1acad2b47adc638471b6e67fa36f10` |
| Commit subject | `chore: remove new badges` |
| Author | Mohammed Arham Khan |
| Clone location (audit only) | `/tmp/next-shadcn-admin-dashboard` (outside the Impulsionando workspace; not copied as `.git`) |
| Package name at pin | `studio-admin` `2.2.0` |

## 1. License and commercial-use compatibility

**MIT License** (Copyright (c) 2024 Mohammed Arham Khan).

Commercial use, modification, distribution, and sublicense are allowed, provided the copyright notice and permission notice are retained in substantial portions.

**Compatible.** Attribution will live in `apps/app-web/THIRD_PARTY_NOTICES.md` plus a copy of the MIT text.

## 2. Next.js version and App Router

- Next.js `^16.3.4`
- App Router (`src/app/…`)
- `next.config.mjs` enables React Compiler and a `/dashboard` → `/dashboard/default` redirect
- File `src/proxy.disabled.ts` documents the Next 16 proxy rename; **no active middleware**

Compatible with a sibling Next.js runtime. The Impulsionando IA does **not** keep the template redirect to `/dashboard/default`.

## 3. React version

React `^19.2.8` / `react-dom` `^19.2.8`. Matches the target stack (React 19).

## 4. Node and package manager

- No `engines` field
- npm + `package-lock.json`
- `prepare`: `husky`
- Node 20+ is assumed by this monorepo

**Change:** import into the existing **pnpm** workspace. Do not copy the template lockfile, Husky, or `prepare` script.

## 5. Dependency vulnerabilities

Not scanned against a live advisory database in this session (npm audit was not treated as proof). Notable coupling:

| Package | Concern |
| --- | --- |
| `@vercel/analytics` | Third-party telemetry; **remove** |
| `cn` | Unusual className helper; replace with `clsx` + `tailwind-merge` |
| `zod` `^4.5.4` | Workspace contracts peer on **zod 3**; do not upgrade the monorepo |
| `next` 16 / `shadcn` 4 / `radix-ui` | Accept for `app-web` only |
| `geist` | Optional font package; Impulsionando uses Inter via `next/font` |

## 6. Abandoned or deprecated dependencies

Actively maintained template (commit dated 2026-09-05 local author timezone). Archive branches exist for Next 14/15; this pin is the current Next 16 line.

`ts-node` is only used for a theme-preset generator — **do not import**.

## 7. Authentication assumptions

Login/register forms **toast the submitted JSON**. There is no Supabase, JWT, cookie session, or server-side identity.

Demo users in `src/data/users.ts` (names, emails, GitHub avatar URL) are **not** identities.

**Change:** discard template auth; implement `@supabase/ssr` HttpOnly cookies via `@impulsionando/auth`.

## 8. Database / provider coupling

None. No Prisma, Drizzle, Supabase, Firebase, or SQL. Demo data is static JSON/TS.

## 9. Server Actions and Route Handlers

`src/server/server-actions.ts` only reads/writes **layout preference cookies**. No domain mutations.

**No Route Handlers** for business APIs.

**Change:** do not use Server Actions for Nest domain calls. Thin server fetches through `@impulsionando/api-client` only.

## 10. Embedded business logic

UI-only CRM/finance/e-commerce/patient-monitoring screens with hardcoded tables. Planned RBAC in README is **not implemented**.

**Change:** do not ship demo verticals as Impulsionando capabilities.

## 11. Analytics and telemetry

`@vercel/analytics` is mounted in the root layout with a comment that it is for the hosted demo.

**Remove.**

## 12. External fonts / assets

- `geist` package
- Optional Google-font CSS variables in `globals.css`
- `media/dashboard.png` screenshot
- Flag-icon CSS unused by the Impulsionando shell

**Change:** Inter via `next/font/google`; no Geist requirement.

## 13. Hard-coded credentials or endpoints

No API keys, service-role strings, or `.env` files at the pinned commit.

Hard-coded **public** demo identities and a GitHub avatar URL in `src/data/users.ts` — do not copy.

## 14. Copied `.env` files or secrets

**None present.**

## 15. Build scripts and post-install

| Script | Import? |
| --- | --- |
| `next dev/build/start` | Yes |
| `biome lint/format/check` | Optional; Impulsionando root uses ESLint/Prettier — app-web will use workspace TypeScript + Vitest |
| `prepare` / Husky / lint-staged | **No** (would hook the whole monorepo) |
| `generate:presets` | **No** |

## 16. Existing API routes

None under `src/app/api`. Impulsionando must add `/healthz` and `/ready` only (plus Next internals). Domain traffic goes to Nest.

## 17. Accessibility

shadcn/Radix primitives (focus rings, `aria-invalid`, sidebar sheet on mobile). **No automated a11y test command** in the template.

Impulsionando must add component tests and contrast-conscious tokens; template a11y is **STATIC**, not CHARACTERIZED.

## 18. Responsive behavior

Sidebar collapses to a sheet below 768px (`use-mobile`). Dashboard grids use Tailwind breakpoints. **LIVE proof requires running the imported app**, not this audit.

## 19. Theme implementation

CSS variables + `data-theme-mode` / `data-theme-preset` (default, tangerine, brutalist, soft-pop). Light/dark supported.

**Change:** tenant branding may override **primary/accent tokens only** from `TenantConfigV1.branding`. No per-tenant CSS bundles. Template presets are optional chrome, not product identity.

## 20. Test and lint configuration

Biome 2.5; **no unit/component/e2e tests**. Impulsionando must add Vitest coverage for manifest, module states, envelopes, and navigation fixtures.

## Reusable parts

- App Router layout patterns
- shadcn `src/components/ui/*` (Radix Nova) as the visual primitive set
- Sidebar / inset shell, sheet, tooltip, table, form field primitives
- Tailwind 4 + CSS variable theme
- Light/dark tokens
- Colocation of route-level `_components/` (adapted to Impulsionando areas)

## Parts to remove

- All demo dashboards (CRM, finance, academy, logistics, patient monitoring, kanban, invoice, mail, chat, users, roles, …)
- `(legacy)` screens
- Fake login/register and Google social button
- `src/data/users.ts`
- Vercel Analytics
- GitHub repositories header menu
- Account switcher bound to demo users
- npm lockfile, Husky, Biome (as repo-wide tooling)
- Template `APP_CONFIG` “Studio Admin” branding
- `/dashboard` → `/dashboard/default` redirect
- Zod 4 (keep workspace Zod 3)

## Security concerns

| Finding | Severity | Mitigation |
| --- | --- | --- |
| Fake auth that looks like a real login | High if copied | Replace with Supabase SSR; never toast credentials |
| Demo PII-like emails/avatars | Low | Do not copy |
| Preference cookies set without `httpOnly`/`secure` | Low (layout only) | Do not store sessions there |
| Vercel Analytics on all pages | Medium (data leak / extra vendor) | Remove |
| No CSRF/session model | N/A until we add auth | Nest + cookie session is the model |

No secrets found at the pin.

## Architecture conflicts

| Template | Impulsionando target |
| --- | --- |
| Next.js is the whole product | Next.js is **UI/SSR only**; Nest owns domain |
| Hard-coded `sidebar-items.ts` | Server-computed `DashboardManifest` (transitional adapter until Nest ships it) |
| npm app | pnpm workspace package `@impulsionando/app-web` |
| Zod 4 | Zod 3 (contracts) |
| No health/SHA | `/healthz` + `/ready` with full Git SHA |
| Demo APIs | Existing Nest `/api/v1/*` only |

Conflicts are resolvable by **importing the design system, not the product**.

## Recommendation

**ACCEPT WITH CHANGES.**

License is compatible, no secrets, no second database, App Router + React 19 are usable. The pin is accepted as a **visual/layout preset**, not as an authentication, data, or authorization system.

Import is still gated by **ADR-009 remaining Proposed until Cauã + Raygs accept it**, and by Phase 8 **G0**. Scaffolding on a feature branch is not a production cutover and is not a dual live dashboard.

## Evidence level

| Claim | Level |
| --- | --- |
| License MIT at pin | `STATIC` |
| No `.env` / secrets at pin | `STATIC` |
| Auth is non-functional demo | `STATIC` |
| npm audit clean / CVEs absent | `UNKNOWN` |
| Accessibility of imported shell | `UNKNOWN` until tests + browser pass |
