-- riomed_sellers
CREATE TABLE public.riomed_sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  seller_code text NOT NULL,
  commission_rate numeric(5,2) NOT NULL DEFAULT 5.00,
  monthly_goal numeric(14,2) DEFAULT 0,
  territory text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, seller_code),
  UNIQUE(company_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_sellers TO authenticated;
GRANT ALL ON public.riomed_sellers TO service_role;
ALTER TABLE public.riomed_sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sellers" ON public.riomed_sellers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- riomed_distribution_config
CREATE TABLE public.riomed_distribution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  mode text NOT NULL DEFAULT 'round_robin',
  active boolean NOT NULL DEFAULT true,
  business_hours_start time DEFAULT '08:00',
  business_hours_end time DEFAULT '18:00',
  weekend_enabled boolean NOT NULL DEFAULT false,
  fallback_seller_id uuid REFERENCES public.riomed_sellers(id) ON DELETE SET NULL,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_assigned_seller_id uuid REFERENCES public.riomed_sellers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_distribution_config TO authenticated;
GRANT ALL ON public.riomed_distribution_config TO service_role;
ALTER TABLE public.riomed_distribution_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage distribution" ON public.riomed_distribution_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- riomed_seller_assignments
CREATE TABLE public.riomed_seller_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.riomed_sellers(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  assigned_via text NOT NULL DEFAULT 'auto',
  first_contact_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_riomed_assignments_seller ON public.riomed_seller_assignments(seller_id, status);
CREATE INDEX idx_riomed_assignments_lead ON public.riomed_seller_assignments(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_seller_assignments TO authenticated;
GRANT ALL ON public.riomed_seller_assignments TO service_role;
ALTER TABLE public.riomed_seller_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers see own assignments" ON public.riomed_seller_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Admins manage assignments" ON public.riomed_seller_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers update own assignments" ON public.riomed_seller_assignments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));

-- riomed_seller_notifications
CREATE TABLE public.riomed_seller_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.riomed_sellers(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.riomed_seller_assignments(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'in_app',
  title text NOT NULL,
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_riomed_notif_seller ON public.riomed_seller_notifications(seller_id, read_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.riomed_seller_notifications TO authenticated;
GRANT ALL ON public.riomed_seller_notifications TO service_role;
ALTER TABLE public.riomed_seller_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers read own notifications" ON public.riomed_seller_notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Sellers update own notifications" ON public.riomed_seller_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.riomed_sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
CREATE POLICY "Admins manage notifications" ON public.riomed_seller_notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER trg_riomed_sellers_updated BEFORE UPDATE ON public.riomed_sellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_riomed_distribution_updated BEFORE UPDATE ON public.riomed_distribution_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_riomed_assignments_updated BEFORE UPDATE ON public.riomed_seller_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignment function
CREATE OR REPLACE FUNCTION public.assign_riomed_lead(_company_id uuid, _lead_id uuid, _opportunity_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config public.riomed_distribution_config%ROWTYPE;
  v_seller_id uuid;
  v_assignment_id uuid;
BEGIN
  SELECT * INTO v_config FROM public.riomed_distribution_config WHERE company_id = _company_id;
  IF NOT FOUND OR NOT v_config.active THEN
    SELECT id INTO v_seller_id FROM public.riomed_sellers
      WHERE company_id = _company_id AND status = 'active' ORDER BY random() LIMIT 1;
  ELSIF v_config.mode = 'random' THEN
    SELECT id INTO v_seller_id FROM public.riomed_sellers
      WHERE company_id = _company_id AND status = 'active' ORDER BY random() LIMIT 1;
  ELSIF v_config.mode = 'round_robin' THEN
    SELECT id INTO v_seller_id FROM public.riomed_sellers
      WHERE company_id = _company_id AND status = 'active'
        AND (v_config.last_assigned_seller_id IS NULL OR id > v_config.last_assigned_seller_id)
      ORDER BY id ASC LIMIT 1;
    IF v_seller_id IS NULL THEN
      SELECT id INTO v_seller_id FROM public.riomed_sellers
        WHERE company_id = _company_id AND status = 'active' ORDER BY id ASC LIMIT 1;
    END IF;
    UPDATE public.riomed_distribution_config SET last_assigned_seller_id = v_seller_id WHERE company_id = _company_id;
  ELSE
    v_seller_id := v_config.fallback_seller_id;
  END IF;

  IF v_seller_id IS NULL THEN
    v_seller_id := v_config.fallback_seller_id;
  END IF;
  IF v_seller_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.riomed_seller_assignments (company_id, seller_id, lead_id, opportunity_id, assigned_via)
  VALUES (_company_id, v_seller_id, _lead_id, _opportunity_id, 'auto')
  RETURNING id INTO v_assignment_id;

  INSERT INTO public.riomed_seller_notifications (company_id, seller_id, assignment_id, title, body, payload)
  VALUES (_company_id, v_seller_id, v_assignment_id, 'Nuevo lead asignado',
    'Tienes un nuevo lead para atender.',
    jsonb_build_object('lead_id', _lead_id, 'opportunity_id', _opportunity_id));

  RETURN v_assignment_id;
END;
$$;
