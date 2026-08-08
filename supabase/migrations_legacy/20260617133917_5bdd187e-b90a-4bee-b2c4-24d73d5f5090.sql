
CREATE TABLE public.contab_irpf_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.contab_clients(id) ON DELETE SET NULL,
  taxpayer_name TEXT NOT NULL,
  taxpayer_cpf TEXT,
  base_year INT NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  result_type TEXT,
  result_amount NUMERIC(14,2) DEFAULT 0,
  fee_amount NUMERIC(14,2) DEFAULT 0,
  fee_paid BOOLEAN DEFAULT false,
  responsible_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_irpf_journeys TO authenticated;
GRANT ALL ON public.contab_irpf_journeys TO service_role;
ALTER TABLE public.contab_irpf_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "irpf_j_all" ON public.contab_irpf_journeys FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE TRIGGER trg_contab_irpf_j_upd BEFORE UPDATE ON public.contab_irpf_journeys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_irpf_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES public.contab_irpf_journeys(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_irpf_steps TO authenticated;
GRANT ALL ON public.contab_irpf_steps TO service_role;
ALTER TABLE public.contab_irpf_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "irpf_s_all" ON public.contab_irpf_steps FOR ALL TO authenticated
USING (journey_id IN (SELECT id FROM public.contab_irpf_journeys WHERE company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())))
WITH CHECK (journey_id IN (SELECT id FROM public.contab_irpf_journeys WHERE company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid())));
CREATE TRIGGER trg_contab_irpf_s_upd BEFORE UPDATE ON public.contab_irpf_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.contab_seed_irpf_steps()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  steps TEXT[] := ARRAY[
    '1. Convite e Aceite','2. Coleta de Documentos','3. Informe de Rendimentos',
    '4. Bens e Direitos','5. Dependentes','6. Despesas Médicas',
    '7. Despesas com Educação','8. Conferência de Dados','9. Simulação (Completa vs Simplificada)',
    '10. Revisão com Cliente','11. Aprovação Final','12. Assinatura',
    '13. Transmissão à Receita','14. Recibo e Arquivamento'
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(steps,1) LOOP
    INSERT INTO public.contab_irpf_steps (journey_id, step_number, step_name)
    VALUES (NEW.id, i, steps[i]);
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_contab_seed_irpf_steps AFTER INSERT ON public.contab_irpf_journeys
FOR EACH ROW EXECUTE FUNCTION public.contab_seed_irpf_steps();

CREATE TABLE public.contab_office_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.contab_clients(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_office_finance TO authenticated;
GRANT ALL ON public.contab_office_finance TO service_role;
ALTER TABLE public.contab_office_finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "off_fin_all" ON public.contab_office_finance FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE TRIGGER trg_contab_off_fin_upd BEFORE UPDATE ON public.contab_office_finance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.contab_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  monthly_fee NUMERIC(14,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  content TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_contracts TO authenticated;
GRANT ALL ON public.contab_contracts TO service_role;
ALTER TABLE public.contab_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ctr_all" ON public.contab_contracts FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE TRIGGER trg_contab_ctr_upd BEFORE UPDATE ON public.contab_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contab_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.contab_clients(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  completed_at TIMESTAMPTZ,
  responsible_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contab_onboarding TO authenticated;
GRANT ALL ON public.contab_onboarding TO service_role;
ALTER TABLE public.contab_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onb_all" ON public.contab_onboarding FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid()));
CREATE TRIGGER trg_contab_onb_upd BEFORE UPDATE ON public.contab_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.permissions (code, module, description) VALUES
  ('contab.irpf.write', 'contabilidade', 'Criar e atualizar jornadas de IRPF'),
  ('contab.finance.write', 'contabilidade', 'Criar e atualizar lançamentos financeiros do escritório'),
  ('contab.contract.write', 'contabilidade', 'Criar e atualizar contratos de clientes'),
  ('contab.onboarding.write', 'contabilidade', 'Criar e atualizar checklist de onboarding')
ON CONFLICT (code) DO NOTHING;
