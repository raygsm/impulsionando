# Implementation rules (agents)

Opened: **2026-08-30**  
Status: **ACTIVE**  
Mirrors: root [`AGENTS.md`](../../../AGENTS.md), `.cursor/rules/impulsionando-implementation.mdc`

## Purpose

One place in `docs/reengineering/` that states what every agent must do on **every** implementation task: stability, maintainability, readability, and **reporting**.

## Before

- Check [`STATUS.md`](../STATUS.md) and phase boards; refuse out-of-gate work.
- Smallest viable change; no unrelated cleanup.

## During

| Concern | Rule |
| --- | --- |
| Stability | No prod destructive DB ops; isolate staging/clean from legacy; immutable SHA releases later; HTTP 200 ≠ healthy |
| Maintainability | Contracts before inventing APIs; forward-only migrations when authorized; clear placeholders |
| Readability | Match repo style; no secret noise in docs; UNKNOWN when unproven |
| Safety | No secrets in git/chat; allow **and** deny for tenant tests |

## Close-out (mandatory)

1. User-facing **report**: changed / verified / open.
2. **Evidence file** updated (clean-host log, restore evidence, STATUS, or phase README).
3. Never close a phase on scaffold-only or backup-without-restore.

## Related

- Feature-level DoD: [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) (migrated feature bar; stricter than task close-out)
- [`.cursor/rules/impulsionando-reengineering.mdc`](../../../.cursor/rules/impulsionando-reengineering.mdc)
- [`.cursor/rules/impulsionando-clean-vps-log.mdc`](../../../.cursor/rules/impulsionando-clean-vps-log.mdc)
- Clean host log: [`../04-migration/phase-2/clean-host/`](../04-migration/phase-2/clean-host/README.md)
