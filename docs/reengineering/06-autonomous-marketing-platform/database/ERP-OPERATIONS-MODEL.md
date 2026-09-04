# ERP and operations data model

Created: **2026-09-04**
State: **PROPOSED logical model — not migration SQL**
Foundation: [`CANONICAL-DATA-MODEL.md`](./CANONICAL-DATA-MODEL.md)

## 1. Product boundary

ERP means **Enterprise Resource Planning**. In Impulsionando it is not one table or indivisible module; it is a product area composed from optional bounded capabilities:

```text
Catalog · Purchasing · Sales · POS · Fulfillment · Inventory
Finance · Accounting · Billing · Payments · Fiscal
Contracts · Documents · Commissions
```

CRM answers who/why/relationship. ERP answers what was offered/sold/delivered, its obligations, cost, stock and financial result.

Integration occurs through commands and events, not CRM updating ERP tables.

## 2. Catalog

### Core tables

| Table | Purpose |
| --- | --- |
| `catalog.items` | Tenant-owned product/service/bundle identity |
| `catalog.item_versions` | Immutable published descriptive/operational version |
| `catalog.item_variants` | SKU/variant and attributes |
| `catalog.units_of_measure` | Governed UOM vocabulary and precision |
| `catalog.item_uom_conversions` | Versioned conversion factors |
| `catalog.price_lists` | Currency, audience, validity and state |
| `catalog.prices` | Item/variant, amount minor, currency, validity and tax inclusion |
| `catalog.tax_categories` | Domain tax classification reference |
| `catalog.item_external_mappings` | Provider/legacy IDs |

Issued quote/order/contract lines preserve name, SKU, UOM, quantity, price, discount, tax and currency snapshots. Later catalog edits never rewrite history.

Services may reference agenda requirements; products may reference stock items. Neither relationship is mandatory.

## 3. Suppliers and purchasing

| Table | Purpose/state |
| --- | --- |
| `purchasing.suppliers` | Link to Contact Organization/customer-neutral party |
| `purchasing.requisitions` | Internal request `draft → submitted → approved/rejected → ordered/cancelled` |
| `purchasing.requisition_lines` | Item/UOM/quantity/needed-at |
| `purchasing.purchase_orders` | Supplier commitment `draft → issued → partially_received → received/closed/cancelled` |
| `purchasing.purchase_order_lines` | Price/tax/currency snapshots |
| `purchasing.goods_receipts` | Immutable receipt header |
| `purchasing.goods_receipt_lines` | Received/accepted/rejected quantity and lot/serial refs |
| `purchasing.supplier_invoices` | Supplier obligation reference, linked to Finance Payable |
| `purchasing.supplier_price_quotes` | Optional comparative sourcing evidence |

Purchase receipt emits inventory movement facts. Supplier invoice creates a Finance command; Purchasing never inserts journal rows directly.

## 4. Sales

### Quotes

`sales.quotes`, `quote_lines`, `quote_status_history`.

State:

```text
draft → presented → accepted → converted
                   └→ rejected/expired/cancelled
```

### Orders

`sales.orders`, `order_lines`, `order_status_history`, `order_adjustments`.

Order carries:

- tenant/unit;
- Contact/customer account;
- source lead/opportunity/campaign;
- channel (`dashboard`, `pos`, `public_checkout`, `api`, etc.);
- currency;
- totals snapshot;
- fulfillment/payment summaries as projections;
- optimistic version.

Order state and payment state are separate.

### Returns/cancellations

`sales.return_requests`, `returns`, `return_lines` and status history. A return emits commands for inventory receipt, refund/credit and commission reversal. Nothing edits the original issued line.

## 5. Authoritative sale lifecycle

This product decision must close before implementation. Recommended generic model:

```text
quote accepted
  → order confirmed
      → inventory reservation (when stocked)
      → receivable/payment intent (according to terms)
      → fulfillment
      → invoice/fiscal request at configured recognition point
      → revenue/cost/commission journal facts
      → Growth conversion/outcome event
```

No single transition works for every niche. Store explicit recognition policy per tenant/module version:

| Decision | Options |
| --- | --- |
| Sales conversion | Order confirmed / payment authorized / fulfillment completed |
| Stock decrement | Reservation / pick / fulfillment |
| Revenue recognition | Order / fulfillment / payment according to accounting policy |
| Commission accrual | Order / payment / return-window close |
| Fiscal issuance | Order / fulfillment / payment according to jurisdiction |

Every reversal is a compensating event/entry, never destructive edits.

## 6. POS/PDV

POS is an optional sales channel over shared Catalog, Sales, Payments and Inventory.

| Table | Purpose |
| --- | --- |
| `pos.registers` | Unit/device/register identity and state |
| `pos.cash_sessions` | Operator opening/closing with expected/actual totals |
| `pos.cash_movements` | Append-only cash in/out/correction |
| `pos.receipts` | Issued POS sale/receipt snapshot |
| `pos.receipt_lines` | Immutable lines |
| `pos.receipt_payment_allocations` | Tender/payment allocations |
| `pos.tabs` | Optional open tab/comanda linked to table/contact |
| `pos.tab_events` | Append-only consumption/status |

Cash differences and voids are audited. Corrections use reversal records.

## 7. Fulfillment

| Table | Purpose |
| --- | --- |
| `fulfillment.fulfillments` | One or more fulfillment units per order |
| `fulfillment.fulfillment_lines` | Quantity/source order line |
| `fulfillment.assignments` | Team/resource/partner responsibility |
| `fulfillment.events` | Append-only state/location/evidence |
| `fulfillment.service_cases` | Work/service delivery lifecycle |

Verticals may extend fulfillment (vehicle delivery, restaurant kitchen, event production) but preserve shared order/outcome links.

## 8. Inventory

### Master data

| Table | Purpose |
| --- | --- |
| `inventory.warehouses` | Tenant/unit storage location |
| `inventory.stock_items` | Inventory identity linked to catalog variant/UOM |
| `inventory.suppliers` | Optional preferred-source relation |
| `inventory.reorder_policies` | Minimum/target/lead time per warehouse/item |
| `inventory.lots` | Lot/batch, manufacture/expiry |
| `inventory.serials` | Serialized unit identity/state |

### Immutable movement truth

| Table | Purpose |
| --- | --- |
| `inventory.stock_movements` | Type/source/idempotency/occurred-at |
| `inventory.stock_movement_lines` | Warehouse/item/lot/serial and signed quantity |
| `inventory.stock_reservations` | Order/line quantity reservation lifecycle |
| `inventory.stock_balances` | Rebuildable current quantity projection |
| `inventory.valuation_layers` | Cost layer when valuation enabled |

Movement types include receipt, reserve, release, issue, transfer, adjustment, return and reversal.

Never make mutable `quantity_on_hand` the only truth. Negative-stock policy is tenant/module configuration and audited.

Inventory migration is blocked until valuation method, negative-stock behavior, reservation/decrement recognition and reversal policy are accepted for the target module.

## 9. Agenda and resources

Generic scheduling invariant:

```text
participant/contact + service + resource(s) + location + time
```

### Tables

| Table | Purpose |
| --- | --- |
| `agenda.services` | Schedulable service and duration/buffer/capacity rules |
| `agenda.resources` | Person, room, equipment, vehicle, table, unit or custom resource |
| `agenda.resource_groups` | Resource pools |
| `agenda.service_resource_requirements` | Required types/counts |
| `agenda.availability_rules` | Recurring local availability + timezone |
| `agenda.availability_exceptions` | Blocks/extra availability |
| `agenda.appointments` | UTC bounds + booking timezone/local date, service/location/state/version |
| `agenda.appointment_participants` | Contact/user/resource roles |
| `agenda.appointment_resources` | Reserved resources |
| `agenda.appointment_status_history` | Append-only transitions/reasons |
| `agenda.waitlist_entries` | Desired service/window/priority |
| `agenda.reminder_intents` | Communication request reference, not provider send |

Multi-resource conflict checks and slot claims are transactional database/application concerns. Default Mon–Fri 09:00–17:00 is a blueprint default, never a hard-coded global rule.

## 10. Finance versus accounting

### Operational finance

| Table | Purpose |
| --- | --- |
| `finance.financial_accounts` | Cash/bank/clearing/card account |
| `finance.receivables` | Customer obligation |
| `finance.payables` | Supplier/other obligation |
| `finance.obligation_events` | Issue/due/adjust/settle/cancel history |
| `finance.allocations` | Payment/credit allocation |
| `finance.bank_statement_imports` | Import provenance/checksum |
| `finance.bank_statement_lines` | Immutable imported lines |
| `finance.reconciliation_runs` | Matching run/version/state |
| `finance.reconciliation_matches` | Statement↔payment/journal evidence |

### Accounting ledger

If DRE, margin and formal reconciliation are promised, a double-entry ledger is required:

| Table | Purpose |
| --- | --- |
| `accounting.chart_accounts` | Versioned tenant chart |
| `accounting.posting_periods` | Open/closed periods |
| `accounting.journals` | Journal source/type |
| `accounting.journal_entries` | Posted/reversed entry header |
| `accounting.journal_lines` | Account, debit/credit amount, currency, cost center |
| `accounting.cost_centers` | Hierarchical management classification |
| `accounting.allocation_rules` | Versioned cost/revenue allocations |
| `accounting.fx_rates` | Rate/source/date |

Posted entries are immutable and balanced per currency. Correction uses reversing entries. DRE is a report/projection over ledger facts, not an editable table.

## 11. Margin and cost

Every sale line may receive a versioned profitability snapshot:

```text
net revenue
- tax
- cost of goods/service
- payment fee
- commission
- allocated direct cost
= contribution margin
```

Tables:

- `accounting.cost_snapshots`;
- `accounting.margin_calculations`;
- `accounting.margin_components`.

Calculations record method/version/source; later cost changes do not silently rewrite historical results.

## 12. Billing

Billing manages recurring/commercial obligations, not provider transactions.

| Table | Purpose |
| --- | --- |
| `billing.contracts` | Customer/tenant commercial contract |
| `billing.contract_versions` | Terms and effective interval |
| `billing.schedules` | Recurrence, next billing and timezone |
| `billing.invoices` | Issued obligation document |
| `billing.invoice_lines` | Immutable item/tax/price snapshots |
| `billing.dunning_policies` | Versioned reminder/suspension rules |
| `billing.dunning_cases` | Per-invoice/contract execution state |
| `billing.service_access_events` | Suspension/reactivation evidence |

Impulsionando SaaS billing and tenant-customer billing may use the same engine with explicit owner/product scope; they are never confused by nullable tenant.

Every Billing aggregate therefore requires non-null `owner_scope` and `product_scope` (for example platform SaaS versus tenant-customer billing); null is never interpreted contextually.

## 13. Payments

Provider-neutral:

| Table | Purpose |
| --- | --- |
| `payments.payment_intents` | Amount/currency/payer/reference/method options |
| `payments.payment_attempts` | Provider attempt/status/idempotency |
| `payments.provider_events` | Deduplicated normalized webhook + encrypted/raw-retention reference |
| `payments.settlements` | Gross/fee/net and settlement date |
| `payments.refunds` | Request/provider result and reason |
| `payments.disputes` | Chargeback/dispute lifecycle |
| `payments.external_mappings` | Provider IDs |

Payment success emits a fact consumed by Finance/Billing/Sales; it does not directly update their tables.

## 14. Fiscal

Separately governed:

- `fiscal.tax_profiles`;
- `fiscal.tax_rule_versions`;
- `fiscal.tax_calculation_snapshots`;
- `fiscal.document_requests`;
- `fiscal.documents`;
- `fiscal.document_events`;
- `fiscal.number_sequences`.

Tax/fiscal rules require jurisdiction-specific review. Provider response never overwrites the original request/evidence.

## 15. Commissions and affiliates

### Generic commissions

| Table | Purpose |
| --- | --- |
| `commissions.programs` | Versioned commission policy |
| `commissions.rules` | Trigger/basis/rate/eligibility |
| `commissions.participants` | Seller/affiliate/manager/coproducer |
| `commissions.accruals` | Append-only calculated obligation |
| `commissions.adjustments` | Reversal/clawback |
| `commissions.payouts` | Approved payout and settlement |
| `commissions.payout_allocations` | Which accruals were paid |

### Affiliate extension

- affiliate profiles;
- links/codes;
- attribution evidence;
- offer/product bindings;
- fraud/dispute review.

View ≠ administer ≠ originate ≠ receive commission. Capabilities remain separate.

## 16. Contracts and documents

| Table | Purpose |
| --- | --- |
| `documents.files` | Metadata, storage ref, checksum, classification, retention |
| `documents.links` | File to typed domain subject |
| `documents.contracts` | Contract identity/parties/state |
| `documents.contract_versions` | Immutable terms/document version |
| `documents.obligations` | Due/fulfilled/waived obligation |
| `documents.signature_requests` | Provider-neutral request |
| `documents.signature_events` | Evidence/results |

Storage paths and URLs are not authorization.

## 17. ERP anti-patterns

- One `erp_transactions` table for every process;
- mutable balance/stock as sole truth;
- order state equated with payment state;
- CRM directly inserts invoices;
- payment webhook directly decrements stock;
- n8n writes ledger rows;
- float money;
- tax calculated only at report time without snapshot;
- issued documents/lines rewritten after catalog changes;
- deletes instead of reversal;
- vertical catalog/order/finance copied into Core wholesale;
- DRE promised without a ledger/reconciliation model.

## 18. Decisions blocking implementation

- authoritative sale/recognition points;
- whether accounting/DRE is full ledger-backed in initial ERP;
- multi-legal-entity and multi-currency scope;
- inventory valuation method(s);
- fiscal jurisdictions/providers;
- commission trigger and clawback;
- plan/provider ownership for SaaS versus tenant commerce;
- agenda multi-resource/capacity requirements;
- return/refund/reversal policies.
