-- Use the standard CHRISMED transactional calendar for ASO and medical expertise.
ALTER TABLE public.chrismed_service_offerings
  DROP CONSTRAINT IF EXISTS chrismed_service_offerings_modality_check;

ALTER TABLE public.chrismed_service_offerings
  ADD CONSTRAINT chrismed_service_offerings_modality_check
  CHECK (modality IN ('presencial','telemedicina','domiciliar','ocupacional','pericia','retorno'));

INSERT INTO public.chrismed_service_offerings
  (company_id,slug,name,description,modality,price_cents,duration_minutes,
   requires_prepayment,refund_window_hours,reschedule_window_hours,display_order,active)
VALUES
  ('642096b5-a9ff-4521-a82a-c004f6d2e2d2','pericia-medica',
   'Perícia médica · Laudo judicial ou previdenciário',
   'Entrevista técnica presencial e análise documental para emissão de laudo.',
   'pericia',240000,60,true,48,24,5,true)
ON CONFLICT (company_id,slug) DO UPDATE SET
  name=EXCLUDED.name, description=EXCLUDED.description, modality=EXCLUDED.modality,
  price_cents=EXCLUDED.price_cents, duration_minutes=EXCLUDED.duration_minutes,
  requires_prepayment=EXCLUDED.requires_prepayment,
  refund_window_hours=EXCLUDED.refund_window_hours,
  reschedule_window_hours=EXCLUDED.reschedule_window_hours,
  display_order=EXCLUDED.display_order, active=EXCLUDED.active, updated_at=now();
