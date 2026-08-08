
CREATE TABLE IF NOT EXISTS public.riomed_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  member_role text NOT NULL DEFAULT 'vendedor',
  specialty text,
  active boolean NOT NULL DEFAULT true,
  rr_position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.riomed_team TO anon, authenticated;
GRANT ALL ON public.riomed_team TO service_role;
ALTER TABLE public.riomed_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rt_public_read" ON public.riomed_team FOR SELECT TO anon, authenticated USING (active);

CREATE TABLE IF NOT EXISTS public.riomed_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  equipment_type text,
  equipment_brand text,
  issue_category text,
  urgency text,
  description text,
  location_city text,
  preferred_window text,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.riomed_support_tickets TO anon, authenticated;
GRANT ALL ON public.riomed_support_tickets TO service_role;
ALTER TABLE public.riomed_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rst_insert_public" ON public.riomed_support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "rst_select_public" ON public.riomed_support_tickets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_seller_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.riomed_team(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  interest text,
  profile text,
  notes text,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.riomed_seller_leads TO anon, authenticated;
GRANT ALL ON public.riomed_seller_leads TO service_role;
ALTER TABLE public.riomed_seller_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsl_insert_public" ON public.riomed_seller_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "rsl_select_public" ON public.riomed_seller_leads FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.riomed_rr_pointer (
  id int PRIMARY KEY DEFAULT 1,
  last_position int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rr_single CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.riomed_rr_pointer TO anon, authenticated;
GRANT ALL ON public.riomed_rr_pointer TO service_role;
ALTER TABLE public.riomed_rr_pointer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rrp_all_public" ON public.riomed_rr_pointer FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
INSERT INTO public.riomed_rr_pointer (id, last_position) VALUES (1, 0) ON CONFLICT DO NOTHING;

INSERT INTO public.riomed_team (full_name, email, phone, member_role, specialty, rr_position) VALUES
  ('Carlos Mendoza', 'carlos.mendoza@riomed.bo', '+591 70011001', 'vendedor', 'Hospitalar', 1),
  ('Ana Quispe', 'ana.quispe@riomed.bo', '+591 70011002', 'vendedor', 'Clínicas', 2),
  ('Jorge Vargas', 'jorge.vargas@riomed.bo', '+591 70011003', 'vendedor', 'Home Care', 3),
  ('María Flores', 'maria.flores@riomed.bo', '+591 70011004', 'vendedor', 'Consultorios', 4),
  ('Luis Rojas', 'luis.rojas@riomed.bo', '+591 70011005', 'vendedor', 'Ambulancias', 5),
  ('Patricia Soto', 'patricia.soto@riomed.bo', '+591 70011006', 'vendedor', 'Profesionales', 6),
  ('Ricardo Camacho', 'ricardo.camacho@riomed.bo', '+591 70011007', 'vendedor', 'Periféricos', 7),
  ('Elena Torres', 'elena.torres@riomed.bo', '+591 70011008', 'gerente', 'Gerência Comercial', 0)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.riomed_seller_leads (customer_name, customer_phone, customer_email, interest, profile, status, notes) VALUES
  ('Hospital San Juan de Dios', '+591 70020001', 'compras@hsjd.bo', 'Camas hospitalarias x10', 'hospital', 'ganho', 'Compra fechada — entrega programada'),
  ('Clínica Los Olivos', '+591 70020002', 'admin@olivos.bo', 'Monitores multiparamétricos x5', 'clinica', 'ganho', 'Pedido confirmado'),
  ('Dr. Mauricio Salinas', '+591 70020003', 'msalinas@medic.bo', 'Electrocardiógrafo', 'profesional', 'ganho', 'Comprou à vista'),
  ('Centro Médico La Paz', '+591 70020004', 'cmlp@cmlp.bo', 'Desfibrilador + oxímetros', 'clinica', 'ganho', 'Fechado em 2 visitas'),
  ('Home Care Sucre', '+591 70020005', 'contacto@hcsucre.bo', 'Concentradores x4', 'home_care', 'ganho', 'Recorrente'),
  ('Hospital Obrero Nº1', '+591 70020006', 'log@hoseguro.bo', 'Aspiradores y nebulizadores', 'hospital', 'ganho', 'Compra licitação'),
  ('Clínica Foianini', '+591 70020007', 'compras@foianini.bo', 'Bombas de infusão x8', 'clinica', 'ganho', 'Recurrente trimestral'),
  ('Dra. Carmen Vaca', '+591 70020008', 'cvaca@med.bo', 'Lámpara cirúrgica', 'profesional', 'ganho', 'Pagamento parcelado'),
  ('Ambulancia Vital', '+591 70020009', 'ops@vital.bo', 'Kit emergência ambulancia', 'ambulancia', 'ganho', 'Fechado'),
  ('Sanatorio Italiano', '+591 70020010', 'compras@italiano.bo', 'Mesa cirúrgica + foco', 'hospital', 'ganho', 'Instalado'),
  ('Clínica Belga', '+591 70020011', 'admin@belga.bo', 'Autoclave', 'clinica', 'perdido', 'Optou por concorrente — preço'),
  ('Dr. Luis Méndez', '+591 70020012', 'lmendez@med.bo', 'Ultrassom portátil', 'profesional', 'perdido', 'Adiou compra'),
  ('Centro Diagnóstico Sur', '+591 70020013', 'cds@cds.bo', 'Raio-X', 'clinica', 'perdido', 'Sem orçamento aprovado'),
  ('Hospital Municipal Boliviano', '+591 70020014', 'lic@hmb.bo', 'Carros emergência x5', 'hospital', 'perdido', 'Licitação não vencida'),
  ('Posta Sanitaria Norte', '+591 70020015', 'norte@minsa.bo', 'Cadeiras rodas x10', 'home_care', 'perdido', 'Sem verba'),
  ('Dr. Ramiro Aguilar', '+591 70020016', 'ramiro@med.bo', 'Otoscópio', 'profesional', 'perdido', 'Comprou online'),
  ('Clínica del Sur', '+591 70020017', 'csur@csur.bo', 'Mamógrafo', 'clinica', 'perdido', 'Decisão adiada 6m'),
  ('Centro Dialítico Tarija', '+591 70020018', 'tarija@dial.bo', 'Cadeiras hemodiálise', 'clinica', 'perdido', 'Sem fechamento'),
  ('Hospital Viedma', '+591 70020019', 'compras@viedma.bo', 'Locação camas UTI x20', 'hospital', 'locacao', 'Contrato 12m'),
  ('Clínica Cemes', '+591 70020020', 'cemes@cemes.bo', 'Locação monitores x10', 'clinica', 'locacao', 'Contrato 6m'),
  ('Asilo San Vicente', '+591 70020021', 'asv@asv.bo', 'Locação concentradores x8', 'home_care', 'locacao', 'Mensal'),
  ('Sra. Rosa Mamani', '+591 70020022', 'rosa@gmail.com', 'Locação cama domiciliar', 'home_care', 'locacao', 'Pós-operatório'),
  ('Familia Suárez', '+591 70020023', 'suarez@gmail.com', 'Locação O2 + aspirador', 'home_care', 'locacao', 'Cuidado paliativo'),
  ('Farmácia Cruz Verde', '+591 70020024', 'cruz@verde.bo', 'Glicosímetros (revenda)', 'periferico', 'novo', 'Aguardando proposta'),
  ('Ótica Visión', '+591 70020025', 'vision@vision.bo', 'Equipamentos auxiliares', 'periferico', 'novo', 'Reunião marcada'),
  ('Distribuidora MediSur', '+591 70020026', 'medisur@medisur.bo', 'Parceria revenda', 'periferico', 'novo', 'Em qualificação'),
  ('Centro Estético VitaPlus', '+591 70020027', 'vita@plus.bo', 'Macas e aparelhos', 'periferico', 'novo', 'Nutrição'),
  ('Lab Análise Clínica Real', '+591 70020028', 'real@lab.bo', 'Centrífugas e microscópios', 'periferico', 'novo', 'Em proposta'),
  ('Spa Médico Equilibrio', '+591 70020029', 'spa@equilibrio.bo', 'Equipamentos estéticos', 'periferico', 'novo', 'Visita agendada'),
  ('Hospital Petrolero', '+591 70020030', 'lic@petrolero.bo', 'Pacote UTI completo', 'hospital', 'novo', 'Licitação em curso')
ON CONFLICT DO NOTHING;
