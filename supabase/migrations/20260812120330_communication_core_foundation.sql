-- Canonical communication core foundation.
-- Restores the base objects that already exist in the live Core but were missing
-- from the replayable migration history before CHRISMED communication seeds.

DO $$ BEGIN
  CREATE TYPE public.communication_category AS ENUM (
    'SECURITY','ACCOUNT','BILLING','SCHEDULING','SERVICE','SUPPORT','SURVEY','NEWS','MARKETING','OPERATIONS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.communication_template_status AS ENUM ('DRAFT','PUBLISHED','DEPRECATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.communication_approval_status AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.communication_message_status AS ENUM (
    'PENDING','SCHEDULED','PROCESSING','SENT','DELIVERED','OPENED','CLICKED','BOUNCED',
    'COMPLAINED','FAILED','CANCELLED','SUPPRESSED','EXPIRED','RETRYING','DEAD_LETTER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.communication_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.communication_tenants(id),
  kind text NOT NULL CHECK (kind = ANY (ARRAY['GLOBAL','NICHE','COMPANY','BRAND','UNIT','PROJECT'])),
  slug text NOT NULL UNIQUE,
  legal_name text,
  display_name text NOT NULL,
  locale text NOT NULL DEFAULT 'pt-BR',
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.communication_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.communication_tenants(id),
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  domain text,
  privacy_url text,
  terms_url text,
  support_url text,
  footer_html text,
  legal_text text,
  hide_impulsionando_brand boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.communication_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.communication_tenants(id),
  brand_id uuid REFERENCES public.communication_brands(id),
  name text NOT NULL,
  avatar_url text,
  signature text,
  role text,
  reply_route text,
  default_cta jsonb,
  disclaimer text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.communication_tenants(id),
  brand_id uuid REFERENCES public.communication_brands(id),
  parent_template_id uuid REFERENCES public.communication_templates(id),
  template_key text NOT NULL,
  event_type text NOT NULL,
  channel text NOT NULL DEFAULT 'EMAIL' CHECK (channel = 'EMAIL'),
  category public.communication_category NOT NULL,
  locale text NOT NULL DEFAULT 'pt-BR',
  status public.communication_template_status NOT NULL DEFAULT 'DRAFT',
  current_version integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, template_key, locale)
);

CREATE TABLE IF NOT EXISTS public.communication_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.communication_tenants(id),
  template_id uuid NOT NULL REFERENCES public.communication_templates(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  subject_template text NOT NULL,
  preheader_template text,
  html_template text NOT NULL,
  text_template text NOT NULL,
  variables_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_variables text[] NOT NULL DEFAULT '{}'::text[],
  optional_variables text[] NOT NULL DEFAULT '{}'::text[],
  fallback_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_status public.communication_approval_status NOT NULL DEFAULT 'PENDING',
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  deprecated_at timestamptz,
  UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS public.communication_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.communication_tenants(id),
  automation_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  n8n_workflow_id text,
  status text NOT NULL CHECK (status = ANY (ARRAY['DRAFT','ACTIVE','PAUSED','DISABLED'])),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, automation_key, version)
);

-- CHRISMED is required by the immediately following transactional catalog seed.
INSERT INTO public.communication_tenants(kind,slug,legal_name,display_name,locale,timezone,settings,active)
SELECT 'COMPANY','chrismed','CHRISMED','CHRISMED','pt-BR','America/Sao_Paulo',
       jsonb_build_object('source','migration_replay_foundation','email_domain','chrismed.com.br','owned_domain','chrismed.com.br'),true
WHERE NOT EXISTS (SELECT 1 FROM public.communication_tenants WHERE slug='chrismed');

INSERT INTO public.communication_brands(tenant_id,name,domain,settings)
SELECT t.id,'CHRISMED','chrismed.com.br',jsonb_build_object('email_domain','chrismed.com.br','web_app_origin','https://chrismed.impulsionando.com.br')
FROM public.communication_tenants t
WHERE t.slug='chrismed'
  AND NOT EXISTS (
    SELECT 1 FROM public.communication_brands b
    WHERE b.tenant_id=t.id AND lower(b.name)=lower('CHRISMED') AND b.deleted_at IS NULL
  );
