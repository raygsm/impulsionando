-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- Parent uniqueness for tenant-safe composite FKs
CREATE TABLE IF NOT EXISTS tenancy.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text NOT NULL,
  legal_name text,
  default_locale text NOT NULL DEFAULT 'pt-BR',
  default_timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  default_currency char(3) NOT NULL DEFAULT 'BRL',
  state text NOT NULL DEFAULT 'provisioning'
    CHECK (state IN ('provisioning','active','suspended','closing','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  row_version bigint NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  CONSTRAINT tenancy_tenants_slug_unique UNIQUE (slug),
  CONSTRAINT tenancy_tenants_tenant_id_unique UNIQUE (id)
);

CREATE TABLE IF NOT EXISTS tenancy.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  hostname text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('platform_subdomain','custom','staging')),
  verification_method text,
  verification_value_hash text,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','verified','active','retired')),
  verified_at timestamptz,
  activated_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  row_version bigint NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  CONSTRAINT tenancy_tenant_domains_hostname_unique UNIQUE (hostname),
  CONSTRAINT tenancy_tenant_domains_tenant_row UNIQUE (tenant_id, id),
  CONSTRAINT tenancy_tenant_domains_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES tenancy.tenants(id)
);

CREATE TABLE IF NOT EXISTS tenancy.legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  legal_name text NOT NULL,
  trade_name text,
  tax_identifier text,
  tax_jurisdiction text,
  base_currency char(3) NOT NULL DEFAULT 'BRL',
  address_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','inactive','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  row_version bigint NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  CONSTRAINT tenancy_legal_entities_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS tenancy.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  parent_unit_id uuid,
  legal_entity_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  address_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','inactive','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  row_version bigint NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  CONSTRAINT tenancy_business_units_tenant_row UNIQUE (tenant_id, id),
  CONSTRAINT tenancy_business_units_code_unique UNIQUE (tenant_id, code),
  CONSTRAINT tenancy_business_units_parent_fk
    FOREIGN KEY (tenant_id, parent_unit_id)
    REFERENCES tenancy.business_units (tenant_id, id),
  CONSTRAINT tenancy_business_units_legal_fk
    FOREIGN KEY (tenant_id, legal_entity_id)
    REFERENCES tenancy.legal_entities (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS tenancy.unit_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_unit_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('regular','exception')),
  weekday smallint CHECK (weekday IS NULL OR (weekday BETWEEN 0 AND 6)),
  exception_date date,
  local_open time,
  local_close time,
  timezone text NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenancy_unit_hours_tenant_row UNIQUE (tenant_id, id),
  CONSTRAINT tenancy_unit_hours_unit_fk
    FOREIGN KEY (tenant_id, business_unit_id)
    REFERENCES tenancy.business_units (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS tenancy.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  namespace text NOT NULL,
  key text NOT NULL,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  value_schema_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT tenancy_tenant_settings_unique UNIQUE (tenant_id, namespace, key),
  CONSTRAINT tenancy_tenant_settings_tenant_row UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS tenancy_tenant_domains_tenant_idx ON tenancy.tenant_domains (tenant_id);
CREATE INDEX IF NOT EXISTS tenancy_business_units_tenant_idx ON tenancy.business_units (tenant_id);
