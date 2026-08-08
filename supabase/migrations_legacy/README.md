# Legacy migrations archive

This directory preserves migrations that predate the canonical Impulsionando Supabase baseline (`20260730123239`).

They are intentionally outside `supabase/migrations` so `supabase db push` cannot apply the legacy Lovable-era schema to the official Core database. Nothing in this archive is executed automatically.

The active migration directory contains:

- the exact migration history recovered from the official Supabase project;
- reviewed migrations created after that baseline;
- no duplicate CHRISMED migration versions.

Do not move files back into the active directory without a reviewed schema diff and a successful remote dry-run.

`20260804143000_chrismed_multiprofessional_onboarding.sql` is additionally
quarantined because the official production schema does not contain its base
tables (`companies`, `user_roles`, `agenda_professionals`, `agenda_schedules`
and `agenda_blocks`) and its seed strings contain mojibake. Applying it before
a reviewed, canonical foundation migration would fail or create an incomplete
CHRISMED data model.
