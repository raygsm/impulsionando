# Phase 8 — evidence FPS (F8 + S1-min + P2 Nest)

Opened: **2026-09-04T22:20Z** · Filled: — · Status: **NOT STARTED**
Slice: platform Support + necessary Nest · Overlay: [`STAKEHOLDER-DELTA.md`](./STAKEHOLDER-DELTA.md)
No secrets. Variable **names** only.

## Meta

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-09-04T22:20Z (paper only) |
| Operator | Nest / necessary-features agent |
| Environment | staging (`aamorcqznimmleafavai`) — **not mutated** |
| Clean host | `2.25.123.224` |
| `app-web` image | n/a |
| `api` image | Phase 6 exit until an FPS SHA exists |
| Runtime `gitSha` | — |
| Route prefixes claimed | none (`/support` stays `legacy`) |

## 1. Contracts and domain

| # | Item | Result | Notes |
| --- | --- | --- | --- |
| 1.1 | Contracts + tests | NOT STARTED | [`CONTRACTS.md`](./CONTRACTS.md) |
| 1.2 | Domain status table | NOT STARTED | `packages/domain/src/support/` |
| 1.3 | Legacy ticket sources enumerated | PASS (paper) | `abrir-ticket`, public create-ticket, `support-tickets.functions.ts`. **Not** cockpit / `support_sessions`. **Not** tenant CS |

## 2. Authorization

Matrix: [`ALLOW-DENY.md`](./ALLOW-DENY.md). Unfilled = FAIL if someone claims PASS.

## 3. Parity (reads)

Target = Phase 3 Nest / `support-tickets.functions.ts` on the same staging tenant. **Not** cockpit KPIs. **Not** a tenant service desk.

| # | Endpoint | Result |
| --- | --- | --- |
| 3.1 | `GET /support/tickets` | NOT STARTED |

## 4. Writes

| # | Case | Result |
| --- | --- | --- |
| 4.1 | Create idempotency replay | NOT STARTED |
| 4.2 | Status change audit/event | NOT STARTED |
| 4.3 | Create outbox (existing TX/fallback) | NOT STARTED |

## 5. Observability

| # | Item | Result |
| --- | --- | --- |
| 5.1 | Correlation across app-web and api | NOT STARTED (api echo can PASS F8 alone) |
| 5.2 | Error envelope has `correlationId` | NOT STARTED |
| 5.3 | Logs: no secrets | NOT STARTED |

## 6. Route ownership

N-A for Nest FPS PASS — prefix stays legacy until the UI agent + G0.

## 7. Data notes

| # | Item | Value |
| --- | --- | --- |
| 7.1 | Tables | `support_tickets.company_id`, `user_roles.company_id` |
| 7.2 | RLS | UNKNOWN until O3 |
| 7.3 | Migrations | none this session |
| 7.4 | SECURITY DEFINER | staff/observer RPCs + `create_support_ticket_with_outbox` — review at implement |

## 8. Gates

| Gate | Outcome |
| --- | --- |
| G0 | **PENDING** |
| PRD-DB-* | **PROPOSED** — overlay recorded, not Aceita |
| Slice DoD | NOT STARTED |

## 9. Open / UNKNOWN

| # | Item | Owner |
| --- | --- | --- |
| Q1 | `user_profiles` on staging | O1 |
| Q2 | Staff precedence | [`STAFF-RULE.md`](./STAFF-RULE.md) O2 |
| G0 | host + scope + reset host | humans |
| G1 | capability ADR | blocked on G0 |

## 10. Docs updated

- [x] this folder
- [x] [`../README.md`](../README.md) · [`../SLICE-CATALOG.md`](../SLICE-CATALOG.md) · [`../CAPABILITY-MAP.md`](../CAPABILITY-MAP.md)
- [x] [`../../../STATUS.md`](../../../STATUS.md)
- [ ] clean-host log — **no** host mutation
- [ ] [`../GATES.md`](../GATES.md) — G0 unchanged
