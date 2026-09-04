# @impulsionando/app-web

Authenticated Impulsionando dashboard. **Next.js App Router.**

ADR-009 is **Proposed**, not Aceita. This app is a feature-branch scaffold. It is **not** a production origin and must not be Traefik-promoted until G0 + accepted ADR.

## Provenance

Preset: `https://github.com/arhamkhnz/next-shadcn-admin-dashboard` @ `15e0a081bc1acad2b47adc638471b6e67fa36f10` (MIT). See `THIRD_PARTY_NOTICES.md` and `LICENSE.preset`.

## Scripts

```bash
pnpm --filter @impulsionando/app-web dev     # APP_WEB_PORT default 3320
pnpm --filter @impulsionando/app-web test
pnpm --filter @impulsionando/app-web build
```

Probes: `GET /healthz` (includes `gitSha`), `GET /ready`.

## Env (names only)

- `NEST_API_BASE` / `NEXT_PUBLIC_NEST_API_BASE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GIT_SHA`
- `APP_WEB_PORT`

No service-role key. No provider credentials.

## Preview fixtures (non-production)

`/preview/restaurant` and `/preview/clinic` exist only when `NODE_ENV !== production`. They are UI fixtures, not live tenants.

## Rollback

Revert this package to the Phase 4B Node health stub, or keep Traefik on the legacy authenticated origin. See ADR-009.
