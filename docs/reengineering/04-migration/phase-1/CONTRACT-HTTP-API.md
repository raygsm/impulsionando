# CONTRACT — HTTP API conventions

Track: **P1-E**  
Opened: 2026-08-30  
Status: **Phase 1 contract** (docs only — no Nest bootstrap)

## Scope and authority

This document defines the **HTTP conventions for the future NestJS + Fastify `api`** (`apps/api`), including versioned routes under `/api/v1`, error envelopes, pagination, auth headers, idempotency, and Zod/OpenAPI validation.

**Explicit non-claim:** this contract binds the **future Nest API** and new work that adopts it. **Legacy TanStack Start routes, `createServerFn` handlers, Edge Functions, and workers are not required to comply today** and may remain non-conforming until each surface is migrated under Phase 3+ strangler rules. Observed legacy surface: [`../../01-current-state/phase-0/API-AND-JOBS.md`](../../01-current-state/phase-0/API-AND-JOBS.md).

Does **not** authorize:

- Nest bootstrap, `apps/api` scaffolding, or dependency installs;
- changing live routes, DNS, or deploy topology;
- re-enabling contained workflows.

Conflict order: accepted ADRs → [`../../02-target-architecture/`](../../02-target-architecture/) → `STATUS.md` → evidence → this contract’s normative text for new Nest surfaces.

Related: [`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md), [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md), [`DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md), ADR-003 (Proposed), exploratory sketch in [`../exploratory/NEST-DOMAIN-PAPER-DESIGN.md`](../exploratory/NEST-DOMAIN-PAPER-DESIGN.md) §4.

---

## 1. URL versioning

### Public Nest surface

```text
/api/v{major}/{module}/...
```

Examples:

```text
GET  /api/v1/support/tickets
POST /api/v1/support/tickets
GET  /api/v1/support/tickets/{ticketId}
```

| Rule | Norm |
| --- | --- |
| Major in path | Breaking HTTP shapes require a new major (`v2`, …). First public Nest surface is **`v1`**. |
| Module prefix | Resource paths are prefixed by domain module name (`support`, `tenants`, `billing`, …) aligned with [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md). |
| Additive change | New optional fields, new endpoints, and new query params under the same major are allowed without bumping `v{n}`. |
| Breaking change | Renames, type changes, removed fields, changed status semantics, or auth requirement changes require a new major **or** a dated deprecation window (see §7). |
| Non-versioned legacy | Existing TanStack `/api/...` and server-fn RPC shapes may stay unversioned facades that **delegate** to Nest use cases; they are not the versioned contract. |
| Health | Process health/readiness may live outside the resource version tree (e.g. `/health`, `/ready`) and are not subject to resource pagination rules. |

Query-string or header-only versioning is **out of scope** for v1. Media-type versioning is not used.

Events/jobs use a separate `schemaVersion` field; that is owned by [`CONTRACT-EVENTS-JOBS.md`](CONTRACT-EVENTS-JOBS.md) (P1-F), not this HTTP contract.

---

## 2. Success and error envelopes

All Nest JSON responses for versioned resource APIs use a single envelope family. Raw bodies without envelope are reserved for non-JSON or explicitly documented binary/stream endpoints (e.g. file download, SSE) and must be called out in OpenAPI.

### Success

```json
{
  "data": {},
  "meta": {
    "correlationId": "01J…",
    "requestId": "req_…"
  }
}
```

- `data` is the resource, collection, or command result. Shape is defined per operation in Zod/OpenAPI.
- `meta` is always an object when present. `correlationId` **MUST** be returned when the request carried or generated one.
- `requestId` is optional operational identity for the HTTP hop (may equal or differ from `correlationId`).
- List responses put items in `data` (array) and pagination fields in `meta` (see §3).

### Error

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable summary safe for operators/UI",
    "correlationId": "01J…",
    "details": [
      {
        "path": "body.email",
        "code": "invalid_string",
        "message": "Invalid email"
      }
    ]
  }
}
```

| Field | Required | Norm |
| --- | --- | --- |
| `error.code` | yes | Stable machine code (UPPER_SNAKE_CASE). Clients branch on `code`, not on `message`. |
| `error.message` | yes | Short, non-sensitive summary. No secrets, tokens, stack traces, or cross-tenant identifiers. |
| `error.correlationId` | yes | Same correlation id as logs/audit for the request. |
| `error.details` | no | Structured extras (validation paths, conflict keys). Never privileged internals. |

### Stable error codes (minimum set)

| Code | Typical HTTP | Meaning |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired session or JWT |
| `FORBIDDEN` | 403 | Authenticated but lacking membership, role, or capability |
| `VALIDATION_FAILED` | 400 | Request failed Zod/OpenAPI validation |
| `NOT_FOUND` | 404 | Resource missing **or** hidden by tenant isolation (same status; no existence leak) |
| `CONFLICT` | 409 | State conflict (e.g. unique constraint, stale version) |
| `IDEMPOTENCY_REPLAY` | 200 or 409* | Replay of a completed idempotent mutation (see §5) |
| `RATE_LIMITED` | 429 | Throttled |
| `INTERNAL` | 500 | Unexpected failure; message stays generic |

\* Prefer returning the **original success envelope** on idempotent replay when the prior result is available; use `409` + `IDEMPOTENCY_REPLAY` / `CONFLICT` only when the same key is reused with a different payload or the stored result cannot be returned safely.

Modules may add **namespaced** codes (`SUPPORT_TICKET_CLOSED`, …) without removing the minimum set.

### HTTP status

Status codes remain meaningful (REST). The envelope does not replace status; clients should use status for transport class and `error.code` for application branching.

---

## 3. Pagination and filtering

### Default: cursor pagination

```text
GET /api/v1/{module}/{collection}?cursor={opaque}&limit={n}&{filters}
```

Success:

```json
{
  "data": [ ],
  "meta": {
    "correlationId": "01J…",
    "nextCursor": "eyJ…",
    "limit": 50
  }
}
```

| Rule | Norm |
| --- | --- |
| Style | **Cursor-based** is the default for Nest list endpoints. |
| `limit` | Optional; server clamps to a documented max (default and max declared per resource in OpenAPI). |
| `cursor` | Opaque to clients; do not invent offset math in UI. |
| `nextCursor` | Absent or `null` means no further page. |
| Offset/page | Offset (`page`/`offset`) is **not** the default. Allowed only when a resource documents why (e.g. admin export) and still returns the same envelope. |
| Sorting | Explicit `sort` / `order` query params only when documented; unstable default sort is forbidden for cursors. |

### Filtering

- Filters are **resource-specific** query parameters declared in OpenAPI (e.g. `status`, `createdAfter`).
- Unknown query params → `VALIDATION_FAILED` (strict) unless the operation documents passthrough.
- Client-supplied tenant ids are **parameters, never authorization** ([`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)). Tenant scope comes from session + server resolution (see §4 and P1-C).
- Free-text `q` / search, if present, must be documented with length limits and indexing expectations.

### Partial responses / field masks

Not required for v1. If introduced later, they must be additive under the same major and documented in OpenAPI.

---

## 4. Authentication and session

Identity issuer remains **Supabase Auth** (managed). Nest does not become a second identity provider in Phase 1–3.

### Headers

| Header | Norm |
| --- | --- |
| `Authorization: Bearer <access_token>` | **Primary** credential for Nest `/api/v1` calls from browsers (via BFF/client), server functions acting as adapters, and service callers that hold a user JWT. |
| Cookie session | May be accepted **only** if explicitly documented for a surface (e.g. same-site cookie bridge). Prefer Bearer for the Nest contract so SSR, workers, and typed clients share one path. Legacy localStorage session + `attachSupabaseAuth` pattern is evidence for Bearer ([`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md)). |
| `X-Correlation-Id` | Optional on request. If valid/present, Nest reuses it; otherwise Nest generates one (ULID/UUID). Always echo in response `meta` / `error`. |

### Validation expectations (Nest)

1. Extract Bearer token (or documented cookie).
2. Validate JWT with Supabase Auth (claims / JWKS path as implemented later — exact library is Phase 3).
3. Resolve actor (`userId`, claims).
4. Resolve **active tenant** and **membership** per P1-C / P1-D contracts — never trust client `company_id` / `tenant_id` alone.
5. Enforce capability at use-case boundary; map denials to `UNAUTHENTICATED` / `FORBIDDEN`.

### Public and machine callers

| Caller | Norm |
| --- | --- |
| Public anonymous | Documented per route; no Bearer. Still receives `correlationId`. Rate-limited. |
| Webhooks | Signature + replay protection + idempotency; **not** end-user JWT. Details in integrations / events contracts. |
| Internal service | Dedicated credentials (not browser `service_role`). `service_role` stays server-side only ([`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)). |

Browser **must not** call privileged integrations with service credentials.

---

## 5. Idempotency-Key (mutating POSTs)

| Rule | Norm |
| --- | --- |
| When required | **All mutating `POST`** endpoints that create side effects (create resource, enqueue job, charge, send message, etc.) **SHOULD** accept `Idempotency-Key`. Pilot and money/comms-adjacent routes **MUST**. |
| Header | `Idempotency-Key: <client-generated opaque string>` (recommend ULID/UUID; max length documented, e.g. 128 chars). |
| Scope | Key is scoped to **(tenant, actor or caller class, route/operation)**. Same key on a different operation is a different slot. |
| Semantics | First successful completion stores the response (or replay handle). Retries with the **same key and equivalent body** return the original success envelope. |
| Mismatch | Same key, **different** body → `409` + `CONFLICT` or `IDEMPOTENCY_REPLAY` with clear `details`. |
| Other methods | `PUT`/`PATCH`/`DELETE` that are naturally idempotent by resource id may omit the header; if side effects are non-idempotent, document and require the key. |
| Retention | Storage TTL and conflict behavior are operational details owned with P1-F; HTTP clients assume at-least-once safe retry within the documented window. |

Unsafe without a key: clients may retry; servers may double-apply. Prefer requiring the header in OpenAPI (`required: true` where MUST applies).

---

## 6. OpenAPI and Zod as validation source of truth

| Rule | Norm |
| --- | --- |
| Source | Request/response (and shared DTO) schemas live as **Zod** definitions intended for `packages/contracts` ([`REPOSITORY.md`](../../02-target-architecture/REPOSITORY.md)). |
| OpenAPI | Nest publishes OpenAPI **generated from the same Zod sources** (Zod→OpenAPI). Hand-written OpenAPI that drifts from runtime validation is non-compliant. |
| Runtime | Every Nest HTTP handler validates input (params, query, headers of interest, body) with those schemas before the use case runs. Invalid → `400` + `VALIDATION_FAILED` + `details`. |
| Clients | Frontends and adapters consume a **typed client** generated from the published contract — never Nest internal modules ([`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md)). |
| Env | Process environment is validated at startup separately; that is not a substitute for per-request DTO validation. |

Phase 1 delivers this **document**. Packaging Zod/OpenAPI files and generators is **not** authorized until Phase 1 exit + later gates (Phase 3 for Nest surface).

---

## 7. Deprecation and strangler coexistence

Migration model: extract use cases into Nest gradually; TanStack Start remains the frontend/SSR host ([`TECHNOLOGY-BOUNDARIES.md`](../../02-target-architecture/TECHNOLOGY-BOUNDARIES.md), [`PHASE-3-API.md`](../PHASE-3-API.md)).

### Coexistence patterns

| Pattern | Allowed | Notes |
| --- | --- | --- |
| TanStack route → Nest HTTP | yes | Legacy `/api/...` thin proxy or reimplementation that calls Nest `/api/v1/...` or shared use case. |
| `createServerFn` → Nest | yes | Temporary **adapter**: validate session, call Nest (or later shared domain), map errors to existing UI expectations. |
| Dual write | only with plan | No dual-write of critical state without explicit reconciliation (exploratory sketch + Phase 3 compatibility). |
| New domain in server-fn only | no (after gate) | After the Phase 3 gate for a module, **new** use cases are born in Nest/domain, not as net-new privileged server-fns. |
| React → DB privileged | no | Components must not import privileged DB access. |

### Deprecation of Nest versions / operations

1. Mark operation `deprecated` in OpenAPI; document successor and removal date.
2. Emit warning headers where practical (`Deprecation`, `Sunset`, and/or `Link` to successor).
3. Keep behavior stable during the window; additive fixes only.
4. Remove only after traffic evidence and an accepted cutover note.

### Legacy non-compliance

Until a specific route or server-fn is migrated and characterization-tested:

- it may use ad-hoc status bodies, missing correlation ids, or no `Idempotency-Key`;
- it is **not** evidence that the Nest contract is optional;
- DoD for a **migrated** feature still requires runtime-validated contracts, correlation ids in logs, and idempotency where applicable ([`DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md)).

---

## 8. Cross-cutting headers (summary)

| Header | Direction | Required |
| --- | --- | --- |
| `Authorization: Bearer …` | request | Authenticated Nest routes |
| `Idempotency-Key` | request | Mutating POSTs per §5 |
| `X-Correlation-Id` | request | Optional; generated if absent |
| `Content-Type: application/json` | request | JSON bodies |
| `Deprecation` / `Sunset` | response | When operation is deprecated |

---

## 9. Out of scope (this contract)

- RBAC vocabulary and capability names → P1-D `CONTRACT-RBAC.md`
- Canonical tenant/membership identity → P1-C `CONTRACT-TENANT-IDENTITY.md`
- Job/event payload schemas, queue tech, audit row shape → P1-F `CONTRACT-EVENTS-JOBS.md`
- SQL expand/contract → P1-G `CONTRACT-MIGRATIONS.md`
- Nest module layout and bootstrap → Phase 3 (after ADRs Aceitas)

---

## 10. Exit checklist (P1-E)

- [x] URL major versioning strategy recorded
- [x] Error envelope (`code`, `message`, `correlationId`, `details`) recorded
- [x] Pagination / filtering conventions recorded
- [x] Auth header / Supabase JWT session expectations recorded
- [x] `Idempotency-Key` for mutating POSTs recorded
- [x] OpenAPI/Zod as validation SoT recorded
- [x] Deprecation / strangler coexistence with TanStack + `createServerFn` recorded
- [x] Explicit legacy non-compliance clause recorded

Human acceptance of this contract is part of Phase 1 exit alongside ADR Aceita decisions; writing this file does not by itself accept ADR-003 or authorize Nest implementation.
