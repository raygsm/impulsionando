create table if not exists public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,name)
);
create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  code text not null,
  name text not null,
  sort_order integer not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(pipeline_id,code)
);
create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.communication_contacts(id) on delete set null,
  pipeline_id uuid not null references public.crm_pipelines(id) on delete restrict,
  stage_id uuid not null references public.crm_pipeline_stages(id) on delete restrict,
  title text not null,
  value_cents bigint not null default 0 check(value_cents>=0),
  source text,
  campaign text,
  product_interest text,
  owner_user_id uuid references auth.users(id) on delete set null,
  expected_close_date date,
  lost_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists idx_crm_opportunities_company_stage on public.crm_opportunities(company_id,stage_id,updated_at desc);
create index if not exists idx_crm_opportunities_contact on public.crm_opportunities(contact_id);
create index if not exists idx_crm_opportunities_owner on public.crm_opportunities(owner_user_id);
create index if not exists idx_crm_stages_pipeline on public.crm_pipeline_stages(pipeline_id,sort_order);

create table if not exists public.crm_tags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id,slug)
);
create table if not exists public.crm_contact_tags (
  contact_id uuid not null references public.communication_contacts(id) on delete cascade,
  tag_id uuid not null references public.crm_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(contact_id,tag_id)
);
create index if not exists idx_crm_contact_tags_tag on public.crm_contact_tags(tag_id);

create table if not exists public.support_sla_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  priority text not null check(priority in ('low','normal','high','critical')),
  first_response_minutes integer not null check(first_response_minutes>0),
  resolution_minutes integer not null check(resolution_minutes>0),
  business_hours_only boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id,name,priority)
);
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requester_user_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.communication_contacts(id) on delete set null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  category text not null default 'other',
  priority text not null default 'normal' check(priority in ('low','normal','high','critical')),
  status text not null default 'open' check(status in ('open','waiting_customer','waiting_internal','resolved','closed','reopened')),
  subject text not null,
  description text not null,
  source_channel text not null default 'web',
  first_response_due_at timestamptz,
  resolution_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_type text not null check(author_type in ('customer','agent','system')),
  body text not null,
  is_internal boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_support_tickets_company_status on public.support_tickets(company_id,status,priority,created_at desc);
create index if not exists idx_support_tickets_requester on public.support_tickets(requester_user_id);
create index if not exists idx_support_tickets_assigned on public.support_tickets(assigned_user_id);
create index if not exists idx_support_ticket_messages_ticket on public.support_ticket_messages(ticket_id,created_at);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  body_markdown text not null,
  category text,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  audience text not null default 'customer' check(audience in ('public','customer','staff')),
  version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,slug,version)
);
create index if not exists idx_knowledge_articles_company_status on public.knowledge_articles(company_id,status,audience);

alter table public.crm_pipelines enable row level security;
alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_opportunities enable row level security;
alter table public.crm_tags enable row level security;
alter table public.crm_contact_tags enable row level security;
alter table public.support_sla_policies enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.knowledge_articles enable row level security;

revoke all on public.crm_pipelines,public.crm_pipeline_stages,public.crm_opportunities,public.crm_tags,public.crm_contact_tags,public.support_sla_policies,public.support_tickets,public.support_ticket_messages,public.knowledge_articles from anon;
grant all on public.crm_pipelines,public.crm_pipeline_stages,public.crm_opportunities,public.crm_tags,public.crm_contact_tags,public.support_sla_policies,public.support_tickets,public.support_ticket_messages,public.knowledge_articles to service_role;
grant select,insert,update on public.crm_pipelines,public.crm_pipeline_stages,public.crm_opportunities,public.crm_tags,public.crm_contact_tags,public.support_sla_policies,public.support_tickets,public.support_ticket_messages,public.knowledge_articles to authenticated;

create policy crm_pipelines_company on public.crm_pipelines for all to authenticated using(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id)) with check(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id));
create policy crm_stages_company on public.crm_pipeline_stages for all to authenticated using(exists(select 1 from public.crm_pipelines p where p.id=pipeline_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),p.company_id)))) with check(exists(select 1 from public.crm_pipelines p where p.id=pipeline_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),p.company_id))));
create policy crm_opportunities_company on public.crm_opportunities for all to authenticated using(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id)) with check(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id));
create policy crm_tags_company on public.crm_tags for all to authenticated using(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id)) with check(public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),company_id));
create policy crm_contact_tags_company on public.crm_contact_tags for all to authenticated using(exists(select 1 from public.communication_contacts c where c.id=contact_id and (public.is_impulsionando_staff((select auth.uid())) or public.user_belongs_to_company((select auth.uid()),c.tenant_id)))) with check(true);

create policy support_sla_staff on public.support_sla_policies for all to authenticated using(public.is_impulsionando_staff((select auth.uid()))) with check(public.is_impulsionando_staff((select auth.uid())));
create policy support_tickets_read on public.support_tickets for select to authenticated using(public.is_impulsionando_staff((select auth.uid())) or requester_user_id=(select auth.uid()) or public.user_belongs_to_company((select auth.uid()),company_id));
create policy support_tickets_insert on public.support_tickets for insert to authenticated with check(requester_user_id=(select auth.uid()) and public.user_belongs_to_company((select auth.uid()),company_id));
create policy support_tickets_update on public.support_tickets for update to authenticated using(public.is_impulsionando_staff((select auth.uid())) or requester_user_id=(select auth.uid())) with check(public.is_impulsionando_staff((select auth.uid())) or requester_user_id=(select auth.uid()));
create policy support_messages_read on public.support_ticket_messages for select to authenticated using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (public.is_impulsionando_staff((select auth.uid())) or t.requester_user_id=(select auth.uid()) or public.user_belongs_to_company((select auth.uid()),t.company_id))) and (not is_internal or public.is_impulsionando_staff((select auth.uid()))));
create policy support_messages_insert on public.support_ticket_messages for insert to authenticated with check(author_user_id=(select auth.uid()) and exists(select 1 from public.support_tickets t where t.id=ticket_id and (public.is_impulsionando_staff((select auth.uid())) or t.requester_user_id=(select auth.uid()))));
create policy knowledge_read on public.knowledge_articles for select to authenticated using(status='published' and (audience in ('public','customer') or public.is_impulsionando_staff((select auth.uid()))) or public.is_impulsionando_staff((select auth.uid())));
create policy knowledge_write on public.knowledge_articles for all to authenticated using(public.is_impulsionando_staff((select auth.uid()))) with check(public.is_impulsionando_staff((select auth.uid())));

insert into public.crm_pipelines(company_id,name,is_default)
select id,'Pipeline Comercial',true from public.companies where is_master=true
on conflict(company_id,name) do nothing;
insert into public.crm_pipeline_stages(pipeline_id,code,name,sort_order,is_won,is_lost)
select p.id,s.code,s.name,s.ord,s.won,s.lost from public.crm_pipelines p cross join (values
 ('lead','Lead',10,false,false),('mql','MQL',20,false,false),('sql','SQL',30,false,false),('proposal','Proposta',40,false,false),('negotiation','Negociação',50,false,false),('won','Fechado',60,true,false),('lost','Perdido',70,false,true)
) as s(code,name,ord,won,lost)
where p.company_id=public.master_company_id()
on conflict(pipeline_id,code) do nothing;

insert into public.support_sla_policies(company_id,name,priority,first_response_minutes,resolution_minutes)
select id,'SLA padrão','low',480,4320 from public.companies where is_master=true
union all select id,'SLA padrão','normal',240,2880 from public.companies where is_master=true
union all select id,'SLA padrão','high',60,720 from public.companies where is_master=true
union all select id,'SLA padrão','critical',15,240 from public.companies where is_master=true
on conflict(company_id,name,priority) do nothing;