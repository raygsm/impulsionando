-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS contacts.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  kind text NOT NULL CHECK (kind IN ('person','organization')),
  display_name text NOT NULL,
  lifecycle_state text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_state IN ('active','merged','anonymized')),
  dedupe_state text NOT NULL DEFAULT 'clean'
    CHECK (dedupe_state IN ('clean','suspected_duplicate','merged')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  row_version bigint NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  deleted_by uuid,
  delete_reason text,
  CONSTRAINT contacts_parties_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.persons (
  party_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  given_name text,
  family_name text,
  birth_date date,
  CONSTRAINT contacts_persons_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.organizations (
  party_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  legal_name text,
  trade_name text,
  tax_identifier text,
  CONSTRAINT contacts_organizations_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.contact_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('email','phone','whatsapp','other')),
  normalized_value text NOT NULL,
  verification_state text NOT NULL DEFAULT 'unverified'
    CHECK (verification_state IN ('unverified','pending','verified','invalid')),
  is_primary boolean NOT NULL DEFAULT false,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_contact_points_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_contact_points_tenant_row UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_contact_points_norm_uq
  ON contacts.contact_points (tenant_id, type, normalized_value)
  WHERE valid_to IS NULL;

CREATE TABLE IF NOT EXISTS contacts.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid,
  business_unit_id uuid,
  purpose text NOT NULL DEFAULT 'primary',
  line1 text,
  line2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_addresses_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_addresses_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.party_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  from_party_id uuid NOT NULL,
  to_party_id uuid NOT NULL,
  role text NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_party_rel_from_fk
    FOREIGN KEY (tenant_id, from_party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_party_rel_to_fk
    FOREIGN KEY (tenant_id, to_party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_party_relationships_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  owner_user_id uuid,
  lifecycle_state text NOT NULL DEFAULT 'prospect'
    CHECK (lifecycle_state IN ('prospect','active','inactive','closed')),
  activated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT contacts_customer_accounts_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_customer_accounts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.external_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  source_system text NOT NULL,
  external_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_external_identities_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  UNIQUE (tenant_id, source_system, external_id)
);

CREATE TABLE IF NOT EXISTS contacts.merge_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  survivor_party_id uuid NOT NULL,
  duplicate_party_id uuid NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  merged_at timestamptz NOT NULL DEFAULT now(),
  reversed_at timestamptz,
  CONSTRAINT contacts_merge_survivor_fk
    FOREIGN KEY (tenant_id, survivor_party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_merge_duplicate_fk
    FOREIGN KEY (tenant_id, duplicate_party_id)
    REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name),
  CONSTRAINT contacts_tags_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.party_tags (
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, party_id, tag_id),
  CONSTRAINT contacts_party_tags_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_party_tags_tag_fk
    FOREIGN KEY (tenant_id, tag_id)
    REFERENCES contacts.tags (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  key text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('text','number','boolean','date','enum','json')),
  schema_version integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key),
  CONSTRAINT contacts_field_definitions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS contacts.field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  party_id uuid NOT NULL,
  field_definition_id uuid NOT NULL,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contacts_field_values_party_fk
    FOREIGN KEY (tenant_id, party_id)
    REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT contacts_field_values_def_fk
    FOREIGN KEY (tenant_id, field_definition_id)
    REFERENCES contacts.field_definitions (tenant_id, id),
  UNIQUE (tenant_id, party_id, field_definition_id)
);

ALTER TABLE iam.consumer_accounts
  DROP CONSTRAINT IF EXISTS iam_consumer_accounts_party_fk;
ALTER TABLE iam.consumer_accounts
  ADD CONSTRAINT iam_consumer_accounts_party_fk
  FOREIGN KEY (tenant_id, party_id)
  REFERENCES contacts.parties (tenant_id, id);

CREATE INDEX IF NOT EXISTS contacts_parties_tenant_name_idx
  ON contacts.parties (tenant_id, display_name);
