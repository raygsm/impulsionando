# First product slice — contracts (land before modules)

Created: **2026-09-04T22:20Z** · State: **PAPER**
Rule: [`../FOUNDATION-TRACKS.md`](../FOUNDATION-TRACKS.md) F7 — contracts + tests before the Nest module.
Envelope: [`../../phase-1/CONTRACT-HTTP-API.md`](../../phase-1/CONTRACT-HTTP-API.md). Tenant id in contracts is always `tenantId` ([`../DATA-AND-IDENTITY-PLAN.md`](../DATA-AND-IDENTITY-PLAN.md) §2).
Product: [`STAKEHOLDER-DELTA.md`](./STAKEHOLDER-DELTA.md).

Do not implement from this file until G0.

---

## 1. `packages/contracts/src/identity.ts` (new)

```ts
SessionUser = { id: uuid, email: string | null }

Membership = {
  tenantId: uuid,           // physical: user_roles.company_id
  tenantName: string,
  isMasterTenant: boolean,  // companies.is_master
  roles: string[],          // app_role as stored; not capabilities
}

StaffFlags = {
  isSuperAdmin: boolean,
  isImpulsionandoStaff: boolean,
  isMasterObserver: boolean,  // never implies staff or write
}

UniversalMinimumStatus = "available" | "unavailable" | "not_implemented"

UniversalMinimumBacking = {
  contacts: UniversalMinimumStatus,         // FPS: not_implemented (P4)
  leadLifecycle: UniversalMinimumStatus,    // FPS: not_implemented (P4)
  tasks: UniversalMinimumStatus,            // FPS: not_implemented
  growthOverview: UniversalMinimumStatus,   // FPS: not_implemented
  internalAgent: UniversalMinimumStatus,    // Phase 6 agent for active tenant
  platformSupport: UniversalMinimumStatus,  // FPS: available
}

SessionContext = {
  user: SessionUser,
  memberships: Membership[],
  activeTenant: Membership | null,
  staff: StaffFlags,
  universalMinimum: UniversalMinimumBacking,
}

ActiveTenantBody = { tenantId: uuid }  // request, not grant
```

| Endpoint | Success body | Error codes |
| --- | --- | --- |
| `GET /api/v1/identity/session` | `successEnvelope(SessionContext)` | `UNAUTHENTICATED` |
| `GET /api/v1/identity/memberships` | `successEnvelope(Membership[])` | `UNAUTHENTICATED` |
| `POST /api/v1/identity/session/active-tenant` | `successEnvelope(SessionContext)` | `UNAUTHENTICATED`, `FORBIDDEN` |

Optional query on GET session: `tenantId` (same as `X-Tenant-Id` — propose, never authorize).

`SessionContext.capabilities` is **absent** (S2 / G1).

`universalMinimum` is **not** `DashboardManifest` and **not** a quota object. Values are never numeric. `not_implemented` must not be mapped to `NOT_ENTITLED` for these six keys.

---

## 2. Support — additive only

### 2.0 Case kind (PRD-DB-05)

```ts
SupportCaseKind = z.literal("platform_support")
```

Add `caseKind: SupportCaseKind` to `SupportTicketSummary`. FPS never emits another kind. A future tenant CS engine is a **different resource**.

### 2.1 GET by id

`GET /api/v1/support/tickets/{ticketId}` → `successEnvelope(SupportTicketSummary)`.

Out of scope but row exists → **403** `FORBIDDEN`. Missing → **404**.

### 2.2 List query

Extend `SupportTicketListQuerySchema` with `tenantId: uuid optional`.

| Actor | `tenantId` | Behaviour |
| --- | --- | --- |
| Member | own tenant | filter ∩ membership |
| Member | other tenant | **403** (not empty list) |
| Member | omitted | memberships ∪ `requester_user_id = actor` (no `user_profiles`) |
| Staff | any / omitted | platform scope; optional filter |

Never accept `companyId`. Never accept `caseKind` from the client on create (server sets `platform_support`).

### 2.3 Error codes

Reuse: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `SUPPORT_LIST_UNAVAILABLE`. Do not add `CUSTOMER_SERVICE_*`.

### 2.4 Paths that must not exist

No `/api/v1/support/customer-service` (or aliases). Unregistered paths stay 404.

---

## 3. Config (`packages/config/src/api.ts`)

| Name | Required | Notes |
| --- | --- | --- |
| `API_PORT` | no (default 3100) | |
| `GIT_SHA` / `GITHUB_SHA` | no | health `"unknown"` is not release identity |
| `SUPABASE_URL` | yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | never log value |
| `SUPPORT_PLATFORM_COMPANY_ID` | no | create fallback to `companies.is_master` |
| `SUPPORT_MEMBERSHIP_SOURCE` | no | `user_roles` default; `legacy_profiles` rollback only |
| `AUTHZ_CAPABILITY_MODE` | no | `log_only` default until G2; `enforcing` forbidden in FPS |

Compose existing `AI_ENV_NAMES` / webhook / journey names; do not duplicate.

---

## 4. Contract tests (with the PR)

| Test | Asserts |
| --- | --- |
| SessionContext parse | happy fixture |
| SessionContext reject | `company_id` extra key (`.strict()`) |
| ActiveTenantBody reject | non-uuid |
| Support list query | `tenantId` uuid ok; `companyId` rejected |
| Support GET response | same summary as list item; `caseKind` required |
| StaffFlags | observer+staff allowed by schema (service forbids promoting observer) |
| UniversalMinimumBacking | FPS fixture: support `available`, contacts/leads/tasks/growth `not_implemented`; reject numbers |
