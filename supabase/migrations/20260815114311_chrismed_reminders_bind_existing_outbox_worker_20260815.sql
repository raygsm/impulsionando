create or replace function public.chrismed_claim_communication_outbox(p_batch_size integer default 25)
returns setof public.chrismed_communication_outbox
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
begin
  if p_batch_size < 1 or p_batch_size > 100 then raise exception 'invalid_batch_size'; end if;

  perform public.chrismed_queue_event_reminders(now());

  return query
  with picked as (
    select id from public.chrismed_communication_outbox
    where channel='email' and status in ('pending','failed') and available_at<=now() and attempts<5
    order by available_at,created_at
    for update skip locked
    limit p_batch_size
  )
  update public.chrismed_communication_outbox o
     set status='processing',attempts=o.attempts+1,updated_at=now()
    from picked p where o.id=p.id
  returning o.*;
end
$$;

revoke all on function public.chrismed_claim_communication_outbox(integer) from public,anon,authenticated;
grant execute on function public.chrismed_claim_communication_outbox(integer) to service_role;
comment on function public.chrismed_claim_communication_outbox(integer) is 'Reserva lote da outbox CHRISMED e, a cada ciclo do worker n8n já ativo, gera de forma idempotente os lembretes de eventos devidos.';