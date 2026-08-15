-- Mantém /mvp sincronizada organicamente com o estado real do Core.
-- Somente métricas agregadas e seguras são publicadas na Investor Room.

create or replace function public.refresh_mvp_execution_snapshot()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_caps_total integer;
  v_caps_prod integer;
  v_caps_homolog integer;
  v_p0_total integer;
  v_p0_passed integer;
  v_p0_open integer;
  v_checks_passed integer;
  v_checks_total integer;
  v_body jsonb;
begin
  select count(*),
         count(*) filter(where commercial_status='production'),
         count(*) filter(where commercial_status='homologation')
    into v_caps_total,v_caps_prod,v_caps_homolog
  from public.core_capability_registry;

  select count(*),count(*) filter(where status='passed')
    into v_checks_total,v_checks_passed
  from public.core_go_live_checks;

  select count(*),count(*) filter(where status='passed')
    into v_p0_total,v_p0_passed
  from public.core_go_live_checks where severity='P0';

  v_p0_open:=v_p0_total-v_p0_passed;

  v_body:=jsonb_build_object(
    'statuses',jsonb_build_array(
      '🟢 TESTADO E FUNCIONAL',
      '🟡 IMPLEMENTADO — TESTE EXTERNO PENDENTE',
      '🟠 PARCIAL',
      '🔴 AUSENTE',
      '⚫ BLOQUEADO'
    ),
    'live',jsonb_build_object(
      'capabilities_total',v_caps_total,
      'capabilities_production',v_caps_prod,
      'capabilities_homologation',v_caps_homolog,
      'go_live_checks_total',v_checks_total,
      'go_live_checks_passed',v_checks_passed,
      'p0_total',v_p0_total,
      'p0_passed',v_p0_passed,
      'p0_open',v_p0_open,
      'snapshot_at',now()
    )
  );

  insert into public.mvp_investor_content(
    section_key,section_order,eyebrow,title,summary,body,status,
    updated_by,approved_for_publication,published_at,updated_at
  ) values(
    'execution',70,'Execução',
    'Construção orientada por evidência, não por promessa.',
    'A Investor Room acompanha automaticamente a maturidade real do Core. Recursos só avançam quando há evidência técnica compatível.',
    v_body,'published','Impulsionito',true,now(),now()
  )
  on conflict(section_key) do update set
    title=excluded.title,
    summary=excluded.summary,
    body=excluded.body,
    status='published',
    approved_for_publication=true,
    updated_by='Impulsionito',
    updated_at=now();
end
$$;

revoke all on function public.refresh_mvp_execution_snapshot() from public;
grant execute on function public.refresh_mvp_execution_snapshot() to service_role;

create or replace function public.trg_refresh_mvp_execution_snapshot()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
begin
  perform public.refresh_mvp_execution_snapshot();
  return null;
end
$$;
revoke all on function public.trg_refresh_mvp_execution_snapshot() from public;

drop trigger if exists trg_mvp_from_capability_registry on public.core_capability_registry;
create trigger trg_mvp_from_capability_registry
after insert or update or delete on public.core_capability_registry
for each statement execute function public.trg_refresh_mvp_execution_snapshot();

drop trigger if exists trg_mvp_from_go_live_checks on public.core_go_live_checks;
create trigger trg_mvp_from_go_live_checks
after insert or update or delete on public.core_go_live_checks
for each statement execute function public.trg_refresh_mvp_execution_snapshot();

select public.refresh_mvp_execution_snapshot();
