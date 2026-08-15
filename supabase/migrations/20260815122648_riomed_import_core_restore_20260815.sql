create table if not exists public.riomed_import_jobs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  entity text not null default 'product', source_label text, mapping_snapshot jsonb not null default '{}'::jsonb,
  total_rows integer not null default 0, status text not null default 'pending' check(status in ('pending','running','done','failed','cancelled')),
  started_at timestamptz, finished_at timestamptz, rows_created integer not null default 0, rows_updated integer not null default 0,
  rows_skipped integer not null default 0, rows_failed integer not null default 0, errors jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.riomed_import_mappings (
  id uuid primary key default gen_random_uuid(), company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  name text not null, entity text not null default 'product', mapping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id,name)
);
do $$ declare t text; begin
  foreach t in array array['riomed_import_jobs','riomed_import_mappings'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('drop policy if exists riomed_import_company_access on public.%I',t);
    execute format('create policy riomed_import_company_access on public.%I for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()))',t);
  end loop;
end $$;
create index if not exists riomed_import_jobs_company_created_idx on public.riomed_import_jobs(company_id,created_at desc);
drop trigger if exists trg_riomed_import_jobs_touch on public.riomed_import_jobs;
create trigger trg_riomed_import_jobs_touch before update on public.riomed_import_jobs for each row execute function public.riomed_commercial_touch();
drop trigger if exists trg_riomed_import_mappings_touch on public.riomed_import_mappings;
create trigger trg_riomed_import_mappings_touch before update on public.riomed_import_mappings for each row execute function public.riomed_commercial_touch();