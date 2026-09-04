# Phase 8 — human gates (G0–G5)

Created: **2026-09-04**
Board: [`README.md`](./README.md) · Waves: [`PARALLEL-SPEED-PLAN.md`](./PARALLEL-SPEED-PLAN.md)

Gates are **human decisions**, not engineering milestones. Nothing below is executed by an agent on its own authority. Approvers per [`../../01-current-state/phase-0/OWNERSHIP-AND-GATES.md`](../../01-current-state/phase-0/OWNERSHIP-AND-GATES.md): Raygs (product), Cauã + Raygs (technical).

---

## G0 — Open Phase 8

**State: NOT STARTED** — no evidence file yet.

Opens Wave 1. Requires four decisions recorded, not merely acknowledged:

| # | Decision | Why it cannot be inferred |
| --- | --- | --- |
| 1 | **Scope accepted**: tenant product + consolidated staff console in; verticals and one-tenant ops deferred to the V-lane | Deferring 141 route files is a product call, not an engineering one |
| 2 | **Consolidation budget accepted**: ~295 staff routes → ≈35–45 screens; the 57 `admin.*-health` pages collapse into one parameterized surface | Deleting screens someone may rely on needs an owner |
| 3 | **Canonical authenticated staging host**: `app.stg.impulsionando.com.br` (Cloudflare A → `2.25.123.224`, grey/DNS-only) | Requires a human with Cloudflare access |
| 4 | **Password-reset canonical host closed** — still OPEN in ADR-008, currently pointing at the apex | Cross-app concern; blocks S1 |

Useful but **not blocking**: a production usage export answering *which authenticated screens anyone opens*. Absent it, the consolidation budget is a judgement call and must be recorded as one.

---

## G1 — Authorize the RBAC ADR

**Blocked on:** G0.

The capability model proposed in [`DATA-AND-IDENTITY-PLAN.md`](./DATA-AND-IDENTITY-PLAN.md) §3 must be written as an ADR using [`../../templates/ADR-TEMPLATE.md`](../../templates/ADR-TEMPLATE.md), indexed in [`../../05-governance/DECISIONS.md`](../../05-governance/DECISIONS.md), and accepted before slice S2 writes a guard.

| Must answer |
| --- |
| Canonical model: capability set, roles expanding into it |
| Fate of `profiles` / `permissions` / `profile_permissions` / `user_profiles` — and whether `user_profiles` exists in production (Q1) |
| Precedence rule for "Impulsionando staff" across `app_metadata`, master-company membership and RPC (Q2) |
| Whether the master-observer entitlement survives as a capability or a separate mode |

Getting this wrong is the most expensive mistake available in Phase 8: it is re-litigated by every subsequent slice.

---

## G2 — Authorize S2 enforcement (log-only → enforcing)

**Blocked on:** G1, and S2 running in log-only mode on staging long enough to produce a decision log.

| Evidence required |
| --- |
| Log-only run shows no unexplained denials for real staging usage |
| Every denial in the log is classified: *correct*, *missing capability grant*, or *bug* |
| Allow **and** deny recorded per capability domain, intra-tenant and cross-tenant |
| A handler without a capability decorator fails a test |

This is the moment authorization becomes real for the first time in the product's history. It gets its own gate because it can lock out working users.

---

## G3 — Authorize the first write slice (P4)

**Blocked on:** G2, and 8D closed (P1–P3 read-only proven).

| Evidence required |
| --- |
| Read-only slices show parity against legacy on the same staging tenant |
| One correlation ID traced across `app-web` → `api` → audit row |
| Rollback rehearsed: a migrated prefix flipped back to `legacy` and back again |
| Idempotency and audit proven on a non-domain write (e.g. support status update) |

---

## G4 — Authorize the self-service billing slice (P9)

**Blocked on:** G3, P7 closed, S4 closed.

The only slice in the tenant lane that can take money or lock out a paying customer.

| Evidence required |
| --- |
| Shadow-read period completed: new API computes subscription state, legacy remains authoritative, divergences recorded and explained |
| Provider webhook idempotency and replay-safety re-proven on staging (extends Phase 5D) |
| A documented, rehearsed procedure returns billing authority to legacy **without orphaned provider state** |
| No suspension, reactivation or charge occurs without an audit row |

---

## G5 — Declare Phase 8 closed

**Blocked on:** all of the above, plus the six conditions in [`../PHASE-8-CORE-APP.md`](../PHASE-8-CORE-APP.md) § *Critério de saída*.

| Must be true | Must **not** be claimed |
| --- | --- |
| A real tenant operates the core spine on `app-web` + Nest on staging | That production has moved — that is Phase 7 |
| Zero legacy owners on migrated prefixes | That the V-lane is done — say **V-lane DEFERRED** |
| Allow + deny recorded for every migrated capability | That green health checks constitute proof |
| Parity on reads, idempotency + audit on writes | That a rendering screen constitutes a migrated capability |
| Rollback rehearsed | — |

---

## Gate log

| Gate | State | Date (UTC) | Approver | Evidence |
| --- | --- | --- | --- | --- |
| G0 | **NOT STARTED** | — | — | — |
| G1 | BLOCKED on G0 | — | — | — |
| G2 | BLOCKED on G1 | — | — | — |
| G3 | BLOCKED on G2 | — | — | — |
| G4 | BLOCKED on G3 | — | — | — |
| G5 | BLOCKED on G4 | — | — | — |
