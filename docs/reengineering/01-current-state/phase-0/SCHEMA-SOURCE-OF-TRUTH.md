# Schema source of truth — Phase 0 decision

Date: 2026-08-30  
Status: **Phase 0 observational decision** (not an accepted ADR; does not authorize schema push/reset or type regeneration as SoT)

## Decision

1. **Live Supabase structure** (inventário em [`SUPABASE-LIVE-AUDIT.md`](SUPABASE-LIVE-AUDIT.md) + CSVs em `.local/phase0-evidence/`) is the **observational baseline** of production reality.
2. Repository `supabase/migrations/` and generated `src/integrations/supabase/types.ts` are **historical / divergent artifacts**, not authority for production shape.
3. **Forbidden in Phase 0 (and until Phase 1 strategy exists):** `db push`, `db reset`, destructive migrate-to-match, or regenerating types and treating them as the contract to “fix” live.
4. **Reconciliation strategy** (how to converge migrations ↔ live ↔ types, expand/contract, staging) is **deferred to Phase 1**.

## Evidence of drift (already collected)

- Live public tables 577 vs typed snapshot 465; intersection only 142.
- Migration history vs repo files diverge materially (see live audit).

## Migration decision for the schema corpus

`unknown` → pending Phase 1 contracts; operational posture now = **observe live, do not “fix” toward repo**.
