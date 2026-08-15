update public.communication_agent_runtime ar
set config = coalesce(ar.config,'{}'::jsonb) || jsonb_build_object(
      'name_spelling','Milito',
      'routes',jsonb_build_object(
        'briefing','/wmp/orcamento',
        'hire_dj','/wmp/djs',
        'b2b','/wmp/empresas',
        'partner','/wmp/parceiro',
        'whereabouts','/wmp/onde-estou'
      )
    ),
    updated_at = now()
from public.communication_agents a
join public.communication_tenants t on t.id=a.tenant_id
where ar.agent_id=a.id
  and t.slug='wmp'
  and lower(a.name)='milito';
