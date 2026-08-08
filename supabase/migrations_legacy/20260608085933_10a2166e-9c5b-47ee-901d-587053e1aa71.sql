
-- =====================================================================
-- PARTE 1: Status Técnico × Status Comercial — Modules & Plans (retry)
-- =====================================================================

-- ---------- MODULES ----------
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS status_tecnico text NOT NULL DEFAULT 'em_desenvolvimento',
  ADD COLUMN IF NOT EXISTS status_comercial text NOT NULL DEFAULT 'oculto',
  ADD COLUMN IF NOT EXISTS monthly_price numeric(14,2) NOT NULL DEFAULT 197.99,
  ADD COLUMN IF NOT EXISTS setup_fee numeric(14,2) NOT NULL DEFAULT 197.99,
  ADD COLUMN IF NOT EXISTS min_contract_days integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS min_installments integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS show_on_site boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_demo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_checkout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_plans boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_price boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_standalone boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_combo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_white_label boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_trial boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cta_primary text,
  ADD COLUMN IF NOT EXISTS cta_secondary text,
  ADD COLUMN IF NOT EXISTS commercial_url text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS description_long text,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS limits jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_status_tecnico_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_status_tecnico_check CHECK (
  status_tecnico IN (
    'rascunho','em_desenvolvimento','em_revisao','em_homologacao',
    'pronto_para_demo','pronto_para_venda','ativo','pausado','arquivado','obsoleto'
  )
);

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_status_comercial_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_status_comercial_check CHECK (
  status_comercial IN (
    'disponivel_contratacao','disponivel_demo','sob_consulta','em_breve',
    'indisponivel_temporariamente','exclusivo_interno','exclusivo_white_label','oculto'
  )
);

UPDATE public.modules SET
  status_tecnico = CASE readiness_status
    WHEN 'em_desenvolvimento' THEN 'em_desenvolvimento'
    WHEN 'em_revisao'         THEN 'em_revisao'
    WHEN 'em_testes'          THEN 'em_homologacao'
    WHEN 'certificado'        THEN 'pronto_para_venda'
    WHEN 'publicado'          THEN 'ativo'
    ELSE 'em_desenvolvimento'
  END,
  status_comercial = CASE
    WHEN readiness_status IN ('certificado','publicado') THEN 'disponivel_contratacao'
    ELSE 'oculto'
  END,
  show_on_site     = (readiness_status IN ('certificado','publicado')),
  show_in_checkout = (readiness_status IN ('certificado','publicado')),
  show_in_plans    = (readiness_status IN ('certificado','publicado'))
WHERE status_tecnico = 'em_desenvolvimento' AND status_comercial = 'oculto';

CREATE INDEX IF NOT EXISTS idx_modules_status_tecnico   ON public.modules(status_tecnico);
CREATE INDEX IF NOT EXISTS idx_modules_status_comercial ON public.modules(status_comercial);

-- ---------- BILLING_PLANS ----------
ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS status_comercial text NOT NULL DEFAULT 'disponivel_contratacao',
  ADD COLUMN IF NOT EXISTS show_on_site boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_checkout boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_direct_checkout boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS route_to_quote boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS route_to_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS legal_text text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS min_contract_days integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS min_installments integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS included_modules text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS included_module_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_module_price numeric(14,2) NOT NULL DEFAULT 197.99,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(6,2) NOT NULL DEFAULT 0;

ALTER TABLE public.billing_plans DROP CONSTRAINT IF EXISTS billing_plans_status_comercial_check;
ALTER TABLE public.billing_plans ADD CONSTRAINT billing_plans_status_comercial_check CHECK (
  status_comercial IN (
    'disponivel_contratacao','sob_consulta','em_breve','oculto',
    'exclusivo_interno','exclusivo_white_label'
  )
);

-- ---------- PERMISSIONS (Gestão Master) ----------
INSERT INTO public.permissions(code, module, description) VALUES
  ('master.modules.view',    'master', 'Ver Gestão Master de Módulos'),
  ('master.modules.edit',    'master', 'Editar módulo na Gestão Master'),
  ('master.modules.status',  'master', 'Alterar status técnico/comercial do módulo'),
  ('master.modules.price',   'master', 'Alterar preço/setup/contrato de módulo'),
  ('master.modules.publish', 'master', 'Publicar/ocultar módulo'),
  ('master.plans.view',      'master', 'Ver Gestão Master de Planos'),
  ('master.plans.edit',      'master', 'Editar plano comercial'),
  ('master.plans.publish',   'master', 'Publicar/ocultar plano')
ON CONFLICT (code) DO NOTHING;
