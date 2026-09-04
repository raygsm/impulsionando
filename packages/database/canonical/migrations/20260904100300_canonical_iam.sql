-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.
-- T-DB-04 RBAC ADR still open; shapes follow CANONICAL-DATA-MODEL recommendations.

CREATE TABLE IF NOT EXISTS iam.user_profiles (
  user_id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  preferred_locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  user_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'invited'
    CHECK (state IN ('invited','active','suspended','ended')),
  invited_at timestamptz,
  activated_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT iam_memberships_tenant_row UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS iam_memberships_active_unique
  ON iam.memberships (tenant_id, user_id)
  WHERE state IN ('invited','active','suspended');

CREATE TABLE IF NOT EXISTS iam.capabilities (
  key text PRIMARY KEY,
  description text NOT NULL,
  risk text NOT NULL DEFAULT 'normal'
    CHECK (risk IN ('low','normal','high','critical')),
  lifecycle text NOT NULL DEFAULT 'active'
    CHECK (lifecycle IN ('draft','active','deprecated','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS iam.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  scope text NOT NULL DEFAULT 'tenant'
    CHECK (scope IN ('global_template','tenant','platform')),
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','deprecated','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS iam_roles_tenant_code_uq
  ON iam.roles (tenant_id, code) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS iam_roles_global_code_uq
  ON iam.roles (code) WHERE tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS iam.role_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES iam.roles(id),
  capability_key text NOT NULL REFERENCES iam.capabilities(key),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, capability_key)
);

CREATE TABLE IF NOT EXISTS iam.membership_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES iam.roles(id),
  granted_by uuid,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iam_membership_roles_membership_fk
    FOREIGN KEY (tenant_id, membership_id)
    REFERENCES iam.memberships (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS iam.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  email_normalized text NOT NULL,
  intended_role_id uuid REFERENCES iam.roles(id),
  token_hash text NOT NULL,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','accepted','expired','revoked')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT iam_invitations_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS iam.platform_principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  principal_kind text NOT NULL DEFAULT 'staff'
    CHECK (principal_kind IN ('staff','service','automation')),
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','suspended','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- party_id FK added after contacts.parties exists (see contacts migration)
CREATE TABLE IF NOT EXISTS iam.consumer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  user_id uuid NOT NULL,
  party_id uuid,
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','suspended','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT iam_consumer_accounts_tenant_row UNIQUE (tenant_id, id),
  CONSTRAINT iam_consumer_accounts_user_unique UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS iam.delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  platform_principal_id uuid NOT NULL REFERENCES iam.platform_principals(id),
  reason text NOT NULL,
  capability_scope text[] NOT NULL DEFAULT '{}',
  state text NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','expired','revoked')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT iam_delegations_tenant_row UNIQUE (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS iam_memberships_user_idx ON iam.memberships (user_id);
CREATE INDEX IF NOT EXISTS iam_delegations_tenant_idx ON iam.delegations (tenant_id);
