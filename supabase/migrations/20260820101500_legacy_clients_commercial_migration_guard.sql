-- Existing real clients remain operational while commercial migration is pending.
-- Billing becomes effective only after an explicit canonical contract acceptance.

with legacy as (
  select c.id
  from public.companies c
  join public.core_client_enrollment e on e.company_id=c.id
  where c.is_active=true
    and coalesce(c.is_master,false)=false
    and coalesce(c.is_demo,false)=false
    and lower(coalesce(c.status,'')) not in ('archived','cancelled')
    and e.contract_id is null
    and not exists (
      select 1
      from public.audit_logs a
      where a.company_id=c.id
        and a.action='core.self_service_company.created'
    )
)
update public.core_client_enrollment e
set metadata=coalesce(e.metadata,'{}'::jsonb)||jsonb_build_object(
      'legacy_migration',true,
      'contract_required',true,
      'commercial_migration_status','pending_acceptance',
      'billing_effective_after_contract_acceptance',true,
      'migration_marked_at',now()
    ),
    updated_at=now()
from legacy l
where e.company_id=l.id;

with legacy as (
  select c.id
  from public.companies c
  join public.core_client_enrollment e on e.company_id=c.id
  where c.is_active=true
    and coalesce(c.is_master,false)=false
    and coalesce(c.is_demo,false)=false
    and lower(coalesce(c.status,'')) not in ('archived','cancelled')
    and e.contract_id is null
    and coalesce((e.metadata->>'legacy_migration')::boolean,false)=true
)
update public.core_service_access_state s
set state='active',
    reason='legacy_migration_pending_acceptance',
    metadata=coalesce(s.metadata,'{}'::jsonb)||jsonb_build_object(
      'access_mode','full',
      'legacy_migration',true,
      'contract_required',true,
      'billing_effective_after_contract_acceptance',true,
      'due_day',5
    ),
    updated_at=now()
from legacy l
where s.company_id=l.id;
