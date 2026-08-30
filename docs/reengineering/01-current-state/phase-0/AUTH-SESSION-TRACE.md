# J-02 — Auth / session / membership (static trace)

Evidence level: `STATIC` (2026-08-30). No production user export. Allow/deny tests not executed.

## Canonical path (code)

1. **Browser session** — Supabase Auth client (`src/integrations/supabase/client.ts`); session in localStorage.
2. **Client → serverFn** — `attachSupabaseAuth` (`src/integrations/supabase/auth-attacher.ts`) attaches `Authorization: Bearer <access_token>` when a session exists. Must be registered as global function middleware in `src/start.ts`.
3. **ServerFn gate** — `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`):
   - requires `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`;
   - requires Bearer token;
   - validates via `supabase.auth.getClaims(token)`;
   - injects `{ supabase, userId, claims }` into context.
4. **Authenticated UI gate** — `src/routes/_authenticated/route.tsx` (`ssr: false`):
   - `supabase.auth.getUser()`; missing user → redirect `/auth`;
   - **WMP host only:** membership check on `communication_tenant_members` for hardcoded `WMP_TENANT_ID`; fail → `signOut` + `/auth`;
   - non-WMP hosts use `AppShell` + `BillingGate` without that membership table check in `beforeLoad`.
5. **Membership / roles** — `fetchCurrentUser` (`src/lib/auth.ts`):
   - reads `user_roles` by `user_id` (maps to `company_id` + role);
   - staff/super-admin via `app_metadata` (`is_super_admin`, `platform_role`, `is_impulsionando_staff`);
   - master observer via RPC `is_impulsionando_master_observer`.
6. **Password reset** — legacy/product code points recovery to apex `https://impulsionando.com.br/reset-password` (`DECLARED` / `STATIC`; per-tenant reset UX still `UNKNOWN`).

## Tenant key

Dominant membership key in this path is `company_id` via `user_roles`. WMP authenticated shell uses a separate `tenant_id` table (`communication_tenant_members`). `company_id` ≡ tenant remains `DECLARED` belief / unproven for every table (clarifications 2026-08-30).

## Allow / deny test plan (not executed)

Safe fixtures only; no prod user dump.

| Case | Expected |
| --- | --- |
| Valid session + membership on host | enter `/_authenticated` |
| Expired / missing session | redirect `/auth` |
| Valid session, no `user_roles` / no WMP membership | deny (WMP: sign-out; Core: empty memberships / staff path) |
| Wrong role for module | deny at feature gate (per route; needs fixture) |
| Cross-tenant `company_id` | deny via RLS + app checks (needs two test accounts) |

**Blocker to execute:** dedicated test accounts owned by Cauã/Raygs; approval for any write characterization.

## Migration decision

`migrate` — preserve Auth + membership contracts; extract gates into Nest/API later without changing identity providers in Phase 0.
