ALTER TABLE public.billing_contracts DROP CONSTRAINT IF EXISTS billing_contracts_status_check;
ALTER TABLE public.billing_contracts
  ADD CONSTRAINT billing_contracts_status_check
  CHECK (status = ANY (ARRAY['active','suspended','cancelled','courtesy']));