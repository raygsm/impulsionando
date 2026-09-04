# First product slice — gates, tests and evidence

Created: **2026-09-04**
State: **BLOCKED — prerequisites below are not all met**
Plan: [`FOUNDATION-AND-CRM-PLAN.md`](./FOUNDATION-AND-CRM-PLAN.md)

## 1. Gate chain

```text
F0 product/frontend authority = product P0 + Phase 8 G0/G1
  → F1 Unit A foundations + S2 log-only
  → Phase 8 G2 authorizes enforcement
  → F2 Unit A + 8D/P1–P3 read-only staging proof
  → C0 CRM characterization/model acceptance
  → Phase 8 G3 authorizes first writes
  → C1 Unit B implementation
  → C2 Unit B staging proof and route retirement
```

F0–C2 are evidence/checkpoint labels only. They never replace the authoritative Phase 8 G0–G3 decisions.

## F0 — Frontend and product authority

**State: BLOCKED** as of 2026-09-04T21:20Z.

Required:

| # | Condition | Current observation |
| --- | --- | --- |
| F0.1 | ADR-009 accepted, not merely Proposed | Proposed in draft PR #151 |
| F0.2 | Next `app-web` merged into `reengineering/program` | Not merged |
| F0.3 | PR #151 CI characterized/acceptable | Current listed checks failing |
| F0.4 | Autonomous-marketing product model accepted (P0) | Proposed |
| F0.5 | Phase 8 G0 accepted | Pending |
| F0.6 | RBAC/capability ADR accepted | Pending |
| F0.7 | G0 closes the canonical password-reset host required by ADR-008/strangler session continuity | Pending |

This plan landing does not satisfy or bypass F0.

## F1 — Authorize Unit A implementation

Opens when F0 is met and the implementation branch is based on a commit containing the accepted frontend.

Before coding:

- record base SHA and accepted ADRs;
- rerun/confirm frontend tests and build;
- inventory transitional local manifest/auth/BFF behavior;
- enumerate existing Nest endpoints and compatibility mode;
- identify staging identities for tenant A, tenant B, role-limited and staff tests.

## G2 checkpoint — Authorize enforcement

Before Unit A can enforce capability decisions:

- S2 runs in log-only mode;
- real staging decisions are classified;
- unexplained denials are corrected;
- allow/deny exists for each implemented capability domain;
- the authoritative Phase 8 **G2** is explicitly passed.

No local F checkpoint substitutes for G2.

## F2 — Accept Unit A and close the read-only prerequisite

Required evidence:

| Area | Required proof |
| --- | --- |
| Contracts | Runtime schemas and contract tests |
| Compatibility | Existing Phase 3–6 tests/smokes still green or failures characterized as pre-existing |
| Auth | Missing bearer 401; valid user resolves one context |
| Isolation | Tenant A→A allow; tenant A→B deny |
| Capability | Role allow/deny; undecorated new route fails policy test |
| Modules | Three niche fixtures × plan/override/readiness |
| Manifest | Two tenants and two roles produce correct differences |
| Next | Production composition comes from Nest, not fixture/local authority |
| Read-only product proof | Home/actions, Support tickets, communications inbox and baseline Growth/Contacts summary satisfy 8D/P1–P3 |
| Legacy parity | `npm run phase8:parity` records explained results for each Unit A read projection |
| Existing write safety proof | Support status update demonstrates idempotency behavior and an audit record without introducing a CRM write |
| Observability | Same correlation ID visible through Next→Nest response/log |
| Security | No service-role or privileged Supabase client in Next |
| Session coexistence | Legacy→Next navigation and sign-out parity proven |
| Route ownership | `npm run phase8:routes:check` PASS and ownership rollback rehearsed |
| Rollback | Frontend can return to transitional/legacy route owner |
| Data | No CRM write or schema migration in Unit A |

## C0 — Accept CRM characterization and model

Required before Unit B:

- observed staging objects and tenant columns;
- existing writer inventory;
- route/server-function behavior trace;
- canonical Contact/Lead/Task/Opportunity decisions;
- metric definitions;
- migration classification;
- transaction/outbox/audit strategy;
- rollback;
- Phase 8 technical approvers Cauã + Raygs accept the characterization/model packet and confirm the slice does not implement CRM Universal;
- the accepted packet is linked from `EVIDENCE-B-FIRST-CRM-GROWTH-SLICE.md`.

Any object still `UNKNOWN` that affects tenant ownership blocks its repository.

## G3 checkpoint — Authorize the first CRM write

C1 cannot start until the authoritative Phase 8 G3 is explicitly passed. Its evidence packet imports all G3 requirements:

| G3 requirement | Evidence source |
| --- | --- |
| G2 enforcing and green | G2 decision/evidence |
| 8D/P1–P3 read-only proof | F2 Home/actions/Support/comms/Growth results |
| Legacy read parity | `phase8:parity` outputs linked from Unit A evidence |
| One correlation ID through Next→Nest→audit | Unit A trace |
| Route-owner rollback | Unit A ownership rehearsal |
| Idempotency + audit on support status update | Unit A support write safety result |
| CRM characterization/model accepted | C0 packet, Cauã + Raygs |

Only Phase 8 G3 authorizes Unit B; this section records readiness and does not self-approve it.

## C1 — Implement Unit B after Phase 8 G3

Opens only when:

- F2 and C0 pass;
- Phase 8 G2 remains green;
- 8D/P1–P3 read-only proof is accepted;
- Phase 8 **G3 explicitly authorizes the first write slice**.

Unit B implementation remains staging-only and does not activate messaging/payment effects.

## C2 — Accept Unit B

Required:

| Area | Required proof |
| --- | --- |
| Lifecycle | Capture → follow-up → stage → conversion → Growth summary |
| UI | Next routes complete with loading/empty/error/forbidden/degraded/unknown states |
| Auth | Capability allow and role deny per command/query |
| Isolation | Tenant A cannot list/get/mutate tenant B resources |
| Resource enumeration | Cross-tenant IDs return non-disclosing 404/403 policy result |
| Idempotency | Replayed lead capture creates one effect |
| Concurrency | Stale stage move returns 409 and preserves current state |
| Audit | Actor, tenant, action, resource, before/after where applicable, correlation |
| Outbox | Event exists in same mutation boundary |
| Growth | Metric reconciliation and zero-vs-UNKNOWN |
| AI | Governed READ tools allow correct tenant and refuse cross-tenant |
| Legacy | Migrated write authority retired or C2 remains blocked |
| Rollback | Route-owner flip rehearsed |

## 2. Test layers

### Contract tests

- schemas accept valid and reject invalid payloads;
- unknown keys handled intentionally;
- error codes/envelopes;
- version compatibility;
- module dependency cycles rejected;
- blueprint compilation deterministic.

### Nest unit tests

- capability expansion/predicates;
- effective module resolver;
- dashboard contribution filtering;
- growth metric reducers;
- idempotency decision;
- stage transition state machine;
- event payload minimization.

### Nest integration tests

Spin up the Nest app in-process:

- guards and decorators;
- validation/error/correlation;
- controller→service→repository;
- transactional command behavior;
- cross-tenant resources;
- existing endpoint compatibility.

No current in-process Nest suite exists; Unit A establishes it.

### Repository/database tests

Against an isolated/local or explicitly authorized staging fixture:

- tenant filter for every query;
- RLS allow/deny when exposed;
- service-role API guard;
- unique/idempotency constraints;
- transaction rollback;
- concurrent version conflict;
- outbox/audit atomicity.

No production write is a test.

### Next tests

- API client envelope/error mapping;
- SSR/BFF bearer propagation;
- manifest-driven navigation/widgets;
- no forbidden data in rendered HTML;
- loading/empty/configuring/degraded/error/unknown states;
- lead form validation and idempotency header;
- pipeline conflict UX;
- Growth freshness;
- accessibility and responsive behavior.

### End-to-end matrix

| Dimension | Fixtures |
| --- | --- |
| Tenant | A and B |
| Niche | Restaurant, clinic, real estate |
| Role | Owner/admin, manager, operator, finance-limited |
| Module | Active, configuring, degraded, not entitled |
| Data | Empty, populated, stale/unknown |
| Agent | Tenant internal only for this slice |

## 3. Required security cases

1. no token;
2. invalid/expired token;
3. valid user with no membership;
4. tenant A member requesting tenant B list;
5. tenant A member guessing tenant B resource ID;
6. role missing read capability;
7. role with read but missing create/update/convert;
8. tenant admin attempting platform staff mode;
9. observer attempting a write;
10. model/tool payload supplies a different tenant ID;
11. contact timeline leaks sensitive fields;
12. Growth aggregate reveals a forbidden module;
13. logs/errors expose no secrets or raw tokens.

## 4. CI expectations

Required checks for each delivery unit:

```text
contracts
api typecheck/build
api unit/integration
app-web typecheck/build/test
tenant isolation
security/RLS regression where schema is touched
phase8:routes:check
legacy regression relevant to route ownership
```

Do not dismiss broad CI failures merely because local focused tests pass. Classify whether each failure is:

- introduced;
- pre-existing and unrelated, with evidence;
- environmental;
- blocked by an unavailable secret/service.

An unexplained failure is not green.

## 5. Evidence files

Create:

```text
docs/reengineering/04-migration/phase-8/EVIDENCE-A-FIRST-PRODUCT-FOUNDATION.md
docs/reengineering/04-migration/phase-8/EVIDENCE-B-FIRST-CRM-GROWTH-SLICE.md
```

Each uses [`../EVIDENCE-TEMPLATE.md`](../EVIDENCE-TEMPLATE.md) and records:

- base/head SHA;
- contracts/endpoints;
- app/API image identities when deployed;
- tenant/role fixture labels (no secrets);
- allow/deny table;
- parity/reconciliation;
- idempotency/concurrency;
- audit/outbox;
- correlation/logs;
- route ownership;
- rollback;
- open UNKNOWN;
- docs updated.

## 6. Staging deploy

Only after the applicable gate:

- build immutable full-SHA `app-web` and `api` images;
- promote the exact tested images;
- keep workers independent;
- expose git SHA in health;
- update clean-host implementation log/HOST facts after any VPS mutation;
- do not infer product correctness from HTTP 200.

No production hostname or database is touched.

## 7. Rollback

### Unit A

- route `app-web` prefix back to prior owner;
- redeploy previous API SHA if compatibility issue;
- no database rollback because Unit A has no schema/write migration.

### Unit B

- stop new write traffic;
- flip CRM/Growth route ownership back only if legacy remains compatible;
- preserve additive schema/data;
- disable new handlers by capability/feature gate;
- reconcile in-flight outbox/jobs;
- redeploy previous SHA;
- never perform destructive down migration as rollback.

The rollback plan must name how writes made by Unit B remain readable by legacy. If they do not, the authority flip cannot occur.

## 8. Documentation sync

After each unit:

- Phase 8 board and evidence;
- autonomous-marketing implementation plan;
- STATUS only if a gate/state actually moves;
- clean-host log/HOST only after infrastructure mutation;
- accepted ADR index if a decision changes.

## 9. Completion vocabulary

| State | Meaning |
| --- | --- |
| PLANNED | Docs exist |
| IMPLEMENTED | Code exists locally/branch |
| TESTED | Required automated tests pass |
| DEPLOYED | Exact SHA runs on staging |
| VERIFIED | Live behavior and safety evidence pass |
| BLOCKED | Named prerequisite prevents progression |
| UNKNOWN | Not observed/proven |

Never convert IMPLEMENTED into VERIFIED by wording.
