# Payments — canonical provider matrix

Date recorded: 2026-08-30  
Source: Cauã consolidation of prior product decisions (“checkout answer”).  
Evidence level: **`DECLARED` intent** — not live account homologation, not CHARACTERIZED webhook behavior.

This closes the deferred clarification #6. It does **not** prove production credentials, sandbox account IDs, or idempotent webhook behavior.

## Technical rule (canonical)

| Surface | Canonical provider | Notes |
| --- | --- | --- |
| **Impulsionando SaaS billing** | **Mercado Pago** | Plans, recurring charges, delinquency, suspension/reactivation, and platform payments for Impulsionando itself. |
| **Generic tenant storefront / commerce** | **Tenant’s own acquirer/platform** | No universal mandatory gateway. Integrated via Core adapters; do not force Mercado Pago for every tenant checkout. |
| **Colors Saúde checkout** | **MaisFy** | Explicit prior decision: **do not** create a parallel Colors checkout on Mercado Pago. Monetizze / PerfectPay may exist in history/ops; **not** current canonical Colors checkout. |
| **CHRISMED** | **Mercado Pago (segregated)** | Own MP account/credentials, **separate** from Impulsionando Core MP account. |
| **Paddle** | **Not canonical** | Code may exist; do **not** replace Mercado Pago with Paddle without a **new architectural decision** (ADR). |

## Sandbox / test credentials

- Architecture anticipates Mercado Pago **TEST-…** credentials separate from production **APP_USR-…**, with segregation between **Core Impulsionando** and **CHRISMED**.
- A specific homologated sandbox account (“use this one”) was **not** identified in the consolidation or in a reliable repo search.
- Status: **sandbox pattern DECLARED; concrete account UNKNOWN / not homologated in this record.**

Do not paste secrets, access tokens, or full credential IDs into this directory.

## Implications for Phase 0 / J-05

- Characterization and migration of billing must treat **Impulsionando SaaS** and **CHRISMED** as **two MP tenants/accounts**, not one shared wallet.
- Colors payment characterization targets **MaisFy** webhooks/state, not MP.
- Other tenants: discover per-tenant gateway before assuming MP.
- Paddle modules remain legacy/optional until an ADR says otherwise.
- Still required before calling J-05 CHARACTERIZED: signed webhook proof, idempotency/replay, reconciliation owner, and confirmed prod vs test credential owners (without storing secrets in Git).

## Related

- Clarifications: [`../product-map/CLARIFICATIONS-2026-08-30.md`](../product-map/CLARIFICATIONS-2026-08-30.md)
- Journey: [`../product-map/JOURNEYS.md`](../product-map/JOURNEYS.md) J-05
- Integrations catalog: [`INTEGRATIONS.md`](INTEGRATIONS.md)
