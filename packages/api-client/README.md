# `@impulsionando/api-client`

Typed fetch client over `@impulsionando/contracts` envelopes.

- Bearer forwarding
- `X-Correlation-Id`
- `Idempotency-Key` on writes
- Bounded retry on GET only
- Maps 401 / 403 / 404 / 409 / 5xx to `ApiClientError`

Does **not** import `apps/api` internals.
