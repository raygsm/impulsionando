
CREATE TABLE IF NOT EXISTS public.core_compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'global',
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  label text NOT NULL,
  document_kind text NOT NULL,
  blocking boolean NOT NULL DEFAULT true,
  min_version text,
  applies_to text NOT NULL DEFAULT 'company',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, company_id, requirement_key)
);

GRANT SELECT ON public.core_compliance_requirements TO authenticated;
GRANT ALL ON public.core_compliance_requirements TO service_role;
ALTER TABLE public.core_compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_req_read_auth" ON public.core_compliance_requirements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "compliance_req_admin_manage" ON public.core_compliance_requirements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_compliance_req_updated_at
  BEFORE UPDATE ON public.core_compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.core_compliance_requirements (scope, requirement_key, label, document_kind, blocking, applies_to)
VALUES
  ('global','master_service_agreement','Contrato Master de Prestação','master_service_agreement',true,'company'),
  ('global','lgpd_dpa','Acordo de Tratamento de Dados (LGPD/DPA)','lgpd_dpa',true,'company'),
  ('global','terms_of_use','Termos de Uso da Plataforma','terms_of_use',true,'company'),
  ('global','privacy_policy','Política de Privacidade','privacy_policy',true,'company')
ON CONFLICT (scope, company_id, requirement_key) DO NOTHING;

CREATE OR REPLACE VIEW public.v_company_compliance_status AS
WITH reqs AS (
  SELECT c.id AS company_id, r.requirement_key, r.label, r.document_kind, r.blocking, r.applies_to
  FROM public.companies c
  CROSS JOIN public.core_compliance_requirements r
  WHERE r.active = true AND r.scope = 'global'
  UNION ALL
  SELECT r.company_id, r.requirement_key, r.label, r.document_kind, r.blocking, r.applies_to
  FROM public.core_compliance_requirements r
  WHERE r.active = true AND r.scope = 'company' AND r.company_id IS NOT NULL
),
master_sig AS (
  SELECT cs.company_id, max(cs.signed_at) AS last_signed_at
  FROM public.contract_signatures cs
  WHERE cs.signed_at IS NOT NULL
  GROUP BY cs.company_id
),
lgpd AS (
  SELECT company_id, document_kind, max(accepted_at) AS last_signed_at
  FROM public.eco_legal_acceptances
  GROUP BY company_id, document_kind
)
SELECT
  reqs.company_id,
  reqs.requirement_key,
  reqs.label,
  reqs.document_kind,
  reqs.blocking,
  reqs.applies_to,
  CASE WHEN reqs.document_kind = 'master_service_agreement' THEN master_sig.last_signed_at
       ELSE lgpd.last_signed_at END AS satisfied_at,
  (CASE WHEN reqs.document_kind = 'master_service_agreement' THEN master_sig.last_signed_at
        ELSE lgpd.last_signed_at END) IS NOT NULL AS satisfied
FROM reqs
LEFT JOIN master_sig ON master_sig.company_id = reqs.company_id AND reqs.document_kind = 'master_service_agreement'
LEFT JOIN lgpd       ON lgpd.company_id = reqs.company_id AND lgpd.document_kind = reqs.document_kind;

GRANT SELECT ON public.v_company_compliance_status TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.company_can_transact(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.v_company_compliance_status
    WHERE company_id = _company_id AND blocking = true AND satisfied = false
  );
$$;

CREATE OR REPLACE FUNCTION public.assert_company_can_transact(_company_id uuid)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(label, ', ' ORDER BY label) INTO v_missing
  FROM public.v_company_compliance_status
  WHERE company_id = _company_id AND blocking = true AND satisfied = false;
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'COMPLIANCE_BLOCKED: empresa % nao pode transacionar. Pendencias: %', _company_id, v_missing
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_mp_orders_compliance_gate()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid;
BEGIN
  v_company := (SELECT company_id FROM public.mp_suppliers WHERE id = NEW.supplier_id);
  IF v_company IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IN ('paid','approved','active','confirmed') THEN
    PERFORM public.assert_company_can_transact(v_company);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='mp_orders' AND column_name='supplier_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='mp_orders' AND column_name='status') THEN
    DROP TRIGGER IF EXISTS trg_mp_orders_compliance_gate ON public.mp_orders;
    CREATE TRIGGER trg_mp_orders_compliance_gate
      BEFORE INSERT OR UPDATE OF status ON public.mp_orders
      FOR EACH ROW EXECUTE FUNCTION public.tg_mp_orders_compliance_gate();
  END IF;
END $$;

INSERT INTO public.runtime_events (level, scope, message, context)
VALUES ('info','core.governance','Phase 2: compliance gate deployed',
  jsonb_build_object('phase','2','subject','compliance_gate',
    'details','core_compliance_requirements + v_company_compliance_status + assert_company_can_transact + mp_orders gate.'));
