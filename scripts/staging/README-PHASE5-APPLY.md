# Phase 5 pending SQL — staging Dashboard apply

**Staging project only:** `aamorcqznimmleafavai`  
**Never** run on prod (`arygtqrdpcdkwnuwsgmm`).

Paste bundle: [`PHASE5-PENDING-DASHBOARD.sql`](./PHASE5-PENDING-DASHBOARD.sql)  
(5B residual GRANT + 5C–5G migrations, in order.)

## Steps

1. **Open Dashboard SQL** — In Supabase, open project `aamorcqznimmleafavai` → SQL Editor (new query).
2. **Paste and run** — Paste the full contents of `PHASE5-PENDING-DASHBOARD.sql` and execute once. Safe to re-run if a prior paste failed mid-way (idempotent `IF NOT EXISTS` / `CREATE OR REPLACE` / re-runnable `GRANT`).
3. **Set Dokploy `WEBHOOK_SECRET_REENGINEERING_SMOKE`** — On clean-host Dokploy service `reengineering-api`, set env `WEBHOOK_SECRET_REENGINEERING_SMOKE` (staging smoke secret; not committed here). Redeploy/restart if the platform requires it for env pickup. Needed (with this DDL) so `POST /api/v1/webhooks/…` stops returning **503**.
4. **Residual table GRANTs (if 5C/5F live smokes fail with permission denied)** — paste [`PHASE5-RESIDUAL-SERVICE-ROLE-GRANTS.sql`](./PHASE5-RESIDUAL-SERVICE-ROLE-GRANTS.sql) once (outbox + CRM `service_role` SELECT/INSERT/UPDATE).
5. **Verify residual smokes** — From repo root (with `.env.staging` + optional `~/.config/impulsionando/staging-operator-secrets.env`):

   ```bash
   npm run phase5:staging:verify
   ```

   One entrypoint (`scripts/phase5-staging-verify-all.mjs`) runs Phase 5 residual smokes in order and prints a PASS/FAIL/SKIP matrix. Defaults `PHASE3_API_BASE` to `https://api.stg.impulsionando.com.br`. Skips steps gracefully when required env is missing (no need to memorize individual `phase5:smoke:*` names). Never prints secrets. Does not SSH.

Do not SSH from this checklist. Do not start Phase 6 until Phase 5 is CLOSED in `docs/reengineering/STATUS.md`.
