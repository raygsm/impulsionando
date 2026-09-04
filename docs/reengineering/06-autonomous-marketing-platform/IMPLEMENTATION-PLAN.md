# Implementation plan — Next.js `app-web` (autonomous marketing dashboard)

Created: **2026-09-04**  
Depends on: ADR-009 **Aceita** (currently **Proposta**) + Phase 8 **G0**.

## Wave 0 — this branch (scaffolding)

1. Preset audit (done in `NEXTJS-PRESET-AUDIT.md`).
2. ADR-009 Proposed.
3. Import stripped preset into `apps/app-web`.
4. `packages/api-client`, `packages/auth`, `packages/config` as needed by the shell.
5. Invariant IA routes + module-state components + Help (Nest support) + agent dock (Nest AI).
6. Tests + local production build.
7. **Do not** Traefik-promote, DNS, or prod.

## Wave 1 — after G0 + Aceita ADR

- Staging host `app.stg.impulsionando.com.br` (human Cloudflare).
- GHCR SHA image; smoke `/healthz` gitSha.
- Cookie dual-write with legacy (F3).

## Wave 2 — identity spine (Phase 8 S*)

Wait for Nest `identity` + capability ADR (G1). UI remains cosmetic.

## Wave 3 — product slices

P-lane Nest modules; flip route-ownership prefixes; retire legacy files per slice.

## Rollback

See ADR-009. Feature branch revert restores the 4B health stub.
