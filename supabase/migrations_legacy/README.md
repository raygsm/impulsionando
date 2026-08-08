# Legacy migrations archive

This directory preserves migrations that predate the canonical Impulsionando Supabase baseline (`20260730123239`).

They are intentionally outside `supabase/migrations` so `supabase db push` cannot apply the legacy Lovable-era schema to the official Core database. Nothing in this archive is executed automatically.

The active migration directory contains:

- the exact migration history recovered from the official Supabase project;
- reviewed migrations created after that baseline;
- no duplicate CHRISMED migration versions.

Do not move files back into the active directory without a reviewed schema diff and a successful remote dry-run.
