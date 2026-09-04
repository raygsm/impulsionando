-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

-- ERP expand DDL. P-DB-07 recognition points must be accepted before write authority.

CREATE TABLE IF NOT EXISTS catalog.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('product','service','bundle')),
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, code),
  CONSTRAINT catalog_items_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.item_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL,
  version integer NOT NULL,
  name text NOT NULL,
  description text,
  operational_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  CONSTRAINT catalog_item_versions_item_fk
    FOREIGN KEY (tenant_id, item_id) REFERENCES catalog.items (tenant_id, id),
  UNIQUE (item_id, version),
  CONSTRAINT catalog_item_versions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL,
  sku text NOT NULL,
  attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT catalog_item_variants_item_fk
    FOREIGN KEY (tenant_id, item_id) REFERENCES catalog.items (tenant_id, id),
  UNIQUE (tenant_id, sku),
  CONSTRAINT catalog_item_variants_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.units_of_measure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  precision integer NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, code),
  CONSTRAINT catalog_uom_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.item_uom_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  from_uom_id uuid NOT NULL,
  to_uom_id uuid NOT NULL,
  factor numeric(20,10) NOT NULL CHECK (factor > 0),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT catalog_uom_conv_from_fk
    FOREIGN KEY (tenant_id, from_uom_id) REFERENCES catalog.units_of_measure (tenant_id, id),
  CONSTRAINT catalog_uom_conv_to_fk
    FOREIGN KEY (tenant_id, to_uom_id) REFERENCES catalog.units_of_measure (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  name text NOT NULL,
  currency char(3) NOT NULL,
  audience text,
  valid_from timestamptz,
  valid_to timestamptz,
  state text NOT NULL DEFAULT 'active',
  CONSTRAINT catalog_price_lists_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  price_list_id uuid NOT NULL,
  item_id uuid,
  variant_id uuid,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  tax_included boolean NOT NULL DEFAULT false,
  valid_from timestamptz,
  valid_to timestamptz,
  CONSTRAINT catalog_prices_list_fk
    FOREIGN KEY (tenant_id, price_list_id) REFERENCES catalog.price_lists (tenant_id, id),
  CONSTRAINT catalog_prices_item_fk
    FOREIGN KEY (tenant_id, item_id) REFERENCES catalog.items (tenant_id, id),
  CONSTRAINT catalog_prices_variant_fk
    FOREIGN KEY (tenant_id, variant_id) REFERENCES catalog.item_variants (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS catalog.tax_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  code text NOT NULL,
  name text NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS catalog.item_external_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL,
  provider text NOT NULL,
  external_id text NOT NULL,
  CONSTRAINT catalog_item_ext_item_fk
    FOREIGN KEY (tenant_id, item_id) REFERENCES catalog.items (tenant_id, id),
  UNIQUE (tenant_id, provider, external_id)
);

CREATE TABLE IF NOT EXISTS purchasing.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchasing_suppliers_party_fk
    FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT purchasing_suppliers_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','submitted','approved','rejected','ordered','cancelled')),
  requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT purchasing_requisitions_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.requisition_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  requisition_id uuid NOT NULL,
  item_id uuid,
  uom_id uuid,
  quantity numeric(20,6) NOT NULL CHECK (quantity > 0),
  needed_at timestamptz,
  CONSTRAINT purchasing_req_lines_req_fk
    FOREIGN KEY (tenant_id, requisition_id) REFERENCES purchasing.requisitions (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  supplier_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','issued','partially_received','received','closed','cancelled')),
  currency char(3) NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT purchasing_po_supplier_fk
    FOREIGN KEY (tenant_id, supplier_id) REFERENCES purchasing.suppliers (tenant_id, id),
  CONSTRAINT purchasing_po_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  purchase_order_id uuid NOT NULL,
  item_id uuid,
  description_snapshot text NOT NULL,
  quantity numeric(20,6) NOT NULL,
  unit_price_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  tax_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT purchasing_pol_po_fk
    FOREIGN KEY (tenant_id, purchase_order_id) REFERENCES purchasing.purchase_orders (tenant_id, id),
  CONSTRAINT purchasing_pol_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  purchase_order_id uuid,
  received_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchasing_gr_po_fk
    FOREIGN KEY (tenant_id, purchase_order_id) REFERENCES purchasing.purchase_orders (tenant_id, id),
  CONSTRAINT purchasing_gr_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.goods_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  goods_receipt_id uuid NOT NULL,
  purchase_order_line_id uuid,
  quantity_received numeric(20,6) NOT NULL,
  quantity_accepted numeric(20,6),
  quantity_rejected numeric(20,6),
  lot_ref text,
  serial_ref text,
  CONSTRAINT purchasing_grl_gr_fk
    FOREIGN KEY (tenant_id, goods_receipt_id) REFERENCES purchasing.goods_receipts (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  supplier_id uuid NOT NULL,
  external_ref text,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  payable_ref uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchasing_si_supplier_fk
    FOREIGN KEY (tenant_id, supplier_id) REFERENCES purchasing.suppliers (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS purchasing.supplier_price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  item_id uuid,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchasing_spq_supplier_fk
    FOREIGN KEY (tenant_id, supplier_id) REFERENCES purchasing.suppliers (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  party_id uuid,
  customer_account_id uuid,
  opportunity_id uuid,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','presented','accepted','converted','rejected','expired','cancelled')),
  currency char(3) NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT sales_quotes_party_fk
    FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT sales_quotes_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  item_id uuid,
  name_snapshot text NOT NULL,
  sku_snapshot text,
  uom_snapshot text,
  quantity numeric(20,6) NOT NULL,
  unit_price_minor bigint NOT NULL,
  discount_minor bigint NOT NULL DEFAULT 0,
  tax_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency char(3) NOT NULL,
  CONSTRAINT sales_quote_lines_quote_fk
    FOREIGN KEY (tenant_id, quote_id) REFERENCES sales.quotes (tenant_id, id),
  CONSTRAINT sales_quote_lines_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.quote_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  from_state text,
  to_state text NOT NULL,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_qsh_quote_fk
    FOREIGN KEY (tenant_id, quote_id) REFERENCES sales.quotes (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  party_id uuid,
  customer_account_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  campaign_id uuid,
  quote_id uuid,
  channel text NOT NULL DEFAULT 'dashboard',
  currency char(3) NOT NULL DEFAULT 'BRL',
  totals_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_state text NOT NULL DEFAULT 'draft'
    CHECK (order_state IN ('draft','confirmed','fulfilling','fulfilled','cancelled','closed')),
  payment_state text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_state IN ('unpaid','partial','paid','refunded','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT sales_orders_party_fk
    FOREIGN KEY (tenant_id, party_id) REFERENCES contacts.parties (tenant_id, id),
  CONSTRAINT sales_orders_quote_fk
    FOREIGN KEY (tenant_id, quote_id) REFERENCES sales.quotes (tenant_id, id),
  CONSTRAINT sales_orders_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  item_id uuid,
  name_snapshot text NOT NULL,
  sku_snapshot text,
  uom_snapshot text,
  quantity numeric(20,6) NOT NULL,
  unit_price_minor bigint NOT NULL,
  discount_minor bigint NOT NULL DEFAULT 0,
  tax_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency char(3) NOT NULL,
  CONSTRAINT sales_order_lines_order_fk
    FOREIGN KEY (tenant_id, order_id) REFERENCES sales.orders (tenant_id, id),
  CONSTRAINT sales_order_lines_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  from_state text,
  to_state text NOT NULL,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_osh_order_fk
    FOREIGN KEY (tenant_id, order_id) REFERENCES sales.orders (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.order_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  kind text NOT NULL,
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_oa_order_fk
    FOREIGN KEY (tenant_id, order_id) REFERENCES sales.orders (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  order_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_rr_order_fk
    FOREIGN KEY (tenant_id, order_id) REFERENCES sales.orders (tenant_id, id),
  CONSTRAINT sales_rr_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  return_request_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_returns_rr_fk
    FOREIGN KEY (tenant_id, return_request_id) REFERENCES sales.return_requests (tenant_id, id),
  CONSTRAINT sales_returns_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS sales.return_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  return_id uuid NOT NULL,
  order_line_id uuid,
  quantity numeric(20,6) NOT NULL,
  CONSTRAINT sales_return_lines_return_fk
    FOREIGN KEY (tenant_id, return_id) REFERENCES sales.returns (tenant_id, id)
);
