-- Seed/upsert dos 14 módulos-mãe da Impulsionando Tecnologia
-- Idempotente: atualiza nome/descrição/sort_order dos slugs existentes
-- (crm, agenda, bi, financeiro) e insere os novos.

INSERT INTO public.modules (slug, name, description, category, is_active, is_core, sort_order)
VALUES
  ('erp',          'ERP — Gestão Operacional e Financeira',     'Financeiro, caixa, cobranças, NF, assinaturas, usuários, permissões, auditoria.', 'mae', true, true,  10),
  ('crm',          'CRM — Relacionamento, Vendas e Atendimento','Leads, clientes, funis, oportunidades, tarefas, segmentação, pós-venda, NPS.',   'mae', true, true,  20),
  ('automacao',    'Automação & Comunicação',                   'WhatsApp via Z-API, e-mail transacional, IA, templates, fila, atendimento.',     'mae', true, false, 30),
  ('agenda',       'Agenda & Reservas',                         'Agendamento, reservas, lista de espera, confirmação automática, lembretes.',     'mae', true, false, 40),
  ('commerce',     'Commerce & Pagamentos',                     'Checkout, Pix, cartão, boleto, recorrência, baixa automática, liberação.',       'mae', true, false, 50),
  ('pdv',          'PDV & Operação Presencial',                 'Caixa, comandas, mesas, QR de mesa, garçom, cozinha, atendimento local.',        'mae', true, false, 60),
  ('estoque',      'Estoque & Fornecedores',                    'Produtos, insumos, lotes, validade, fornecedores, catálogo B2B, recompra.',      'mae', true, false, 70),
  ('saude',        'Saúde & Prontuário',                        'Prontuário eletrônico, exames, laudos, área do paciente, auditoria clínica.',    'mae', true, false, 80),
  ('eventos',      'Eventos & Ingressos',                       'Venda de ingressos, lotes, QR, check-in, transferência, pesquisa pós-evento.',   'mae', true, false, 90),
  ('delivery',     'Delivery & Logística',                      'Cardápio, pedidos, status, entregadores, rotas, recompra.',                      'mae', true, false, 100),
  ('bi',           'BI & Dashboards',                           'Dashboards por área, relatórios, indicadores, exportações, BI por nicho.',       'mae', true, false, 110),
  ('white_label',  'White Label & Franquias Digitais',          'Marca própria, multiempresa, gestão centralizada, planos próprios.',             'mae', true, false, 120),
  ('fidelizacao',  'Fidelização & Afiliados',                   'Indicação, clube de vantagens, cupons, comissões, ranking, recompra.',           'mae', true, false, 130),
  ('area_cliente', 'Área do Cliente',                           'Portal do cliente/paciente/aluno/participante: histórico, pagamentos, mensagens.','mae', true, false, 140)
ON CONFLICT (slug) DO UPDATE
SET name        = EXCLUDED.name,
    description = EXCLUDED.description,
    category    = EXCLUDED.category,
    is_active   = true,
    sort_order  = EXCLUDED.sort_order,
    updated_at  = now();