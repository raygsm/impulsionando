update public.communication_channel_endpoints e
set display_address='impulsionandobr',
    handle='impulsionandobr',
    config=coalesce(config,'{}'::jsonb)||jsonb_build_object('official_name','impulsionandobr','official_handle','impulsionandobr'),
    updated_at=now()
from public.communication_agents a
join public.communication_tenants t on t.id=a.tenant_id
where e.agent_id=a.id
  and e.tenant_id=t.id
  and t.slug='impulsionando'
  and lower(a.name)=lower('Impulsionito')
  and e.channel='whatsapp'
  and e.address='+5521993075000';

update public.communication_channel_endpoints e
set address='impulsionandobr',
    display_address='@impulsionandobr',
    handle='impulsionandobr',
    status='PENDING_CONNECTION',
    config=coalesce(config,'{}'::jsonb)||jsonb_build_object('official',true,'official_handle','impulsionandobr','provider_adapter_required',true),
    updated_at=now()
from public.communication_agents a
join public.communication_tenants t on t.id=a.tenant_id
where e.agent_id=a.id
  and e.tenant_id=t.id
  and t.slug='impulsionando'
  and lower(a.name)=lower('Impulsionito')
  and e.channel='instagram';
