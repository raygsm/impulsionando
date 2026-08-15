create table if not exists public.riomed_search_queries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  channel text not null default 'web',
  query_text text,
  query_image_url text,
  query_kind text not null default 'text' check(query_kind in ('text','image','multimodal')),
  results_count integer not null default 0,
  top_product_id uuid references public.riomed_products(id) on delete set null,
  top_score numeric,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.riomed_search_queries enable row level security;
grant select,insert,update,delete on public.riomed_search_queries to authenticated;
grant all on public.riomed_search_queries to service_role;
drop policy if exists riomed_search_company_access on public.riomed_search_queries;
create policy riomed_search_company_access on public.riomed_search_queries for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
create index if not exists riomed_search_queries_company_created_idx on public.riomed_search_queries(company_id,created_at desc);