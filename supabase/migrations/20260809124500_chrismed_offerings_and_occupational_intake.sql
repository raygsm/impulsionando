-- Reconcile official CHRISMED prices and persist the occupational B2B journey.
ALTER TABLE public.chrismed_service_offerings DROP CONSTRAINT IF EXISTS chrismed_service_offerings_modality_check;
ALTER TABLE public.chrismed_service_offerings ADD CONSTRAINT chrismed_service_offerings_modality_check
  CHECK (modality IN ('presencial','telemedicina','domiciliar','ocupacional','retorno'));

INSERT INTO public.chrismed_service_offerings
  (company_id,slug,name,description,modality,price_cents,duration_minutes,requires_prepayment,refund_window_hours,reschedule_window_hours,display_order,active)
VALUES
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','consulta-presencial','Consulta Presencial','Atendimento clínico presencial em Copacabana.','presencial',120000,60,true,24,12,1,true),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','telemedicina','Teleconsulta','Consulta por vídeo em português, inglês ou espanhol.','telemedicina',60000,45,true,6,2,2,true),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','visita-domiciliar','Consulta Domiciliar','Atendimento médico domiciliar no Rio de Janeiro, sujeito a confirmação logística.','domiciliar',240000,90,true,48,24,3,true),
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','aso','Consulta Ocupacional / ASO','Atendimento ocupacional presencial, sujeito à confirmação da empresa e da agenda.','ocupacional',11000,30,true,24,12,4,true)
ON CONFLICT (company_id,slug) DO UPDATE SET
  name=EXCLUDED.name,description=EXCLUDED.description,modality=EXCLUDED.modality,price_cents=EXCLUDED.price_cents,
  duration_minutes=EXCLUDED.duration_minutes,requires_prepayment=EXCLUDED.requires_prepayment,
  refund_window_hours=EXCLUDED.refund_window_hours,reschedule_window_hours=EXCLUDED.reschedule_window_hours,
  display_order=EXCLUDED.display_order,active=EXCLUDED.active,updated_at=now();

CREATE TABLE IF NOT EXISTS public.chrismed_occupational_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT DEFAULT '642096b5-a9ff-4521-a82a-c004f6d2e2d2',
  service text NOT NULL CHECK (service IN ('aso','pericia')), organization_name text NOT NULL,
  organization_document text, contact_name text NOT NULL, contact_email text NOT NULL, contact_phone text NOT NULL,
  employees_or_case text, preferred_window text, notes text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_review','contacted','scheduled','closed','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chrismed_occupational_company CHECK (company_id='642096b5-a9ff-4521-a82a-c004f6d2e2d2')
);
ALTER TABLE public.chrismed_occupational_intakes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chrismed_occupational_intakes FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.chrismed_occupational_intakes TO service_role;
CREATE POLICY chrismed_occupational_staff_read ON public.chrismed_occupational_intakes
  FOR SELECT TO authenticated USING (public.is_impulsionando_staff((SELECT auth.uid())));

CREATE OR REPLACE FUNCTION public.submit_chrismed_occupational_intake(p_request jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_request_id uuid; v_service text; v_email text; v_payload jsonb;
BEGIN
  v_request_id := nullif(p_request->>'requestId','')::uuid; v_service := p_request->>'service'; v_email := lower(trim(p_request->>'email'));
  IF v_request_id IS NULL OR v_service NOT IN ('aso','pericia') THEN RAISE EXCEPTION 'invalid occupational request'; END IF;
  IF char_length(trim(p_request->>'company')) NOT BETWEEN 2 AND 180
    OR char_length(trim(p_request->>'contactName')) NOT BETWEEN 2 AND 180
    OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    OR char_length(trim(p_request->>'phone')) NOT BETWEEN 8 AND 40 THEN RAISE EXCEPTION 'required occupational contact data is invalid'; END IF;
  INSERT INTO public.chrismed_occupational_intakes
    (request_id,service,organization_name,organization_document,contact_name,contact_email,contact_phone,employees_or_case,preferred_window,notes)
  VALUES (v_request_id,v_service,trim(p_request->>'company'),nullif(trim(p_request->>'cnpj'),''),trim(p_request->>'contactName'),v_email,
    trim(p_request->>'phone'),nullif(trim(p_request->>'employees'),''),nullif(trim(p_request->>'window'),''),nullif(left(trim(p_request->>'notes'),4000),''))
  ON CONFLICT(request_id) DO UPDATE SET request_id=EXCLUDED.request_id RETURNING id INTO v_id;
  v_payload := jsonb_build_object('intake_id',v_id,'service',v_service,'company',trim(p_request->>'company'),
    'contact_name',trim(p_request->>'contactName'),'contact_email',v_email,'contact_phone',trim(p_request->>'phone'),'received_at',now());
  INSERT INTO public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key)
  VALUES ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','occupational_intake_management','email','sac@chrismed.com.br',v_payload,
    'occupational:'||v_request_id||':management:email') ON CONFLICT(idempotency_key) DO NOTHING;
  INSERT INTO public.chrismed_communication_outbox(company_id,event_code,channel,recipient,payload,idempotency_key)
  VALUES ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','occupational_intake_received','email',v_email,v_payload,
    'occupational:'||v_request_id||':received:email') ON CONFLICT(idempotency_key) DO NOTHING;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_chrismed_occupational_intake(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_chrismed_occupational_intake(jsonb) TO anon,authenticated,service_role;
