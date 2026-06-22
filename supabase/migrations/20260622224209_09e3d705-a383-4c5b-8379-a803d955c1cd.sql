
-- ONDA B + F: limpar menu administrativo Impulsionando e arquivar duplicidade Rio Med
-- =====================================================================================

-- 1) Remover grupos vazados na vertente 'clientes' que pertencem ao card do tenant RioMed,
--    não ao menu administrativo global. Reversível: registros podem ser recriados via seed.
DELETE FROM public.core_admin_menu
WHERE vertente = 'clientes'
  AND (
    group_key = 'riomed'                                         -- grupo "RioMed" (4 itens operacionais)
    OR (group_key = 'directory' AND group_order = 20)            -- grupo "Diretório (duplicado)" com atalhos RioMed
    OR (group_key = 'diretorio' AND item_key = 'riomed_products') -- atalho solto "RioMed · Produtos"
  );

-- 2) Arquivar tenant duplicado "Rio Med" (b7daafc3…, subdomain rio-med, niche ecommerce).
--    Mantemos a linha (auditoria), apenas marcamos como inativo/arquivado e liberamos o subdomain.
UPDATE public.companies
SET is_active = false,
    status = 'archived',
    subdomain = 'rio-med-arquivado-' || to_char(now(), 'YYYYMMDDHH24MISS'),
    updated_at = now()
WHERE id = 'b7daafc3-c9bf-4ac4-bfae-810730816dc8'
  AND name = 'Rio Med';
