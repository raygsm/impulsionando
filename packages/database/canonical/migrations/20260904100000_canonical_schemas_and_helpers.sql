-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE SCHEMA IF NOT EXISTS canonical_migration;
CREATE SCHEMA IF NOT EXISTS tenancy;
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS entitlements;
CREATE SCHEMA IF NOT EXISTS contacts;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS growth;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS tasks;
CREATE SCHEMA IF NOT EXISTS eventing;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS purchasing;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS pos;
CREATE SCHEMA IF NOT EXISTS fulfillment;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS agenda;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS fiscal;
CREATE SCHEMA IF NOT EXISTS commissions;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS communications;
CREATE SCHEMA IF NOT EXISTS cases;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS automation;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS vertical_health;
CREATE SCHEMA IF NOT EXISTS vertical_automotive;
CREATE SCHEMA IF NOT EXISTS vertical_representation;
CREATE SCHEMA IF NOT EXISTS vertical_brewery;
CREATE SCHEMA IF NOT EXISTS vertical_restaurant;
CREATE SCHEMA IF NOT EXISTS vertical_events;
CREATE SCHEMA IF NOT EXISTS vertical_tourism;
CREATE SCHEMA IF NOT EXISTS vertical_retail;
CREATE SCHEMA IF NOT EXISTS vertical_education;
CREATE SCHEMA IF NOT EXISTS vertical_services;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY[
    'canonical_migration','tenancy','iam','entitlements','contacts','compliance',
    'growth','crm','tasks','eventing','catalog','purchasing','sales','pos',
    'fulfillment','inventory','agenda','finance','accounting','billing','payments',
    'fiscal','commissions','documents','communications','cases','integrations',
    'automation','ai','analytics','vertical_health','vertical_automotive',
    'vertical_representation','vertical_brewery','vertical_restaurant',
    'vertical_events','vertical_tourism','vertical_retail','vertical_education',
    'vertical_services'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', s);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role', s);
  END LOOP;
END $$;

COMMENT ON SCHEMA tenancy IS 'Canonical tenant workspace — Nest/service_role only; not PostgREST-exposed by default';
COMMENT ON SCHEMA iam IS 'Canonical identity/access — capability RBAC pending T-DB-04';
COMMENT ON SCHEMA eventing IS 'Canonical eventing; Phase 5 reengineering_* tables remain adapters until T-DB-05';

CREATE OR REPLACE FUNCTION canonical_migration.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION canonical_migration.touch_row_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.row_version := COALESCE(OLD.row_version, 0) + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
