# Réguas N8N — Impulsionando

Fluxos prontos para importar no N8N (Cloud ou self-hosted). Todos consomem
**eventos** publicados pelo backend via webhook (Lovable Cloud) e disparam
ações em **WhatsApp (Z-API/Meta)**, **E-mail (Resend)** e **CRM interno**.

## Eventos esperados (contrato)

| Evento | Origem | Quando dispara | Payload mínimo |
|---|---|---|---|
| `lead.captured` | site/landing | submit do formulário | `{ email, name?, source, utm:{} }` |
| `trial.started` | server fn `trial_create` | provisioning do trial | `{ tenantId, email, plan, trialEndsAt }` |
| `trial.day3.silent` | cron diário | nenhum login até D+3 | `{ tenantId, email }` |
| `trial.ending.soon` | cron diário | 48h antes do fim | `{ tenantId, email, hoursLeft, plan }` |
| `trial.expired` | cron diário | passou do `trialEndsAt` | `{ tenantId, email, plan }` |
| `checkout.started` | front | clique em "Assinar" | `{ email, plan, annual, modules:[] }` |
| `checkout.abandoned` | cron 30min | started sem `paid` | `{ email, plan, recoverUrl }` |
| `invoice.paid` | webhook MP | pagamento confirmado | `{ tenantId, email, invoiceId, amount, plan }` |
| `invoice.overdue` | cron diário | fatura > vencimento | `{ tenantId, email, invoiceId, dueDate, payUrl }` |
| `subscription.cancelled` | server fn | cancelamento solicitado | `{ tenantId, email, reason? }` |
| `nps.due` | cron mensal | 30 dias após paid | `{ tenantId, email, score? }` |

Todos os webhooks são `POST /webhook/<event-name>` com header
`X-Impulsionando-Signature: hmac-sha256(body, IMPULSIONANDO_WEBHOOK_SECRET)`.
N8N valida via node `Crypto` antes de processar.

## Fluxos disponíveis

| Arquivo | Régua | Objetivo |
|---|---|---|
| `01-captacao-lead-nurturing.json` | Captação | Lead → 5-touch nurturing 14 dias |
| `02-conversao-trial-onboarding.json` | Conversão | Trial Day 0/1/3/5/6 + ending |
| `03-conversao-checkout-recovery.json` | Conversão | Carrinho abandonado 30min/24h/72h |
| `04-relacionamento-onboarding-pago.json` | Relacionamento | D+0/D+7/D+30 pós-pagamento |
| `05-retencao-cobranca-inadimplencia.json` | Retenção | Régua de inadimplência D+1/3/7/15 |
| `06-retencao-winback-cancelados.json` | Retenção | Win-back 7/30/90 dias pós-cancel |
| `07-relacionamento-nps-feedback.json` | Relacionamento | NPS mensal + roteamento por score |

## Variáveis de ambiente N8N

```
IMPULSIONANDO_WEBHOOK_SECRET=...
IMPULSIONANDO_API_BASE=https://impulsionando.com.br
RESEND_API_KEY=...
ZAPI_INSTANCE=...
ZAPI_TOKEN=...
WHATSAPP_FROM=+5511999999999
SLACK_OPS_WEBHOOK=...
```

## Como importar

1. N8N → Workflows → Import from File → selecione o JSON
2. Ative as credenciais (Resend / Z-API / HTTP Header Auth)
3. Copie a URL do node Webhook e cole em `Backend → Outbox routes`
4. Ative o workflow

## Mapeamento com templates de e-mail

Os e-mails referenciam templates já registrados em
`src/lib/email-templates/registry.ts`:

- `trial-started`, `trial-ending`, `welcome-paid`, `invoice-paid`,
  `invoice-overdue`

N8N chama `POST /api/public/email/send` com `{ template, to, props }`.
