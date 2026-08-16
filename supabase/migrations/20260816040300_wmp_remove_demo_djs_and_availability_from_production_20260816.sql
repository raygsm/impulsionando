do $$
declare v_tenant uuid;
begin
  select id into v_tenant from public.communication_tenants where slug='wmp' limit 1;
  if v_tenant is null then raise exception 'wmp_tenant_not_found'; end if;

  delete from public.wmp_dj_availability a
  using public.wmp_parceiros p
  where a.tenant_id=v_tenant
    and p.id=a.parceiro_id
    and p.tenant_id=v_tenant
    and p.origem='seed_gestao_20260814'
    and coalesce(a.notes,'') like '[DEMO REMOVIVEL]%';

  update public.wmp_parceiros
  set status='INACTIVE',
      internal_notes=concat_ws(E'\n',nullif(internal_notes,''),'[2026-08-16] Seed demonstrativo retirado da operação real durante auditoria de go-live.'),
      updated_at=now()
  where tenant_id=v_tenant and origem='seed_gestao_20260814';
end $$;
