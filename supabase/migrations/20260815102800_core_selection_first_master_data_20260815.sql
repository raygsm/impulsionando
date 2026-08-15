-- Selection-first master-data foundation.
-- Reuses reference_option_sets/reference_options and existing WMP equipment tables.

create or replace function public.core_normalize_cnpj(p_value text)
returns text language sql immutable set search_path=public as $$ select upper(regexp_replace(coalesce(p_value,''),'[^A-Za-z0-9]','','g')) $$;

create or replace function public.core_cnpj_char_value(p_char text)
returns integer language sql immutable set search_path=public as $$ select ascii(upper(p_char))-48 $$;

create or replace function public.core_is_valid_cpf(p_value text)
returns boolean language plpgsql immutable set search_path=public as $$
declare d text:=regexp_replace(coalesce(p_value,''),'[^0-9]','','g'); s int; dv int; i int;
begin
  if length(d)<>11 or d ~ '^(.)\1{10}$' then return false; end if;
  s:=0; for i in 1..9 loop s:=s+substr(d,i,1)::int*(11-i); end loop;
  dv:=11-(s%11); if dv>=10 then dv:=0; end if;
  if dv<>substr(d,10,1)::int then return false; end if;
  s:=0; for i in 1..10 loop s:=s+substr(d,i,1)::int*(12-i); end loop;
  dv:=11-(s%11); if dv>=10 then dv:=0; end if;
  return dv=substr(d,11,1)::int;
end $$;

create or replace function public.core_is_valid_cnpj(p_value text)
returns boolean language plpgsql immutable set search_path=public as $$
declare d text:=public.core_normalize_cnpj(p_value); w1 int[]:=array[5,4,3,2,9,8,7,6,5,4,3,2]; w2 int[]:=array[6,5,4,3,2,9,8,7,6,5,4,3,2]; s int:=0; r int; dv1 int; dv2 int; i int;
begin
  if d !~ '^[A-Z0-9]{12}[0-9]{2}$' then return false; end if;
  if d ~ '^(.)\1{13}$' then return false; end if;
  for i in 1..12 loop s:=s+public.core_cnpj_char_value(substr(d,i,1))*w1[i]; end loop;
  r:=s%11; dv1:=case when r<2 then 0 else 11-r end;
  if dv1<>substr(d,13,1)::int then return false; end if;
  s:=0;
  for i in 1..13 loop s:=s+public.core_cnpj_char_value(substr(d,i,1))*w2[i]; end loop;
  r:=s%11; dv2:=case when r<2 then 0 else 11-r end;
  return dv2=substr(d,14,1)::int;
end $$;

revoke all on function public.core_normalize_cnpj(text) from public;
revoke all on function public.core_cnpj_char_value(text) from public;
grant execute on function public.core_normalize_cnpj(text) to authenticated,service_role;
grant execute on function public.core_cnpj_char_value(text) to authenticated,service_role;
grant execute on function public.core_is_valid_cpf(text) to anon,authenticated,service_role;
grant execute on function public.core_is_valid_cnpj(text) to anon,authenticated,service_role;

insert into public.reference_option_sets(key,name,description,scope,active)
values
 ('br_states','Estados e Distrito Federal','Unidades da Federação do Brasil com código IBGE.','global',true),
 ('person_document_types','Tipos de documento de pessoa','Documentos estruturados para identificação de pessoas.','global',true),
 ('company_document_types','Tipos de documento de empresa','Documentos estruturados para identificação de empresas.','global',true),
 ('wmp_equipment_categories','Categorias de equipamentos WMP','Taxonomia canônica de equipamentos de áudio, luz, vídeo, energia e apoio.','vertical',true)
on conflict(key) do update set name=excluded.name,description=excluded.description,active=true,updated_at=now();

with s as (select id from public.reference_option_sets where key='br_states')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,jsonb_build_object('ibge_code',v.ibge,'country','BR') from s cross join (values
 ('AC','Acre',12,10),('AL','Alagoas',27,20),('AP','Amapá',16,30),('AM','Amazonas',13,40),('BA','Bahia',29,50),('CE','Ceará',23,60),('DF','Distrito Federal',53,70),('ES','Espírito Santo',32,80),('GO','Goiás',52,90),('MA','Maranhão',21,100),('MT','Mato Grosso',51,110),('MS','Mato Grosso do Sul',50,120),('MG','Minas Gerais',31,130),('PA','Pará',15,140),('PB','Paraíba',25,150),('PR','Paraná',41,160),('PE','Pernambuco',26,170),('PI','Piauí',22,180),('RJ','Rio de Janeiro',33,190),('RN','Rio Grande do Norte',24,200),('RS','Rio Grande do Sul',43,210),('RO','Rondônia',11,220),('RR','Roraima',14,230),('SC','Santa Catarina',42,240),('SP','São Paulo',35,250),('SE','Sergipe',28,260),('TO','Tocantins',17,270)
) as v(code,label,ibge,ord)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,metadata=excluded.metadata,updated_at=now();

with s as (select id from public.reference_option_sets where key='person_document_types')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,v.meta from s cross join (values
 ('CPF','CPF',10,jsonb_build_object('country','BR','validator','core_is_valid_cpf')),('PASSPORT','Passaporte',20,jsonb_build_object('international',true)),('OTHER','Outro documento',999,jsonb_build_object('exception_only',true))
) as v(code,label,ord,meta)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,metadata=excluded.metadata,updated_at=now();

with s as (select id from public.reference_option_sets where key='company_document_types')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,v.meta from s cross join (values
 ('CNPJ','CNPJ',10,jsonb_build_object('country','BR','validator','core_is_valid_cnpj','alphanumeric',true)),('FOREIGN_REGISTRATION','Registro empresarial estrangeiro',20,jsonb_build_object('international',true)),('OTHER','Outro documento',999,jsonb_build_object('exception_only',true))
) as v(code,label,ord,meta)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,metadata=excluded.metadata,updated_at=now();

with s as (select id from public.reference_option_sets where key='wmp_equipment_categories')
insert into public.reference_options(set_id,code,label,sort_order,active,metadata)
select s.id,v.code,v.label,v.ord,true,'{}'::jsonb from s cross join (values
 ('dj_player','CDJ / player / media player',10),('dj_controller','Controladora DJ',20),('dj_mixer','Mixer DJ',30),('turntable','Toca-discos',40),('audio_mixer','Mesa / console de áudio',50),('digital_stagebox','Stagebox digital',60),('active_speaker','Caixa ativa',70),('passive_speaker','Caixa passiva',80),('subwoofer','Subwoofer',90),('line_array','Line array',100),('amplifier','Amplificador de potência',110),('audio_processor','Processador / DSP de áudio',120),('wireless_microphone','Microfone sem fio',130),('wired_microphone','Microfone com fio',140),('headset_lavalier','Headset / lapela',150),('di_box','Direct box / DI',160),('monitor','Monitor de palco / retorno',170),('in_ear','Sistema in-ear',180),('moving_head','Moving head',190),('par_led','PAR LED',200),('led_bar','Barra LED',210),('strobe','Strobo',220),('laser','Laser',230),('follow_spot','Canhão seguidor',240),('lighting_console','Mesa / controladora de iluminação',250),('dmx_node','Node / interface DMX',260),('led_panel','Painel LED',270),('projector','Projetor',280),('display_tv','TV / display',290),('video_switcher','Switcher / mixer de vídeo',300),('camera','Câmera',310),('video_converter','Conversor / scaler de vídeo',320),('truss','Treliça / truss',330),('stand','Pedestal / suporte',340),('rigging','Rigging / talha / acessórios',350),('power_distribution','Distribuição elétrica',360),('ups','Nobreak / UPS',370),('generator','Gerador',380),('cabling_audio','Cabeamento de áudio',390),('cabling_power','Cabeamento elétrico',400),('cabling_data_video','Cabeamento dados/vídeo',410),('intercom','Intercom / comunicação técnica',420),('computer','Computador / notebook',430),('network','Rede / switch / roteador',440),('special_effects','Efeitos especiais',450),('stage','Palco / praticável',460),('furniture_support','Mobiliário / apoio técnico',470),('other_curated','Outro equipamento curado',999)
) as v(code,label,ord)
on conflict(set_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true,updated_at=now();

create table if not exists public.core_localities (
  id uuid primary key default gen_random_uuid(), country_code text not null default 'BR' check(country_code ~ '^[A-Z]{2}$'), state_code text not null check(state_code ~ '^[A-Z]{2}$'), municipality_ibge_code text not null, municipality_name text not null, neighborhood_name text, neighborhood_normalized text generated always as (lower(trim(coalesce(neighborhood_name,'')))) stored, source text not null default 'cep_lookup', source_reference text, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(country_code,municipality_ibge_code,neighborhood_normalized)
);
create index if not exists core_localities_state_municipality_idx on public.core_localities(state_code,municipality_name,active);
alter table public.core_localities enable row level security;
revoke all on public.core_localities from public,anon;
grant select on public.core_localities to authenticated,service_role;
grant insert,update,delete on public.core_localities to service_role;
comment on table public.core_localities is 'Cache canônico de município/bairro derivado de fontes de CEP/IBGE; evita bairro livre como fonte primária.';

create unique index if not exists wmp_equipment_models_identity_uq on public.wmp_equipment_models(tenant_id,coalesce(manufacturer_id,'00000000-0000-0000-0000-000000000000'::uuid),category,lower(model),lower(coalesce(submodel,'')));
create index if not exists wmp_equipment_manufacturers_search_idx on public.wmp_equipment_manufacturers(tenant_id,lower(name)) where active=true;
create index if not exists wmp_equipment_models_search_idx on public.wmp_equipment_models(tenant_id,category,lower(model)) where active=true;
