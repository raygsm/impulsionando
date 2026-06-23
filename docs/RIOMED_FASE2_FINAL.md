# RioMed — Fase 2 · Entrega Final (Etapas 1→6)

> Tenant **RioMed** (`5bdcdef4…`) inteiramente acoplado ao core Impulsionando. Funil aplicado: **captar → converter → relacionar → reter → expandir**.

## Resumo das etapas

| Etapa | Entrega | Status |
|---|---|---|
| 1 | Auditoria + scaffolding (`_authenticated`, RBAC, RLS por `company_id`, branding, billing gates) | ✅ |
| 2 | Tabelas operacionais RioMed (catálogo, cotações, carrinhos, AR/AP, tickets, sellers, n8n) | ✅ |
| 3 | Páginas admin/cliente sob `/admin/clientes/riomed/*` (master-hub, CRM, cotações, técnicos, N8N) | ✅ |
| 4 | Public surface (`/riomed.*`) + portais hospital/técnico/vendedor + checkout BOB | ✅ |
| 5 | Cadastro de 9 workflows em `riomed_n8n_workflows` (5 prontos + 4 placeholders) | ✅ |
| 6 | **JSONs N8N completos + README de import** | ✅ (este doc) |

## Workflows N8N — arquivos finais em `docs/n8n/`

| # | Arquivo | Funil | Gatilho |
|---|---|---|---|
| 01 | `riomed-01-novo-lead.json` | Captação | Webhook `lead.created` |
| 02 | `riomed-02-ticket-tecnico.json` | Retenção | Webhook `ticket.created` |
| 03 | `riomed-03-cotacao-fria.json` | Conversão | Schedule 2/2h |
| 04 | `riomed-04-recuperacao-carrinho.json` | Conversão | Schedule 2/2h |
| 05 | `riomed-05-cobranca-ar.json` | Retenção | Cron diário 09h |
| 06 | `riomed-06-lead-facebook.json` | Captação | Facebook Lead Ads Trigger |
| 07 | `riomed-07-lead-instagram.json` | Captação | Webhook Meta (IG DM) |
| 08 | `riomed-08-broadcast-whatsapp.json` | Relacionamento | Schedule 10/10min |
| 09 | `riomed-09-cotacao-bob-usd.json` | Operação | Cron 08h `America/La_Paz` |

## Fluxo de import (resumo operacional)

1. **N8N → Workflows → Import from File** → carregar o JSON.
2. Configurar variáveis: `IMPULSIONANDO_API_BASE`, `IMPULSIONANDO_WEBHOOK_SECRET`, `RIOMED_FALLBACK_MANAGER_PHONE`, `RIOMED_FB_FORM_ID`, `RIOMED_FB_PAGE_ID`.
3. Para workflows com **Webhook**: ativar e copiar a **Production URL**.
4. **No Impulsionando:** `/admin/clientes/riomed/n8n` → editar registro correspondente → colar `webhook_url` → `is_active=true`.
5. **Teste:** `/admin/clientes/riomed/master-dashboard` → aba **N8N → Testar conectividade**.

## Endpoints públicos esperados (`/api/public/riomed/*`)

Todos com verificação HMAC `x-impulsionando-signature` (segredo `IMPULSIONANDO_WEBHOOK_SECRET`):

- `POST /events` — ingest unificado (lead, ticket, fx, etc.)
- `GET  /quotes/cold?hours=48`
- `GET  /carts/abandoned?min_value=500&hours=4`
- `GET  /ar/overdue`
- `GET  /broadcasts/due`
- `POST /broadcasts/:id/mark-sent`
- `POST /fx/upsert`
- `POST /whatsapp/send` · `POST /whatsapp/send-bulk`
- `POST /email/send`

> Endpoints que ainda não existem devem ser criados sob `src/routes/api/public/riomed/*.ts` com validação Zod + HMAC. Peça "criar endpoint público X" quando necessário.

## Migração de dados (Supabase externo `arygtqrpdcdkwnuwsgmm`)

**Pendente.** A chave fornecida é apenas `publishable/anon` — não permite leitura das tabelas privadas (RLS bloqueia).

Para destravar, fornecer **uma** das opções:
- Connection string Postgres (`postgresql://postgres:<senha>@db.arygtqrpdcdkwnuwsgmm.supabase.co:5432/postgres`)
- Service role key (`sb_secret_…` ou JWT `service_role`)

Assim que disponível, ETL roda em batch para `riomed_*` mapeando por `company_id = 5bdcdef4…`.

## Próximos passos sugeridos

1. Provisionar os endpoints `/api/public/riomed/*` faltantes (broadcasts, fx, events).
2. Ativar workflows 01–05 (prontos) e validar ping no master-dashboard.
3. Importar 06–09 conforme contas (Meta, etc.) ficarem disponíveis.
4. Rodar ETL assim que credencial Postgres/service_role chegar.
5. Configurar `riomed_governance_policies` para SLA e dunning conforme regra de negócio definitiva.
