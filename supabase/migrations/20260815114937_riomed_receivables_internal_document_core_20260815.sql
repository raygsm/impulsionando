create table if not exists public.riomed_ar_invoices (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null default public.riomed_company_id() references public.companies(id) on delete cascade,
 order_id uuid references public.sales_orders(id) on delete set null,
 customer_id uuid,
 number text,
 description text not null,
 amount numeric(14,2) not null check(amount>=0),
 paid_amount numeric(14,2) not null default 0 check(paid_amount>=0),
 currency text not null default 'BOB',
 issue_date date not null default current_date,
 due_date date,
 paid_at timestamptz,
 payment_method text,
 status text not null default 'open' check(status=any(array['open','partial','paid','overdue','cancelled'])),
 notes text,
 internal_document_number text,
 internal_document_issued_at timestamptz,
 official_fiscal_status text not null default 'not_configured' check(official_fiscal_status=any(array['not_configured','pending_integration','issued_external','failed_external'])),
 official_fiscal_reference text,
 mp_preference_id text,
 mp_init_point text,
 mp_payment_id text,
 external_reference text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.riomed_fiscal_sequences (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null unique default public.riomed_company_id() references public.companies(id) on delete cascade,
 prefix text not null default 'INT-',
 next_number bigint not null default 1 check(next_number>0),
 padding int not null default 7 check(padding between 1 and 12),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create or replace function public.riomed_issue_internal_document(p_ar_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_company uuid; v_prefix text; v_num bigint; v_pad int; v_number text;
begin
 select company_id into v_company from public.riomed_ar_invoices where id=p_ar_id for update;
 if v_company is null then raise exception 'Conta a receber não encontrada'; end if;
 if not (public.user_belongs_to_company(auth.uid(),v_company) or public.is_impulsionando_staff(auth.uid()) or auth.role()='service_role') then raise exception 'Acesso negado'; end if;
 select internal_document_number into v_number from public.riomed_ar_invoices where id=p_ar_id;
 if v_number is not null then return v_number; end if;
 insert into public.riomed_fiscal_sequences(company_id) values(v_company) on conflict(company_id) do nothing;
 update public.riomed_fiscal_sequences set next_number=next_number+1,updated_at=now()
 where company_id=v_company and active=true returning prefix,next_number-1,padding into v_prefix,v_num,v_pad;
 if v_prefix is null then raise exception 'Sequência interna indisponível'; end if;
 v_number:=v_prefix||lpad(v_num::text,v_pad,'0');
 update public.riomed_ar_invoices set internal_document_number=v_number,internal_document_issued_at=now(),updated_at=now() where id=p_ar_id;
 return v_number;
end $$;
create or replace function public.riomed_ar_from_order(p_order_id uuid,p_due_days int default 30)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_order public.sales_orders%rowtype; v_id uuid;
begin
 select * into v_order from public.sales_orders where id=p_order_id;
 if not found then raise exception 'Pedido não encontrado'; end if;
 if not (public.user_belongs_to_company(auth.uid(),v_order.company_id) or public.is_impulsionando_staff(auth.uid()) or auth.role()='service_role') then raise exception 'Acesso negado'; end if;
 select id into v_id from public.riomed_ar_invoices where order_id=p_order_id limit 1;
 if v_id is not null then return v_id; end if;
 insert into public.riomed_ar_invoices(company_id,order_id,customer_id,number,description,amount,currency,due_date)
 values(v_order.company_id,v_order.id,v_order.customer_id,'AR-'||substr(v_order.id::text,1,8),'Pedido '||v_order.order_number,v_order.total,v_order.currency,current_date+greatest(p_due_days,0)) returning id into v_id;
 return v_id;
end $$;
alter table public.riomed_ar_invoices enable row level security;
alter table public.riomed_fiscal_sequences enable row level security;
grant select,insert,update,delete on public.riomed_ar_invoices,public.riomed_fiscal_sequences to authenticated;
grant all on public.riomed_ar_invoices,public.riomed_fiscal_sequences to service_role;
drop policy if exists riomed_ar_company_access on public.riomed_ar_invoices;
create policy riomed_ar_company_access on public.riomed_ar_invoices for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
drop policy if exists riomed_fiscal_sequence_company_access on public.riomed_fiscal_sequences;
create policy riomed_fiscal_sequence_company_access on public.riomed_fiscal_sequences for all to authenticated using(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid())) with check(public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()));
revoke all on function public.riomed_issue_internal_document(uuid) from public,anon; grant execute on function public.riomed_issue_internal_document(uuid) to authenticated,service_role;
revoke all on function public.riomed_ar_from_order(uuid,int) from public,anon; grant execute on function public.riomed_ar_from_order(uuid,int) to authenticated,service_role;
drop trigger if exists trg_riomed_ar_touch on public.riomed_ar_invoices; create trigger trg_riomed_ar_touch before update on public.riomed_ar_invoices for each row execute function public.riomed_commercial_touch();
drop trigger if exists trg_riomed_fiscal_sequence_touch on public.riomed_fiscal_sequences; create trigger trg_riomed_fiscal_sequence_touch before update on public.riomed_fiscal_sequences for each row execute function public.riomed_commercial_touch();
create index if not exists riomed_ar_company_status_due_idx on public.riomed_ar_invoices(company_id,status,due_date);
comment on column public.riomed_ar_invoices.internal_document_number is 'Identificador interno operacional; não representa autorização fiscal oficial.';
comment on column public.riomed_ar_invoices.official_fiscal_status is 'Estado da integração fiscal oficial externa; not_configured significa que nenhuma emissão fiscal oficial é feita pelo Core.';