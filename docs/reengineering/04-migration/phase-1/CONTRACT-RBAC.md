# Phase 1 contract — RBAC / capabilities

Track: **P1-D**  
Opened: 2026-08-30  
Status: **CONTRACT** (executable limits for later API; no Nest implementation in this phase)  
Evidence grounding: `STATIC` on `src/lib` + Phase 0 auth/product-map docs. Allow/deny tests **not executed**.

Authority: [`docs/reengineering/`](../../README.md). Companions: [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md), [`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md), [`SYSTEM-AND-ACTORS.md`](../../01-current-state/product-map/SYSTEM-AND-ACTORS.md), [`CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md), [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md) (P1-C).

---

## 1. Decision (normative)

1. The **new API authorizes by capability**, not by role name string checks scattered in handlers.
2. **Roles** (and legacy `app_role` / `user_roles` rows) are **assignment vehicles** that expand to a capability set for a `(actor, tenant)` context.
3. **Deny by default**: missing membership, missing capability, unknown actor kind, or unresolved tenant ⇒ deny.
4. **API policy is primary**; **RLS is defense-in-depth** (never the only gate for complex use cases).
5. **Client-supplied role, company_id, tenant_id, or capability lists are parameters, never authorization.**
6. No second, parallel permission system (menus, feature flags, n8n, AI tools) may become an authority without an **Aceita** ADR.

This contract does **not** authorize Nest bootstrap, schema changes, or production privilege edits.

---

## 2. Actor kinds

Canonical kinds for policy and audit. One request resolves to exactly one primary kind (machine overrides human session when the credential is a machine identity).

| Kind | Meaning | Trust | How resolved today (`STATIC`) | Target resolution |
| --- | --- | --- | --- | --- |
| `anon` | Unauthenticated visitor / public surface | Untrusted | No Bearer / no session | No session; public routes only; rate-limited |
| `member` | Authenticated user with tenant membership, non-admin operational role | Tenant-bound | Supabase Auth + `user_roles` row for `company_id` | Auth + membership + role→capabilities |
| `professional` | Authenticated provider of services (agenda/care verticals) | Tenant-bound; often elevated within module | Legacy role `profissional` (and product-specific professional tables) | Same as member + professional capability bundle |
| `tenant_admin` | Privileged **within one tenant** (users, modules, branding, ops) | Privileged in-tenant | Legacy `admin` / `gestor` (often both treated as admin-ish) | Membership + tenant-admin capability bundle |
| `platform_admin` | Platform-wide operator (Raygs product ownership) | Highly privileged | `app_metadata` (`is_super_admin`, `platform_role=super_admin`, `is_impulsionando_staff`) and/or RPC `is_impulsionando_staff`; master-company admin/gestor heuristically treated as staff in `fetchCurrentUser` | Explicit platform principal + audited capabilities; **not** “skip all gates” |
| `machine` | Webhook, scheduler, worker, integration caller | Privileged server process | Cron/tick routes, Edge Functions, workers; auth often `UNKNOWN` | Dedicated machine credential + scoped capabilities + audit |

### Related but non-primary kinds (map, do not invent new authorities)

| Legacy / product label | Maps to | Notes |
| --- | --- | --- |
| Lead / prospective customer | `anon` (+ optional lead token later) | Untrusted input with PII |
| Customer / consumer / `consumidor` / `paciente` / `empresa` (UI labels) | `member` (or `anon` if unauthenticated portal) | Role enum drift — see §4 |
| WMP operator / affiliate / partner | `member` or `tenant_admin` per capability set | Product-specific; deny behavior largely `UNKNOWN` |
| Master Observer (`is_impulsionando_master_observer`) | **Read-only observer**, not `platform_admin` | Code comment: never promoted to staff/super-admin; no write inheritance (`src/lib/auth.ts`) |
| AI assistant | Never an actor authority | Must re-check human/machine capabilities on every tool (§7 non-goals / Phase 6) |
| Cauã / Raygs (human approvers) | Out-of-band **change approval**, not a runtime actor kind | Clarifications: Raygs owns product; Cauã+Raygs approve production changes |

---

## 3. Capability model vs role model

### 3.1 Recommendation (new API)

- **Authorize on capabilities** named as stable strings: `{domain}.{resource}.{action}` (example shape: `support.ticket.read`, `support.ticket.write`, `tenants.membership.manage`).
- A **role** is a named set of capabilities scoped to a tenant (or to `platform` for platform roles).
- Policy check at use-case entry:

```text
require(actor, tenantContext, capability) → allow | deny
```

- UI may hide controls by capability **hints**, but UI never grants access.
- Entitlements (billing/plan modules) may **narrow** capabilities; they must not invent a second allow path without ADR.

### 3.2 Why not role-only

Legacy reality is role-string checks with inconsistent meaning:

| Pattern | Where (`STATIC`) | Problem |
| --- | --- | --- |
| `has_role(..., 'admin')` | Many `*.functions.ts` | Binary admin; ignores finer roles |
| `user_roles` in (`admin`,`gestor`) | Chrismed / WMP management | Ad-hoc role sets per module |
| `is_impulsionando_staff` | Health/ops/billing/admin surfaces | Platform bypass beside tenant roles |
| `app_metadata` super-admin flags | `auth.ts`, Chrismed events, WMP | Privilege outside `user_roles` |
| Core health gate | `core-rbac.functions.ts` | Staff **or** tenant `admin` only |

Capabilities keep role UX (admin/gestor/…) while making module policies explicit and testable.

### 3.3 Legacy role map (`STATIC`)

**Database enum `app_role`** (generated types):  
`admin` | `white_label` | `gestor` | `operador` | `profissional` | `consumidor`

**Client `AppRole` in `src/lib/auth.ts`** (diverges):  
`admin` | `gestor` | `profissional` | `paciente` | `empresa`

**RBAC admin UI list** (`rbac-admin.functions.ts`): matches DB enum (+ writes gated by `is_impulsionando_staff`).

| Legacy role / flag | Suggested actor kind | Suggested default capability posture (contract-level, not final catalog) |
| --- | --- | --- |
| `consumidor` / UI `paciente` / UI `empresa` | `member` | Read/write own consumer-facing resources only |
| `operador` | `member` | Operational module caps granted by tenant config |
| `profissional` | `professional` | Own agenda/care resources; no tenant-wide admin |
| `gestor` | `tenant_admin` (or elevated member) | Manage ops within tenant; not platform |
| `admin` | `tenant_admin` | Full in-tenant admin bundle |
| `white_label` | `tenant_admin` or scoped member | Treat as tenant-scoped until proven; **UNKNOWN** exact power |
| `is_impulsionando_staff` / `is_super_admin` / `platform_role=super_admin` | `platform_admin` | Cross-tenant ops caps; always audited |
| Master Observer RPC | observer (not listed as primary kind) | Read-only; **no** write caps |
| Cron / webhook / worker | `machine` | Per-endpoint capability; signature + replay |

**Canonical capability catalog** (full list) is owned by Identity & Access + each domain module during Phase 3; Phase 1 requires only the **model** and pilot module caps (see P1-H Support).

### 3.4 Role → capability expansion

```text
session → actor identity
       → active tenant (server-derived; see P1-C)
       → membership row(s)
       → roles for that tenant
       → union(capabilities(role)) ∩ entitlements ∩ deny-list
       → policy decision
```

Platform principals expand **platform** roles/caps; they still require an explicit capability for the action (no silent omnipotence).

---

## 4. Where checks run

| Layer | Responsibility | Required? |
| --- | --- | --- |
| Edge / reverse proxy | TLS, routing, coarse WAF — **not** product RBAC | Yes (infra) |
| `app-web` / route `beforeLoad` | UX gate only (redirect/sign-out) | Optional UX |
| **API use-case policy** (target Nest Identity & Access + domain) | **Primary**: actor, tenant, capability, audit decision | **Yes** |
| Postgres **RLS** + grants | **Defense-in-depth** for Data API / leaked clients / direct SQL paths | **Yes** |
| DB RPCs (`has_role`, `is_impulsionando_staff`, …) | Legacy helpers; wrap or replace behind API policy during strangler | Transitional |
| `service_role` | Server-only break-glass for migrations/jobs; never browser | Strictly limited |
| Worker / machine handlers | Re-resolve machine capability; do not trust job payload for authz | **Yes** |

Aligned with [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md): membership and role/capability verified at the start of each use case; client IDs are never authorization.

During strangler: existing `createServerFn` gates remain; new behavior must not weaken deny paths when moving checks to API.

---

## 5. Staff / super-admin / Raygs rules

### 5.1 Product ownership (`DECLARED`)

From clarifications 2026-08-30:

- **Raygs owns** all products/verticals; clients have **user access to web apps only** — no client infra/admin of the platform.
- Technical production approvers: **Cauã + Raygs**.

Therefore `platform_admin` is a **Raygs-operated** principal class, not a tenant-customer feature.

### 5.2 Legacy privilege signals (`STATIC`)

Documented in code / mem; **not** re-authorized as “skip all gates” in the target:

| Signal | Source | Contract stance |
| --- | --- | --- |
| `app_metadata.is_super_admin` / `platform_role=super_admin` | Auth JWT claims (`auth.ts`) | Maps to `platform_admin`; still needs capability + audit |
| `app_metadata.is_impulsionando_staff` | Auth JWT | Same |
| RPC `is_impulsionando_staff` | Postgres | Same; used widely as gate |
| Admin/gestor on `companies.is_master` | Heuristic in `fetchCurrentUser` | Treat carefully; do not silently grant platform write in new API without explicit platform role |
| Master Observer | RPC by entitlement email | Read-only; never staff |
| Mem “admin master” / global test-customer emails | `mem/` (legacy ops notes) | **LEGACY DECLARED belief** — useful for fixture planning; **must not** hardcode omnipotent bypass in new policy. Prefer explicit platform role assignment + secrets outside git. Do not publish or rotate credentials via this doc. |

### 5.3 Hard rules for platform principals

1. Platform actions are **deny-by-default** except listed platform capabilities.
2. Cross-tenant read/write always emits **audit** (tenant, actor, capability, decision, correlation id).
3. Platform admin ≠ exemption from RLS tests in staging; break-glass `service_role` remains separate and rarer.
4. Assigning or changing platform privileges requires human approval (Cauã + Raygs) outside this contract’s runtime.
5. AI, n8n, and browsers never receive platform privilege material.

---

## 6. Deny-by-default and required tests

### 6.1 Default

If any of the following fail, **deny** (prefer 401 unauthenticated / 403 forbidden; no resource oracle):

- no valid session (for non-public use cases);
- no membership for active tenant (`member` / `professional` / `tenant_admin`);
- capability not in effective set;
- tenant context missing or mismatched;
- machine credential missing/invalid/replayed;
- observer attempting write.

### 6.2 Mandatory test matrix (non-prod fixtures)

For every multi-tenant resource and every sensitive capability (pilot first: Support / J-13):

| # | Case | Expected |
| ---: | --- | --- |
| 1 | Actor in tenant A with capability | **Allow** A |
| 2 | Actor in tenant A against tenant B id | **Deny** |
| 3 | Actor in A creating/moving row into B | **Deny** |
| 4 | Authenticated, no membership | **Deny** |
| 5 | Membership, wrong role/capability | **Deny** |
| 6 | `anon` on protected use case | **Deny** |
| 7 | `platform_admin` with required platform cap | **Allow** + audit |
| 8 | `platform_admin` without that cap | **Deny** |
| 9 | Master Observer write attempt | **Deny** |
| 10 | `machine` with valid scoped credential | **Allow** bounded action + audit |
| 11 | `machine` with bad/replayed credential | **Deny** |
| 12 | Privileged service path | Audit trail present |

HTTP 200 on a public page is **not** authorization proof. RLS allow without API deny test is **incomplete**.

Blocker to execute: dedicated test accounts owned by Cauã/Raygs; no production user export ([clarifications](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) #5).

---

## 7. Non-goals

- Nest / `apps/api` implementation or wiring (Phase 3+).
- Production changes to `user_roles`, `app_metadata`, RLS, or Auth users.
- Full capability catalog for all modules in Phase 1 (pilot subset only).
- Unifying every historical role synonym (`paciente` vs `consumidor`, etc.) in the database now — inventory and map only.
- Replacing Supabase Auth with a second IdP.
- Letting **admin menus**, **module flags**, **n8n workflows**, or **AI tools** become a parallel permission authority without an Aceita ADR.
- Encoding mem “no gates” master behavior as target architecture.
- Treating WMP `communication_tenant_members` as a second global RBAC system — hostname-specific membership remains a **tenant identity** concern (P1-C); capabilities still apply after membership.

---

## 8. Strangler expectations

| Until | Do |
| --- | --- |
| Phase 1 | This contract + pilot allow/deny plan; ADR acceptance for stack |
| Phase 3 | API policy module implements `require(capability)`; legacy serverFns call into it or duplicate deny semantics |
| Phase 4+ | Frontends consume capability hints from API; stop local role string sprawl for new code |
| Phase 7 | Remove obsolete role checks only after evidence window |

Open follow-ups (do not block writing this contract):

- Single Supabase user in multiple companies with separate UX hosts (clarifications follow-up).
- Exact power of `white_label` and residual UI roles `paciente`/`empresa`.
- Machine-auth standard (shared with P1-F events/jobs).

---

## 9. Acceptance checklist (Phase 1 exit contribution)

- [ ] Actor kinds above accepted by Cauã/Raygs (no silent extras).
- [ ] Capability-primary model accepted; legacy role map acknowledged.
- [ ] API-primary + RLS defense-in-depth accepted.
- [ ] Platform/staff rules accepted (Raygs-owned; audited; no omnipotent bypass).
- [ ] Allow+deny matrix scheduled on non-prod fixtures for pilot module.
- [ ] Explicit non-goal: no parallel permission system without ADR.

---

## 10. Evidence index (read-only grounding)

| Item | Path / note |
| --- | --- |
| Session → membership | [`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md); `src/lib/auth.ts` |
| Core staff/admin gate | `src/lib/core-rbac.functions.ts` |
| Role CRUD (staff) | `src/lib/rbac-admin.functions.ts` |
| `app_role` enum | `src/integrations/supabase/types.ts` |
| Widespread staff RPC | `is_impulsionando_staff` across many `src/lib/*health*.functions.ts` and admin surfaces |
| Security target | [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md) |
| Actors | [`SYSTEM-AND-ACTORS.md`](../../01-current-state/product-map/SYSTEM-AND-ACTORS.md) |
| Raygs ownership | Clarifications #3 (`DECLARED`) |
