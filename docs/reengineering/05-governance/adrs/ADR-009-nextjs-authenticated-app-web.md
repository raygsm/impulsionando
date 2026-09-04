# ADR-009 — Next.js for authenticated `app-web`

## Estado

Proposta

Not Aceita. Does **not** replace ADR-002 until Cauã + Raygs formally accept this record. Implementation on a feature branch is scaffolding evidence, not an accepted stack change, not a Phase 8 G0 opening, and not a production/staging cutover.

## Contexto

ADR-002 (Aceita, 2026-08-30) keeps TanStack Start for `platform-web`, `tenant-web`, and `app-web`. The stated alternative “migrate to Next.js” was rejected because a full frontend rewrite does not fix domain authority, multi-tenancy, or releases.

Phase 8 now has to rebuild the **authenticated** product (`apps/app-web` is still a Node health stub). Product direction for that surface is a single universal dashboard for physical businesses (acquisition, CRM, operations, finance UI, support, governed AI), composed from entitlements rather than per-tenant route trees.

A pinned MIT App Router preset (`arhamkhnz/next-shadcn-admin-dashboard` @ `15e0a081bc1acad2b47adc638471b6e67fa36f10`) supplies a modern shell (Next 16, React 19, Tailwind 4, shadcn). Audit: [`../../06-autonomous-marketing-platform/NEXTJS-PRESET-AUDIT.md`](../../06-autonomous-marketing-platform/NEXTJS-PRESET-AUDIT.md) — **ACCEPT WITH CHANGES**.

Keeping TanStack Start for the authenticated app **and** introducing a Next.js dashboard as a second live product would violate the strangler rule of one owner per capability (Phase 8 R-01 / R-13).

This ADR is the **partial amendment** of ADR-002: Next.js **only** for authenticated `app-web`. Public surfaces stay TanStack until their own ADRs.

## Decisão

**If accepted**, use **Next.js App Router** as the runtime for authenticated `app-web`.

Limits:

1. **NestJS/Fastify remains the only domain/API authority** (ADR-003). Next.js may SSR-render, guard the session cookie, and make thin authenticated fetches. It must not own business rules, tenant authorization, payments, queues, provider SDKs, or privileged Supabase access.
2. **TanStack Start remains** for `platform-web`, `tenant-web`, and the legacy monolith strangler until those surfaces are retired under Phase 7 / later ADRs.
3. **One authenticated dashboard.** Do not operate a permanent Next.js dashboard **and** a TanStack `_authenticated` dashboard as parallel products. Legacy routes stay until each capability is proven and the route-ownership manifest flips — then the legacy owner is removed (Phase 8 8H).
4. **ADR-008 stands.** Public marketing (`platform-web`) and white-label sites (`tenant-web`) stay separate from `app-web`. Hostname selects tenant **configuration**, never a per-tenant commit or route tree.
5. **Same release discipline** (ADR-007): image `ghcr.io/raygsm/impulsionando-app-web:<full-git-sha>`; `/healthz` exposes `gitSha`; never `latest`.
6. **Preset is a design system, not a backend.** Strip demo auth, Vercel Analytics, fake data, npm lockfile, Husky.
7. **Contracts** live in `packages/contracts`. UI talks through `packages/api-client`. Session helpers live in `packages/auth` (`@supabase/ssr` cookies).
8. **Phase gates.** Feature-branch scaffolding ≠ G0. Staging deploy of Next `app-web` needs G0 + this ADR Aceita. Production DNS stays Phase 7.

### Migration

```text
legacy TanStack `_authenticated`  ── strangler, default owner
        │
        ▼
apps/app-web (Next.js)            ── new owner per flipped prefix
        │
        ▼
Nest api + worker + managed Supabase
```

Coexistence uses the Phase 8 route-ownership manifest (exactly one owner per prefix). Session continuity: cookie dual-write during strangling (F3), one canonical host (`app.stg…` proposed).

### Rollback

- **Before Traefik serves Next.js:** delete or freeze the feature branch; the Node health stub (or previous SHA) remains.
- **After a prefix is flipped:** set that prefix `owner` back to `legacy` in the manifest; do not run two writers.
- **If Next.js is rejected:** restore ADR-002 unmodified for `app-web` and implement F1 as TanStack Start per [`../04-migration/phase-8/TARGET-APP-SHAPE.md`](../../04-migration/phase-8/TARGET-APP-SHAPE.md).

## Alternativas consideradas

- **Keep ADR-002 unchanged (TanStack Start `app-web`).** Lowest framework cost; Phase 8 F1 already specified this. Rejected *only if* this ADR is accepted for dashboard UX/preset reuse — not because TanStack cannot SSR.
- **Rewrite all three web apps to Next.js now.** Out of scope (OBJECTIVE: no full frontend swap for preference); explodes public white-label risk.
- **Permanent dual dashboards (TanStack + Next).** Forbidden: two owners, two design systems, split session.
- **Next.js as BFF/domain.** Forbidden: recreates the monolith (TECHNOLOGY-BOUNDARIES).

## Consequências

### Positivas

- Reuses a maintained App Router + shadcn shell instead of inventing one.
- Clearer split: authenticated product vs public TanStack sites (ADR-008).
- Aligns `app-web` with SSR session cookies (`@supabase/ssr`) rather than the legacy `localStorage` SPA inside Nitro.

### Negativas e custos

- **Two frontend frameworks** in one monorepo (TanStack Start + Next.js) until public apps move or the legacy strangler dies: two build graphs, two Dockerfiles, two mental models, shared packages must stay framework-agnostic.
- Team must not copy `createServerFn` habits into Next Server Actions.
- Zod 3 (contracts) vs template Zod 4 — stay on workspace Zod 3.
- ADR-002 review criteria are triggered; this must be an explicit human accept, not drift.

## Critérios de revisão

- Evidence that Next.js blocks SSR multi-tenant routing, SHA health, or observability worse than TanStack Start at lower cost than staying.
- Decision to unify all web apps on one meta-framework (would need a new ADR).
- Failure to keep Nest as the sole domain authority (revert this ADR).

## Evidências

- [`ADR-002-keep-tanstack-start-frontends.md`](ADR-002-keep-tanstack-start-frontends.md)
- [`ADR-003-nestjs-fastify-modular-api.md`](ADR-003-nestjs-fastify-modular-api.md)
- [`ADR-008-split-platform-tenant-app-web.md`](ADR-008-split-platform-tenant-app-web.md)
- [`../../06-autonomous-marketing-platform/NEXTJS-PRESET-AUDIT.md`](../../06-autonomous-marketing-platform/NEXTJS-PRESET-AUDIT.md)
- [`../../04-migration/phase-8/TARGET-APP-SHAPE.md`](../../04-migration/phase-8/TARGET-APP-SHAPE.md)
- [`../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)
