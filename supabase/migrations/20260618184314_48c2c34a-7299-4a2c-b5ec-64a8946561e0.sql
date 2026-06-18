
-- Fase 1 — Demo Bar & Restaurante: cenário, QRs, cardápio, vouchers, leads.

CREATE TABLE public.demo_resto_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  primary_color text NOT NULL DEFAULT '#c2410c',
  seed_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_resto_scenarios TO anon, authenticated;
GRANT ALL ON public.demo_resto_scenarios TO service_role;
ALTER TABLE public.demo_resto_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_resto_scenarios_read ON public.demo_resto_scenarios FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.demo_resto_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.demo_resto_scenarios(id) ON DELETE CASCADE,
  slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('mesa','delivery','evento','pesquisa','clube')),
  title text NOT NULL,
  instruction text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (scenario_id, slug)
);
GRANT SELECT ON public.demo_resto_qr_codes TO anon, authenticated;
GRANT ALL ON public.demo_resto_qr_codes TO service_role;
ALTER TABLE public.demo_resto_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_resto_qr_codes_read ON public.demo_resto_qr_codes FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.demo_resto_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.demo_resto_scenarios(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  harmony text,
  is_bestseller boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_demo_resto_menu_scenario ON public.demo_resto_menu_items(scenario_id, sort_order);
GRANT SELECT ON public.demo_resto_menu_items TO anon, authenticated;
GRANT ALL ON public.demo_resto_menu_items TO service_role;
ALTER TABLE public.demo_resto_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_resto_menu_items_read ON public.demo_resto_menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.demo_resto_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.demo_resto_scenarios(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  rule text NOT NULL,
  validity_label text,
  audience text,
  channel text,
  status text NOT NULL DEFAULT 'active',
  UNIQUE (scenario_id, code)
);
GRANT SELECT ON public.demo_resto_vouchers TO anon, authenticated;
GRANT ALL ON public.demo_resto_vouchers TO service_role;
ALTER TABLE public.demo_resto_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_resto_vouchers_read ON public.demo_resto_vouchers FOR SELECT TO anon, authenticated USING (true);

-- Leads da demo são SEMPRE marcados is_demo=true. Inserts vão por server fn que valida
-- com Zod (nome 2-80, whatsapp só dígitos 10-13). Nada de CPF/cartão.
CREATE TABLE public.demo_resto_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.demo_sessions(id) ON DELETE SET NULL,
  scenario_id uuid NOT NULL REFERENCES public.demo_resto_scenarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL,
  birthdate date,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(name) BETWEEN 2 AND 80),
  CHECK (whatsapp ~ '^[0-9]{10,13}$'),
  CHECK (is_demo = true)
);
CREATE INDEX idx_demo_resto_leads_scenario ON public.demo_resto_leads(scenario_id, created_at DESC);
GRANT SELECT ON public.demo_resto_leads TO authenticated;
GRANT ALL ON public.demo_resto_leads TO service_role;
ALTER TABLE public.demo_resto_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY demo_resto_leads_admin_read ON public.demo_resto_leads FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ───────────── Seed: Boteco Aurora ─────────────
WITH s AS (
  INSERT INTO public.demo_resto_scenarios (slug, name, tagline, primary_color)
  VALUES ('boteco-aurora', 'Boteco Aurora', 'Cervejas Especiais, Massas e Música ao Vivo', '#c2410c')
  RETURNING id
)
INSERT INTO public.demo_resto_qr_codes (scenario_id, slug, kind, title, instruction, sort_order)
SELECT s.id, q.slug, q.kind, q.title, q.instruction, q.sort_order FROM s, (VALUES
  ('mesa-01',   'mesa',      'Mesa 01 — Consumo no local',       'Aponte a câmera para abrir o cardápio da mesa e montar o pedido.', 1),
  ('mesa-08',   'mesa',      'Mesa 08 — Comanda compartilhada',  'Grupo na mesa 08: cada pessoa adiciona itens à mesma comanda.',     2),
  ('delivery',  'delivery',  'Delivery — Pedido para entrega',   'Simule um pedido com endereço fictício e veja a jornada completa.', 3),
  ('evento',    'evento',    'Noite IPA — Reserva do evento',    'Reserve uma vaga para a Noite IPA com harmonização guiada.',        4),
  ('pesquisa',  'pesquisa',  'Pesquisa rápida de satisfação',    'Responda 3 perguntas e veja como o restaurante usa o resultado.',   5),
  ('clube',     'clube',     'Clube — Vouchers e benefícios',    'Veja os vouchers disponíveis e como o cliente é fidelizado.',       6)
) AS q(slug, kind, title, instruction, sort_order);

-- Cardápio (12 itens)
WITH s AS (SELECT id FROM public.demo_resto_scenarios WHERE slug='boteco-aurora')
INSERT INTO public.demo_resto_menu_items
  (scenario_id, category, name, description, price_cents, tags, harmony, is_bestseller, sort_order)
SELECT s.id, c.category, c.name, c.description, c.price_cents, c.tags, c.harmony, c.is_bestseller, c.sort_order FROM s, (VALUES
  ('Cervejas IPA', 'Aurora Session IPA',              'Leve, cítrica, refrescante, ideal para começar.',           2400, ARRAY['ipa','session','leve'],   NULL, true,  1),
  ('Cervejas IPA', 'West Coast IPA Horizonte',        'Amargor firme, notas resinosas e final seco.',              3100, ARRAY['ipa','west-coast'],        NULL, false, 2),
  ('Cervejas IPA', 'New England IPA Neblina',         'Turva, aromática, suculenta, com notas tropicais.',         3600, ARRAY['ipa','neipa','aromática'], NULL, true,  3),
  ('Cervejas IPA', 'Double IPA Círculo',              'Intensa, alcoólica, potente e aromática.',                  4200, ARRAY['ipa','double','intensa'],  NULL, false, 4),
  ('Entradas',     'Batata rústica com páprica',      'Crocante por fora, macia por dentro, com molho da casa.',   3400, ARRAY['petisco'],                 'Session IPA', false, 5),
  ('Entradas',     'Bolinho de costela',              'Recheio cremoso de costela desfiada, 6 unidades.',          4200, ARRAY['petisco'],                 'West Coast IPA', true,  6),
  ('Entradas',     'Burrata com pesto',               'Burrata fresca, pesto da casa, focaccia tostada.',          5900, ARRAY['vegetariano'],             'NEIPA', false, 7),
  ('Massas',       'Fettuccine Alfredo da Casa',      'Massa fresca, manteiga noisette, parmesão de 24 meses.',    5800, ARRAY['massa','queijo'],          'NEIPA', false, 8),
  ('Massas',       'Ravioli de Queijo com Tomate',    'Recheado com mussarela de búfala, molho rústico.',          6400, ARRAY['massa','queijo'],          'Session IPA', true,  9),
  ('Massas',       'Spaghetti Carbonara',             'Receita romana tradicional, guanciale e pecorino.',         6200, ARRAY['massa'],                   'West Coast IPA', false, 10),
  ('Massas',       'Gnocchi ao Ragu',                 'Gnocchi de batata, ragu de carne 6h, parmesão.',            6800, ARRAY['massa'],                   'Double IPA', true,  11),
  ('Sobremesas',   'Brownie com sorvete',             'Brownie morno, sorvete de creme, calda de chocolate amargo.', 2800, ARRAY['doce'],                  NULL, false, 12)
) AS c(category, name, description, price_cents, tags, harmony, is_bestseller, sort_order);

-- Vouchers (5)
WITH s AS (SELECT id FROM public.demo_resto_scenarios WHERE slug='boteco-aurora')
INSERT INTO public.demo_resto_vouchers
  (scenario_id, code, name, rule, validity_label, audience, channel, status)
SELECT s.id, v.code, v.name, v.rule, v.validity_label, v.audience, v.channel, v.status FROM s, (VALUES
  ('IPA10',       'Desconto IPA',               '10% de desconto em IPAs selecionadas.',                                        'Até domingo',     'Clientes IPA',          'WhatsApp', 'active'),
  ('MASSAIPA',    'Combo Massa + IPA',          'Na compra de uma massa da casa, ganhe 15% em uma IPA harmonizada.',            'Permanente',      'Clientes com perfil massa', 'WhatsApp', 'active'),
  ('VOLTEAURORA', 'Crédito de retorno',         'R$ 50,00 de crédito para voltar em até 15 dias.',                              '15 dias',         'Clientes sumidos',      'WhatsApp', 'active'),
  ('ANIVERSARIO', 'Sobremesa de aniversário',   'Uma sobremesa cortesia no mês do aniversário.',                                'Mês de aniv.',    'Aniversariantes',       'WhatsApp', 'active'),
  ('EVENTOIPA',   'Noite IPA',                  'Condição especial na próxima Noite IPA com 4 rótulos e harmonização guiada.',  'Próximo evento',  'Apreciadores de IPA',   'WhatsApp', 'active')
) AS v(code, name, rule, validity_label, audience, channel, status);
