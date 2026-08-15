create table if not exists public.mvp_investor_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  section_order integer not null default 100,
  title text not null,
  eyebrow text,
  summary text,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft','published','archived')),
  updated_by text,
  approved_for_publication boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mvp_investor_content enable row level security;

drop policy if exists mvp_investor_public_read on public.mvp_investor_content;
create policy mvp_investor_public_read
on public.mvp_investor_content
for select
to anon, authenticated
using (status = 'published' and approved_for_publication = true);

revoke all on public.mvp_investor_content from anon;
grant select on public.mvp_investor_content to anon, authenticated;

insert into public.mvp_investor_content (section_key, section_order, eyebrow, title, summary, body, status, updated_by, approved_for_publication, published_at)
values
('vision',10,'A tese','Um sistema operacional do negócio, com inteligência no centro.','A Impulsionando conecta aquisição, vendas, atendimento, operação, financeiro, automação, relacionamento e inteligência em um único ecossistema.',jsonb_build_object('bullets',jsonb_build_array('Uma arquitetura modular em vez de softwares isolados','Impulsionito como camada de inteligência e orquestração','Dados e jornadas conectados de ponta a ponta','Experiência adaptada por empresa, segmento e modelo de negócio')),'published','Impulsionito',true,now()),
('problem',20,'O problema','Empresas ainda operam em ilhas.','Leads, vendas, atendimento, pagamentos, estoque, automações e relacionamento vivem em ferramentas separadas. O custo real aparece em retrabalho, perda de contexto, baixa conversão e pouca recorrência.',jsonb_build_object('bullets',jsonb_build_array('Leads esquecidos','Dados fragmentados','Pouca visão de CAC, LTV e recorrência','Atendimento sem histórico','Processos manuais que não escalam')),'published','Impulsionito',true,now()),
('solution',30,'A solução','Um ecossistema. Uma inteligência. Todo o negócio conectado.','O Core entrega capacidades universais e adapta a experiência ao contexto da empresa, sem recriar um software diferente para cada operação.',jsonb_build_object('bullets',jsonb_build_array('CRM e vendas','Comunicação','Automação e jornadas','Billing e financeiro','Analytics e atribuição','Customer Success','White Label','IA e agentes especializados')),'published','Impulsionito',true,now()),
('impulsionito',40,'A inteligência','Impulsionito: o cérebro vivo do ecossistema.','O Impulsionito interpreta contexto, orienta usuários, acompanha indicadores, diagnostica problemas e coordena ações autorizadas entre os módulos do Core.',jsonb_build_object('bullets',jsonb_build_array('Concierge','Analista','Growth Manager','Operador','Auditor')),'published','Impulsionito',true,now()),
('business',50,'Modelo de negócio','Receita recorrente, expansão e distribuição.','A estratégia combina contratos empresariais, White Label e ecossistema de relacionamento com consumidor final.',jsonb_build_object('bullets',jsonb_build_array('Empresas como principal frente comercial','White Label 50, 100, 500 e 1.000','Clube Impulsionando como camada de relacionamento e descoberta','Receita recorrente com expansão por capacidade e uso')),'published','Impulsionito',true,now()),
('moat',60,'Vantagem estrutural','Quanto mais o ecossistema aprende, mais difícil fica copiá-lo.','A vantagem não está em um único módulo, mas na conexão entre dados, jornadas, automação, inteligência, distribuição e aprendizado reutilizável entre contextos compatíveis.',jsonb_build_object('bullets',jsonb_build_array('Core reutilizável','Capability Packs por segmento','Aprendizado cliente → nicho → Core','Dados operacionais conectados','Impulsionito como interface de inteligência')),'published','Impulsionito',true,now()),
('execution',70,'Execução','Construção orientada por evidência, não por promessa.','A Impulsionando diferencia explicitamente aquilo que está testado, aquilo que está implementado e aquilo que ainda depende de homologação.',jsonb_build_object('bullets',jsonb_build_array('🟢 TESTADO E FUNCIONAL','🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE','🟠 PARCIAL','🔴 AUSENTE','⚫ BLOQUEADO')),'published','Impulsionito',true,now()),
('market',80,'Oportunidade','Substituir fragmentação por uma camada operacional única.','A tese comercial captura valor não apenas pela substituição de ferramentas, mas pela melhoria da jornada de captação, conversão, relacionamento, fidelização e gestão.',jsonb_build_object('bullets',jsonb_build_array('Menos ferramentas soltas','Menos trabalho manual','Mais contexto por cliente','Mais recorrência','Melhor capacidade de decisão')),'published','Impulsionito',true,now())
on conflict (section_key) do nothing;

-- Enable live updates for the investor room.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mvp_investor_content'
  ) then
    execute 'alter publication supabase_realtime add table public.mvp_investor_content';
  end if;
end $$;
