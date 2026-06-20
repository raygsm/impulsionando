
CREATE OR REPLACE FUNCTION public.is_ecosystem_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = _user_id AND up.company_id IS NOT NULL
    UNION ALL
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_ecosystem_member(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.eco_marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL, description text NOT NULL, niche text NOT NULL, subniche text,
  audience text NOT NULL DEFAULT 'b2b' CHECK (audience IN ('b2b','b2c','both')),
  pricing_model text NOT NULL DEFAULT 'project' CHECK (pricing_model IN ('hour','project','recurring','custom')),
  min_price_cents integer DEFAULT 0, max_price_cents integer, currency text NOT NULL DEFAULT 'BRL',
  tags text[] DEFAULT '{}', coverage_area text DEFAULT 'national',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  visibility text NOT NULL DEFAULT 'ecosystem' CHECK (visibility IN ('ecosystem','public','private')),
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_marketplace_listings TO authenticated;
GRANT ALL ON public.eco_marketplace_listings TO service_role;
GRANT SELECT ON public.eco_marketplace_listings TO anon;
ALTER TABLE public.eco_marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_listings_select_active ON public.eco_marketplace_listings FOR SELECT USING (
  (status='active' AND visibility IN ('ecosystem','public'))
  OR public.mp_user_in_company(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_listings_write_owner ON public.eco_marketplace_listings FOR ALL USING (
  public.mp_user_in_company(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.mp_user_in_company(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin')
);
CREATE INDEX IF NOT EXISTS idx_eco_listings_niche ON public.eco_marketplace_listings(niche, status);
CREATE INDEX IF NOT EXISTS idx_eco_listings_search ON public.eco_marketplace_listings USING gin(search_vector);

CREATE OR REPLACE FUNCTION public.eco_listings_search_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.niche,'') || ' ' || coalesce(NEW.subniche,'')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(array_to_string(NEW.tags,' '),'')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_eco_listings_search BEFORE INSERT OR UPDATE ON public.eco_marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.eco_listings_search_update();

CREATE TABLE IF NOT EXISTS public.eco_marketplace_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  listing_id uuid REFERENCES public.eco_marketplace_listings(id) ON DELETE SET NULL,
  target_niche text, title text NOT NULL, scope text NOT NULL,
  budget_cents integer, deadline date,
  nda_required boolean NOT NULL DEFAULT false, contract_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','quoting','awarded','closed','cancelled')),
  invited_providers uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_marketplace_requests TO authenticated;
GRANT ALL ON public.eco_marketplace_requests TO service_role;
ALTER TABLE public.eco_marketplace_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_requests_select ON public.eco_marketplace_requests FOR SELECT USING (
  public.mp_user_in_company(auth.uid(), requester_company_id)
  OR auth.uid() = ANY(invited_providers)
  OR (status='open' AND public.is_ecosystem_member(auth.uid()))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_requests_insert_member ON public.eco_marketplace_requests FOR INSERT WITH CHECK (
  public.mp_user_in_company(auth.uid(), requester_company_id)
);
CREATE POLICY eco_requests_update_owner ON public.eco_marketplace_requests FOR UPDATE USING (
  public.mp_user_in_company(auth.uid(), requester_company_id) OR public.has_role(auth.uid(),'admin')
);

CREATE TABLE IF NOT EXISTS public.eco_marketplace_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.eco_marketplace_requests(id) ON DELETE CASCADE,
  provider_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_user_id uuid NOT NULL, amount_cents integer NOT NULL, currency text NOT NULL DEFAULT 'BRL',
  scope_details text NOT NULL, delivery_days integer,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','rejected','withdrawn','expired')),
  message text, attachments jsonb DEFAULT '[]'::jsonb, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_marketplace_quotes TO authenticated;
GRANT ALL ON public.eco_marketplace_quotes TO service_role;
ALTER TABLE public.eco_marketplace_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_quotes_select ON public.eco_marketplace_quotes FOR SELECT USING (
  public.mp_user_in_company(auth.uid(), provider_company_id)
  OR EXISTS (SELECT 1 FROM public.eco_marketplace_requests r WHERE r.id=request_id AND public.mp_user_in_company(auth.uid(), r.requester_company_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_quotes_insert_provider ON public.eco_marketplace_quotes FOR INSERT WITH CHECK (
  public.mp_user_in_company(auth.uid(), provider_company_id)
);
CREATE POLICY eco_quotes_update ON public.eco_marketplace_quotes FOR UPDATE USING (
  public.mp_user_in_company(auth.uid(), provider_company_id)
  OR EXISTS (SELECT 1 FROM public.eco_marketplace_requests r WHERE r.id=request_id AND public.mp_user_in_company(auth.uid(), r.requester_company_id))
  OR public.has_role(auth.uid(),'admin')
);

CREATE TABLE IF NOT EXISTS public.eco_marketplace_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.eco_marketplace_quotes(id),
  request_id uuid NOT NULL REFERENCES public.eco_marketplace_requests(id),
  requester_company_id uuid NOT NULL REFERENCES public.companies(id),
  provider_company_id uuid NOT NULL REFERENCES public.companies(id),
  contract_id uuid, nda_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_delivery','completed','disputed','cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  gmv_cents integer NOT NULL,
  intermediation_fee_cents integer NOT NULL DEFAULT 0,
  intermediation_fee_bps integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.eco_marketplace_engagements TO authenticated;
GRANT ALL ON public.eco_marketplace_engagements TO service_role;
ALTER TABLE public.eco_marketplace_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_engagements_select ON public.eco_marketplace_engagements FOR SELECT USING (
  public.mp_user_in_company(auth.uid(), requester_company_id)
  OR public.mp_user_in_company(auth.uid(), provider_company_id)
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_engagements_write_parties ON public.eco_marketplace_engagements FOR ALL USING (
  public.mp_user_in_company(auth.uid(), requester_company_id)
  OR public.mp_user_in_company(auth.uid(), provider_company_id)
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  public.mp_user_in_company(auth.uid(), requester_company_id)
  OR public.mp_user_in_company(auth.uid(), provider_company_id)
  OR public.has_role(auth.uid(),'admin')
);

CREATE TABLE IF NOT EXISTS public.eco_marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.eco_marketplace_engagements(id) ON DELETE CASCADE,
  reviewer_company_id uuid NOT NULL REFERENCES public.companies(id),
  reviewer_user_id uuid NOT NULL,
  reviewed_company_id uuid NOT NULL REFERENCES public.companies(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_quality smallint CHECK (rating_quality BETWEEN 1 AND 5),
  rating_deadline smallint CHECK (rating_deadline BETWEEN 1 AND 5),
  rating_communication smallint CHECK (rating_communication BETWEEN 1 AND 5),
  rating_price smallint CHECK (rating_price BETWEEN 1 AND 5),
  comment text,
  visibility text NOT NULL DEFAULT 'ecosystem' CHECK (visibility='ecosystem'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, reviewer_company_id)
);
GRANT SELECT, INSERT, UPDATE ON public.eco_marketplace_reviews TO authenticated;
GRANT ALL ON public.eco_marketplace_reviews TO service_role;
ALTER TABLE public.eco_marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_reviews_select_ecosystem ON public.eco_marketplace_reviews FOR SELECT USING (
  public.is_ecosystem_member(auth.uid()) OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_reviews_insert_reviewer ON public.eco_marketplace_reviews FOR INSERT WITH CHECK (
  public.mp_user_in_company(auth.uid(), reviewer_company_id)
  AND EXISTS (SELECT 1 FROM public.eco_marketplace_engagements e
    WHERE e.id=engagement_id
      AND (e.requester_company_id=reviewer_company_id OR e.provider_company_id=reviewer_company_id)
      AND e.status IN ('completed','in_delivery'))
);
CREATE POLICY eco_reviews_update_owner ON public.eco_marketplace_reviews FOR UPDATE USING (
  public.mp_user_in_company(auth.uid(), reviewer_company_id)
);

CREATE TABLE IF NOT EXISTS public.eco_marketplace_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_company_id uuid NOT NULL REFERENCES public.companies(id),
  referrer_user_id uuid NOT NULL,
  referred_company_id uuid NOT NULL REFERENCES public.companies(id),
  target_company_id uuid REFERENCES public.companies(id),
  target_email text, context_note text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','viewed','accepted','converted','expired')),
  converted_engagement_id uuid REFERENCES public.eco_marketplace_engagements(id),
  reward_cents integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.eco_marketplace_referrals TO authenticated;
GRANT ALL ON public.eco_marketplace_referrals TO service_role;
ALTER TABLE public.eco_marketplace_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_referrals_select ON public.eco_marketplace_referrals FOR SELECT USING (
  public.mp_user_in_company(auth.uid(), referrer_company_id)
  OR public.mp_user_in_company(auth.uid(), referred_company_id)
  OR (target_company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), target_company_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_referrals_insert ON public.eco_marketplace_referrals FOR INSERT WITH CHECK (
  public.mp_user_in_company(auth.uid(), referrer_company_id)
);
CREATE POLICY eco_referrals_update ON public.eco_marketplace_referrals FOR UPDATE USING (
  public.mp_user_in_company(auth.uid(), referrer_company_id)
  OR (target_company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), target_company_id))
  OR public.has_role(auth.uid(),'admin')
);

CREATE TABLE IF NOT EXISTS public.eco_legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('terms','privacy','nda','dpa','contract_b2b','cookies','consent_general')),
  niche text, audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','staff','client','consumer','b2b')),
  version text NOT NULL, title text NOT NULL, body_md text NOT NULL,
  effective_at timestamptz NOT NULL DEFAULT now(), is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, niche, audience, version)
);
GRANT SELECT ON public.eco_legal_documents TO authenticated, anon;
GRANT ALL ON public.eco_legal_documents TO service_role;
ALTER TABLE public.eco_legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_legal_select_all ON public.eco_legal_documents FOR SELECT USING (true);
CREATE POLICY eco_legal_write_staff ON public.eco_legal_documents FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.eco_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  document_id uuid NOT NULL REFERENCES public.eco_legal_documents(id),
  document_kind text NOT NULL, document_version text NOT NULL, context text NOT NULL,
  document_hash text NOT NULL, ip_address inet, user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now(), metadata jsonb DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT ON public.eco_legal_acceptances TO authenticated;
GRANT ALL ON public.eco_legal_acceptances TO service_role;
ALTER TABLE public.eco_legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY eco_acceptances_select_own ON public.eco_legal_acceptances FOR SELECT USING (
  user_id = auth.uid()
  OR (company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), company_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY eco_acceptances_insert_self ON public.eco_legal_acceptances FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_eco_acceptances_user ON public.eco_legal_acceptances(user_id, document_kind);

CREATE TRIGGER trg_eco_requests_updated BEFORE UPDATE ON public.eco_marketplace_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eco_quotes_updated BEFORE UPDATE ON public.eco_marketplace_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eco_engagements_updated BEFORE UPDATE ON public.eco_marketplace_engagements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eco_reviews_updated BEFORE UPDATE ON public.eco_marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eco_referrals_updated BEFORE UPDATE ON public.eco_marketplace_referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eco_legal_updated BEFORE UPDATE ON public.eco_legal_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.eco_legal_documents (kind, niche, audience, version, title, body_md, is_current) VALUES
  ('terms', NULL, 'all', '2026.06.1', 'Termos de Uso — Impulsionando',
   E'# Termos de Uso\n\nAo utilizar a Impulsionando você concorda com estes Termos. A plataforma conecta empresas, profissionais e consumidores em um ecossistema de serviços e produtos. Uso indevido, fraude ou violação de direitos de terceiros resulta em suspensão.\n\nA Taxa de Intermediação Digital incide sobre contratações fechadas no marketplace interno.\n\nForo: comarca da sede da Impulsionando, salvo norma de proteção ao consumidor.', true),
  ('privacy', NULL, 'all', '2026.06.1', 'Política de Privacidade — LGPD',
   E'# Política de Privacidade (LGPD)\n\nTratamos dados conforme Lei 13.709/2018. Coletamos identificação, contato, dados de uso, dados financeiros e, em nichos específicos (saúde, educação, contábil, jurídico), dados sensíveis estritamente necessários.\n\nBases legais: execução de contrato, obrigação legal, legítimo interesse e consentimento.\n\nDireitos do titular: confirmação, acesso, correção, anonimização, portabilidade, eliminação, revogação. Canal: dpo@impulsionando.com.br ou /legal/aceites.\n\nRetenção: fiscal 5 anos; médico CFM 20 anos.', true),
  ('nda', NULL, 'b2b', '2026.06.1', 'Acordo de Sigilo e Confidencialidade — NDA',
   E'# NDA — Acordo de Sigilo\n\n1. Confidencialidade por 5 anos.\n2. Uso restrito à finalidade.\n3. Não-divulgação a terceiros sem mesma obrigação.\n4. Devolução/destruição ao término.\n5. LGPD.\n6. Multa de 50% do engagement em violação.\n7. Foro da sede do CONTRATANTE.\n\nAceite eletrônico com valor jurídico (MP 2.200-2/2001 e Lei 14.063/2020).', true),
  ('contract_b2b', NULL, 'b2b', '2026.06.1', 'Contrato de Prestação de Serviços B2B',
   E'# Contrato B2B\n\nCONTRATANTE: {{requester_company}}\nCONTRATADA: {{provider_company}}\n\nObjeto: {{scope}}\nValor: R$ {{amount}} · prazo {{delivery_days}} dias.\nTaxa de Intermediação Digital: {{fee_bps}} bps sobre o GMV.\n\nRescisão imotivada: 15 dias.\nForo: sede do CONTRATANTE.\n\nAceite eletrônico MP 2.200-2/2001.', true),
  ('cookies', NULL, 'all', '2026.06.1', 'Política de Cookies',
   E'# Cookies\n\nEssenciais, funcionais e analíticos. Marketing somente com consentimento.', true),
  ('dpa', NULL, 'b2b', '2026.06.1', 'Acordo de Processamento de Dados (DPA)',
   E'# DPA\n\nQuando a Impulsionando opera dados sob instruções do tenant: finalidade limitada, segurança técnica e organizacional, registro de operações, notificação de incidentes em até 48h, suporte a titulares.', true)
ON CONFLICT (kind, niche, audience, version) DO NOTHING;

INSERT INTO public.mp_fee_policies (scope, niche_slug, fee_pct, label, active)
SELECT 'default', NULL, 0.005, 'Taxa de Intermediação Digital — padrão Impulsionando', true
WHERE NOT EXISTS (SELECT 1 FROM public.mp_fee_policies WHERE scope='default');
