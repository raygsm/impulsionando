# Content guidelines

Created: **2026-09-04**  
Product UI: **Brazilian Portuguese**. This file: English rules. Strings: [PT-BR-COPY-DECK.md](./PT-BR-COPY-DECK.md).

## Voice

Counter manager: clear, specific, respectful. You/your = **você**. Company = **sua empresa**.

## Words to prefer / avoid

| Prefer | Avoid |
| --- | --- |
| Assistente / {nome} | Bot, IA mágica, GPT |
| Preparada — não executada | “Já fiz”, “Pronto” (if not executed) |
| Sem dados | 0, “—”, empty KPI that looks like zero |
| Indisponível / Sem permissão | 404, “Forbidden”, “Error 403” as the only text |
| Falar com pessoa | “Escalation”, “Handoff” |
| Configurando | “Provisioning” |
| Instável / Com falha | “Degraded” as the only label |

English technical terms allowed when the operator already uses them (e-mail, WhatsApp, PDF). Do not invent English for buttons.

## Status names (product)

Use the PT-BR deck. Map backend enums; never show raw `NOT_ENTITLED` to operators.

## Empty

Name what’s missing and the next step. “Ainda não há leads. Importe ou cadastre o primeiro.”

## Errors

1. What happened. 2. What to do. 3. Persist id for Help if useful (staff).

## Setup

Blueprint language: “Recomendado para restaurantes”, not “Vertical pack V-lane”.

## AI

State labels from AI-EXPERIENCE. Approval warnings name money/customers when relevant.

## Finance

- `R$ 1.234,56` with `pt-BR`.
- Never joke. Confirm destructive.

## Unknown data

**Sem dados** + optional “Ainda não temos essa informação.” Never a fake sparkline.

## Degraded integration

“O envio de mensagens está instável. Nada foi marcado como enviado.” + link Integrações.

## Support / handoff

“Abrimos um chamado para uma pessoa da Impulsionando.” Tenant client-facing: “Vamos chamar alguém da {empresa}.”

## Capitalization

Sentence case. Buttons: **Entrar**, **Aprovar**, **Salvar**. Not Title Case English.

## Inclusive

Avoid gendered job assumptions. “A pessoa responsável”, “quem atende”.
