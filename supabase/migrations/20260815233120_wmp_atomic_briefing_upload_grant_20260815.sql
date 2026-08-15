create or replace function public.wmp_consume_briefing_upload_grant(
  p_briefing_id uuid,
  p_token_hash text
)
returns table(token_id uuid, slot integer)
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.wmp_briefing_upload_tokens
     set used_count = used_count + 1,
         last_used_at = now()
   where briefing_id = p_briefing_id
     and token_hash = p_token_hash
     and expires_at > now()
     and used_count < max_files
  returning id, used_count;
$$;

revoke all on function public.wmp_consume_briefing_upload_grant(uuid,text) from public, anon, authenticated;
grant execute on function public.wmp_consume_briefing_upload_grant(uuid,text) to service_role;
