create table if not exists public.core_commercial_contract_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  billing_contract_id uuid not null unique references public.billing_contracts(id) on delete restrict,
  checkout_session_id uuid unique references public.billing_checkout_sessions(id) on delete restrict,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  contract_version text not null,
  terms_version text not null,
  terms_hash text not null,
  accepted_at timestamptz not null,
  accepted_user_id uuid null references auth.users(id) on delete set null,
  effective_date date not null,
  due_day smallint not null default 5 check (due_day=5),
  initial_term_days integer not null default 90 check (initial_term_days=90),
  setup_amount numeric not null check (setup_amount>=0),
  initial_prorata_amount numeric not null check (initial_prorata_amount>=0),
  initial_total numeric not null check (initial_total>=0),
  recurring_amount numeric not null check (recurring_amount>=0),
  next_due_date date not null,
  contract_text text not null,
  contract_hash text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_core_contract_docs_company on public.core_commercial_contract_documents(company_id,created_at desc);
alter table public.core_commercial_contract_documents enable row level security;
drop policy if exists "company reads own commercial contracts" on public.core_commercial_contract_documents;
create policy "company reads own commercial contracts" on public.core_commercial_contract_documents for select to authenticated using (public.user_belongs_to_company(auth.uid(),company_id) or public.is_impulsionando_staff(auth.uid()) or public.is_super_admin(auth.uid()));
grant select on public.core_commercial_contract_documents to authenticated;
grant all on public.core_commercial_contract_documents to service_role;

create or replace function public.core_create_commercial_contract_document()
returns trigger language plpgsql security definer set search_path to 'pg_catalog','public','extensions' as $$
declare
  v_session public.billing_checkout_sessions%rowtype; v_plan public.billing_plans%rowtype; v_company public.companies%rowtype;
  v_checkout_id uuid; v_prorata numeric; v_initial_total numeric; v_text text; v_hash text;
  v_contract_version text := 'impulsionando-commercial-v1';
begin
  if coalesce(new.metadata->>'source','') <> 'billing_initial_checkout' then return new; end if;
  v_checkout_id := nullif(new.metadata->>'checkout_session_id','')::uuid;
  if v_checkout_id is null then return new; end if;
  select * into v_session from public.billing_checkout_sessions where id=v_checkout_id;
  select * into v_plan from public.billing_plans where id=new.plan_id;
  select * into v_company from public.companies where id=new.company_id;
  if v_session.id is null or v_plan.id is null or v_company.id is null then raise exception 'commercial_contract_snapshot_source_missing'; end if;
  v_prorata := coalesce((new.metadata->>'initial_prorata_amount')::numeric,0);
  v_initial_total := coalesce((new.metadata->>'initial_total')::numeric,v_plan.setup_fee+v_prorata);
  v_text := concat_ws(E'\n',
    'CONTRATO ELETRONICO DE PRESTACAO DE SERVICOS - IMPULSIONANDO TECNOLOGIA',
    'Versao: '||v_contract_version,
    'Empresa: '||coalesce(v_company.legal_name,v_company.name),
    'Documento: '||coalesce(v_company.document,'nao informado'),
    'Plano: '||v_plan.name||' ('||v_plan.code||')',
    'Setup inicial: R$ '||to_char(v_plan.setup_fee,'FM999999990D00'),
    'Mensalidade: R$ '||to_char(v_plan.recurring_amount,'FM999999990D00'),
    'Primeiro periodo proporcional: R$ '||to_char(v_prorata,'FM999999990D00'),
    'Valor inicial total: R$ '||to_char(v_initial_total,'FM999999990D00'),
    'Vencimento recorrente: dia 5',
    'Proximo vencimento integral: '||to_char(new.next_due_date,'DD/MM/YYYY'),
    'Ciclo inicial: 90 dias - periodo medio de implantacao, parametrizacao, integracao, treinamento, adocao e estabilizacao. Recursos podem ser disponibilizados antes conforme escopo e dependencias externas.',
    'Onboarding: guiado pelo Impulsionito, com automacoes e suporte humano quando necessario.',
    'Politica financeira: inadimplencia pode restringir o acesso operacional, preservando acesso financeiro para regularizacao; pagamento confirmado permite reativacao automatica conforme regras do Core.',
    'Termos aceitos: '||v_session.terms_version,
    'Hash dos termos: '||v_session.terms_hash,
    'Aceite em: '||to_char(v_session.accepted_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI:SS'),
    'Aceite eletronico registrado e auditavel no Core Impulsionando.'
  );
  v_hash := encode(digest(convert_to(v_text,'UTF8'),'sha256'),'hex');
  insert into public.core_commercial_contract_documents(company_id,billing_contract_id,checkout_session_id,plan_id,contract_version,terms_version,terms_hash,accepted_at,accepted_user_id,effective_date,due_day,initial_term_days,setup_amount,initial_prorata_amount,initial_total,recurring_amount,next_due_date,contract_text,contract_hash,snapshot)
  values(new.company_id,new.id,v_session.id,new.plan_id,v_contract_version,v_session.terms_version,v_session.terms_hash,v_session.accepted_at,v_session.accepted_user_id,new.start_date,5,90,v_plan.setup_fee,v_prorata,v_initial_total,new.recurring_amount,new.next_due_date,v_text,v_hash,jsonb_build_object('company_name',v_company.name,'legal_name',v_company.legal_name,'document',v_company.document,'plan_code',v_plan.code,'plan_name',v_plan.name,'plan_legal_text',v_plan.legal_text,'setup_amount',v_plan.setup_fee,'recurring_amount',new.recurring_amount,'initial_prorata_amount',v_prorata,'initial_total',v_initial_total,'next_due_date',new.next_due_date,'due_day',5,'initial_term_days',90,'onboarding','impulsionito_guided','billing_contract_metadata',new.metadata))
  on conflict(billing_contract_id) do nothing;
  return new;
end; $$;
drop trigger if exists trg_core_create_commercial_contract_document on public.billing_contracts;
create trigger trg_core_create_commercial_contract_document after insert on public.billing_contracts for each row execute function public.core_create_commercial_contract_document();
