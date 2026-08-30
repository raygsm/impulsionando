# Product clarifications — 2026-08-30

Source: answers from Cauã during reengineering onboarding.  
Authority: this file and the rest of `docs/reengineering/` override older `docs/` and `mem/` for product intent and program behavior.

Evidence level for each row is explicit. Unproven items stay `UNKNOWN`.

| # | Topic | Decision / belief | Evidence level | Implication |
| ---: | --- | --- | --- | --- |
| 1 | Impulsionando as platform vs `company` row | Unknown; database is messy and will likely need refactor | `UNKNOWN` | Do not invent a company/tenant model in Phase 0. Inventory both; canonical identity is a Phase 1 decision. |
| 2 | `company_id` ≡ tenant | Believed true, not proven for every table | `DECLARED` belief / `UNKNOWN` proof | Treat `company_id` as the dominant legacy tenant key; do not mechanistically rename; prove table-by-table. |
| 3 | Vertical ownership | Raygs owns everything. Clients only have user access to web apps. No client infra/admin of platform. | `DECLARED` | Matches Phase 0 access model. Product/ops owner for all P0 verticals = Raygs; technical approvers = Cauã + Raygs. |
| 4 | Monday readiness scope | All critical journeys for Impulsionando, Chrismed, Colors, WMP are in scope. Sequence by assumed usage/risk, not equal parallelization. | `DECLARED` | See prioritization below. Urgency does not skip gates. |
| 5 | Data sensitivity | Mostly demo/seed, but some real users exist. **Treat all data as real.** | `DECLARED` | No production user export; anonymized fixtures; clinical/payment characterization needs approval. |
| 6 | Canonical payment provider | See [`../phase-0/PAYMENTS-CANONICAL.md`](../phase-0/PAYMENTS-CANONICAL.md): Impulsionando SaaS = Mercado Pago; tenant commerce = own gateway; Colors = MaisFy; CHRISMED = MP segregated; Paddle not canonical; sandbox TEST pattern without homologated account ID | `DECLARED` intent | J-05 characterization uses this matrix; no secrets in Git |
| 7 | Client-side product separation | Tenant applications are totally separate from each other on the client side (each feels like its own product). | `DECLARED` | White-label / separate UX surfaces are intentional. Shared auth/backend may still exist; do not force a single visible shell in characterization. |
| 8 | WhatsApp / Evolution / Meta | Unknown | `UNKNOWN` | J-06 stays inventory-first. |
| 9 | AI assistants | High-priority todo — keep visible and important | `DECLARED` intent | Not Phase 6 implementation now. Inventory and risk-bound (J-14) stay high priority in Phase 0 backlog; no governed AI platform build yet. |
| 10 | Documentation authority | Ignore older files as governance. Reference = app intention + `docs/reengineering/`. | `DECLARED` | Product-map + reengineering win over historical `docs/*` and `mem/*`. |

## Assumed usage / risk prioritization (within the four P0 tenants)

This is an engineering hypothesis for sequencing characterization, not proof of traffic.

### Shared foundations (block everything else)

1. **J-01** host → runtime → release → SHA  
2. **J-15** single temporary publish authority  
3. **J-16** backup + isolated restore  
4. **J-02** auth / session / membership / deny  
5. **J-03** onboarding / membership / modules  

### Then by product (assumed criticality)

| Order | Product | Why first | Journey focus after foundations |
| ---: | --- | --- | --- |
| 1 | Impulsionando | Platform acquisition + Core admin; other tenants hang off platform concepts | J-04 acquisition → J-05 billing (when provider known) → J-06/J-07 platform automation → J-13 support/status |
| 2 | Chrismed | Highest sensitivity (health/docs/fiscal); P0 tenant #2 | J-08 care path; J-06 WhatsApp; payment/payout only with approval |
| 3 | Colors Saúde | Money + webhooks + worker/automation coupling | J-09 order/webhook/affiliate/automation; Iris under J-14 inventory |
| 4 | WMP | Ops/contracts/evidence; still P0 but after money/health foundations | J-10 proposal → contract → evidence |

Ana Madu / RioMed / others remain on the map but behind these four unless Raygs reprioritizes.

## Open follow-ups (do not block Phase 0 topology work)

- Whether a single Supabase user can belong to multiple companies while UX stays separate per host.
- Password-reset canonical host (legacy code pointed at apex) vs per-tenant reset UX.
- Homologated Mercado Pago / MaisFy **sandbox account IDs** (pattern known; specific accounts UNKNOWN).
- Live Evolution/Meta/n8n inventory (#8).
