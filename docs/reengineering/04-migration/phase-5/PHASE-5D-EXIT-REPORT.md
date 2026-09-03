# Phase 5D — Secure webhook boundary (repo-complete)

Status: **STAGING-CLOSED** — webhook ingress live **PASS** (verify 8/8 · 2026-09-03T03:40Z) · Phase 5 **CLOSED**  
Opened: **2026-09-02**  
Authority: [`../PRODUCT-INTAKE-ACTION-PLAN.md`](../PRODUCT-INTAKE-ACTION-PLAN.md) § Phase 5D · [`../PHASE-5-INTEGRATIONS.md`](../PHASE-5-INTEGRATIONS.md)

## Delivered in repo

| # | Item | Path |
| --- | --- | --- |
| 1 | WebhookEnvelope + HMAC / skew / redaction helpers | `packages/contracts/src/webhook.ts` |
| 2 | Contracts export block (5D-marked) | `packages/contracts/src/index.ts` |
| 3 | Nest ingress `POST /api/v1/webhooks/:provider` | `apps/api/src/webhooks/` |
| 4 | Ingress audit migration + RPC | `supabase/migrations/20260902210000_phase5d_webhook_ingress.sql` |
| 5 | Contract tests | `tests/reengineering/webhook.contract.test.ts` |
| 6 | Smoke skeleton (default DRY_RUN) | `scripts/smoke-reengineering-webhook-ingress.mjs` |

## Security properties (repo)

- Default-deny unknown providers (`reengineering.smoke` allowlisted only).
- HMAC-SHA256 over `${timestamp}.${rawBody}` with timing-safe compare.
- Timestamp skew window default **300s**.
- Idempotency scope `provider:idempotencyKey`; durable duplicate → `REPLAY_DUPLICATE`.
- Logs / audit store `payload_sha256` + redacted JSON — never raw body / secrets.
- Env var **name** only: `WEBHOOK_SECRET_REENGINEERING_SMOKE`.
- Ingress does **not** call external provider networks.

## Operator close checklist (staging)

1. Apply migration `20260902210000_phase5d_webhook_ingress.sql` on staging (`aamorcqznimmleafavai`) — **not** prod.
2. Deploy API image that includes `WebhooksModule`.
3. Set `WEBHOOK_SECRET_REENGINEERING_SMOKE` on staging API (value never committed / never pasted into docs).
4. Run contracts: `npm run test:phase5d:contracts` (or `vitest run tests/reengineering/webhook.contract.test.ts`).
5. Dry-run smoke: `node scripts/smoke-reengineering-webhook-ingress.mjs` (`DRY_RUN=1` default).
6. Live staging smoke only when ready: `DRY_RUN=0` against `api.stg` — prove 202 accept, 401 bad sig, 409 replay, 400 stale.
7. Record evidence in `STATUS.md` / clean-host log when staging verified — **do not mark Phase 5 CLOSED** on repo-complete alone.

## Exit gate

- Valid signature → **202** + ingress row (`signature_ok=true`).
- Bad signature → deny + audit (`signature_ok=false`).
- Replay same idempotency key → **409** + `replay_rejected=true`.
- Stale timestamp → deny (`STALE_TIMESTAMP`).
- Correlation id echoed from ingress through audit row.

## Explicitly out of scope here

- Live 5A/5B deploy verification.
- Phase 5C outbox (separate agent).
- Real provider webhooks (Mercado Pago, Meta, etc.).
- Legacy VPS / prod DB apply.
