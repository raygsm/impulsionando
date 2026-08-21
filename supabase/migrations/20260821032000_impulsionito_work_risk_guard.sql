-- Impulsionito operational governance guard.
-- Safe autonomy is allowed for LOW/MEDIUM work, but HIGH/CRITICAL work must be
-- explicitly human-approved before it can reach APPROVED. Destructive changes
-- remain forbidden by the agent profile policy.

create or replace function public.core_agent_enforce_work_risk_guard()
returns trigger
language plpgsql
security invoker
set search_path to 'pg_catalog','public'
as $$
begin
  new.risk_level := upper(coalesce(new.risk_level,'LOW'));
  if new.risk_level not in ('LOW','MEDIUM','HIGH','CRITICAL') then
    raise exception 'invalid_agent_work_risk_level:%', new.risk_level;
  end if;

  if new.risk_level in ('HIGH','CRITICAL') then
    new.requires_human_approval := true;
  end if;

  if new.requires_human_approval
     and new.status='APPROVED'
     and upper(coalesce(new.evidence->>'human_approval_status','')) <> 'APPROVED' then
    raise exception 'human_approval_required_for_agent_work:%', coalesce(new.id,gen_random_uuid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_core_agent_work_risk_guard on public.core_agent_work_items;
create trigger trg_core_agent_work_risk_guard
before insert or update on public.core_agent_work_items
for each row execute function public.core_agent_enforce_work_risk_guard();

update public.core_agent_work_items
set requires_human_approval=true,
    updated_at=now()
where risk_level in ('HIGH','CRITICAL')
  and requires_human_approval=false;
