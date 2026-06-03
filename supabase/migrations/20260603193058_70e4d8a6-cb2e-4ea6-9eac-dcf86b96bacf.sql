
-- Captura de leads do site público (orçamento, contato, demo)
CREATE TABLE public.marketing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('orcamento','contato','demo','outro')),
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  message TEXT,
  answers JSONB,
  recommended_plan TEXT,
  recommended_modules TEXT[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','won','lost','spam')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_leads_status ON public.marketing_leads(status);
CREATE INDEX idx_marketing_leads_created_at ON public.marketing_leads(created_at DESC);
CREATE INDEX idx_marketing_leads_source ON public.marketing_leads(source);

-- Grants: anon pode INSERT (formulários públicos); staff Impulsionando lê/gerencia
GRANT INSERT ON public.marketing_leads TO anon;
GRANT INSERT, SELECT, UPDATE ON public.marketing_leads TO authenticated;
GRANT ALL ON public.marketing_leads TO service_role;

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode criar um lead (formulário público)
CREATE POLICY "Public can insert marketing leads"
  ON public.marketing_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas equipe Impulsionando (super admin / staff master) pode visualizar
CREATE POLICY "Staff can view marketing leads"
  ON public.marketing_leads FOR SELECT
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()));

-- Apenas equipe Impulsionando pode atualizar (status, atribuição, notas)
CREATE POLICY "Staff can update marketing leads"
  ON public.marketing_leads FOR UPDATE
  TO authenticated
  USING (public.is_impulsionando_staff(auth.uid()))
  WITH CHECK (public.is_impulsionando_staff(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER set_updated_at_marketing_leads
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Notifica staff master quando chega novo lead do site
CREATE OR REPLACE FUNCTION public.tg_notify_marketing_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE u RECORD;
BEGIN
  FOR u IN
    SELECT DISTINCT up.user_id
    FROM public.user_profiles up
    JOIN public.profiles p ON p.id = up.profile_id
    WHERE p.is_master_profile = true AND up.is_active = true
  LOOP
    PERFORM public.notify_user(
      u.user_id, NULL, 'crm', 'info',
      'Novo lead do site (' || NEW.source || ')',
      COALESCE(NEW.name, NEW.email, NEW.phone, 'Sem nome informado'),
      '/marketing/leads', 'Ver leads'
    );
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER tg_marketing_leads_notify
  AFTER INSERT ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_marketing_lead();
