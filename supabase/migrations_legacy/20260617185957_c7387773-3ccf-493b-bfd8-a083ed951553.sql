
create table if not exists public.billing_pix_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  contract_id uuid references public.billing_contracts(id) on delete set null,
  plan_code text,
  base_amount_cents integer not null check (base_amount_cents > 0),
  unique_amount_cents integer not null check (unique_amount_cents > 0),
  pix_payload text not null,
  pix_key text not null,
  txid text not null,
  status text not null default 'pending' check (status in ('pending','paid','expired','cancelled')),
  payer_name text,
  payer_doc text,
  payer_email text,
  payer_whatsapp text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  paid_at timestamptz,
  confirmed_by uuid references auth.users(id) on delete set null,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_pix_charges_pending_amount_uniq
  on public.billing_pix_charges (unique_amount_cents)
  where status = 'pending';

create index if not exists billing_pix_charges_company_idx
  on public.billing_pix_charges (company_id);

create index if not exists billing_pix_charges_status_idx
  on public.billing_pix_charges (status, created_at desc);

grant select, update on public.billing_pix_charges to authenticated;
grant all on public.billing_pix_charges to service_role;

alter table public.billing_pix_charges enable row level security;

create policy "owners read own pix charges"
  on public.billing_pix_charges
  for select
  to authenticated
  using (
    company_id is not null
    and exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.company_id = billing_pix_charges.company_id
    )
  );

create policy "admins read all pix charges"
  on public.billing_pix_charges
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins update pix charges"
  on public.billing_pix_charges
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger billing_pix_charges_set_updated_at
  before update on public.billing_pix_charges
  for each row execute function public.update_updated_at_column();
