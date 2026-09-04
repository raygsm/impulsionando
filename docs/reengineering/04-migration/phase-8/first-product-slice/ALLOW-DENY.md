# First product slice — allow and deny matrix

Created: **2026-09-04T22:20Z** · Fill into [`EVIDENCE.md`](./EVIDENCE.md)
Authority: [`../../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../../02-target-architecture/SECURITY-MULTITENANCY.md)
A slice with only allow results is **FAIL**.

Identities are roles, never credentials. Staging `aamorcqznimmleafavai`.

Capability-mode: **log-only** (G2 not open). **enforce** rows must 401/403 today.

---

## WP-F8

| # | Case | Expected | Mode |
| --- | --- | --- | --- |
| F8.1 | Handler with neither `@Public()` nor `@RequireCapability()` | test fails | enforce (test) |
| F8.2 | Unauthenticated guarded route | 401 | enforce |
| F8.3 | Correlation id omitted | server mints on success and error | enforce |
| F8.4 | Phase 5 verify 8/8 | PASS | regression |
| F8.5 | Phase 6 verify 2/2 | PASS | regression |

---

## WP-S1-min

| # | Case | Identity | Expected | Mode |
| --- | --- | --- | --- | --- |
| S1.1 | `GET /identity/session` | member of A | 200; A in memberships | enforce |
| S1.2 | session `?tenantId=A` | member of A | `activeTenant` = A | enforce |
| S1.3 | session `?tenantId=B` | member of A only | **403** | enforce |
| S1.4 | POST active-tenant B | member of A only | **403** | enforce |
| S1.5 | session | none | **401** | enforce |
| S1.6 | staff flags | platform operator | staff true after O2 | enforce |
| S1.7 | observer-only | observer | observer true, staff false | enforce |
| S1.8 | tenant admin non-master | tenant-a-admin | staff false | enforce |
| S1.9 | extra `capabilities: ['*']` | any | rejected or ignored | enforce |
| S1.10 | `universalMinimum` | member | support `available`; contacts/leads/tasks/growth `not_implemented`; never numbers | enforce |

---

## WP-P2

| # | Case | Identity | Expected | Mode |
| --- | --- | --- | --- | --- |
| P2.1 | list | member of A | 200; rows in memberships ∪ requester; `caseKind: platform_support` | enforce |
| P2.2 | list `?tenantId=B` | member of A only | **403** | enforce |
| P2.3 | GET ticket of B | member of A | **403** | enforce |
| P2.4 | GET missing | member of A | **404** | enforce |
| P2.5 | list | unauthenticated | **401** | enforce |
| P2.6 | POST create | anon | **201**; no client `company_id` grant; `caseKind` server-set | enforce |
| P2.7 | POST replay Idempotency-Key | anon | one ticket; replay meta | enforce |
| P2.8 | PATCH status | tenant-a-admin non-staff | **403** | enforce |
| P2.9 | PATCH status | staff | 200 + event/audit row | enforce |
| P2.10 | PATCH illegal transition | staff | **400** | enforce |
| P2.11 | list membership source | — | `user_roles`, not `user_profiles` | enforce |
| P2.12 | `GET /api/v1/support/customer-service` (or alias) | any | **404** — resource does not exist (PRD-DB-05) | enforce |
| P2.13 | `support.ticket.read` missing after G2 | member | 403 | **log** in FPS |

---

## Cross-tenant pair (mandatory)

Two companies A, B; user member of A only.

| Direction | Endpoints | Expected |
| --- | --- | --- |
| A → A | session propose A, list A, get A’s ticket | 200 |
| A → B | session propose B, list `tenantId=B`, get B’s ticket | 403 × 3 |
