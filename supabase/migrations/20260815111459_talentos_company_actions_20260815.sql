create or replace function public.talentos_favorite_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company_id uuid;
  v_match_id uuid;
begin
  v_company_id := public.current_user_company_id();
  if v_company_id is null then
    raise exception 'Usuário sem empresa ativa vinculada' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.talentos_candidatos c
    where c.id = p_candidate_id and c.ativo = true and c.visivel_rede = true
  ) then
    raise exception 'Candidato indisponível' using errcode = 'P0002';
  end if;

  insert into public.talentos_matches (
    company_id, candidato_id, vaga_id, stage, score, motivos
  ) values (
    v_company_id, p_candidate_id, null, 'favorito', 70, array['Salvo manualmente']::text[]
  )
  on conflict (company_id, candidato_id) where vaga_id is null
  do update set
    stage = 'favorito',
    score = greatest(public.talentos_matches.score, 70),
    motivos = case
      when 'Salvo manualmente' = any(public.talentos_matches.motivos) then public.talentos_matches.motivos
      else array_append(public.talentos_matches.motivos, 'Salvo manualmente')
    end,
    updated_at = now()
  returning id into v_match_id;

  return v_match_id;
end;
$$;

revoke all on function public.talentos_favorite_candidate(uuid) from public, anon;
grant execute on function public.talentos_favorite_candidate(uuid) to authenticated, service_role;

comment on function public.talentos_favorite_candidate(uuid) is 'Favorita candidato de forma transacional usando a empresa canônica do usuário autenticado; o front nunca fornece company_id.';