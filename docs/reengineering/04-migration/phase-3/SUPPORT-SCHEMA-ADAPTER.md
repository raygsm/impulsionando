# Support schema adapter — contracts ↔ staging CRM

**Scope:** Phase 3 Nest Support pilot (`apps/api`) against staging Supabase `support_tickets`.  
**Authority:** staging CRM foundation schema is SoT for **writes**; `@impulsionando/contracts` remains the **HTTP** vocabulary until a later expand/contract of the public API.

Do not treat this as a license to alter prod schema or to `db push` on prod.

## Drift summary

| Layer | Reality |
| --- | --- |
| HTTP contracts (`packages/contracts`) | Legacy STATIC vocabulary (`protocol`, `type`, `status=new`, `priority=medium`, requester email in body) |
| Staging DB `support_tickets` | CRM foundation (`ticket_code`, `category`, `status=open`, `priority=normal`, required `company_id`, …) |
| Prod form schema | **Out of scope** for this pilot — do not assume staging matches prod form columns |

### Staging CRM columns (expected)

`company_id` (required), `category`, `priority` (`low` \| `normal` \| `high` \| `critical`), `status` (`open` \| `waiting_customer` \| `waiting_internal` \| `resolved` \| `closed` \| `reopened`), `subject`, `description`, `source_channel`, `ticket_code`, `metadata`, `requester_user_id`, plus usual id/timestamps.

### Not on staging CRM (do not write)

`protocol`, `type`, `origin`, `requester_email`, `status=new`, `priority=medium`.

## Field mapping

| Contract / HTTP | DB column / value | Notes |
| --- | --- | --- |
| `protocol` | `ticket_code` | Bidirectional: store as `ticket_code`; expose as `protocol` in responses |
| `type` | `category` | Same string enum values where possible; default `other` / CRM equivalent if absent |
| `priority: "medium"` | `priority: "normal"` | Write map medium→normal; read map normal→medium for HTTP |
| `priority: "low"\|"high"\|"critical"` | same | Passthrough |
| `status: "new"` (create default) | `status: "open"` | Create always persists `open` |
| `status: "waiting_customer"\|"resolved"\|"closed"\|"reopened"` | same | Shared values |
| `status: "waiting_core"` (contract) | `waiting_internal` | Closest CRM analogue for staff/internal wait |
| Other contract-only statuses (`received`, `in_review`, `waiting_third_party`, `in_development`, `cancelled`, …) | Prefer map to nearest CRM value **or** reject with validation until contracts shrink | Do not invent DB enum members |
| `source` | `source_channel` | Optional string |
| `requester.email` / name / phone | Prefer `requester_user_id` when actor known; else stash non-PII-safe refs under `metadata` (no prod PII dump) | Do not invent `requester_email` column |
| `companyId` (list summary) | `company_id` | Required on insert |

## `company_id` resolution (create)

`company_id` is **required** on staging CRM. Nest must not trust a client-supplied company id for create AuthZ.

Resolution order:

1. **`SUPPORT_PLATFORM_COMPANY_ID`** — optional env UUID (documented in `.env.staging.example`). Prefer for deterministic staging.
2. Else lookup **`companies` where `is_master = true`** (single platform master row) and use that `id`.
3. If neither yields a UUID → fail create with a clear service error (do not insert null).

Documented for operators; values never committed.

## Status / priority maps (quick reference)

### Priority

```text
HTTP → DB:  low→low, medium→normal, high→high, critical→critical
DB → HTTP:  low→low, normal→medium, high→high, critical→critical
```

### Status (create + update)

```text
HTTP → DB (common):
  new              → open
  waiting_customer → waiting_customer
  waiting_core     → waiting_internal
  resolved         → resolved
  closed           → closed
  reopened         → reopened

DB → HTTP (common):
  open               → new          (or keep "open" if contracts later expand)
  waiting_internal   → waiting_core
  waiting_customer   → waiting_customer
  resolved|closed|reopened → same
```

Until contracts are revised, responses may continue to speak `protocol` / `type` / `new` / `medium` while the adapter owns the CRM mapping.

## Events / audit

Side tables (`support_ticket_events`, audit payloads) should store **CRM status values** (or both from/to with explicit fields) so staging rows stay queryable. Correlation / idempotency keys remain HTTP-layer concerns.

## Staging residual — `support_ticket_seq` (42501)

**Observed:** inserts that rely on the column DEFAULT (`nextval('support_ticket_seq')`) fail with `permission denied for sequence support_ticket_seq` (**42501**) when the API uses the staging service role.

**Nest workaround (current):** set an explicit `ticket_code` on insert — pattern `IMP-P3-YYYYMMDD-<8hex>` — so the DEFAULT / sequence is never invoked. Keep until the operator GRANT is applied.

**Proper fix (staging SQL, operator only):**

```sql
GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_seq TO service_role;
-- plus postgres / authenticator as needed for that project
```

Do **not** invent or apply prod grants from this track. Seq GRANT on staging is optional while the API workaround remains; prefer restoring DEFAULT once USAGE is confirmed.

## Verification hints (no secrets)

- Insert with adapter → row has `company_id`, `ticket_code`, `category`, `priority` ∈ CRM set, `status=open`.
- List maps DB → contract summary without selecting missing columns (`protocol`, `type`, …).
- Update-status staff path writes CRM statuses only.

## Related

- Phase board: [`README.md`](./README.md)
- Contracts: `packages/contracts/src/support.ts`
- Pilot intent: [`../phase-1/PILOT-SUPPORT.md`](../phase-1/PILOT-SUPPORT.md)
