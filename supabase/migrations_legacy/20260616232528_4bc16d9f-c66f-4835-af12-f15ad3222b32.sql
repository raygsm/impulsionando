
CREATE TABLE IF NOT EXISTS public.generated_page_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.generated_pages(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_generated_page_versions_page ON public.generated_page_versions(page_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_page_versions TO authenticated;
GRANT ALL ON public.generated_page_versions TO service_role;
ALTER TABLE public.generated_page_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage page versions" ON public.generated_page_versions;
CREATE POLICY "Staff manage page versions" ON public.generated_page_versions
  FOR ALL TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

DO $$
DECLARE v_company UUID := '8e90a584-a5f6-40b3-8975-dad968db39ba';
BEGIN
  UPDATE public.companies SET is_active = true, subdomain = COALESCE(subdomain, 'garrido') WHERE id = v_company;

  INSERT INTO public.company_units(company_id, name, code, city, state, is_active)
  SELECT v_company, 'Matriz Garrido', 'MTZ', 'Rio de Janeiro', 'RJ', true
  WHERE NOT EXISTS (SELECT 1 FROM public.company_units WHERE company_id = v_company);

  DELETE FROM public.realestate_search_intents WHERE company_id = v_company AND notes LIKE '%[SEED-GARRIDO]%';
  DELETE FROM public.realestate_properties WHERE company_id = v_company AND description LIKE '%[SEED-GARRIDO]%';

  INSERT INTO public.realestate_properties(
    company_id, reference_code, title, description, operation, property_type, status,
    sale_price, rent_price, condo_fee, iptu, area_total, area_useful,
    bedrooms, suites, bathrooms, parking_spots,
    address_line, neighborhood, city, state, features, photos, is_published
  ) VALUES
  (v_company, 'GAR-FLM-203', 'Apartamento 3 quartos no Flamengo — vista para o Aterro',
   '[SEED-GARRIDO] 120m², 3 quartos (1 suíte), varanda, vaga escriturada. Prédio 1 bloco, 2 ap/andar, portaria 24h. Próximo metrô Largo do Machado.',
   'venda', 'apartamento', 'ativo', 1800000, NULL, 2100, 4000, 140, 120, 3, 1, 2, 1,
   'Rua Paissandu, 165 / Ap 802', 'Flamengo', 'Rio de Janeiro', 'RJ',
   '{"varanda":true,"portaria_24h":true,"elevador":true,"vista_mar":true,"aceita_financiamento":true}'::jsonb,
   '[]'::jsonb, true),
  (v_company, 'GAR-BOT-118', 'Apartamento 2 quartos em Botafogo — pronto para morar',
   '[SEED-GARRIDO] 75m², 2 quartos, sala ampla, cozinha americana, 1 vaga, mobiliado. Próximo metrô Botafogo. Pet friendly.',
   'locacao', 'apartamento', 'ativo', NULL, 4500, 1100, 1800, 80, 75, 2, 1, 2, 1,
   'Rua São Clemente, 401 / Ap 502', 'Botafogo', 'Rio de Janeiro', 'RJ',
   '{"mobiliado":true,"pet":true,"ar_condicionado":true,"portaria_24h":true}'::jsonb,
   '[]'::jsonb, true),
  (v_company, 'GAR-BRR-044', 'Casa em condomínio na Barra — 4 quartos, piscina, 3 vagas',
   '[SEED-GARRIDO] Duplex 320m² em condomínio fechado, 4 quartos (2 suítes), área gourmet, piscina, 3 vagas. Aceita financiamento e permuta.',
   'venda', 'casa', 'ativo', 3200000, NULL, 1800, 6500, 400, 320, 4, 2, 4, 3,
   'Cond. Mansões da Barra — Av. das Américas, 12500', 'Barra da Tijuca', 'Rio de Janeiro', 'RJ',
   '{"piscina_privativa":true,"area_gourmet":true,"condominio_fechado":true,"aceita_financiamento":true,"aceita_permuta":true}'::jsonb,
   '[]'::jsonb, true);

  INSERT INTO public.realestate_search_intents(
    company_id, contact_name, contact_email, contact_phone,
    operation, property_types, price_max, area_min,
    bedrooms_min, bathrooms_min, parking_min,
    cities, neighborhoods, status, notes
  ) VALUES
  (v_company, 'Mariana Costa', 'mariana.teste@example.com', '+5521900000001',
   'locacao', ARRAY['apartamento']::realestate_property_type[], 5000, 60, 2, 1, 1,
   ARRAY['Rio de Janeiro'], ARRAY['Flamengo','Botafogo','Catete'],
   'ativo', '[SEED-GARRIDO] Casal jovem, pet friendly, 30 dias.'),
  (v_company, 'Carlos Eduardo', 'carlos.teste@example.com', '+5521900000002',
   'venda', ARRAY['apartamento','cobertura']::realestate_property_type[], 2200000, 100, 3, 2, 1,
   ARRAY['Rio de Janeiro'], ARRAY['Flamengo','Laranjeiras','Urca'],
   'ativo', '[SEED-GARRIDO] Família, vista/varanda, financia 70%.');
END $$;
