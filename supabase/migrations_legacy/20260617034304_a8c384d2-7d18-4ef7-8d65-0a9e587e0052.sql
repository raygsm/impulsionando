
-- =========================
-- 1) CONTRACT DOCUMENTS
-- =========================
CREATE TABLE IF NOT EXISTS public.contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  white_label_id uuid NULL,
  billing_contract_id uuid NULL REFERENCES public.billing_contracts(id) ON DELETE SET NULL,
  contract_number text NOT NULL,
  version int NOT NULL DEFAULT 1,
  storage_path text NOT NULL,        -- path inside the "contracts" bucket
  file_hash text NOT NULL,           -- sha256 of bytes for tamper-evidence
  file_size_bytes int NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,  -- plan, modules, prices, customer
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','signed','cancelled','archived')),
  generated_by uuid NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_documents_company ON public.contract_documents(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_documents_wl     ON public.contract_documents(white_label_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_status ON public.contract_documents(status);

GRANT SELECT, INSERT, UPDATE ON public.contract_documents TO authenticated;
GRANT ALL ON public.contract_documents TO service_role;

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_documents_admin_all"
  ON public.contract_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contract_documents_company_read"
  ON public.contract_documents FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT up.company_id FROM public.user_profiles up WHERE up.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_contract_documents_updated_at
  BEFORE UPDATE ON public.contract_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 2) CONTRACT SIGNATURES
-- =========================
CREATE TABLE IF NOT EXISTS public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_document_id uuid NOT NULL REFERENCES public.contract_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  white_label_id uuid NULL,
  signer_user_id uuid NULL,                 -- auth.users.id (nullable for off-platform signer)
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_doc text NULL,                     -- CPF/CNPJ
  signer_role text NULL,                    -- "Representante legal", "Administrador", etc.
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet NULL,
  user_agent text NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb, -- geolocation, otp/email proof, signature image hash...
  signature_hash text NOT NULL,             -- sha256(contract_hash || signer_email || signed_at)
  status text NOT NULL DEFAULT 'valid'
    CHECK (status IN ('valid','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_signatures_doc     ON public.contract_signatures(contract_document_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_company ON public.contract_signatures(company_id);

GRANT SELECT, INSERT ON public.contract_signatures TO authenticated;
GRANT ALL ON public.contract_signatures TO service_role;

ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_signatures_admin_all"
  ON public.contract_signatures FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "contract_signatures_company_read"
  ON public.contract_signatures FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT up.company_id FROM public.user_profiles up WHERE up.user_id = auth.uid())
  );

CREATE POLICY "contract_signatures_self_insert"
  ON public.contract_signatures FOR INSERT TO authenticated
  WITH CHECK (
    signer_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================
-- 3) WEBHOOK / AUTOMATION RUNS
-- =========================
CREATE TABLE IF NOT EXISTS public.webhook_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  white_label_id uuid NULL,
  workflow text NOT NULL,            -- "n8n.lead.new", "stripe.webhook", etc.
  event text NOT NULL,               -- "lead.created", "payment.succeeded"
  target_url text NULL,
  http_method text NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status int NULL,
  response_body text NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','success','error','retry')),
  attempts int NOT NULL DEFAULT 0,
  last_error text NULL,
  started_at timestamptz NULL,
  finished_at timestamptz NULL,
  next_retry_at timestamptz NULL,
  triggered_by uuid NULL,
  idempotency_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_runs_workflow ON public.webhook_runs(workflow, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_runs_status   ON public.webhook_runs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_runs_company  ON public.webhook_runs(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_runs_idemp
  ON public.webhook_runs(workflow, idempotency_key) WHERE idempotency_key IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.webhook_runs TO authenticated;
GRANT ALL ON public.webhook_runs TO service_role;

ALTER TABLE public.webhook_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_runs_admin_all"
  ON public.webhook_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "webhook_runs_company_read"
  ON public.webhook_runs FOR SELECT TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id IN (SELECT up.company_id FROM public.user_profiles up WHERE up.user_id = auth.uid())
  );

CREATE TRIGGER trg_webhook_runs_updated_at
  BEFORE UPDATE ON public.webhook_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 4) STORAGE POLICIES for bucket "contracts"
-- =========================
-- Admins: full access
CREATE POLICY "contracts_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));

-- Tenant read: company users may read files belonging to a contract of their company.
-- Path convention enforced by app: <company_id>/<contract_document_id>.pdf
CREATE POLICY "contracts_company_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (split_part(name, '/', 1))::uuid IN (
      SELECT up.company_id FROM public.user_profiles up WHERE up.user_id = auth.uid()
    )
  );
