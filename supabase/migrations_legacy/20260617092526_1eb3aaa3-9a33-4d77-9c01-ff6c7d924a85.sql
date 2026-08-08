
ALTER TABLE public.contract_documents
  ADD COLUMN IF NOT EXISTS parent_document_id uuid NULL REFERENCES public.contract_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_id uuid NULL REFERENCES public.contract_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_storage_path text NULL,
  ADD COLUMN IF NOT EXISTS signed_file_hash text NULL,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_contract_documents_parent ON public.contract_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_version ON public.contract_documents(company_id, contract_number, version);

-- Allow ALTER status='superseded' in CHECK
ALTER TABLE public.contract_documents DROP CONSTRAINT IF EXISTS contract_documents_status_check;
ALTER TABLE public.contract_documents
  ADD CONSTRAINT contract_documents_status_check
  CHECK (status IN ('draft','sent','signed','cancelled','archived','superseded'));
