INSERT INTO public.core_admin_menu
  (vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
SELECT * FROM (VALUES
  ('impulsionando','operacao','Operação & Logística',6,'onda_y_hub','Onda Y — Operação',1,'/admin/onda-y','Layers','Hub: logística, pro-rata, setores, CRM réguas.','admin',true),
  ('impulsionando','operacao','Operação & Logística',6,'onda_y_fretes','Logística & Fretes',2,'/admin/onda-y/fretes','Truck','Tabelas de frete por região/peso/modalidade e parâmetros de retirada/despacho.','admin',true),
  ('impulsionando','operacao','Operação & Logística',6,'onda_y_prorata','Módulos & Pro-rata',3,'/admin/onda-y/prorata','Calculator','Upgrade/downgrade de módulos com cálculo pro-rata.','admin',true),
  ('impulsionando','operacao','Operação & Logística',6,'onda_y_setores','Setores & Membros',4,'/admin/onda-y/setores','Users','Vincula usuários a setores e canais de notificação.','admin',true),
  ('impulsionando','operacao','Operação & Logística',6,'onda_y_crm_reguas','CRM — Réguas',5,'/admin/onda-y/crm-reguas','Workflow','Réguas de pós-venda, recuperação e relacionamento.','admin',true)
) AS v(vertente, group_key, group_label, group_order, item_key, item_label, item_order, route, icon, description, required_role, enabled)
WHERE NOT EXISTS (
  SELECT 1 FROM public.core_admin_menu m
  WHERE m.vertente = v.vertente AND m.item_key = v.item_key
);