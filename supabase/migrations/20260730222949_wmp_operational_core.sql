create table if not exists public.wmp_briefings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id),
  status text not null default 'NEW' check (status in ('NEW','QUALIFYING','PROPOSAL','WON','LOST','ARCHIVED')),
  contratante_nome text not null check (char_length(contratante_nome) between 2 and 120),
  contratante_email text not null check (char_length(contratante_email) <= 200),
  contratante_telefone text not null check (char_length(contratante_telefone) <= 40),
  contratante_empresa text,
  evento_tipo text not null check (char_length(evento_tipo) <= 80),
  evento_data date,
  evento_horario_inicio time,
  evento_horario_fim time,
  evento_publico_estimado integer check (evento_publico_estimado is null or evento_publico_estimado >= 0),
  evento_perfil_publico text,
  evento_endereco text,
  evento_cidade text,
  evento_estado text check (evento_estado is null or char_length(evento_estado) between 2 and 4),
  ambiente jsonb not null default '{}'::jsonb,
  medidas jsonb not null default '{}'::jsonb,
  acustica jsonb not null default '{}'::jsonb,
  pre_diagnostico jsonb not null default '{}'::jsonb,
  utm jsonb,
  origem text not null default 'site_wmp',
  user_agent text,
  assigned_to uuid references auth.users(id),
  internal_notes text,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wmp_parceiros (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.communication_tenants(id),
  status text not null default 'PENDING' check (status in ('PENDING','REVIEWING','APPROVED','REJECTED','INACTIVE')),
  nome text not null check (char_length(nome) between 2 and 120),
  nome_artistico text,
  email text not null check (char_length(email) <= 200),
  telefone text not null check (char_length(telefone) <= 40),
  categoria text not null check (categoria in ('dj','musico','tecnico_som','tecnico_luz','tecnico_video','fornecedor','cerimonialista','outro')),
  cidade text,
  estado text check (estado is null or char_length(estado) between 2 and 4),
  experiencia_anos integer check (experiencia_anos is null or experiencia_anos between 0 and 80),
  bio text check (bio is null or char_length(bio) <= 1500),
  portfolio_links text[] not null default '{}',
  utm jsonb,
  origem text not null default 'site_wmp_parceiro',
  user_agent text,
  internal_notes text,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wmp_audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.communication_tenants(id),
  actor_user_id uuid,
  entity_table text not null,
  entity_id uuid not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists wmp_briefings_tenant_status_created_idx on public.wmp_briefings (tenant_id,status,created_at desc);
create index if not exists wmp_briefings_event_date_idx on public.wmp_briefings (tenant_id,evento_data) where evento_data is not null;
create index if not exists wmp_parceiros_tenant_status_created_idx on public.wmp_parceiros (tenant_id,status,created_at desc);
create index if not exists wmp_audit_logs_tenant_created_idx on public.wmp_audit_logs (tenant_id,created_at desc);
create or replace function private.wmp_set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at:=now(); return new; end; $$;
create or replace function private.wmp_write_audit_log() returns trigger language plpgsql security definer set search_path='' as $$
declare row_before jsonb; row_after jsonb; audit_tenant_id uuid; audit_entity_id uuid;
begin
  if tg_op='DELETE' then row_before:=to_jsonb(old); audit_tenant_id:=old.tenant_id; audit_entity_id:=old.id;
  else row_after:=to_jsonb(new); audit_tenant_id:=new.tenant_id; audit_entity_id:=new.id; if tg_op='UPDATE' then row_before:=to_jsonb(old); end if; end if;
  insert into public.wmp_audit_logs(tenant_id,actor_user_id,entity_table,entity_id,action,before_data,after_data)
  values(audit_tenant_id,auth.uid(),tg_table_name,audit_entity_id,tg_op,row_before,row_after);
  if tg_op='DELETE' then return old; end if; return new;
end; $$;
drop trigger if exists wmp_briefings_set_updated_at on public.wmp_briefings;
create trigger wmp_briefings_set_updated_at before update on public.wmp_briefings for each row execute function private.wmp_set_updated_at();
drop trigger if exists wmp_parceiros_set_updated_at on public.wmp_parceiros;
create trigger wmp_parceiros_set_updated_at before update on public.wmp_parceiros for each row execute function private.wmp_set_updated_at();
drop trigger if exists wmp_briefings_audit on public.wmp_briefings;
create trigger wmp_briefings_audit after insert or update or delete on public.wmp_briefings for each row execute function private.wmp_write_audit_log();
drop trigger if exists wmp_parceiros_audit on public.wmp_parceiros;
create trigger wmp_parceiros_audit after insert or update or delete on public.wmp_parceiros for each row execute function private.wmp_write_audit_log();
alter table public.wmp_briefings enable row level security;
alter table public.wmp_parceiros enable row level security;
alter table public.wmp_audit_logs enable row level security;
revoke all on public.wmp_briefings from anon,authenticated;
revoke all on public.wmp_parceiros from anon,authenticated;
revoke all on public.wmp_audit_logs from anon,authenticated;
grant select,insert,update on public.wmp_briefings to authenticated;
grant select,insert,update on public.wmp_parceiros to authenticated;
grant select on public.wmp_audit_logs to authenticated;
create policy wmp_briefings_select on public.wmp_briefings for select to authenticated using (private.is_tenant_member(tenant_id));
create policy wmp_briefings_insert on public.wmp_briefings for insert to authenticated with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));
create policy wmp_briefings_update on public.wmp_briefings for update to authenticated using (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[])) with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));
create policy wmp_parceiros_select on public.wmp_parceiros for select to authenticated using (private.is_tenant_member(tenant_id));
create policy wmp_parceiros_insert on public.wmp_parceiros for insert to authenticated with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));
create policy wmp_parceiros_update on public.wmp_parceiros for update to authenticated using (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[])) with check (private.is_tenant_member(tenant_id,array['OWNER','ADMIN','EDITOR','OPERATOR']::text[]));
create policy wmp_audit_logs_select on public.wmp_audit_logs for select to authenticated using (private.is_tenant_member(tenant_id));
