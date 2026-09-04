# Vertical extension data model

Created: **2026-09-04**
State: **PROPOSED — verticals deferred from first dashboard/CRM slice**
Core model: [`CANONICAL-DATA-MODEL.md`](./CANONICAL-DATA-MODEL.md) · ERP: [`ERP-OPERATIONS-MODEL.md`](./ERP-OPERATIONS-MODEL.md)

## Principle

A vertical extends shared capabilities with niche-specific truth. It does not create a parallel CRM, ERP, agenda, finance, communication or agent platform.

Every vertical:

- has explicit module/version identity;
- uses direct `tenant_id`;
- references canonical Contact/Party;
- references shared Appointment, Order, Document and financial records where applicable;
- emits versioned events;
- contributes dashboard widgets/actions through the module contract;
- contributes agent tools through the governed registry;
- has independent authorization capabilities;
- can be disabled without corrupting Core truth.

Shared Core never imports a vertical repository.

## Shared-extension relationship

```text
Contact/Party
  ├─ CRM lead/opportunity/task
  ├─ Appointment
  ├─ Quote/Order/Fulfillment
  ├─ Contract/Document
  ├─ Finance/Payment
  └─ vertical profile/case/assets
```

## Health

Product requirements:

- patients;
- professionals;
- specialties/subspecialties;
- consultations/encounters;
- ASO/PCMSO/exams/laboratory;
- referrals;
- events/evaluations;
- finance.

Proposed extension tables:

```text
vertical_health.patient_profiles
vertical_health.practitioners
vertical_health.practitioner_specialties
vertical_health.care_episodes
vertical_health.encounters
vertical_health.occupational_programs
vertical_health.examinations
vertical_health.referrals
vertical_health.clinical_documents
```

Agenda owns availability/appointment. Contacts owns identity. Finance owns money. Health owns clinical/occupational meaning.

Clinical data requires separate regulatory, retention, access and AI gates. No diagnosis capability is implied.

## Automotive

Journey:

```text
Lead → Vehicle → Test drive → Proposal → Sale → Delivery
→ Insurance/service plan → Collection → Workshop → Return → Repurchase
```

Proposed extension:

```text
vertical_automotive.vehicles
vertical_automotive.party_vehicle_relationships
vertical_automotive.vehicle_acquisitions
vertical_automotive.test_drives
vertical_automotive.inspections
vertical_automotive.work_orders
vertical_automotive.work_order_steps
vertical_automotive.service_history
vertical_automotive.service_plans
vertical_automotive.insurance_referrals
```

Shared CRM tracks relationship, Agenda schedules test-drive/collection, Sales owns proposal/order, Finance/Inventory records economics/parts.

## Commercial representation

Journey:

```text
Principal/represented company → Brand → Product → Offer
→ Representative → Territory → Portfolio → Customer
→ Order → Sale → Commission → Repurchase
```

Proposed extension:

```text
vertical_representation.principals
vertical_representation.brands
vertical_representation.principal_products
vertical_representation.territories
vertical_representation.representative_assignments
vertical_representation.account_portfolios
vertical_representation.representation_agreements
vertical_representation.field_visits
vertical_representation.sales_targets
```

Products, Contacts, Orders and Commissions remain shared contexts.

## Brewery

Journey:

```text
Raw material → Recipe → Production batch → Process/quality
→ Packaging/keg → Inventory → B2B order → Distribution → Bar
```

Proposed extension:

```text
vertical_brewery.recipes
vertical_brewery.recipe_ingredients
vertical_brewery.production_batches
vertical_brewery.batch_steps
vertical_brewery.quality_checks
vertical_brewery.packaging_runs
vertical_brewery.kegs
vertical_brewery.keg_movements
vertical_brewery.distribution_routes
```

Catalog, Purchasing, Inventory and Sales own generic economic movement.

## Bar / restaurant

Journey:

```text
Customer → Reservation/table/tab → POS → Order
→ Kitchen/fulfillment → Payment → Inventory/Fiscal
→ CRM → NPS → Loyalty
```

Proposed extension:

```text
vertical_restaurant.dining_areas
vertical_restaurant.tables
vertical_restaurant.reservations
vertical_restaurant.tabs
vertical_restaurant.tab_guests
vertical_restaurant.kitchen_tickets
vertical_restaurant.kitchen_ticket_items
vertical_restaurant.service_events
```

POS receipt, Order, Payment and Inventory remain shared. A table/comanda does not become a second order/payment model.

## Events

```text
vertical_events.events
vertical_events.venues
vertical_events.ticket_types
vertical_events.registrations
vertical_events.tickets
vertical_events.checkins
vertical_events.transfers
vertical_events.production_requirements
vertical_events.crew_assignments
```

WMP production contracts/equipment may extend fulfillment; generic event registration/ticket/check-in is reusable.

## Tourism / hospitality

```text
vertical_tourism.tour_products
vertical_tourism.departures
vertical_tourism.itineraries
vertical_tourism.bookings
vertical_tourism.travelers
vertical_tourism.vouchers
vertical_tourism.properties
vertical_tourism.stays
vertical_tourism.maintenance_cases
```

Contacts, Agenda, Orders, Payments and Documents remain shared.

## Retail

Primarily shared Catalog, POS, Inventory, CRM and Payments.

Optional extension:

```text
vertical_retail.assortments
vertical_retail.store_listings
vertical_retail.promotions
vertical_retail.loyalty_accounts
vertical_retail.loyalty_events
```

Ana Madú/Colors data becomes migration input, not separate Core commerce.

## Education

```text
vertical_education.programs
vertical_education.classes
vertical_education.enrollments
vertical_education.attendance
vertical_education.assessments
vertical_education.student_progress
```

Student identity references Contact; authenticated student access uses Consumer Account or an explicit education membership—not copied auth.

## Generic services

```text
vertical_services.service_cases
vertical_services.work_orders
vertical_services.work_order_steps
vertical_services.work_logs
vertical_services.service_slas
vertical_services.assets
```

Useful for workshops, consulting, maintenance and other physical service businesses.

## Investments

Investment-specific profiles, suitability, recommendations and orders are regulated. The first Core model supplies Contacts, CRM, Documents, Payments and agents, but no investment advice/trade model is accepted here.

## Affiliate module

Affiliates are transverse rather than one niche:

- affiliate/manager/coproducer role;
- offer/link/code;
- attribution evidence;
- sale/payment link;
- commission rule/accrual/clawback;
- payout.

Capabilities distinguish view, administer, originate and receive.

## Vertical module contract

Each vertical version declares:

```text
owned entities
shared entity references
capabilities
events emitted/consumed
dashboard contributions
agent tools
data classifications
retention
setup/readiness
migration adapters
```

## Anti-patterns

- `chrismed_customers`, `dumont_customers`, `costeira_customers` as permanent identities;
- vertical-specific CRM pipelines implemented as separate code;
- vertical payment/finance tables when shared contracts suffice;
- hard-coded tenant UUID policies;
- Core table with hundreds of nullable niche columns;
- unversioned JSON blob containing the whole vertical;
- agent routes named per tenant;
- a vertical table without direct tenant ownership;
- regulated data entering generic agent context;
- enabling a vertical because a blueprint recommends it without plan/policy/readiness checks.

## Migration rule

Legacy vertical namespaces remain until that tenant/module wave:

1. map shared facts to Core;
2. map niche facts to extension;
3. backfill with lineage;
4. reconcile;
5. move API/write authority;
6. retire duplicate vertical Core concepts;
7. retain legally required historical evidence.

No vertical migration blocks the first Core CRM/Growth slice.
