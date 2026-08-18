create sequence if not exists public.quotes_number_seq start 1000;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default ('IMP-' || to_char(current_date,'YYYYMM') || '-' || lpad(nextval('public.quotes_number_seq')::text,6,'0')),
  public_token uuid not null unique default gen_random_uuid(),
  lead_name text not null,
  lead_whatsapp text not null,
  lead_email text,
  lead_role text,
  lead_city text,
  lead_state text,
  company_name text,
  company_tax_id text,
  company_legal_name text,
  category text,
  segment text,
  modules text[] not null default '{}',
  plan_code text,
  plan_name text,
  subtotal_cents bigint not null default 0,
  discount_pct numeric(7,2) not null default 0,
  discount_cents bigint not null default 0,
  setup_cents bigint not null default 0,
  total_cents bigint not null default 0,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  origin text,
  status text not null default 'draft' check (status in ('draft','reviewed','accepted','payment_requested','converted','cancelled')),
  accepted_at timestamptz,
  accepted_user_agent text,
  accepted_terms jsonb,
  payment_requested_at timestamptz,
  converted_contract_id uuid references public.billing_contracts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_created_at_idx on public.quotes(created_at desc);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_plan_code_idx on public.quotes(plan_code);
create index if not exists quotes_public_token_idx on public.quotes(public_token);

alter table public.quotes enable row level security;
revoke all on public.quotes from anon, authenticated;
grant select,insert,update,delete on public.quotes to service_role;

create or replace function public.touch_quotes_updated_at() returns trigger language plpgsql set search_path=pg_catalog,public as $function$ begin new.updated_at=now(); return new; end;$function$;
drop trigger if exists trg_quotes_updated_at on public.quotes;
create trigger trg_quotes_updated_at before update on public.quotes for each row execute function public.touch_quotes_updated_at();

create or replace view public.v_quote_funnel with (security_invoker=true) as
select status,count(*) as total,count(*) filter (where created_at>=now()-interval '7 days') as last_7d,count(*) filter (where created_at>=now()-interval '24 hours') as last_24h from public.quotes group by status;
revoke all on public.v_quote_funnel from anon,authenticated;
grant select on public.v_quote_funnel to service_role;
