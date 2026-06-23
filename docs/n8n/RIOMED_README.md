# N8N — Workflows RioMed

## Como integrar no N8N

1. **Acesse o N8N** (Cloud ou self-hosted).
2. **Importar JSON:** menu superior → **Workflows → Import from File** → escolha o JSON desejado abaixo.
3. **Ativar:** abra o workflow, no canto superior direito alterne **Active**.
4. **Copiar o webhook:** abra o nó `Webhook · ...`, copie a "Production URL".
5. **No Impulsionando:** vá em **`/admin/clientes/riomed/n8n`** → **Novo workflow** → cole o webhook em `webhook_url`, marque ativo. Salve.
6. **Testar:** abra **`/admin/clientes/riomed/master-dashboard` → aba N8N → Testar conectividade**.

### Variáveis de ambiente recomendadas no N8N
- `IMPULSIONANDO_API_BASE = https://impulsionando.com.br`
- `LOVABLE_AI_KEY` (caso use modelos via Lovable AI Gateway)

## Workflows disponíveis

| Arquivo | Gatilho | O que faz |
|---|---|---|
| `riomed-01-novo-lead.json` | Webhook `lead.created` | WhatsApp ao vendedor + e-mail boas-vindas + follow-up D+1 |
| `riomed-02-ticket-tecnico.json` | Webhook `ticket.created` | Roteia por SLA (crítica → gerente, alta → técnico on-call, baixa → e-mail) |
| `riomed-03-cotacao-fria.json` | Schedule 2/2h | Cotações sem resposta há 48h, mensagem com IA + WhatsApp |
| `riomed-04-recuperacao-carrinho.json` | Schedule 2/2h | Carrinhos B2B abandonados — alto valor (>5k BOB) → vendedor; demais → e-mail |
| `riomed-05-cobranca-ar.json` | Cron diário 09h | Régua: lembrete (≤3d), firme (≤10d), escalada gestor (>10d) |
| `riomed-06-lead-facebook.json` | Facebook Lead Ads | Normaliza lead Meta → POST `/api/public/riomed/events` |
| `riomed-07-lead-instagram.json` | Webhook Meta (IG DM) | Extrai DMs, classifica como lead e injeta no CRM |
| `riomed-08-broadcast-whatsapp.json` | Schedule 10/10min | Dispara `riomed_whatsapp_broadcasts` agendados (respeita opt-out) |
| `riomed-09-cotacao-bob-usd.json` | Cron 08h La Paz | Atualiza `cotacao_bob_usd` via exchangerate.host |

## Endpoints públicos que os flows consomem

Todos sob `https://impulsionando.com.br/api/public/riomed/*` — bypass de auth no site publicado. Devem validar payload e never retornar PII além do necessário.

- `GET  /api/public/riomed/quotes/cold?hours=48`
- `GET  /api/public/riomed/carts/abandoned?min_value=500&hours=4`
- `GET  /api/public/riomed/ar/overdue`
- `POST /api/public/riomed/events`
- `POST /api/public/whatsapp/send`
- `POST /api/public/email/send`

> Se algum endpoint ainda não existir, peça "criar endpoint público X" — eu gero a rota TanStack com verificação de assinatura.

## Onde monitorar no Impulsionando
- `/admin/clientes/riomed/master-dashboard` → aba **Integração N8N** (status + ping)
- `/admin/clientes/riomed/n8n` → cadastrar, ativar, testar execução manual
- `/admin/clientes/riomed/governanca` → eventos operacionais agregados
