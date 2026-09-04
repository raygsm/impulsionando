-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- POS / fulfillment / inventory / agenda / finance / accounting / billing / payments / fiscal / commissions / documents

CREATE TABLE IF NOT EXISTS pos.registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  code text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  UNIQUE (tenant_id, code),
  CONSTRAINT pos_registers_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  register_id uuid NOT NULL,
  operator_user_id uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  expected_total_minor bigint,
  actual_total_minor bigint,
  currency char(3) NOT NULL DEFAULT 'BRL',
  CONSTRAINT pos_cash_sessions_reg_fk
    FOREIGN KEY (tenant_id, register_id) REFERENCES pos.registers (tenant_id, id),
  CONSTRAINT pos_cash_sessions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  cash_session_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('in','out','correction')),
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_cash_movements_session_fk
    FOREIGN KEY (tenant_id, cash_session_id) REFERENCES pos.cash_sessions (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  order_id uuid,
  cash_session_id uuid,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_receipts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  line_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_receipt_lines_receipt_fk
    FOREIGN KEY (tenant_id, receipt_id) REFERENCES pos.receipts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.receipt_payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  receipt_id uuid NOT NULL,
  tender text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  CONSTRAINT pos_rpa_receipt_fk
    FOREIGN KEY (tenant_id, receipt_id) REFERENCES pos.receipts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.tabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  table_ref text,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_tabs_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS pos.tab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  tab_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pos_tab_events_tab_fk
    FOREIGN KEY (tenant_id, tab_id) REFERENCES pos.tabs (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fulfillment.fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  order_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_fulfillments_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fulfillment.fulfillment_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  fulfillment_id uuid NOT NULL,
  order_line_id uuid,
  quantity numeric(20,6) NOT NULL,
  CONSTRAINT fulfillment_fl_ff_fk
    FOREIGN KEY (tenant_id, fulfillment_id) REFERENCES fulfillment.fulfillments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fulfillment.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  fulfillment_id uuid NOT NULL,
  assignee_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_assignments_ff_fk
    FOREIGN KEY (tenant_id, fulfillment_id) REFERENCES fulfillment.fulfillments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fulfillment.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  fulfillment_id uuid NOT NULL,
  event_type text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_events_ff_fk
    FOREIGN KEY (tenant_id, fulfillment_id) REFERENCES fulfillment.fulfillments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fulfillment.service_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  fulfillment_id uuid,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fulfillment_service_cases_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  UNIQUE (tenant_id, code),
  CONSTRAINT inventory_warehouses_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  variant_id uuid,
  uom_id uuid,
  name text NOT NULL,
  CONSTRAINT inventory_stock_items_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.reorder_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  minimum_qty numeric(20,6),
  target_qty numeric(20,6),
  lead_time_days integer,
  CONSTRAINT inventory_reorder_wh_fk
    FOREIGN KEY (tenant_id, warehouse_id) REFERENCES inventory.warehouses (tenant_id, id),
  CONSTRAINT inventory_reorder_item_fk
    FOREIGN KEY (tenant_id, stock_item_id) REFERENCES inventory.stock_items (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  lot_code text NOT NULL,
  manufactured_at date,
  expires_at date,
  CONSTRAINT inventory_lots_item_fk
    FOREIGN KEY (tenant_id, stock_item_id) REFERENCES inventory.stock_items (tenant_id, id),
  CONSTRAINT inventory_lots_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  serial_code text NOT NULL,
  state text NOT NULL DEFAULT 'available',
  CONSTRAINT inventory_serials_item_fk
    FOREIGN KEY (tenant_id, stock_item_id) REFERENCES inventory.stock_items (tenant_id, id),
  UNIQUE (tenant_id, serial_code),
  CONSTRAINT inventory_serials_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  movement_type text NOT NULL,
  source_type text,
  source_id uuid,
  idempotency_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key),
  CONSTRAINT inventory_stock_movements_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_movement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  stock_movement_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  lot_id uuid,
  serial_id uuid,
  quantity_signed numeric(20,6) NOT NULL,
  CONSTRAINT inventory_sml_sm_fk
    FOREIGN KEY (tenant_id, stock_movement_id) REFERENCES inventory.stock_movements (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  order_id uuid,
  order_line_id uuid,
  warehouse_id uuid,
  stock_item_id uuid NOT NULL,
  quantity numeric(20,6) NOT NULL,
  state text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_reservations_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS inventory.stock_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  quantity numeric(20,6) NOT NULL DEFAULT 0,
  rebuilt_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, warehouse_id, stock_item_id)
);

CREATE TABLE IF NOT EXISTS inventory.valuation_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  stock_item_id uuid NOT NULL,
  quantity numeric(20,6) NOT NULL,
  unit_cost_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  duration_minutes integer NOT NULL,
  buffer_minutes integer NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT agenda_services_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  kind text NOT NULL,
  name text NOT NULL,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT agenda_resources_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.resource_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  CONSTRAINT agenda_resource_groups_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.service_resource_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  service_id uuid NOT NULL,
  resource_kind text NOT NULL,
  required_count integer NOT NULL DEFAULT 1,
  CONSTRAINT agenda_srr_service_fk
    FOREIGN KEY (tenant_id, service_id) REFERENCES agenda.services (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  timezone text NOT NULL,
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT agenda_ar_resource_fk
    FOREIGN KEY (tenant_id, resource_id) REFERENCES agenda.resources (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  kind text NOT NULL CHECK (kind IN ('block','extra')),
  CONSTRAINT agenda_ae_resource_fk
    FOREIGN KEY (tenant_id, resource_id) REFERENCES agenda.resources (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  service_id uuid,
  location_ref text,
  starts_at_utc timestamptz NOT NULL,
  ends_at_utc timestamptz NOT NULL,
  booking_timezone text NOT NULL,
  local_date date NOT NULL,
  state text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT agenda_appointments_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.appointment_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  party_id uuid,
  user_id uuid,
  role text NOT NULL,
  CONSTRAINT agenda_ap_appt_fk
    FOREIGN KEY (tenant_id, appointment_id) REFERENCES agenda.appointments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.appointment_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  CONSTRAINT agenda_ar2_appt_fk
    FOREIGN KEY (tenant_id, appointment_id) REFERENCES agenda.appointments (tenant_id, id),
  CONSTRAINT agenda_ar2_resource_fk
    FOREIGN KEY (tenant_id, resource_id) REFERENCES agenda.resources (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.appointment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  from_state text,
  to_state text NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agenda_ash_appt_fk
    FOREIGN KEY (tenant_id, appointment_id) REFERENCES agenda.appointments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS agenda.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  service_id uuid,
  window_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda.reminder_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  communication_intent_ref uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agenda_ri_appt_fk
    FOREIGN KEY (tenant_id, appointment_id) REFERENCES agenda.appointments (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  kind text NOT NULL CHECK (kind IN ('cash','bank','clearing','card')),
  name text NOT NULL,
  currency char(3) NOT NULL,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT finance_financial_accounts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  due_at timestamptz,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_receivables_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  due_at timestamptz,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_payables_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.obligation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  obligation_type text NOT NULL CHECK (obligation_type IN ('receivable','payable')),
  obligation_id uuid NOT NULL,
  event_type text NOT NULL,
  amount_minor bigint,
  currency char(3),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_ref uuid,
  obligation_type text NOT NULL,
  obligation_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  checksum text NOT NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, checksum),
  CONSTRAINT finance_bsi_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.bank_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  import_id uuid NOT NULL,
  line_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz,
  CONSTRAINT finance_bsl_import_fk
    FOREIGN KEY (tenant_id, import_id) REFERENCES finance.bank_statement_imports (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  version integer NOT NULL DEFAULT 1,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_rr_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS finance.reconciliation_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  run_id uuid NOT NULL,
  statement_line_id uuid,
  payment_ref uuid,
  journal_ref uuid,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT finance_rm_run_fk
    FOREIGN KEY (tenant_id, run_id) REFERENCES finance.reconciliation_runs (tenant_id, id)
);

-- Accounting requires P-DB-08 acceptance before write authority
CREATE TABLE IF NOT EXISTS accounting.chart_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, code, version),
  CONSTRAINT accounting_chart_accounts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS accounting.posting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  period_key text NOT NULL,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','closed')),
  UNIQUE (tenant_id, period_key),
  CONSTRAINT accounting_posting_periods_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS accounting.journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  source_type text NOT NULL,
  journal_type text NOT NULL,
  CONSTRAINT accounting_journals_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS accounting.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  journal_id uuid NOT NULL,
  posting_period_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'posted' CHECK (state IN ('posted','reversed')),
  posted_at timestamptz NOT NULL DEFAULT now(),
  reversal_of uuid,
  CONSTRAINT accounting_je_journal_fk
    FOREIGN KEY (tenant_id, journal_id) REFERENCES accounting.journals (tenant_id, id),
  CONSTRAINT accounting_je_period_fk
    FOREIGN KEY (tenant_id, posting_period_id) REFERENCES accounting.posting_periods (tenant_id, id),
  CONSTRAINT accounting_je_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS accounting.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  journal_entry_id uuid NOT NULL,
  account_id uuid NOT NULL,
  debit_minor bigint NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
  credit_minor bigint NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
  currency char(3) NOT NULL,
  cost_center_id uuid,
  CONSTRAINT accounting_jl_entry_fk
    FOREIGN KEY (tenant_id, journal_entry_id) REFERENCES accounting.journal_entries (tenant_id, id),
  CONSTRAINT accounting_jl_account_fk
    FOREIGN KEY (tenant_id, account_id) REFERENCES accounting.chart_accounts (tenant_id, id),
  CHECK (NOT (debit_minor > 0 AND credit_minor > 0))
);

CREATE TABLE IF NOT EXISTS accounting.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid,
  UNIQUE (tenant_id, code),
  CONSTRAINT accounting_cost_centers_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS accounting.allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  version integer NOT NULL DEFAULT 1,
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS accounting.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency char(3) NOT NULL,
  quote_currency char(3) NOT NULL,
  rate numeric(20,10) NOT NULL,
  rate_date date NOT NULL,
  source text NOT NULL,
  UNIQUE (base_currency, quote_currency, rate_date, source)
);

CREATE TABLE IF NOT EXISTS accounting.cost_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_line_ref uuid NOT NULL,
  method_version text NOT NULL,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounting.margin_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sale_line_ref uuid NOT NULL,
  method_version text NOT NULL,
  contribution_margin_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounting.margin_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  margin_calculation_id uuid NOT NULL REFERENCES accounting.margin_calculations(id),
  component_key text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS billing.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  owner_scope text NOT NULL,
  product_scope text NOT NULL,
  party_id uuid,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_contracts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS billing.contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  version integer NOT NULL,
  terms_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  CONSTRAINT billing_cv_contract_fk
    FOREIGN KEY (tenant_id, contract_id) REFERENCES billing.contracts (tenant_id, id),
  UNIQUE (contract_id, version)
);

CREATE TABLE IF NOT EXISTS billing.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  timezone text NOT NULL,
  recurrence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_billing_at timestamptz,
  CONSTRAINT billing_schedules_contract_fk
    FOREIGN KEY (tenant_id, contract_id) REFERENCES billing.contracts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS billing.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  contract_id uuid,
  owner_scope text NOT NULL,
  product_scope text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  state text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_invoices_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS billing.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  description_snapshot text NOT NULL,
  quantity numeric(20,6) NOT NULL DEFAULT 1,
  unit_price_minor bigint NOT NULL,
  tax_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency char(3) NOT NULL,
  CONSTRAINT billing_il_invoice_fk
    FOREIGN KEY (tenant_id, invoice_id) REFERENCES billing.invoices (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS billing.dunning_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  version integer NOT NULL DEFAULT 1,
  rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS billing.dunning_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_dc_invoice_fk
    FOREIGN KEY (tenant_id, invoice_id) REFERENCES billing.invoices (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS billing.service_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  event_type text NOT NULL CHECK (event_type IN ('suspended','reactivated')),
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  payer_party_id uuid,
  reference_type text,
  reference_id uuid,
  method_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_payment_intents_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS payments.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_intent_id uuid NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_pa_intent_fk
    FOREIGN KEY (tenant_id, payment_intent_id) REFERENCES payments.payment_intents (tenant_id, id),
  UNIQUE (tenant_id, provider, idempotency_key)
);

CREATE TABLE IF NOT EXISTS payments.provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  payload_hash text NOT NULL,
  normalized_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_retention_ref text,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS payments.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_intent_id uuid,
  gross_minor bigint NOT NULL,
  fee_minor bigint NOT NULL DEFAULT 0,
  net_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  settled_on date NOT NULL
);

CREATE TABLE IF NOT EXISTS payments.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_intent_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  reason text,
  provider_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payment_intent_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments.external_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  domain_type text NOT NULL,
  domain_id uuid NOT NULL,
  provider text NOT NULL,
  external_id text NOT NULL,
  UNIQUE (tenant_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS fiscal.tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  jurisdiction text NOT NULL,
  profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fiscal_tax_profiles_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fiscal.tax_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  tax_profile_id uuid NOT NULL,
  version integer NOT NULL,
  rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT fiscal_trv_profile_fk
    FOREIGN KEY (tenant_id, tax_profile_id) REFERENCES fiscal.tax_profiles (tenant_id, id),
  UNIQUE (tax_profile_id, version)
);

CREATE TABLE IF NOT EXISTS fiscal.tax_calculation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fiscal.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  request_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_document_requests_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fiscal.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  request_id uuid NOT NULL,
  document_number text,
  document_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz,
  CONSTRAINT fiscal_documents_req_fk
    FOREIGN KEY (tenant_id, request_id) REFERENCES fiscal.document_requests (tenant_id, id),
  CONSTRAINT fiscal_documents_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fiscal.document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  event_type text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_de_doc_fk
    FOREIGN KEY (tenant_id, document_id) REFERENCES fiscal.documents (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS fiscal.number_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  sequence_key text NOT NULL,
  next_value bigint NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, sequence_key)
);

CREATE TABLE IF NOT EXISTS commissions.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT commissions_programs_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS commissions.rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  program_id uuid NOT NULL,
  trigger_key text NOT NULL,
  basis text NOT NULL,
  rate_bps integer,
  eligibility_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT commissions_rules_program_fk
    FOREIGN KEY (tenant_id, program_id) REFERENCES commissions.programs (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS commissions.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  user_id uuid,
  kind text NOT NULL,
  CONSTRAINT commissions_participants_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS commissions.accruals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  participant_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commissions_accruals_participant_fk
    FOREIGN KEY (tenant_id, participant_id) REFERENCES commissions.participants (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS commissions.adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  accrual_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  participant_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  state text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commissions_payouts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS commissions.payout_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payout_id uuid NOT NULL,
  accrual_id uuid NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  CONSTRAINT commissions_pa_payout_fk
    FOREIGN KEY (tenant_id, payout_id) REFERENCES commissions.payouts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS documents.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  storage_ref text NOT NULL,
  checksum text,
  classification text,
  retention_policy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_files_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS documents.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  file_id uuid NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  CONSTRAINT documents_links_file_fk
    FOREIGN KEY (tenant_id, file_id) REFERENCES documents.files (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS documents.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  state text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_contracts_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS documents.contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  version integer NOT NULL,
  terms_ref uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_cv_contract_fk
    FOREIGN KEY (tenant_id, contract_id) REFERENCES documents.contracts (tenant_id, id),
  UNIQUE (contract_id, version)
);

CREATE TABLE IF NOT EXISTS documents.obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'due' CHECK (state IN ('due','fulfilled','waived')),
  due_at timestamptz,
  CONSTRAINT documents_obligations_contract_fk
    FOREIGN KEY (tenant_id, contract_id) REFERENCES documents.contracts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS documents.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  contract_version_id uuid,
  provider text,
  state text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents.signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  signature_request_id uuid NOT NULL,
  event_type text NOT NULL,
  evidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
