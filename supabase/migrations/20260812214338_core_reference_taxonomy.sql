create table if not exists public.reference_option_sets(
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  scope text not null default 'global' check(scope in('global','company','vertical')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_options(
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.reference_option_sets(id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(set_id,code)
);
create index if not exists idx_reference_options_set_order on public.reference_options(set_id,active,sort_order);

alter table public.reference_option_sets enable row level security;
alter table public.reference_options enable row level security;
grant select on public.reference_option_sets,public.reference_options to anon,authenticated;
grant insert,update,delete on public.reference_option_sets,public.reference_options to authenticated;
grant all on public.reference_option_sets,public.reference_options to service_role;

create policy reference_sets_read on public.reference_option_sets for select to anon,authenticated using(active=true or public.is_impulsionando_staff((select auth.uid())));
create policy reference_options_read on public.reference_options for select to anon,authenticated using(active=true or public.is_impulsionando_staff((select auth.uid())));
create policy reference_sets_write on public.reference_option_sets for all to authenticated using(public.is_impulsionando_staff((select auth.uid()))) with check(public.is_impulsionando_staff((select auth.uid())));
create policy reference_options_write on public.reference_options for all to authenticated using(public.is_impulsionando_staff((select auth.uid()))) with check(public.is_impulsionando_staff((select auth.uid())));

insert into public.reference_option_sets(key,name,description,scope) values
 ('business_segments','Segmentos de negócio','Segmentos padronizados para cadastro, CRM, filtros e automações.','global'),
 ('support_categories','Categorias de suporte','Classificação estruturada de chamados.','global'),
 ('support_priorities','Prioridades de suporte','Prioridades operacionais e de SLA.','global'),
 ('communication_channels','Canais de comunicação','Canais suportados pelo núcleo omnichannel.','global'),
 ('health_modalities','Modalidades de atendimento em saúde','Modalidades disponíveis para agenda CHRISMED.','vertical'),
 ('lead_sources','Origens de lead','Origens padronizadas para atribuição comercial.','global')
on conflict(key) do update set name=excluded.name,description=excluded.description,scope=excluded.scope,active=true,updated_at=now();

with s as (select id,key from public.reference_option_sets), vals(set_key,code,label,ord) as (values
 ('business_segments','health','Saúde',10),('business_segments','restaurants','Bares e Restaurantes',20),('business_segments','events','Eventos',30),('business_segments','real_estate','Imobiliário',40),('business_segments','automotive','Automotivo',50),('business_segments','retail','Varejo',60),('business_segments','services','Serviços',70),('business_segments','education','Educação',80),('business_segments','hospitality','Hotelaria',90),('business_segments','industry','Indústria',100),('business_segments','professional_services','Profissional liberal',110),('business_segments','other','Outros',999),
 ('support_categories','financial','Financeiro',10),('support_categories','billing','Cobrança',20),('support_categories','access','Acesso',30),('support_categories','integration','Integração',40),('support_categories','whatsapp','WhatsApp',50),('support_categories','instagram','Instagram',60),('support_categories','virtual_agent','Agente virtual',70),('support_categories','website','Site',80),('support_categories','agenda','Agenda',90),('support_categories','crm','CRM',100),('support_categories','automation','Automação',110),('support_categories','error','Erro',120),('support_categories','security','Segurança',130),('support_categories','question','Dúvidas',140),('support_categories','other','Outros',999),
 ('support_priorities','low','Baixa',10),('support_priorities','normal','Normal',20),('support_priorities','high','Alta',30),('support_priorities','critical','Crítica',40),
 ('communication_channels','web_chat','Chat no site',10),('communication_channels','whatsapp','WhatsApp',20),('communication_channels','instagram','Instagram',30),('communication_channels','email','E-mail',40),('communication_channels','in_app','Notificação interna',50),
 ('health_modalities','teleconsultation','Teleconsulta',10),('health_modalities','office','Consultório',20),('health_modalities','home','Domiciliar',30),('health_modalities','hybrid','Híbrido',40),
 ('lead_sources','organic','Orgânico',10),('lead_sources','google_ads','Google Ads',20),('lead_sources','meta_ads','Meta Ads',30),('lead_sources','instagram','Instagram',40),('lead_sources','whatsapp','WhatsApp',50),('lead_sources','referral','Indicação',60),('lead_sources','event','Evento',70),('lead_sources','affiliate','Afiliado',80),('lead_sources','outbound','Outbound',90),('lead_sources','other','Outros',999)
)
insert into public.reference_options(set_id,code,label,sort_order)
select s.id,v.code,v.label,v.ord from vals v join s on s.key=v.set_key
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,updated_at=now();