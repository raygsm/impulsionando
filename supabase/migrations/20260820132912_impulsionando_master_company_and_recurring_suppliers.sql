update public.companies
set email='sac@impulsionando.com.br', updated_at=now()
where id=public.master_company_id()
  and (email is distinct from 'sac@impulsionando.com.br');

insert into public.core_suppliers(company_id,trade_name,legal_name,active,metadata)
select public.master_company_id(),v.trade_name,v.legal_name,true,jsonb_build_object('category',v.category,'recurring_cost',true)
from (values
  ('OpenAI','OpenAI OpCo, LLC','software_ai'),
  ('Supabase','Supabase, Inc.','infrastructure'),
  ('GitHub','GitHub, Inc.','development'),
  ('Cloudflare','Cloudflare, Inc.','infrastructure_security'),
  ('n8n','n8n GmbH','automation'),
  ('Hostinger','Hostinger','infrastructure'),
  ('Lovable','Lovable Labs Incorporated','development')
) as v(trade_name,legal_name,category)
where not exists (
  select 1 from public.core_suppliers s
  where s.company_id=public.master_company_id()
    and lower(s.trade_name)=lower(v.trade_name)
);
