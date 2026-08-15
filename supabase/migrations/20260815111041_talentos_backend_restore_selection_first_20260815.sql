create table if not exists public.talentos_candidatos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  email text not null check (char_length(email) <= 255),
  whatsapp text not null check (char_length(whatsapp) between 8 and 30),
  cep text not null check (regexp_replace(cep, '[^0-9]', '', 'g') ~ '^[0-9]{8}$'),
  bairro text,
  cidade text not null,
  estado text not null check (estado ~ '^[A-Z]{2}$'),
  municipio_ibge text not null check (municipio_ibge ~ '^[0-9]{7}$'),
  foto_url text,
  cargo_desejado text not null,
  nicho text,
  experiencia text,
  faixa_etaria text check (faixa_etaria is null or faixa_etaria = any(array['18-25','26-35','36-45','46-55','56-65','66-75','76+'])),
  escolaridade text,
  curso_superior text,
  instituicao text,
  cursando text,
  cursando_instituicao text,
  cursando_previsao date,
  disponibilidade text,
  modelo_trabalho text,
  pretensao_salarial text,
  video_url text,
  tags text[] not null default '{}',
  habilidades text[] not null default '{}',
  idiomas text[] not null default '{}',
  ativo boolean not null default true,
  visivel_rede boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists talentos_candidatos_localidade_idx on public.talentos_candidatos(estado, municipio_ibge, bairro);
create index if not exists talentos_candidatos_cargo_idx on public.talentos_candidatos(cargo_desejado);
create index if not exists talentos_candidatos_nicho_idx on public.talentos_candidatos(nicho);

create table if not exists public.talentos_curriculos (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references public.talentos_candidatos(id) on delete cascade,
  arquivo_url text not null,
  formato text check (formato is null or formato = any(array['pdf','docx'])),
  texto_bruto text,
  extracao jsonb,
  processado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.talentos_company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid unique not null references public.companies(id) on delete cascade,
  participa boolean not null default false,
  receber_automatico boolean not null default false,
  nicho text,
  cidades_interesse text[] not null default '{}',
  bairros_interesse text[] not null default '{}',
  raio_km integer check (raio_km is null or raio_km between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talentos_vagas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  titulo text not null,
  nicho text,
  cargo text not null,
  cidade text,
  estado text check (estado is null or estado ~ '^[A-Z]{2}$'),
  municipio_ibge text check (municipio_ibge is null or municipio_ibge ~ '^[0-9]{7}$'),
  bairro text,
  modelo_trabalho text,
  experiencia_minima text,
  escolaridade_minima text,
  faixa_salarial text,
  descricao text,
  habilidades_desejadas text[] not null default '{}',
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.talentos_matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  candidato_id uuid not null references public.talentos_candidatos(id) on delete cascade,
  vaga_id uuid references public.talentos_vagas(id) on delete set null,
  score integer not null default 0 check (score between 0 and 100),
  motivos text[] not null default '{}',
  stage text not null default 'novo' check (stage = any(array['novo','favorito','entrevista','contratado','banco','descartado'])),
  observacoes text,
  contratado_em timestamptz,
  desligado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists talentos_matches_unique_vaga on public.talentos_matches(company_id,candidato_id,vaga_id) where vaga_id is not null;
create unique index if not exists talentos_matches_unique_banco on public.talentos_matches(company_id,candidato_id) where vaga_id is null;

alter table public.talentos_candidatos enable row level security;
alter table public.talentos_curriculos enable row level security;
alter table public.talentos_company_settings enable row level security;
alter table public.talentos_vagas enable row level security;
alter table public.talentos_matches enable row level security;

grant select, insert, update, delete on public.talentos_candidatos to authenticated;
grant select, insert, update, delete on public.talentos_curriculos to authenticated;
grant select, insert, update, delete on public.talentos_company_settings to authenticated;
grant select, insert, update, delete on public.talentos_vagas to authenticated;
grant select, insert, update, delete on public.talentos_matches to authenticated;
grant all on public.talentos_candidatos, public.talentos_curriculos, public.talentos_company_settings, public.talentos_vagas, public.talentos_matches to service_role;

create policy talentos_candidato_own_all on public.talentos_candidatos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy talentos_candidato_visible_read on public.talentos_candidatos for select to authenticated using (ativo and visivel_rede);
create policy talentos_curriculo_own_all on public.talentos_curriculos for all to authenticated using (exists(select 1 from public.talentos_candidatos c where c.id=candidato_id and c.user_id=auth.uid())) with check (exists(select 1 from public.talentos_candidatos c where c.id=candidato_id and c.user_id=auth.uid()));
create policy talentos_company_settings_members on public.talentos_company_settings for all to authenticated using (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id)) with check (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id));
create policy talentos_vagas_company_members on public.talentos_vagas for all to authenticated using (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id)) with check (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id));
create policy talentos_matches_company_members on public.talentos_matches for all to authenticated using (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id)) with check (exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.company_id=company_id));
create policy talentos_matches_candidate_read on public.talentos_matches for select to authenticated using (exists(select 1 from public.talentos_candidatos c where c.id=candidato_id and c.user_id=auth.uid()));

comment on table public.talentos_candidatos is 'Cadastro canônico do módulo Impulsionando Talentos; município identificado por código IBGE e CEP como origem primária de localidade.';
comment on column public.talentos_candidatos.municipio_ibge is 'Código IBGE canônico do município derivado do Core CEP.';