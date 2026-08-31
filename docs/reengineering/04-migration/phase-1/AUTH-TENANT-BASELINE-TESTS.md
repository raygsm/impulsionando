# Auth / tenant baseline tests (Phase 1 exit)

Track: **P1-J**  
Opened: 2026-08-30  
Status: **EXECUTABLE PLAN** — mock/contract suite in-repo; live staging still human-gated  
Authority: [`docs/reengineering/`](../../README.md). Companions: [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md) (T-01…T-10), [`CONTRACT-RBAC.md`](CONTRACT-RBAC.md) (§6.2), [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) (A1–A12), [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md).

**Does not authorize:** Nest bootstrap, prod writes, prod PII export, schema push, DNS/Dokploy, re-enabling contained workflows.

Dominant persistence key belief: **`company_id` ≡ tenant** (DECLARED; table-by-table proof still open). Isolation is incomplete without **allow and deny** evidence.

---

## 1. Purpose

Close Phase 1 residual exit: **auth/tenant baseline tests running in NON-PROD**.

| Layer | What this track delivers | Phase 1 exit role |
| --- | --- | --- |
| **Contract / mock** | Encode T + RBAC + Support AuthZ expectations as executable vitest (no secrets) | Always runnable in CI / local without staging |
| **Live staging** | Allow/deny against staging Supabase (+ optional legacy Support HTTP/serverFn) | Required for Phase 1 **exit**; operator-owned fixtures |
| Nest `/api/v1/...` | Out of scope | Phase 3 after residual + Phase 2 healthy |

HTTP 200 on a public page is **not** authorization proof. RLS allow without API deny is **incomplete**.

---

## 2. Prerequisites

### 2.1 Staging project + restore

From [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md):

- [ ] Staging Supabase project exists (name/ref only in Git; keys in vault).
- [ ] Isolated restore into staging completed; structure smoke (§7.1) pass.
- [ ] Staging Auth **isolated** — prefer staging-native test users; no prod password reuse in docs.
- [ ] No prod webhooks / payment / Evolution fan-out wired to staging.
- [ ] Operator vault holds staging URL, anon, service_role — **never** commit.

### 2.2 Anonymization / data handling

| Rule | Detail |
| --- | --- |
| No prod PII export for fixtures | Do not dump prod `support_tickets`, messages, or requester emails into Git or shared drives |
| Synthetic tenants | Minimum **two** companies A/B with distinct `company_id` |
| Synthetic actors | Dedicated emails on test domains (e.g. `+auth-baseline@…`); owned by Cauã/Raygs |
| Logs | Assert codes / row counts / opaque ids — never print full ticket body or contact fields |
| Restored rows | Treat as sensitive until scrubbed; access allow-list only |

### 2.3 Fixtures (minimum inventory)

| Fixture | Purpose |
| --- | --- |
| Tenant A / Tenant B | Distinct `companies.id` (`company_id`) |
| Member A | Auth user + `user_roles` (or equivalent membership) on A only |
| Member B | Membership on B only |
| Operator A | Membership A + Support operator capability (legacy role map per P1-D until caps exist) |
| No-membership user | Valid Auth session, **no** row for host A |
| Weak-role user | Membership A without `support.ticket.read` / update-status |
| Platform actor (optional) | Explicit platform signal; **deny by default** on B unless named platform cap |
| Host A / Host B | Staging hostnames or documented host→company mapping for attribution tests |
| Ticket seed A | At least one Support ticket row bound to A (staging write only) |

Platform-vs-company row remains **UNKNOWN** ([P1-C §5](CONTRACT-TENANT-IDENTITY.md)); platform cases must not invent a fake client `company_id`.

---

## 3. Case matrix

IDs are stable for evidence logs. **Allow** and **deny** both required for multi-tenant claims.

### 3.1 Tenant identity (P1-C T-01…T-10)

| ID | Case | Expected | Mockable? | Live staging? |
| --- | --- | --- | --- | --- |
| T-01 | User of tenant A, host A, membership A — read/write within A policy | **Allow** | Policy decision mock | Yes — session + membership + resource |
| T-02 | User of tenant A reads tenant B resource | **Deny** (no leak) | Expected-outcome contract | Yes — SELECT/list must return zero B rows |
| T-03 | User of A create/move/update with client `company_id` = B | **Deny**; resource stays on A or rejected | Body-attribution helper mock | Yes — insert/update characterization |
| T-04 | Valid session, no membership for host tenant | **Deny** private surface | Actor/tenant resolution mock | Yes — authenticated 403/redirect |
| T-05 | Membership, inadequate role/capability | **Deny** | Capability expansion mock | Yes — wrong-role operator |
| T-06 | Missing / expired / forged session | **Deny** | Session-gate mock | Yes — unauthenticated / bad JWT |
| T-07 | Anonymous on host A; forged body `company_id`=B | Attribute to A via **hostname**; ignore/reject B | Attribution rule mock | Yes — public create path |
| T-08 | Privileged / `service_role` path | **Allow** only in authorized server process + **audit** | Contract: “browser never holds service_role” | Staging: server-only smoke; no browser key |
| T-09 | Platform actor without explicit platform policy on B | **Deny** by default | Platform deny-default mock | Yes if platform fixture exists |
| T-10 | Vertical membership (e.g. WMP) after translation | Same allow/deny; no bypass via alternate id | Translation-table contract | Deferred unless WMP fixtures present; mark UNKNOWN |

### 3.2 RBAC (P1-D §6.2)

| ID | Case | Expected | Mockable? | Live staging? |
| --- | --- | --- | --- | --- |
| R-01 | Actor in A with capability | **Allow** A | Yes | Yes |
| R-02 | Actor in A against tenant B id | **Deny** | Yes | Yes |
| R-03 | Actor in A creating/moving row into B | **Deny** | Yes | Yes |
| R-04 | Authenticated, no membership | **Deny** | Yes | Yes |
| R-05 | Membership, wrong role/capability | **Deny** | Yes | Yes |
| R-06 | `anon` on protected use case | **Deny** | Yes | Yes |
| R-07 | `platform_admin` with required platform cap | **Allow** + audit | Outcome contract | Optional live |
| R-08 | `platform_admin` without that cap | **Deny** | Yes | Optional live |
| R-09 | Master Observer write attempt | **Deny** | Yes | Optional live |
| R-10 | `machine` with valid scoped credential | **Allow** + audit | Contract shape only | Optional; machine auth often UNKNOWN |
| R-11 | `machine` bad/replayed credential | **Deny** | Contract shape only | Optional |
| R-12 | Privileged service path | Audit trail present | “audit required” assertion | Staging mutation + audit row check |

R-01…R-06 map onto T-01…T-06; keep both ID spaces so contract docs stay citeable.

### 3.3 Support pilot AuthZ (P1-H A1–A12)

Pilot resource: Support tickets (`support.ticket.create` / `list` / `update-status`). Dominant tenant key: `company_id`.

| ID | Case | Expected | Mockable? | Live staging? |
| --- | --- | --- | --- | --- |
| A1 | Public create, valid payload | **Allow**; no session | Validation + allow rule | Yes — legacy `create-ticket` or staging insert path |
| A2 | Public create, invalid/missing fields | **Deny** `VALIDATION_FAILED` | Zod/schema mock | Yes |
| A3 | Create with forged `company_id` / tenant in body | **Deny** or ignore — never authorize from client id | Attribution mock (≡ T-07/T-03) | Yes |
| A4 | List without session | **Deny** `UNAUTHENTICATED` | Session gate | Yes |
| A5 | List session + membership + `support.ticket.read` on A | **Allow** only A rows | Filtering mock | Yes |
| A6 | List on A aiming at B | **Deny** empty/`FORBIDDEN` — zero B rows | Cross-tenant filter mock | Yes |
| A7 | List session, no membership / no capability | **Deny** `FORBIDDEN` | Yes | Yes |
| A8 | Update-status operator + cap on own-tenant ticket | **Allow** + audit | Transition + audit shape | Yes |
| A9 | Update-status other tenant’s ticket | **Deny** `FORBIDDEN` or `NOT_FOUND` (no leak) | Yes | Yes |
| A10 | Update-status authenticated without operator cap | **Deny** `FORBIDDEN` | Yes | Yes |
| A11 | Update-status illegal transition | **Deny** `CONFLICT` or `VALIDATION_FAILED` | Status table mock | Yes |
| A12 | Platform staff cross-tenant list | **Allow** only with explicit platform scope cap; else deny | Deny-default + optional allow | Optional; product UNKNOWN |

Until Nest exists, live cases may characterize **legacy** `src/routes/api/public/support/create-ticket.ts` + `src/lib/support-tickets.functions.ts` ([PILOT-SUPPORT §7](PILOT-SUPPORT.md)). Target `/api/v1/support/...` fixtures remain schema contracts only.

---

## 4. How to run

### 4.1 Contract / mock suite (no staging secrets)

Encodes the matrix expectations without calling Supabase:

```bash
npx vitest run tests/reengineering/auth-tenant-baseline.contract.test.ts
```

Or via default project include (`tests/**/*.test.ts`):

```bash
npm test -- tests/reengineering/auth-tenant-baseline.contract.test.ts
```

Pass = all mock/contract assertions green. Does **not** alone close Phase 1 exit.

### 4.2 Live staging (operator)

1. Complete §2 prerequisites (staging restore + fixtures).
2. Export staging env **locally only** (never commit):

```bash
# Prefer loading .env.staging (gitignored) — never production
cp -n .env.staging.example .env.staging   # fill keys from Dashboard once
npm run verify:staging-supabase           # refuses prod ref arygtqrdpcdkwnuwsgmm
npm run test:auth-baseline                # mock/contract (always)
npm run test:auth-baseline:live           # sets AUTH_TENANT_BASELINE_LIVE=1
```

Or export manually:

```bash
# Staging project only — never production (ref kyiczxtcoexnvcqgrgkr)
export SUPABASE_URL='…staging…'
export SUPABASE_PUBLISHABLE_KEY='…'
export SUPABASE_SERVICE_ROLE_KEY='…'   # server/admin seed only
export AUTH_TENANT_BASELINE_LIVE=1     # opt-in gate
```

3. Optional: point a non-prod app config / curl harness at staging Support create + authenticated list/update (legacy routes). Prefer serverFn/HTTP characterization over browser service_role.
4. Record evidence in §6 table (timestamps, fixture labels, pass/fail) — **no secrets, no PII dumps**.
5. Existing live RLS helpers under `tests/*.test.ts` that import `tests/helpers.ts` require the same env pattern and **must** target staging when used for this exit — they throw if env missing and are **not** safe against prod.

Live suite in this track: `describe.skipIf(!AUTH_TENANT_BASELINE_LIVE)` refuses prod ref, requires staging URL + service_role, and probes `companies` count (post-restore). Expand T/A matrix with real client sessions when fixtures exist. Default CI remains mock-only.

### 4.3 What not to run

| Forbidden | Why |
| --- | --- |
| Prod Supabase URL/keys for baseline writes | Real tenant data; no prod writes as tests |
| Committing `.env` / service_role | Secrets policy |
| Nest bootstrap “to run the matrix” | Nest not authorized |
| Claiming exit from mock suite alone | Live allow+deny still required |

---

## 5. Pass / fail criteria (Phase 1 exit)

### 5.1 Pass (P1-J complete)

All of the following:

1. **Mock/contract suite green** in-repo (`auth-tenant-baseline.contract.test.ts`).
2. **Staging restore proven** per P1-I (structure smoke + RPO/RTO recorded).
3. **Live evidence** for the **mandatory** set below against staging (or approved non-prod harness), with allow **and** deny:

| Required live | Source IDs |
| --- | --- |
| Membership allow on A | T-01 / R-01 / A5 (or equivalent private read) |
| Cross-tenant deny A→B | T-02 / R-02 / A6 |
| Client `company_id` spoof deny/ignore | T-03 / T-07 / A3 |
| No membership deny | T-04 / R-04 / A7 |
| Inadequate capability deny | T-05 / R-05 / A10 |
| Unauthenticated deny on protected | T-06 / R-06 / A4 |
| Public create allow + validation deny | A1 + A2 |
| Own-tenant update allow + cross-tenant update deny | A8 + A9 |

4. Evidence log filled (§6) with date, operator, staging project **ref** (non-secret), case IDs, result.
5. No secrets or prod PII in Git / evidence attachments.

### 5.2 Soft / deferred (do not block if marked UNKNOWN)

| Case | When deferrable |
| --- | --- |
| T-10 WMP translation | No WMP fixtures; document UNKNOWN |
| R-07…R-11 platform/machine | Fixtures missing; deny-default still asserted in mock |
| A12 platform cross-tenant list | Product UNKNOWN until Aceita |
| Full Nest OpenAPI golden | Phase 3 |
| Index/RLS body audit for every table | Ongoing; not sole exit gate |

### 5.3 Fail

- Any required live case allows cross-tenant data (row leak, wrong `company_id` persist, B visible to A).
- Client-supplied `company_id` alone grants access or reattributes a ticket.
- Evidence only from prod, or mock-only with no staging run.
- Service_role used from browser / committed keys.
- HTTP 200 public smoke presented as AuthZ proof.

---

## 6. Evidence log (fill in place)

| Date | Operator | Staging ref | Cases run | Result | Notes (no secrets/PII) |
| --- | --- | --- | --- | --- | --- |
| 2026-08-30 | P1-J | — | Mock/contract suite authored | Plan + mock only | Live not yet executed |
| | | | | | |

---

## 7. Related

- [`README.md`](README.md) — workboard P1-J
- [`PILOT-SUPPORT.md`](PILOT-SUPPORT.md) — Support A1–A12
- [`STAGING-RESTORE-PLAN.md`](STAGING-RESTORE-PLAN.md) — non-prod DB
- [`CONTRACT-TENANT-IDENTITY.md`](CONTRACT-TENANT-IDENTITY.md) — T matrix
- [`CONTRACT-RBAC.md`](CONTRACT-RBAC.md) — capability deny-default
- [`../../01-current-state/phase-0/AUTH-SESSION-TRACE.md`](../../01-current-state/phase-0/AUTH-SESSION-TRACE.md) — J-02 static path
- [`../../02-target-architecture/SECURITY-MULTITENANCY.md`](../../02-target-architecture/SECURITY-MULTITENANCY.md)
- Executable: `tests/reengineering/auth-tenant-baseline.contract.test.ts`
