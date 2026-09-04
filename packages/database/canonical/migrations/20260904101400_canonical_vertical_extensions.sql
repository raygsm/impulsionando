-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- Vertical extension tables — deferred from first CRM slice; expand DDL only.
-- Core never depends on these schemas.

CREATE TABLE IF NOT EXISTS vertical_health.patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid NOT NULL,
  profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vh_patient_party_fk FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT vh_patient_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.practitioners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid NOT NULL,
  license_ref text,
  CONSTRAINT vh_pract_party_fk FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT vh_pract_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.practitioner_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  practitioner_id uuid NOT NULL,
  specialty text NOT NULL,
  CONSTRAINT vh_ps_pract_fk FOREIGN KEY (tenant_id, practitioner_id) REFERENCES vertical_health.practitioners (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.care_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  patient_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vh_ce_patient_fk FOREIGN KEY (tenant_id, patient_id) REFERENCES vertical_health.patient_profiles (tenant_id, id),
  CONSTRAINT vh_ce_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  care_episode_id uuid NOT NULL,
  appointment_id uuid,
  occurred_at timestamptz,
  CONSTRAINT vh_enc_ce_fk FOREIGN KEY (tenant_id, care_episode_id) REFERENCES vertical_health.care_episodes (tenant_id, id),
  CONSTRAINT vh_enc_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.occupational_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  CONSTRAINT vh_op_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.examinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  program_id uuid,
  result_ref text,
  CONSTRAINT vh_exam_patient_fk FOREIGN KEY (tenant_id, patient_id) REFERENCES vertical_health.patient_profiles (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  to_practitioner_id uuid,
  state text NOT NULL DEFAULT 'open',
  CONSTRAINT vh_ref_patient_fk FOREIGN KEY (tenant_id, patient_id) REFERENCES vertical_health.patient_profiles (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_health.clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  file_id uuid,
  classification text NOT NULL DEFAULT 'clinical',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vertical_automotive.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  vin text,
  plate text,
  attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT va_vehicles_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_automotive.test_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  party_id uuid,
  scheduled_at timestamptz,
  CONSTRAINT va_td_vehicle_fk FOREIGN KEY (tenant_id, vehicle_id) REFERENCES vertical_automotive.vehicles (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_automotive.workshop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  vehicle_id uuid NOT NULL,
  order_id uuid,
  state text NOT NULL DEFAULT 'open',
  CONSTRAINT va_wo_vehicle_fk FOREIGN KEY (tenant_id, vehicle_id) REFERENCES vertical_automotive.vehicles (tenant_id, id),
  CONSTRAINT va_wo_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_representation.territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  UNIQUE (tenant_id, code),
  CONSTRAINT vr_terr_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_representation.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  territory_id uuid NOT NULL,
  name text NOT NULL,
  CONSTRAINT vr_routes_terr_fk FOREIGN KEY (tenant_id, territory_id) REFERENCES vertical_representation.territories (tenant_id, id),
  CONSTRAINT vr_routes_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_representation.visit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  route_id uuid NOT NULL,
  party_id uuid,
  planned_at date,
  CONSTRAINT vr_vp_route_fk FOREIGN KEY (tenant_id, route_id) REFERENCES vertical_representation.routes (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_brewery.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  recipe_ref text,
  state text NOT NULL DEFAULT 'planned',
  UNIQUE (tenant_id, code),
  CONSTRAINT vb_batches_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_brewery.tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  capacity_liters numeric(20,6),
  UNIQUE (tenant_id, code),
  CONSTRAINT vb_tanks_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_restaurant.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  code text NOT NULL,
  seats integer,
  UNIQUE (tenant_id, code),
  CONSTRAINT vrest_tables_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_restaurant.kitchen_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  order_id uuid,
  state text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vrest_kt_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_events.event_productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  CONSTRAINT ve_ep_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_tourism.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT vt_packages_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_retail.store_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  layout_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT vret_sl_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_education.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT ved_courses_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_education.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  course_id uuid NOT NULL,
  party_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'enrolled',
  CONSTRAINT ved_enroll_course_fk FOREIGN KEY (tenant_id, course_id) REFERENCES vertical_education.courses (tenant_id, id),
  CONSTRAINT ved_enroll_party_fk FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS vertical_services.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vs_wo_tenant_row UNIQUE (tenant_id, id)
);
