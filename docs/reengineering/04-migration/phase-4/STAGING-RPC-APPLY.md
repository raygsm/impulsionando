# Staging DB patch — Phase 4 RPC (operator)

**Project:** `aamorcqznimmleafavai` only — **never** prod `arygtqrdpcdkwnuwsgmm`.

## What this fixes

| Patch | Unblocks |
| --- | --- |
| `resolve_tenant_by_host` function + grants | P4 `GET /api/v1/tenants/resolve` |
| `companies` branding columns if missing | RPC can read subdomain/domain/colors |
| `support_ticket_seq` GRANT | P3 optional (legacy ticket code sequence) |

## Option A — Supabase SQL Editor (recommended)

1. Open [SQL Editor — staging project](https://supabase.com/dashboard/project/aamorcqznimmleafavai/sql/new)
2. Paste full contents of [`scripts/staging/phase4-resolve-tenant-rpc.sql`](../../../../scripts/staging/phase4-resolve-tenant-rpc.sql)
3. **Run**
4. Verify:

```bash
npm run phase4:smoke:tenant-resolve
```

## Option B — CLI script (if you have DB URI)

Add to `.env.staging` (gitignored):

```env
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@...pooler.supabase.com:6543/postgres
```

From Dashboard → Settings → Database → Connection string → URI.

```bash
npm run staging:apply:db-patch
```

## Verify RPC exists (no secrets printed)

After apply, `npm run phase4:smoke:tenant-resolve` should return HTTP **200** with `data` object or `null` (unknown host), not 503.

## Not authorized

- Running this SQL on **prod**
- `supabase db push` against prod from `config.toml` (points at prod ref — change target explicitly if using CLI)
