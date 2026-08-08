
UPDATE public.core_tenant_identity ti
SET custom_domain = c.domain,
    updated_at = now()
FROM public.companies c
WHERE ti.company_id = c.id
  AND c.domain IS NOT NULL
  AND c.domain NOT LIKE '%.impulsionando.com.br'
  AND ti.custom_domain IS DISTINCT FROM c.domain;

INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT 'impulsionando', 'platform', 'Plataforma & Infra', 2, 'dominios_clientes', 'Domínios por Cliente',
       5, '/admin/cockpit-tenants', 'Globe',
       'Painel consolidado de DNS/SSL/build. O detalhe por tenant abre em /admin/clientes/{slug}/dominio.',
       'super', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_admin_menu
  WHERE vertente='impulsionando' AND item_key='dominios_clientes'
);
