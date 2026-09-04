# Phase 8 — parallel speed plan

Created: **2026-09-04**
Program SoT: [`../../STATUS.md`](../../STATUS.md) · Board: [`README.md`](./README.md) · Authority: [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md)

> Goal: build the core app on the new stack as fast as parallelism honestly allows.
> Quality bar unchanged: allow **and** deny, parity on reads, idempotency and audit on writes, legacy owner retired per slice.
> **Staging only. No production cutover in any wave.**

## Parallel vs serialize

| May run in parallel | Must stay serial |
| --- | --- |
| F1–F7, F9 foundation tracks | F8 `common/` before any capability-guarded slice |
| P-lane and A-lane after S3 | S1 → S2 → S3 (each is the next one's input) |
| Contract authoring for future slices | S2 enforcement flip (log-only → enforcing) |
| Parity harness projections per slice | P7 → P9 (finance before self-service billing) |
| Staff console consolidation design | A4 billing-hub write paths after S4 |
| V-lane discovery notes | Any legacy route deletion after its observation window |

The spine is serial because each slice consumes the previous one's output: session feeds capabilities, capabilities feed entitlements, entitlements feed the shell. Everything downstream of the shell can fan out.

## Wave model

```text
Wave 0 (paper, LANDED): scope | capability map | app shape | slices | data | routing | gates | risks
        │
        ▼
Wave 1 (parallel):  8A foundation — F1 F2 F3 F4 F5 F6 F7 F9 ║ then F8
        │
        ▼
Wave 2 (serial):    8B/8C spine — S1 → S2(log-only → enforce) → S3 → S4 → S5
        │
        ├───────────────────────────────┐
        ▼                               ▼
Wave 3a (parallel P-lane)        Wave 3b (parallel A-lane)
  8D  P1 P2 P3   (read-only)       8G  A1 → A2 A3 A5 A6
  8E  P4 P5 P6 → P7, P8                    A4 (after S4)
  8F  P9 (after P7) , P10
        │                               │
        └───────────────┬───────────────┘
                        ▼
                Wave 4: 8H sweep — confirm zero legacy owners on migrated prefixes
                        │
                        ╳ ── V-lane DEFERRED (verticals + one-tenant ops)
                        ╳ ── production cutover = Phase 7, not here
```

## Wave 0 lanes — this landing

| Lane | Output | State |
| --- | --- | --- |
| **Scope** | [`CORE-APP-SCOPE.md`](./CORE-APP-SCOPE.md) | LANDED |
| **Map** | [`CAPABILITY-MAP.md`](./CAPABILITY-MAP.md) | LANDED |
| **Shape** | [`TARGET-APP-SHAPE.md`](./TARGET-APP-SHAPE.md) | LANDED |
| **Found** | [`FOUNDATION-TRACKS.md`](./FOUNDATION-TRACKS.md) | LANDED |
| **Slices** | [`SLICE-CATALOG.md`](./SLICE-CATALOG.md) | LANDED |
| **Data** | [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) | LANDED |
| **Route** | [`STRANGLER-ROUTING.md`](./STRANGLER-ROUTING.md) | LANDED |
| **Gates** | [`GATES.md`](./GATES.md) | LANDED |
| **Risk** | [`RISKS.md`](./RISKS.md) | LANDED |
| **Evid** | [`EVIDENCE-TEMPLATE.md`](./EVIDENCE-TEMPLATE.md) | LANDED |

Wave 0 produces **no code and no infrastructure mutation**. STATUS keeps Phase 8 at NOT STARTED until gate G0.

## Wave 1 — foundation (8A)

Eight tracks in parallel, one serial tail.

| Parallel | F1 app-web · F2 api-client · F3 auth · F4 config · F5 ui · F6 observability · F7 contracts · F9 CI+parity |
| --- | --- |
| **Then serial** | F8 `apps/api/src/common/` — validation, error envelope, correlation, **CapabilityGuard**, TenantScopeGuard, AuditInterceptor, ConfigModule |

Wave 1 closes on the six conditions in [`FOUNDATION-TRACKS.md`](./FOUNDATION-TRACKS.md) § *Exit criterion for 8A* — not on the app rendering.

## Wave 2 — spine (8B, 8C)

Strictly serial. S2 additionally splits in two:

| Step | S2 mode | Purpose |
| --- | --- | --- |
| 2a | **log-only** — compute the authorization decision, record it, allow the request | Discover which real usage the legacy UI-only model was silently permitting |
| 2b | **enforcing** — deny by default | Only after 2a's log shows no unexplained denials on staging |

Skipping 2a means discovering the gap by locking users out. The gap is real: the legacy audit found permissions are primarily UI-gated with inconsistent server checks.

## Wave 3 — product and staff, in parallel

Both lanes depend only on the spine, touch mostly disjoint data, and have different audiences.

| P-lane order | Reason |
| --- | --- |
| P1, P2, P3 (read-only) | Prove the full path with nothing at stake |
| P4 → P5 → P6 | Ascending operational blast radius |
| P6 → P7 | Finance consumes sales/inventory concepts |
| P7 → P9 | Never put self-service billing in front of an unproven finance module |
| P8 | Anywhere after S2, but privilege-escalation tests gate it |
| P10 | After the modules whose data it reports |

| A-lane order | Reason |
| --- | --- |
| A1 first | Everything staff-side needs the tenant registry |
| A2, A3, A5, A6 parallel | Disjoint surfaces |
| A4 after S4 | The billing gate must be server-authoritative before staff can suspend through it |

## Wave 4 — retirement sweep (8H)

Retirement is **not** a final wave; it happens inside each slice. Wave 4 only confirms:

| Check | Tool |
| --- | --- |
| Every migrated prefix has exactly one owner, and it is `app-web` | `npm run phase8:routes:check` |
| No orphaned `*.functions.ts` remain for migrated capabilities | repo scan recorded in evidence |
| The aggregate slice matrix is green | `npm run phase8:staging:verify` |
| A rollback of the most recent slice has been rehearsed | manifest flip, logged |

## Definition of done

| Milestone | Meaning |
| --- | --- |
| **Wave 0 done** | Planning docs landed; STATUS still shows Phase 8 NOT STARTED; no code, no infra mutation |
| **8A done** | `app-web` real and deployable by SHA; API on the `common/` pipeline with deny-by-default; correlation traced end to end |
| **Spine done** | One tenant's session, capabilities, entitlements, access policy and navigation served by the API, with allow+deny recorded |
| **8D–8F usable done** | A tenant operates the core product on `app-web` with no legacy owner on those prefixes |
| **8G usable done** | Staff operate the platform from the consolidated console; the 57 health pages are gone, not copied |
| **Phase 8 CLOSED** | The six conditions in [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) § *Critério de saída*, on staging |
| **V-lane** | Separate, per tenant or per product gate — never counted toward Phase 8 |

## Explicit exclusions

- Production DNS or production traffic for `app-web` — Phase 7 authority
- Any production schema write, `db push` or reset
- Porting the 283 staff routes one-for-one
- A write slice shipped before S2 is enforcing
- Building the intake product vision (Payments, revenue share, CRM Universal, regulated verticals) under this gate
- Declaring Phase 8 closed with the V-lane open — say **V-lane DEFERRED**, as Phase 7 says **7F PARKED**
- Secrets in git, chat or docs
