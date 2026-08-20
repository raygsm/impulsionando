create or replace view public.companies_vitrine_public as
select
  t.company_id as id,
  coalesce(nullif(p.public_name,''),t.display_name) as name,
  coalesce(nullif(p.public_name,''),t.display_name) as trade_name,
  case t.slug
    when 'chrismed' then 'saude'
    when 'colorssaude' then 'saude'
    when 'rio-med' then 'medico-hospitalar'
    when 'plataformasaude' then 'saude'
    when 'marocas' then 'hospedagem'
    when 'imobiliariagarrido' then 'imobiliaria'
    when 'lopesenjoy' then 'imobiliaria'
    when 'wmp' then 'eventos'
    when 'fepersonal' then 'fitness'
    when 'peroladavila' then 'beleza'
    when 'ontap' then 'bar'
    when 'raoni' then 'bar'
    when 'riobeer' then 'bar'
    when 'haunted' then 'bar'
    when 'spartacus' then 'bar'
    when 'sulatlantica' then 'b2b'
    when 'csi' then 'financeiro'
    when 'anamadu' then 'varejo'
    when 'impulsionando-tour' then 'turismo'
    else coalesce(nullif(lower(t.kind),''),'servicos')
  end as segment,
  coalesce(p.logo_url,c.logo_url) as logo_url,
  p.cover_url as cover_image_url,
  coalesce(p.tagline,t.settings->>'tagline','Cliente do ecossistema Impulsionando') as tagline,
  coalesce(p.short_description,t.settings->>'description','Operacao conectada ao Core Impulsionando — '||t.display_name) as description,
  t.slug as public_slug,
  p.public_data->>'address_city' as address_city,
  p.public_data->>'address_state' as address_state,
  p.public_data->>'address_neighborhood' as address_neighborhood,
  p.public_data->>'primary_color' as primary_color,
  case when i.dns_status='active' and i.ssl_status='issued' then
    coalesce(p.website_url,e.url,case when i.custom_domain is not null then 'https://'||i.custom_domain when i.subdomain is not null then 'https://'||i.subdomain||'.'||coalesce(i.root_domain,'impulsionando.com.br') end)
  end as website,
  p.public_contact->>'instagram' as instagram,
  p.public_contact->>'whatsapp' as whatsapp,
  r.rating_avg,
  coalesce(r.review_count,0)::bigint as rating_count,
  greatest(t.updated_at,coalesce(i.updated_at,t.updated_at),coalesce(e.updated_at,t.updated_at),p.updated_at) as updated_at,
  i.subdomain,
  i.custom_domain as domain
from public.communication_tenants t
join public.core_client_showcase_profiles p on p.company_id=t.company_id and p.published=true and p.showcase_authorized=true and p.opted_out_at is null
left join public.companies c on c.id=t.company_id
left join public.core_tenant_identity i on i.company_id=t.company_id
left join lateral (
  select ce.url,ce.updated_at from public.core_company_endpoints ce
  where ce.company_id=t.company_id and ce.endpoint_kind='public_site' and ce.status='active'
  order by ce.is_primary desc,ce.updated_at desc limit 1
) e on true
left join lateral (
  select round(avg(cr.rating),2) as rating_avg,count(*)::bigint as review_count
  from public.core_client_reviews cr where cr.company_id=t.company_id and cr.status='APPROVED'
) r on true
where t.deleted_at is null and t.active=true and t.kind<>'GLOBAL' and t.slug<>'universidade' and t.company_id is not null and coalesce(c.is_demo,false)=false and coalesce(c.is_active,true)=true;
