# Agent instructions (Impulsionando)

This file is the **entry checklist** for every agent session. Detailed authority lives under `docs/reengineering/`. Cursor always-apply rules under `.cursor/rules/` enforce the same bar.

## Read first (every task)

1. `docs/reengineering/STATUS.md` — current phase + forbidden actions  
2. Accepted ADRs → `docs/reengineering/02-target-architecture/` → evidence  
3. Always-apply rules:
   - `.cursor/rules/impulsionando-reengineering.mdc`
   - `.cursor/rules/impulsionando-implementation.mdc`
   - `.cursor/rules/impulsionando-clean-vps-log.mdc` (when touching clean VPS)

## After every implementation (mandatory)

Follow **Implementation close-out** in `.cursor/rules/impulsionando-implementation.mdc`:

- Report what changed (paths, SHAs, hostnames, project refs — **no secrets**)
- Update the correct evidence doc (phase board, `clean-host/` log, restore evidence, etc.)
- Sync `STATUS.md` if a gate moved
- Do not claim proven what was only planned or HTTP-200

## Never without an explicit gate

Nest bootstrap · Dokploy on legacy VPS · wipe legacy · prod DNS cutover · `db push`/reset prod · mechanical move of all routes · secrets in git/chat · treat `latest` / `build-info.ts` as release identity
