# Core Master Tenant Registry

Status: repository-ready, pending Supabase migration apply.

## Objective

Make Impulsionando the official Core/master system for managed tenants, independent from Lovable as an operating dependency.

The master dashboard must be able to manage clients, modules, tools, plans, agenda, upgrades, downgrades and support access from the Impulsionando admin area.

## Official Core

- Master company: `Impulsionando`
- Official Supabase project: `arygtqrdpcdkwnuwsgmm`
- Master user to promote when present in Supabase Auth: `ricks@hotmail.com`
- Master profile: `super-admin-impulsionando`

## Official Tenants

The migration `20260625153000_core_master_tenant_registry.sql` registers or updates these canonical tenants:

- `riomed`
- `chrismed`
- `imobiliaria-garrido`
- `wmp`
- `dqa`

Each tenant receives:

- canonical `public_slug`;
- tenant identity in `core_tenant_identity`;
- active commercial, financial and technical statuses;
- stable release channel;
- native migration status;
- default module enablement in `company_modules`;
- `company_settings.core.master_control` with master-management flags.

## Enabled Capabilities

The registry marks each tenant as managed by Impulsionando with these master controls:

- module installation;
- out-of-plan tool enablement;
- plan upgrade and downgrade;
- agenda installation;
- support impersonation;
- dashboard-level tenant management.

## Safety

The migration is idempotent and uses only:

- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`;
- `INSERT ... ON CONFLICT DO UPDATE`;
- targeted `UPDATE` by tenant identity;
- `NOTIFY pgrst, 'reload schema'`.

It does not use `DROP`, `TRUNCATE` or `DELETE`.

## Execution Rule

Do not paste this migration manually into production unless the repository workflow is unavailable. Preferred path:

1. merge the branch into `main`;
2. run the GitHub workflow `Apply Supabase Migrations`;
3. confirm the workflow uses project `arygtqrdpcdkwnuwsgmm`;
4. confirm `public.companies`, `public.company_modules`, `public.core_tenant_identity` and `public.user_profiles` contain the expected records.
