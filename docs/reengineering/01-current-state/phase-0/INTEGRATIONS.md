# Inventário inicial de integrações

Atualizado em: 2026-08-30. “Detectado” não significa ativo com consumidor comprovado.

| Integração | Superfície | Evidência | Live consumer | Owner (product / technical) | Decisão |
| --- | --- | --- | --- | --- | --- |
| Supabase Auth/Postgres/Storage/Edge | client, serverFns, 8 Edge Functions | STATIC + LIVE structural audit | LIVE (DB); auth CHARACTERIZED pending | Raygs / Cauã+Raygs | manter; SoT live observacional |
| Mercado Pago | HTTP, Edge (`mpago-*`, billing) | STATIC + DECLARED canonical for **Impulsionando SaaS** and **CHRISMED (segregated account)** | LIVE account/webhook behavior UNKNOWN | Cauã+Raygs | [`PAYMENTS-CANONICAL.md`](PAYMENTS-CANONICAL.md) |
| Paddle | SDK/server module | STATIC; **not canonical** | UNKNOWN usage | Cauã+Raygs | do not replace MP without ADR |
| Maisfy / Monetizze / PerfectPay | webhooks Colors | STATIC; **MaisFy = Colors canonical**; Monetizze/PerfectPay historical/ops only | LIVE UNKNOWN | Cauã+Raygs | no parallel Colors MP checkout |
| n8n | dispatch, callbacks, container `n8n-umlg-n8n-1` Up | STATIC + LIVE container | workflows/webhooks **UNKNOWN** | Raygs / Cauã+Raygs | provisionador contido; inventário UI pendente |
| Evolution/WhatsApp | containers `impulsionando-evolution-*` Up `:18080` | LIVE containers | instâncias/templates **UNKNOWN** | Raygs / Cauã+Raygs | inventário pendente |
| Meta | hooks Chrismed/Colors/Impulsionando | STATIC | UNKNOWN | Raygs / Cauã+Raygs | inventário pendente |
| Google Drive/OAuth | Chrismed routes | STATIC | UNKNOWN | Raygs / Cauã+Raygs | inventário pendente |
| e-mail | public email + fiscal hooks | STATIC | UNKNOWN | Raygs / Cauã+Raygs | inventário pendente |
| IA | AI SDK, chats por nicho | STATIC inventory: [`AI-ASSISTANTS-INVENTORY.md`](AI-ASSISTANTS-INVENTORY.md); live consumer UNKNOWN | UNKNOWN | Raygs / Cauã+Raygs | J-14 inventário feito; **não** CHARACTERIZED; **não** Phase 6 |
| Cloudflare | DNS/proxy | LIVE dig/headers | zone ativa | Raygs / Cauã+Raygs | export rules pendente |
| Focus NFe | webhook Chrismed | STATIC | UNKNOWN | UNKNOWN / Cauã+Raygs | revisar |
| Workers Pulsonitor / Colors | filhos de `impulsionando-core` | LIVE ticks Colors | consumidor interno; side-effect volume UNKNOWN | Raygs / Cauã+Raygs | manter durante descoberta |

## J-07 — jobs / webhooks (inventário máximo read-only)

### Runtimes de job

| Job runtime | Como sobe | LIVE 2026-08-30 | Auth/idempotency | Consumer |
| --- | --- | --- | --- | --- |
| Pulsonitor worker | `start-core-runtime.mjs` → `pulsonitor-worker.mjs` | process ativo sob core | STATIC only | UNKNOWN detalhe |
| Colors automation | `colors-automation-worker.mjs` | ticks ~60s `ok:true` counts 0 | STATIC only | UNKNOWN externo |
| HTTP cron/hooks | `src/routes/api/public/cron/*`, `…/hooks/*`, `…/webhooks/*` | surface STATIC (~40+ candidatos) | heurística fraca | LIVE callers **UNKNOWN** |
| Edge workers | `chrismed-communication-worker`, payment edges | deploy state UNKNOWN | UNKNOWN | UNKNOWN |
| n8n schedules | container Up | workflow list **UNKNOWN** | UNKNOWN | UNKNOWN |
| GH scheduled workflows | ver DEPLOYMENT-PUBLISHERS | vários active | N/A | VPS/DNS/backup |

### Candidatos HTTP estáticos (amostra; catálogo completo em API-ENDPOINTS)

`public/cron/crm-touch-dispatch`, `public/cron/agenda-tick`, `public/hooks/billing-tick`, `public/comm/tick`, `public/comm/n8n-callback`, `public/webhooks/monetizze-colors`, `public/health/mp-webhook`, Edge `mpago-webhook` / `core-initial-checkout-webhook`, `internal/colors/automation-tick`, WhatsApp communication routes, Focus NFe hook, Meta hooks.

**Gate:** sem logs/assinaturas/consumidores live, frequência e idempotência permanecem `UNKNOWN`. Não alterar endpoints.

## Regras de migração

Nenhuma integração muda de endpoint sem coexistência, observação, idempotency key, dead-letter/replay e rollback. Segredos nunca entram neste diretório.
