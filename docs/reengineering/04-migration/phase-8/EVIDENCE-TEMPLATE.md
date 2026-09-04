# Phase 8 — evidence template

Created: **2026-09-04**
Use: copy to `EVIDENCE-<SLICE-ID>.md` in this folder when a slice starts. One file per slice, filled as the slice runs, not written afterwards from memory.

Follows the Phase 7 evidence convention ([`../phase-7/EVIDENCE-7A.md`](../phase-7/EVIDENCE-7A.md)) with the Phase 8 additions: parity, allow/deny, retirement.

---

```markdown
# Phase 8 — evidence <SLICE-ID> (<slice name>)

Opened: **YYYY-MM-DDThh:mmZ** · Filled: **YYYY-MM-DDThh:mmZ** · Status: **NOT STARTED | IN PROGRESS | PASS | FAIL**
Slice: [`SLICE-CATALOG.md`](./SLICE-CATALOG.md) §<ID> · Board: [`README.md`](./README.md)
No secrets. Environment variable **names** only.

## Meta

| Field | Value |
| --- | --- |
| Date (UTC) | |
| Operator | |
| Environment | staging (`aamorcqznimmleafavai`) |
| Clean host | `2.25.123.224` |
| `app-web` image | `ghcr.io/raygsm/impulsionando-app-web:<full-sha>` |
| `api` image | `ghcr.io/raygsm/impulsionando-api:<full-sha>` |
| Runtime `gitSha` (app-web `/healthz`) | |
| Runtime `gitSha` (api `/health`) | |
| Tenant(s) under test | slug + role of each test identity |
| Route prefixes claimed | e.g. `/crm` |
| Accepted frontend ADR/runtime | ADR + landed commit, never draft assumption |
| Phase 8 authorization | G0/G1/G2/G3/later |
| Applicable database gates | DB0–DB9 pointers |

## 1. Contracts and domain

| # | Item | Result | Notes |
| --- | --- | --- | --- |
| 1.1 | Contract file landed with tests | PASS/FAIL | `packages/contracts/src/<x>.ts` |
| 1.2 | Domain rules extracted, framework-free, unit-tested | PASS/FAIL/N-A | `packages/domain/src/<x>/` |
| 1.3 | Legacy source enumerated (routes + `*.functions.ts`) | PASS/FAIL | list the files that will be deleted |

## 2. Authorization — allow and deny

Both directions are mandatory. A slice with only allow results is **FAIL**.

| # | Case | Identity | Expected | Actual | Result |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Member of tenant A reads A | tenant-a-member | 200 | | |
| 2.2 | Member of tenant A reads **B** | tenant-a-member | 403 | | |
| 2.3 | Role without the capability | tenant-a-viewer | 403 | | |
| 2.4 | Unauthenticated | — | 401 | | |
| 2.5 | Staff-only endpoint hit by a tenant admin | tenant-a-admin | 403 | | |
| 2.6 | Handler without a capability decorator | — | test fails | | |
| 2.7 | Privilege escalation (grant a capability not held) | tenant-a-admin | 403 | | for P8/A-lane |

## 3. Parity against legacy (read paths)

`npm run phase8:parity -- --slice=<ID>`

| # | Endpoint / view | Legacy source | Fields compared | Divergences | Result |
| --- | --- | --- | --- | --- | --- |
| 3.1 | | | | | PASS/FAIL |

Every divergence is either **explained** (with the reason) or the field is **removed**, never left unexplained.

## 4. Writes — idempotency and audit

| # | Case | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| 4.1 | Create replayed with the same `Idempotency-Key` | one entity, one effect | | |
| 4.2 | Sensitive action produces an audit row (actor, tenant, before/after) | present | | |
| 4.3 | State change emits an outbox event | present in `reengineering_event_outbox` | | |
| 4.4 | Concurrent conflicting writes | no lost update / no double effect | | for P5/P6 |

## 5. Observability

| # | Item | Result |
| --- | --- | --- |
| 5.1 | One correlation ID visible across `app-web` and `api` logs for one request | |
| 5.2 | Errors return the standard envelope with `correlationId` | |
| 5.3 | Logs contain no sensitive values | |

## 6. Route ownership and retirement

| # | Step | Timestamp (UTC) | Result |
| --- | --- | --- | --- |
| 6.1 | `npm run phase8:routes:check` before the flip | | |
| 6.2 | Manifest prefix flipped to `app-web` | | |
| 6.3 | Observation window (duration, error rate, traces) | | |
| 6.4 | **Rollback rehearsed** — flipped back to `legacy` and forward again | | |
| 6.5 | Legacy route files deleted | | list |
| 6.6 | Legacy `*.functions.ts` deleted | | list |
| 6.7 | `npm run phase8:routes:check` after retirement | | |

A slice without 6.4 and 6.5 is **IN PROGRESS**, not PASS.

## 7. Data notes

| # | Item | Value |
| --- | --- | --- |
| 7.1 | Tables touched, and their tenant column per the registry | |
| 7.2 | RLS state of each table (enabled / policies / none) | |
| 7.3 | Migrations applied (staging only, expand/contract) | |
| 7.4 | SECURITY DEFINER functions wrapped, and their review outcome | |
| 7.5 | Accepted physical target/access decision | |
| 7.6 | Source classifications and every browser/n8n/webhook/cron writer | |
| 7.7 | Backfill/reconciliation/shadow-read evidence | |
| 7.8 | Write/read authority before and after | |

For the first CRM/Growth vertical, record accepted P-DB-06 conversion semantics. Without it, conversion metric/write acceptance is **BLOCKED**.

## 8. Gate outcome

| Gate | Outcome | Evidence pointer |
| --- | --- | --- |
| Slice DoD ([`../../05-governance/DEFINITION-OF-DONE.md`](../../05-governance/DEFINITION-OF-DONE.md)) | PASS/FAIL | |
| Cross-cutting rules ([`SLICE-CATALOG.md`](./SLICE-CATALOG.md) § *Cross-cutting rules*) | PASS/FAIL | |

## 9. Open / UNKNOWN after this slice

| # | Item | Why it stays open | Owner |
| --- | --- | --- | --- |
| | | | |

## 10. Docs updated

- [ ] [`README.md`](./README.md) subphase board
- [ ] [`../../STATUS.md`](../../STATUS.md) if a gate moved
- [ ] [`../phase-2/clean-host/IMPLEMENTATION-LOG.md`](../phase-2/clean-host/IMPLEMENTATION-LOG.md) if the clean host changed
- [ ] [`GATES.md`](./GATES.md) gate log
```
