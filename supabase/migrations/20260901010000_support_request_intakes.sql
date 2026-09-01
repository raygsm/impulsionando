-- Intake real: Impulsionito -> consolidacao -> aceite do cliente -> ticket/SLA -> comite

CREATE TABLE IF NOT EXISTS public.support_request_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'impulsionito' CHECK (source IN ('impulsionito','form','voice','manual')),
  request_kind text NOT NULL CHECK (request_kind IN ('support','emergency','improvement')),
  raw_request text NOT NULL,
  consolidated_title text,
  consolidated_summary text,
  acceptance_status text NOT NULL DEFAULT 'draft' CHECK (acceptance_status IN ('draft','awaiting_acceptance','accepted','rejected','superseded')),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  committee_status text NOT NULL DEFAULT 'not_applicable' CHECK (committee_status IN ('not_applicable','pending','in_review','approved','rejected','scheduled','implemented')),
  committee_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_request_intakes_requester ON public.support_request_intakes(requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_request_intakes_company ON public.support_request_intakes(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_request_intakes_acceptance ON public.support_request_intakes(acceptance_status, request_kind);
CREATE INDEX IF NOT EXISTS idx_support_request_intakes_committee ON public.support_request_intakes(committee_status) WHERE request_kind='improvement';

ALTER TABLE public.support_request_intakes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.support_request_intakes TO authenticated;
GRANT ALL ON public.support_request_intakes TO service_role;

DROP POLICY IF EXISTS "support_request_intakes_select" ON public.support_request_intakes;
CREATE POLICY "support_request_intakes_select"
ON public.support_request_intakes FOR SELECT TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR requester_user_id = auth.uid()
  OR (company_id IS NOT NULL AND public.mp_user_in_company(auth.uid(), company_id))
);

DROP POLICY IF EXISTS "support_request_intakes_insert" ON public.support_request_intakes;
CREATE POLICY "support_request_intakes_insert"
ON public.support_request_intakes FOR INSERT TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND (
    company_id IS NULL
    OR public.mp_user_in_company(auth.uid(), company_id)
    OR public.is_impulsionando_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "support_request_intakes_update" ON public.support_request_intakes;
CREATE POLICY "support_request_intakes_update"
ON public.support_request_intakes FOR UPDATE TO authenticated
USING (
  public.is_impulsionando_staff(auth.uid())
  OR requester_user_id = auth.uid()
)
WITH CHECK (
  public.is_impulsionando_staff(auth.uid())
  OR requester_user_id = auth.uid()
);

CREATE OR REPLACE FUNCTION public.support_add_business_hours(start_at timestamptz, hours_to_add integer)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cursor_at timestamptz := start_at;
  remaining integer := GREATEST(hours_to_add, 0);
BEGIN
  WHILE remaining > 0 LOOP
    cursor_at := cursor_at + interval '1 hour';
    IF EXTRACT(ISODOW FROM cursor_at) BETWEEN 1 AND 5 THEN
      remaining := remaining - 1;
    END IF;
  END LOOP;
  RETURN cursor_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.support_request_intakes_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_support_request_intakes_touch ON public.support_request_intakes;
CREATE TRIGGER trg_support_request_intakes_touch
BEFORE UPDATE ON public.support_request_intakes
FOR EACH ROW EXECUTE FUNCTION public.support_request_intakes_touch();

COMMENT ON TABLE public.support_request_intakes IS 'Solicitacoes reais consolidadas pelo Impulsionito antes do aceite e da geracao de ticket.';
COMMENT ON COLUMN public.support_request_intakes.request_kind IS 'support=atendimento normal; emergency=emergencia; improvement=incremento de recurso.';
COMMENT ON COLUMN public.support_request_intakes.committee_status IS 'Incrementos aceitos seguem para o comite Impulsionando.';
