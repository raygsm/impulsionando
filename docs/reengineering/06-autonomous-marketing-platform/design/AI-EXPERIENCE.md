# AI experience

Created: **2026-09-04**  
Authority: [`../AI-OPERATING-MODEL.md`](../AI-OPERATING-MODEL.md). Nest gateway only. Models never get service-role keys from the UI.

## Rule

AI must never feel magical. Every surface answers:

| Question | Where it is shown |
| --- | --- |
| Which agent? | Scope chip: name + kind |
| Which company? | Tenant name in chip and header |
| What information? | Source list |
| Stale? | Freshness caption or **Pode estar desatualizado** |
| Recommending vs preparing vs executing? | State badge (below) |
| Approval required? | Prepared card + Aprovar |
| Succeeded? | Receipt |
| Reach a human? | Falar com pessoa |
| Stop / undo? | Parar (stream) · Descartar (prepared) · Desfazer if API (`UNKNOWN` hide if missing) |

Do **not** show unsupported confidence percentages.

## Three agents (never confuse)

| Kind | Users | Chrome | Color | Mount |
| --- | --- | --- | --- | --- |
| Internal business agent | Tenant users | Panel + dock; chip `{AgentName} · {Tenant}` | Tenant action (validated) | `app-web` Home/shell |
| Impulsionito | Staff only | Same panel; chip **Impulsionito · Impulsionando** | Impulso `#C81E3A` | Staff routes only — **not** tenant Home |
| Client-facing | Consumers | Public bubble; no admin nav | Tenant brand on public | `tenant-web` |

If the chip is missing, the panel is not shippable.

## Visual states

| State | Badge label (PT-BR) | Visual | User can |
| --- | --- | --- | --- |
| `READ` | Leitura | Ink, no dashed border | Ask more |
| `RECOMMEND` | Recomendação | Info icon + blue-info text | Accept as suggestion, not run |
| `PREPARED` | Preparada — não executada | Dashed mulberry border, summary | Aprovar / Descartar |
| `APPROVAL_REQUIRED` | Precisa da sua aprovação | Action fill **Aprovar** + risk sentence | Approve or discard |
| `EXECUTED` | Executada | Success badge + receipt id | Undo if offered |
| `FAILED` | Não concluída | Danger + retry/handoff | Retry / human |
| `FORBIDDEN` | Sem permissão | Lock + explanation | Handoff |
| `HUMAN_HANDOFF` | Encaminhada a uma pessoa | Help ticket id | Open ticket |

`PREPARED` is **not executed**. Never style it like success.

## Action color discipline

- Composer **Enviar** is secondary (ink outline) — sending a question is not a brand stamp.
- **Aprovar** is the only action-colored button in the panel when a prepared card is present.
- Stop is ghost/danger text, not action fill.

## Streaming

- `aria-live="polite"` on the growing assistant message.
- `aria-live="assertive"` only for FAILED / FORBIDDEN.
- Reduced motion: no pulse cursor.

## Risk language

- Finance / send-to-customers / delete: extra sentence **Esta ação afeta dinheiro ou clientes.** before Aprovar.
- Do not soften with “é só um clique”.

## Unavailable / degraded

- Chip shows **Indisponível** or **Instável**.
- Composer disabled; handoff enabled.
- Do not keep a fake “online” dot.

## Staff Impulsionito extra

- Tenant picker inside panel is explicit; default **no tenant loaded**.
- Cross-tenant aggregates only via allowed tools; UI never dumps raw rows.

## Client-facing (public)

- Introduces itself as the **business** agent, not Impulsionando.
- Cannot access admin widgets, finance, or other tenants.
- Handoff is “Falar com a empresa”, not Impulsionito.

## Incorrect

- Robot mascot, glowing brain, “99% certeza”.
- Autopilot banner that looks executed.
- Same avatar for all three agents.
