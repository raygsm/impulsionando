create or replace function public.wmp_append_briefing_evidence(
  p_briefing_id uuid,
  p_evidence jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
begin
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' then
    raise exception 'invalid_evidence';
  end if;

  update public.wmp_briefings
     set ambiente_imagens = coalesce(ambiente_imagens, '[]'::jsonb) || jsonb_build_array(p_evidence),
         updated_at = now()
   where id = p_briefing_id
  returning ambiente_imagens into v_result;

  if v_result is null then
    raise exception 'briefing_not_found';
  end if;

  return v_result;
end;
$$;

revoke all on function public.wmp_append_briefing_evidence(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.wmp_append_briefing_evidence(uuid,jsonb) to service_role;
