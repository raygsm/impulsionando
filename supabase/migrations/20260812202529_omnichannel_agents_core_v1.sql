insert into public.communication_tenants(kind,slug,display_name,legal_name,settings,active)
select 'GLOBAL','impulsionando','Impulsionando Tecnologia','Impulsionando Tecnologia',jsonb_build_object('source','omnichannel_agents_core','role','platform_core'),true
where not exists (select 1 from public.communication_tenants where slug='impulsionando');

insert into public.communication_brands(tenant_id,name,domain,settings)
select t.id,'Impulsionando Tecnologia','impulsionando.com.br',jsonb_build_object('source','omnichannel_agents_core','canonical_url','https://impulsionando.com.br')
from public.communication_tenants t
where t.slug='impulsionando'
  and not exists (select 1 from public.communication_brands b where b.tenant_id=t.id and lower(b.name)=lower('Impulsionando Tecnologia'));

insert into public.communication_agents(tenant_id,brand_id,name,signature,role,reply_route,disclaimer,active)
select t.id,b.id,'Impulsionito','Impulsionito · Impulsionando Tecnologia','platform_orchestrator','/api/agents/omnichannel','Agente virtual oficial da Impulsionando Tecnologia.',true
from public.communication_tenants t
left join public.communication_brands b on b.tenant_id=t.id and lower(b.name)=lower('Impulsionando Tecnologia')
where t.slug='impulsionando'
  and not exists (select 1 from public.communication_agents a where a.tenant_id=t.id and lower(a.name)=lower('Impulsionito'));

insert into public.communication_agents(tenant_id,brand_id,name,signature,role,reply_route,disclaimer,active)
select t.id,b.id,'Oliver','Oliver · Concierge CHRISMED','client_health_concierge','/api/agents/omnichannel','Instância CHRISMED do Impulsionito. Não diagnostica, não prescreve e não interpreta exames.',true
from public.communication_tenants t
left join public.communication_brands b on b.tenant_id=t.id and lower(b.name)=lower('CHRISMED')
where t.slug='chrismed'
  and not exists (select 1 from public.communication_agents a where a.tenant_id=t.id and lower(a.name)=lower('Oliver'));

create table if not exists public.communication_agent_runtime (
  agent_id uuid primary key references public.communication_agents(id) on delete cascade,
  agent_key text not null unique,
  root_agent_id uuid references public.communication_agents(id) on delete restrict,
  instance_type text not null check (instance_type in ('CORE','CLIENT_INSTANCE')),
  system_prompt_ref text,
  knowledge_scope text not null default 'tenant',
  model_policy jsonb not null default '{}'::jsonb,
  privacy_policy jsonb not null default '{}'::jsonb,
  handoff_policy jsonb not null default '{}'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communication_channel_endpoints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  agent_id uuid not null references public.communication_agents(id) on delete cascade,
  channel text not null,
  provider text not null default 'unbound',
  address text,
  display_address text,
  external_account_id text,
  handle text,
  secret_reference text,
  webhook_path text,
  status text not null default 'PENDING_CONNECTION' check (status in ('PENDING_DISCOVERY','PENDING_CONNECTION','ACTIVE','PAUSED','ERROR')),
  is_primary boolean not null default false,
  capabilities jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  last_healthcheck_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_communication_channel_endpoint_address on public.communication_channel_endpoints(tenant_id,channel,address) where address is not null;
create index if not exists idx_communication_channel_endpoints_agent on public.communication_channel_endpoints(agent_id,status);

create table if not exists public.communication_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  merged_into_contact_id uuid references public.communication_contacts(id) on delete restrict,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_communication_contacts_tenant_user on public.communication_contacts(tenant_id,user_id);

create table if not exists public.communication_contact_identities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.communication_contacts(id) on delete cascade,
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  channel text not null,
  provider text not null default 'unbound',
  external_user_id text not null,
  normalized_address text,
  verified boolean not null default false,
  verification_method text,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,channel,provider,external_user_id)
);
create index if not exists idx_communication_contact_identities_contact on public.communication_contact_identities(contact_id);

create table if not exists public.communication_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  agent_id uuid not null references public.communication_agents(id) on delete restrict,
  contact_id uuid not null references public.communication_contacts(id) on delete restrict,
  status text not null default 'OPEN' check (status in ('OPEN','WAITING_HUMAN','HUMAN','RESOLVED','CLOSED','BLOCKED')),
  subject text,
  last_channel text,
  assigned_user_id uuid references auth.users(id) on delete set null,
  journey_key text,
  context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_communication_conversations_contact on public.communication_conversations(tenant_id,contact_id,status,last_message_at desc);
create index if not exists idx_communication_conversations_agent on public.communication_conversations(agent_id,status,last_message_at desc);

create table if not exists public.communication_conversation_channels (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.communication_conversations(id) on delete cascade,
  endpoint_id uuid references public.communication_channel_endpoints(id) on delete set null,
  channel text not null,
  provider text not null default 'unbound',
  provider_thread_id text,
  external_user_id text,
  active boolean not null default true,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(conversation_id,channel,provider,external_user_id)
);
create index if not exists idx_communication_conversation_channels_conversation on public.communication_conversation_channels(conversation_id,active);

create table if not exists public.communication_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.communication_conversations(id) on delete cascade,
  tenant_id uuid not null references public.communication_tenants(id) on delete cascade,
  agent_id uuid not null references public.communication_agents(id) on delete restrict,
  contact_id uuid not null references public.communication_contacts(id) on delete restrict,
  endpoint_id uuid references public.communication_channel_endpoints(id) on delete set null,
  channel text not null,
  provider text not null default 'unbound',
  direction text not null check (direction in ('INBOUND','OUTBOUND','INTERNAL')),
  author_type text not null check (author_type in ('CONTACT','AGENT','HUMAN','SYSTEM')),
  author_user_id uuid references auth.users(id) on delete set null,
  provider_message_id text,
  body_text text,
  content jsonb not null default '{}'::jsonb,
  message_type text not null default 'text',
  reply_to_message_id uuid references public.communication_conversation_messages(id) on delete set null,
  status text not null default 'RECEIVED',
  error_code text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists uq_communication_conversation_provider_message on public.communication_conversation_messages(endpoint_id,provider_message_id) where endpoint_id is not null and provider_message_id is not null;
create index if not exists idx_communication_conversation_messages_thread on public.communication_conversation_messages(conversation_id,occurred_at,id);

create table if not exists public.communication_handoffs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.communication_conversations(id) on delete cascade,
  requested_by text not null check (requested_by in ('AGENT','CONTACT','HUMAN','SYSTEM')),
  reason text not null,
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','CRITICAL')),
  status text not null default 'REQUESTED' check (status in ('REQUESTED','ACCEPTED','RESOLVED','CANCELLED')),
  assigned_user_id uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_communication_handoffs_open on public.communication_handoffs(status,priority,requested_at);

alter table public.communication_agent_runtime enable row level security;
alter table public.communication_channel_endpoints enable row level security;
alter table public.communication_contacts enable row level security;
alter table public.communication_contact_identities enable row level security;
alter table public.communication_conversations enable row level security;
alter table public.communication_conversation_channels enable row level security;
alter table public.communication_conversation_messages enable row level security;
alter table public.communication_handoffs enable row level security;

revoke all on public.communication_agent_runtime from anon,authenticated;
revoke all on public.communication_channel_endpoints from anon,authenticated;
revoke all on public.communication_contacts from anon,authenticated;
revoke all on public.communication_contact_identities from anon,authenticated;
revoke all on public.communication_conversations from anon,authenticated;
revoke all on public.communication_conversation_channels from anon,authenticated;
revoke all on public.communication_conversation_messages from anon,authenticated;
revoke all on public.communication_handoffs from anon,authenticated;
grant all on public.communication_agent_runtime to service_role;
grant all on public.communication_channel_endpoints to service_role;
grant all on public.communication_contacts to service_role;
grant all on public.communication_contact_identities to service_role;
grant all on public.communication_conversations to service_role;
grant all on public.communication_conversation_channels to service_role;
grant all on public.communication_conversation_messages to service_role;
grant all on public.communication_handoffs to service_role;

insert into public.communication_agent_runtime(agent_id,agent_key,root_agent_id,instance_type,system_prompt_ref,knowledge_scope,model_policy,privacy_policy,handoff_policy,capabilities,config)
select a.id,'impulsionito-core',null,'CORE','impulsionito/core','platform',jsonb_build_object('strategy','server_authoritative','fallback_allowed',true),jsonb_build_object('cross_tenant_access','explicit_only','pii_minimization',true),jsonb_build_object('human_handoff',true,'preserve_history',true),jsonb_build_object('web_chat',true,'whatsapp',true,'instagram',true,'future_channels',true),jsonb_build_object('central_brain',true,'channel_agnostic',true)
from public.communication_agents a join public.communication_tenants t on t.id=a.tenant_id
where t.slug='impulsionando' and lower(a.name)=lower('Impulsionito')
on conflict (agent_key) do update set agent_id=excluded.agent_id,active=true,updated_at=now();

insert into public.communication_agent_runtime(agent_id,agent_key,root_agent_id,instance_type,system_prompt_ref,knowledge_scope,model_policy,privacy_policy,handoff_policy,capabilities,config)
select child.id,'chrismed-oliver',root.id,'CLIENT_INSTANCE','chrismed/oliver','tenant',jsonb_build_object('strategy','server_authoritative','inherit_root',true),jsonb_build_object('health_data',true,'clinical_boundary','administrative_only','cross_tenant_access',false,'pii_minimization',true),jsonb_build_object('human_handoff',true,'preserve_history',true,'medical_escalation',true),jsonb_build_object('web_chat',true,'whatsapp',true,'instagram',true,'future_channels',true),jsonb_build_object('inherits_impulsionito',true,'public_identity','Oliver','client','CHRISMED')
from public.communication_agents child
join public.communication_tenants ct on ct.id=child.tenant_id and ct.slug='chrismed'
join public.communication_agents root on lower(root.name)=lower('Impulsionito')
join public.communication_tenants rt on rt.id=root.tenant_id and rt.slug='impulsionando'
where lower(child.name)=lower('Oliver')
on conflict (agent_key) do update set agent_id=excluded.agent_id,root_agent_id=excluded.root_agent_id,active=true,updated_at=now();

insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,status,is_primary,capabilities,config)
select t.id,a.id,'web_chat','impulsionando_front','https://impulsionando.com.br','Chat do site Impulsionando','ACTIVE',true,jsonb_build_object('text',true,'streaming',true),jsonb_build_object('route','/api/impulsionito/chat')
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Impulsionito') where t.slug='impulsionando'
on conflict do nothing;
insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,status,is_primary,capabilities,config)
select t.id,a.id,'whatsapp','unbound','+5521993075000','+55 (21) 99307-5000','PENDING_CONNECTION',true,jsonb_build_object('text',true,'media',true,'templates',true),jsonb_build_object('official',true,'provider_adapter_required',true)
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Impulsionito') where t.slug='impulsionando'
on conflict do nothing;
insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,status,is_primary,capabilities,config)
select t.id,a.id,'instagram','unbound',null,'Instagram Impulsionando','PENDING_DISCOVERY',false,jsonb_build_object('dm',true,'attachments',true),jsonb_build_object('provider_adapter_required',true)
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Impulsionito') where t.slug='impulsionando' and not exists(select 1 from public.communication_channel_endpoints e where e.tenant_id=t.id and e.channel='instagram');

insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,status,is_primary,capabilities,config)
select t.id,a.id,'web_chat','chrismed_front','https://chrismed.impulsionando.com.br','Chat CHRISMED','ACTIVE',true,jsonb_build_object('text',true,'streaming',true,'health_context',true),jsonb_build_object('legacy_component','ChrismedOliverPanel')
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Oliver') where t.slug='chrismed'
on conflict do nothing;
insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,status,is_primary,capabilities,config)
select t.id,a.id,'whatsapp','unbound','+5521972537868','+55 (21) 97253-7868','PENDING_CONNECTION',true,jsonb_build_object('text',true,'media',true,'templates',true,'health_context',true),jsonb_build_object('official',true,'provider_adapter_required',true)
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Oliver') where t.slug='chrismed'
on conflict do nothing;
insert into public.communication_channel_endpoints(tenant_id,agent_id,channel,provider,address,display_address,handle,status,is_primary,capabilities,config)
select t.id,a.id,'instagram','unbound','csachrismed','@csachrismed','csachrismed','PENDING_CONNECTION',false,jsonb_build_object('dm',true,'attachments',true,'health_context',true),jsonb_build_object('official',true,'provider_adapter_required',true)
from public.communication_tenants t join public.communication_agents a on a.tenant_id=t.id and lower(a.name)=lower('Oliver') where t.slug='chrismed'
on conflict do nothing;
