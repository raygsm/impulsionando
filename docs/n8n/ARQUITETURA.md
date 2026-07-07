# Automação & N8N — Arquitetura do Ecossistema Impulsionando

> **Escopo desta doc**: define como TODA automação N8N do Core Impulsionando
> nasce, é homologada e vai para produção. Vale para Core, clientes reais,
> tenants em demo, White Label, Cliente Empresa, Consumidor Final / Clube,
> Teste Premium 30 dias e clientes pagantes.
>
> **Regra-mãe**: nenhum workflow entra em produção sem o Checklist de
> Ativação (ver `checklist-ativacao.md`) aprovado manualmente. Todo
> workflow nasce em `modo: demo`.

## 1. Camadas

```
┌───────────────────────────────────────────────────────────────┐
│  Core Impulsionando (multi-tenant)                            │
│  ├─ Tenants reais (CHRISMED, RioMed, Marocas, ...)            │
│  ├─ Tenants demo (dados fictícios, sem disparo real)          │
│  ├─ White Label (parceiros revendendo)                        │
│  ├─ Consumidor Final / Clube PF                               │
│  └─ Teste Premium 30 dias                                     │
├───────────────────────────────────────────────────────────────┤
│  N8N (orquestrador)                                           │
│  ├─ Webhooks por tenant/workflow                              │
│  ├─ Nodes de canal (WhatsApp/Z-API, e-mail, Impulsionito)     │
│  └─ Sub-workflows compartilhados (_shared/*)                  │
├───────────────────────────────────────────────────────────────┤
│  Backend Impulsionando                                        │
│  ├─ /api/public/hooks/n8n-log  (HMAC, tabela n8n_workflow_runs)│
│  ├─ Server fns core-integrations.functions.ts                 │
│  └─ Server fns riomed-n8n.functions.ts (tenant-específico)    │
└───────────────────────────────────────────────────────────────┘
```

## 2. Padrão de webhook

```
POST {IMPULSIONANDO_N8N_BASE}/webhook/impulsionando/{tenant_slug}/{workflow_slug}
```

Exemplos:

- `/webhook/impulsionando/chrismed/consulta-confirmada`
- `/webhook/impulsionando/marocas/pedido-delivery`
- `/webhook/impulsionando/core/pagamento-aprovado`
- `/webhook/impulsionando/demo/lead-captado`

Convenções:
- `tenant_slug` = `core`, `demo`, ou slug real do tenant (`companies.subdomain`).
- `workflow_slug` = kebab-case do id em `CATALOGO.md` (ex.: `lead-captado`, `pix-expirado`).
- Cabeçalhos obrigatórios:
  - `x-impulsionando-signature`: HMAC-SHA256 do body cru com `IMPULSIONANDO_WEBHOOK_SECRET`.
  - `content-type: application/json`.

## 3. Envelope de payload (contrato universal)

Todo workflow recebe o mesmo envelope. Campos ausentes → workflow encerra em `status: skipped`.

```json
{
  "mode": "demo",
  "workflow": {
    "slug": "lead-captado",
    "version": "1.0.0",
    "regua": "captacao"
  },
  "tenant": {
    "id": "uuid-ou-null-em-demo",
    "slug": "chrismed",
    "plan": "premium",
    "niche": "clinica_medica"
  },
  "actor": {
    "user_id": null,
    "email": null,
    "phone": null,
    "name": null
  },
  "entity": {
    "type": "lead|customer|invoice|appointment|order|ticket|...",
    "id": "string"
  },
  "channels": {
    "whatsapp": { "enabled": false, "template_id": null },
    "email":    { "enabled": false, "template_id": null },
    "impulsionito": { "enabled": true }
  },
  "consent": {
    "lgpd_ok": true,
    "opt_in_channels": ["email", "whatsapp"]
  },
  "context": { }
}
```

## 4. Gate demo × produção

Todo workflow tem, logo após o Webhook Trigger, um node `IF` chamado
`Mode Gate`:

- `mode == "demo"` → segue ramo **Simulação** (nodes de canal ficam
  `disabled: true`, apenas gera log fake, retorna 200).
- `mode == "producao"` → exige TODAS as pré-condições:
  1. `tenant.id` válido.
  2. `consent.lgpd_ok === true`.
  3. `channels.<canal>.enabled === true` para o canal a usar.
  4. `channels.<canal>.template_id` presente e aprovado.
  5. Plano do tenant permite o workflow (ver `matriz-planos.md`).
  6. Nicho compatível (ver `matriz-nichos.md`).

Falha em qualquer pré-condição → ramo **Fallback Humano**
(`_shared/fallback-humano.json`) + log `status: failed`.

## 5. Contrato de log

Todo node relevante envia POST para `/api/public/hooks/n8n-log`:

```json
{
  "workflow_name": "lead-captado",
  "workflow_version": "1.0.0",
  "regua": "captacao",
  "event_name": "lead.captured",
  "step": "send-welcome-whatsapp",
  "status": "received|ok|retry|failed|skipped|suppressed",
  "channel": "whatsapp|email|impulsionito|internal|api",
  "http_status": 200,
  "latency_ms": 320,
  "tenant_id": "uuid",
  "lead_id": "uuid",
  "entity_type": "lead",
  "entity_id": "uuid",
  "payload": { },
  "error": null,
  "idempotency_key": "lead-captado:{tenant_slug}:{entity_id}"
}
```

Idempotência: `idempotency_key` obrigatório em nodes de disparo real.

## 6. Retry & fallback humano

- Retry padrão: 3 tentativas com backoff exponencial (2s, 8s, 32s).
- Falha após 3 tentativas → sub-workflow `_shared/fallback-humano.json`:
  - Cria notificação interna (`notify_user`) para responsável do tenant.
  - Registra log `status: failed` + `channel: internal`.
  - Em produção, opcional: abre chamado no módulo Suporte.

## 7. Segurança & LGPD

- HMAC obrigatório em todo webhook público.
- Templates de mensagem devem ter opt-out visível.
- Consumidor Final só recebe mensagens com `consent.lgpd_ok === true`.
- Dados sensíveis (CPF, CNPJ, telefone) nunca aparecem em `payload` de log
  cru — usar hash/mask quando necessário.
- Sub-workflow `_shared/mask-pii.json` disponível.

## 8. Estados do workflow

| Estado                | Significado                                                    |
| --------------------- | -------------------------------------------------------------- |
| `rascunho`            | JSON existe mas não foi importado no N8N                       |
| `pronto`              | Importado, testado em demo, aguardando aprovação de produção   |
| `ativo`               | Rodando em produção para o tenant                              |
| `pausado`             | Ativado antes, temporariamente desligado                       |
| `erro`                | Falha crítica recente, exige revisão                           |
| `aguardando_credencial` | Falta credencial de canal (Z-API, SMTP, etc.)                |

## 9. Referências cruzadas

- Catálogo completo: `CATALOGO.md`
- Variações por nicho: `matriz-nichos.md`
- Variações por plano: `matriz-planos.md`
- Habilitação por tenant: `matriz-tenants.md`
- Templates: `templates/*.md`
- Checklist de ativação: `checklist-ativacao.md`
- Plano de homologação: `plano-homologacao.md`
- Plano de produção: `plano-producao.md`
- Pendências: `PENDENCIAS.md`
