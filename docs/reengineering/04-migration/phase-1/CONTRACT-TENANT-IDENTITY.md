# Contract — Tenant & membership identity

| Field | Value |
| --- | --- |
| Track | **P1-C** |
| Status | **Draft — pending human Aceita** |
| Opened | 2026-08-30 |
| Authority | `docs/reengineering/` (accepted ADRs → target architecture → STATUS → evidence → legacy) |
| Does **not** authorize | Nest bootstrap, schema migrations, `db push`/`reset`, mechanical column renames, DNS/routing changes |

This document is a **Phase 1 executable contract draft**. It binds naming, derivation rules, lifecycle semantics, and test requirements for Tenants & Memberships. It is **not** an accepted ADR and does **not** license implementation until a human marks **Aceita** (and related ADRs / sibling contracts as required by Phase 1 exit).

---

## 1. Purpose

Unify how the program names and resolves **tenant** and **membership** before scaffolding, so:

- API policy, RLS defense, and UI shells share one translation model;
- `company_id`, rare `tenant_id`, slugs, and hostnames stop competing as silent authorities;
- allow/deny isolation tests have a stable vocabulary.

Out of this contract’s ownership: RBAC capability vocabulary ([`CONTRACT-RBAC.md`](CONTRACT-RBAC.md) — P1-D), HTTP shapes (P1-E), events/jobs (P1-F), migration expand/contract (P1-G).

---

## 2. Canonical vocabulary

| Concept (target language) | Meaning | Legacy / storage mapping (Phase 1) |
| --- | --- | --- |
| **User** | Authenticated principal from Supabase Auth (`auth.users` / JWT subject) | `user_id` = Auth user id |
| **Tenant** | Isolation boundary for private business data and staff operations | **Dominant persistence key: `company_id`** referencing `public.companies.id`. Conceptual name is `tenant`; storage does **not** mechanically rename to `tenant_id`. |
| **Membership** | Binding of a User to a Tenant with at least one role (and later capabilities) | Dominant observed path: `public.user_roles` (`user_id` + `company_id` + `role`). Other tables may exist per vertical; they are **aliases requiring explicit translation**, not second authorities. |
| **Active tenant context** | Tenant under which a server use case runs for this request | Derived server-side (session + hostname); never trusted from client body/query alone |
| **Hostname / slug** | Presentation and routing hints | Resolve **which** tenant config to load; do **not** authorize data access by themselves |
| **Platform actor** | Impulsionando staff / super-admin / master observer (elevated) | Observed via `app_metadata` and/or RPCs (e.g. `is_impulsionando_master_observer`); **not** a substitute for a decided “platform company row” model (see §5) |

### 2.1 `company_id` ↔ `tenant` mapping rule

1. In contracts, ADRs, and future API domain language: prefer **tenant** / **membership**.
2. In persistence, SQL, and strangler adapters against live schema: **`company_id` remains the dominant key** until a Phase 1+ migration contract (P1-G) and table-by-table proof say otherwise.
3. Equivalence **`company_id` ≡ tenant** is a **DECLARED belief**, **not proven for every table** ([`CLARIFICATIONS-2026-08-30.md`](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md) #2; [`DATA-AND-RLS.md`](../../01-current-state/phase-0/DATA-AND-RLS.md)). Proof is table-by-table; absence of `company_id` on a table means **UNKNOWN isolation**, not “global public.”
4. **Forbidden:** mechanical rename of `company_id` → `tenant_id` across the corpus; inventing a parallel tenant registry that diverges from `companies` without an Aceita decision.
5. Where a table uses `tenant_id` (notably WMP / `communication_tenant_members`), document an **explicit translation** to the canonical tenant (`companies` / `company_id` or a registered WMP tenant constant). Competing IDs without a translation table/function are a defect.

### 2.2 Frozen root registries (evidence only)

Root [`DECISIONS.md`](../../../../DECISIONS.md) (2026-07-10 freeze) lists legacy SoT tables (`companies`, `user_roles`, `core_tenant_identity`, etc.). For reengineering:

- Treat that freeze as **historical product intent / inventory evidence**.
- It does **not** override `docs/reengineering/` conflict order.
- Phase 1 contracts may **preserve** those tables as adapters while renaming concepts in API language.

Live schema remains observational baseline ([`SCHEMA-SOURCE-OF-TRUTH.md`](../../01-current-state/phase-0/SCHEMA-SOURCE-OF-TRUTH.md)); typed snapshot counts are divergent and non-authoritative for production shape.

---

## 3. How active tenant is derived (server-side)

### 3.1 Inputs (ordered)

```text
1. Authenticated session (Supabase Auth) → user_id (+ claims / app_metadata)
2. Request hostname (normalized; proxy-aware rules TBD under host-spoof tests)
3. Optional client hint: company_id / slug / “selected membership”
   → PARAMETER ONLY — never sufficient for authorization
```

### 3.2 Resolution algorithm (contract)

For every authenticated mutating or private-read use case:

1. **Attest session** — reject missing/expired/invalid token (see J-02 static path in [`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md)).
2. **Resolve host tenant candidate** — map hostname → tenant (`companies` / `core_tenant_identity` / subdomain registry / reserved hosts). Unknown or unverified host → **fail closed** for tenant-bound private data (public marketing routes may still render under separate public contracts).
3. **Load memberships** for `user_id` (primary: `user_roles`; vertical exceptions only with registered translation).
4. **Intersect** host tenant candidate with memberships:
   - If exactly one allowed membership matches host → that is **active tenant**.
   - If user has memberships but **none** match host → **deny** (do not silently switch to another company).
   - If multiple match (should be rare) → **deny or require explicit server-validated selection** that still must be a membership of that host’s tenant — never a free-form client UUID.
5. **Platform actors** — may operate with elevated scope only under explicit platform policies (P1-D). Until platform-vs-company (§5) is decided, platform elevation **must not** invent a fake `company_id` from the client; actions that need a tenant scope still require a server-resolved tenant or an explicitly named platform scope in the use-case contract.
6. **Anonymous / public** — no membership; tenant for attribution (leads, public tickets) comes from **hostname (and verified domain ownership)**, not from client-supplied `company_id`.

### 3.3 Hard rules

| Rule | Statement |
| --- | --- |
| R1 | Client-supplied `company_id` / `tenant_id` / slug is a **hint or filter parameter**, never the authorization decision. |
| R2 | Active tenant is computed on the **server** (future `api` / current serverFn equivalent) at use-case entry. |
| R3 | UI may cache display config by host; **mutations** re-resolve tenant + membership. |
| R4 | RLS remains **defense in depth**; application policy remains primary for complex rules ([`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)). |
| R5 | `service_role` only in authorized server processes; never in browser. |
| R6 | Hostname alone does not grant membership; membership alone does not override a host that maps to a different tenant. |

Observed legacy divergence (WMP membership table vs Core `user_roles`) is **technical debt** to strangler behind this algorithm — not a license for two authorities.

---

## 4. Membership lifecycle (contract level)

States are conceptual. Storage may remain `user_roles` rows ± invite tables until P1-G migrations are Aceitas.

```text
none → invited → active → (suspended) → ended
         ↑_________|  (re-invite)
```

| Transition | Actor | Preconditions | Effects (contract) | Non-effects |
| --- | --- | --- | --- | --- |
| **Invite** | Tenant admin (or platform admin under platform policy) | Inviter has membership + invite capability on **server-resolved** tenant; invitee identity by email/user id | Creates pending membership/invite bound to that tenant + initial role; audit event | Cannot invite into arbitrary `company_id` from body; cannot self-grant platform roles via invite payload |
| **Join / accept** | Invitee (authenticated) | Valid, unexpired invite for that user; session attested | Membership becomes **active**; role = invite’s role (or tenant default); audit | Client cannot escalate role beyond invite; cannot join a second tenant by forging host |
| **Provision (signup/onboarding)** | New customer / platform provisioning | J-03 paths; idempotent where possible | May create tenant (`companies`) **and** first membership in one server-owned transaction boundary (owner function TBD) | Client cannot choose privileged platform role or another existing tenant’s id as “my new company” without server rules |
| **Leave / remove** | Member (self-leave if allowed) or tenant admin | Target membership exists on active tenant; last-admin policy TBD | Membership **ended** (or revoked); sessions/capabilities for that tenant stop; audit | Soft-delete vs hard-delete storage is deferred; must not orphan privileged solo-admin without policy |
| **Suspend** (optional) | Tenant/platform admin | Explicit capability | Active → suspended; deny use cases; audit | Not required for pilot if unused in legacy |

### 4.1 Multi-company Auth users

Whether one Supabase user may hold **multiple** active memberships while UX stays host-separated is an **open product follow-up** ([clarifications](../../01-current-state/product-map/CLARIFICATIONS-2026-08-30.md)). Until decided:

- Contract **allows** multiple `user_roles` rows in data;
- **Active context** for a request remains host ∩ membership (§3);
- Cross-host “switcher” that ignores hostname is **out of contract** for private data.

### 4.2 Vertical / consumer memberships

Tables such as `consumer_memberships`, `clube_memberships`, `comm_memberships`, WMP `communication_tenant_members` are **not** the Core staff membership SoT. They may bind **customer/partner** actors. Phase 1 requires each to declare:

- actor class (staff vs consumer vs partner);
- tenant key used;
- translation to canonical tenant when the use case touches shared resources.

RBAC details → P1-D.

---

## 5. Impulsionando platform vs `companies` row — still UNKNOWN

Clarification #1: whether Impulsionando-the-platform is itself a `companies` row (or a distinct platform scope) remains **`UNKNOWN`**. Database messiness is acknowledged; refactor likely later.

### 5.1 Required API / policy behavior until Aceita decision

| Situation | Required behavior |
| --- | --- |
| Private tenant data | Always require membership (or audited platform elevation) on a **resolved** tenant; never “null tenant means all rows.” |
| Platform admin UI / Core | Treat as **platform scope** in use-case contracts: either (A) explicit platform role checks **without** inventing a tenant, or (B) a documented platform tenant id **only after Aceita**. Do not silently mix both. |
| Public Impulsionando surfaces (`platform-web`) | No privileged credentials; no admin rules ([`SYSTEM.md`](../../02-target-architecture/SYSTEM.md)). |
| Attribution of platform-level tickets/leads | Prefer hostname / configured platform id from **server config**, not client `company_id`. If a company row is later designated “Impulsionando,” adapters map config → that id in one place. |
| Cross-tenant platform reads | Denied by default; only named use cases with audit + allow/deny tests. |
| Schema speculation | **Forbidden** to “fix” by inserting a synthetic platform company or renaming tables in Phase 1 implementation work. Decision first → then P1-G. |

Mark any code or doc that assumes “Impulsionando ≡ company X” as **assumption** until the Aceita entry exists (recommend recording in `05-governance/DECISIONS.md` / ADR when decided).

---

## 6. Allow / deny test matrix (mandatory)

Evidence today: J-02 plan exists; **not executed** ([`AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md)). Phase 1 exit requires these as **baseline tests in non-prod** (fixtures owned by Cauã/Raygs; no prod user dump).

For **each** multi-tenant resource / pilot use case (starting with Support / P1-H when ready):

| ID | Case | Expected |
| --- | --- | --- |
| T-01 | User of tenant A, host A, membership A | **Allow** read/write within A policy |
| T-02 | User of tenant A, attempts read of tenant B resource | **Deny** (no data leak) |
| T-03 | User of tenant A, attempts create/move/update with client `company_id` = B | **Deny**; resource remains on A (or rejected) |
| T-04 | Valid session, **no** membership for host tenant | **Deny** authenticated private surface |
| T-05 | Valid session + membership, **inadequate role** for use case | **Deny** (capability — coordinated with P1-D) |
| T-06 | Missing / expired / forged session | **Deny** |
| T-07 | Anonymous on host A submitting public attribution | Attributes to A via **hostname**; forged body `company_id`=B ignored or rejected |
| T-08 | Privileged / `service_role` path | **Allow** only in authorized server process; **audit trail** required |
| T-09 | Platform actor without explicit platform policy on tenant B data | **Deny** by default |
| T-10 | WMP (or other vertical) membership table path | Same allow/deny after **translation** to canonical tenant; no bypass via alternate id |

Also required (security target):

- Indexes cover columns used by policies ([`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)).
- Views, functions (esp. `SECURITY DEFINER`), and Storage buckets inherit the same isolation expectations — schedule under Phase 1/3 evidence, not assumed from table RLS alone.

---

## 7. Compatibility with separate client-side tenant UXs

Clarification #7 + ADR-008 (Proposed): **on the client, tenant applications feel like separate products**; Raygs owns platform ops.

| Concern | Contract |
| --- | --- |
| Visual / IA separation | **Allowed and intentional** — distinct shells, brands, routes per host (`tenant-web` / vertical skins). |
| Auth provider | Shared Supabase Auth is **allowed**; UX may still look separate. |
| Membership model | **One** server-side membership/tenant contract (§2–§4); UIs must not invent per-tenant authz semantics that contradict the API. |
| Hostname | Selects branding + **candidate tenant**; does not select a different image/SHA per tenant (target). |
| Password reset host | Canonical host still product-open; contract only requires reset not to attach the wrong tenant membership. |
| `app-web` | Authenticated UI is not owner of business rules; calls server with session; displays tenant-bound data only after server resolution. |

Do **not** force a single visible shell in characterization or pilot UX. Do **force** a single authorization model behind the shells.

---

## 8. Non-goals / deferred

| Deferred | Until |
| --- | --- |
| Nest `TenantsModule` implementation / `apps/api` | Phase 3 after Phase 1+2 gates + Aceita ADRs |
| Mechanical `company_id` → `tenant_id` renames; schema push to “fix” live | Aceita decision + P1-G + staging restore proof |
| Proving `company_id` ≡ tenant on **every** table | Ongoing evidence; not a blocker for drafting this contract; blocker for claiming full isolation |
| Deciding Impulsionando platform row vs scope | Explicit Aceita (§5) |
| Full RBAC / module entitlement catalog | P1-D / J-03 characterization |
| MFA, session revocation E2E, password-reset E2E | Non-prod test plan after fixtures |
| Custom-domain ownership / Host spoof matrix | Host resolution security contract (related; may live beside this doc) |
| Consumer/club/partner membership product rules | Per-vertical contracts after staff path is stable |
| DNS, Traefik, Dokploy, VPS wipe | Phase 2+ |
| Re-enabling contained workflows | Recorded decision only |

---

## 9. Relationship to other Phase 1 outputs

| Doc | Relationship |
| --- | --- |
| [`PHASE-1-FOUNDATION.md`](../PHASE-1-FOUNDATION.md) | Parent phase goals |
| [`phase-1/README.md`](README.md) | Workboard track P1-C |
| [`SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md) | Normative security rules this contract operationalizes |
| [`SYSTEM.md`](../../02-target-architecture/SYSTEM.md) | `platform-web` / `tenant-web` / `app-web` / `api` ownership |
| P1-D `CONTRACT-RBAC.md` | Roles & capabilities on top of membership |
| P1-H `PILOT-SUPPORT.md` | First consumer of T-01…T-10 on a real module |
| P1-G `CONTRACT-MIGRATIONS.md` | How storage may later converge without mechanical rename |

---

## 10. Acceptance checklist (human Aceita)

- [ ] Canonical names + `company_id` dominance accepted (§2)
- [ ] Server-side derivation + “client IDs never authorize” accepted (§3)
- [ ] Invite / join / leave lifecycle accepted at contract level (§4)
- [ ] Platform-vs-company UNKNOWN posture accepted until separate decision (§5)
- [ ] Allow/deny matrix required for multi-tenant resources (§6)
- [ ] Separate client UX compatibility accepted (§7)
- [ ] Non-goals acknowledged (§8)

**Sign-off:** _pending — human Aceita_

When Aceita: update this Status field, link from [`STATUS.md`](../../STATUS.md) / governance register, and unblock dependent contract wording in P1-D / P1-H (still no Nest/schema push from this file alone).
