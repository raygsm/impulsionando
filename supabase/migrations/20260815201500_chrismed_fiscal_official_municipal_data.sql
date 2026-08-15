-- Dados fiscais confirmados em NFS-e oficial da Prefeitura do Rio de Janeiro.
-- Mantém emissão desativada até existir credencial do provedor e validação externa.
update public.chrismed_fiscal_issuer_config cfg
set municipal_registration='13.23.046-3',
    service_code='04.01.01',
    service_description='Medicina - consulta e demais serviços médicos elegíveis',
    readiness=coalesce(cfg.readiness,'{}'::jsonb)||jsonb_build_object(
      'municipal_registration',true,
      'service_code',true,
      'source','NFS-e oficial Prefeitura do Rio - nota 649 de 05/09/2025'
    ),
    updated_at=now()
from public.companies c
where c.id=cfg.company_id
  and regexp_replace(coalesce(c.document,''),'[^0-9]','','g')='42625058000170';
