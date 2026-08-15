create or replace function public.wmp_append_briefing_multimodal_analysis(
  p_briefing_id uuid,
  p_analysis jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
begin
  if p_analysis is null or jsonb_typeof(p_analysis) <> 'object' then
    raise exception 'invalid_analysis';
  end if;

  update public.wmp_briefings
     set analise_multimodal = coalesce(analise_multimodal, '[]'::jsonb) || jsonb_build_array(p_analysis),
         updated_at = now()
   where id = p_briefing_id
  returning analise_multimodal into v_result;

  if v_result is null then
    raise exception 'briefing_not_found';
  end if;

  return v_result;
end;
$$;

revoke all on function public.wmp_append_briefing_multimodal_analysis(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.wmp_append_briefing_multimodal_analysis(uuid,jsonb) to service_role;
