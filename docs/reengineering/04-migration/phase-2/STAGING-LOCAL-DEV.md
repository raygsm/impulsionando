# Staging — local dev wiring

Opened: **2026-08-31**  
Staging project: `impulsionando-staging` · ref **`kyiczxtcoexnvcqgrgkr`**

## 1. Get keys (Dashboard)

**impulsionando-staging** → **Project Settings → API**:

| Copy into env | Field in Dashboard |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (server only; never browser commit) |

Do **not** reuse prod keys from `.env.local`.

## 2. Create local env file

```bash
cp .env.staging.example .env.staging
# Edit .env.staging — paste staging keys only (file is gitignored)
```

Optional: `.env.staging.local` for machine-specific overrides (wins in `dev:staging` mode).

## 3. Verify connection

```bash
npm run verify:staging-supabase
```

Expect: `OK — ref kyiczxtcoexnvcqgrgkr` and non-zero table counts if restore succeeded.

## 4. Run app against staging

```bash
npm run dev:staging
```

Vite loads `.env.staging` (overrides `.env.local` for conflicting keys). Open `http://localhost:8080`.

**Warning:** restored staging may contain **real PII**. No prod webhooks; no sharing URLs publicly.

## 5. Live auth baseline (Phase 1)

After fixtures exist:

```bash
npm run test:auth-baseline:live
```

See [`../phase-1/AUTH-TENANT-BASELINE-TESTS.md`](../phase-1/AUTH-TENANT-BASELINE-TESTS.md).

## 6. Supabase MCP (optional — agent SQL/schema)

For Cursor agent tools (list tables, run read-only SQL), not for running the app:

1. Repo config: [`.cursor/mcp.json`](../../../.cursor/mcp.json) — scoped to **staging ref only** + `read_only=true`.
2. Cursor → **Settings → Tools & MCP** → authenticate **supabase-staging** (OAuth).
3. Ask the agent e.g. “list tables on staging via MCP”.

**Do not** add prod ref to MCP. App runtime still uses `.env.staging` API keys.

Docs: [Supabase MCP guide](https://supabase.com/docs/guides/ai-tools/mcp)

## Related

- [`STAGING-ENV-INVENTORY.md`](./STAGING-ENV-INVENTORY.md)
- [`STAGING-RESTORE-EVIDENCE.md`](./STAGING-RESTORE-EVIDENCE.md)
