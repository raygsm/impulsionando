# Workflows N8N — índice de arquivos gerados

Gerados via `docs/n8n/generate-workflows.mjs` (rode `node docs/n8n/generate-workflows.mjs`
para regenerar). Todos nascem em `modo: demo`, `status: rascunho`, com nodes
de canal `disabled: true`. Nenhum dispara mensagem real.

## Estrutura

```
docs/n8n/
├── workflows/
│   ├── _shared/
│   │   ├── fallback-humano.json
│   │   └── plano-gate.json
│   ├── captacao/         (8 workflows)
│   ├── conversao/        (11)
│   ├── relacionamento/   (11)
│   ├── retencao/         (10)
│   ├── financeiro/       (10)
│   ├── suporte/          (6)
│   ├── vitrine/          (7)
│   └── nichos/
│       ├── clinica/      (4 variações)
│       ├── bar/          (5)
│       ├── imob/         (4)
│       ├── eventos/      (4)
│       ├── wl/           (3)
│       └── clube/        (3)
└── payloads/             (86 payloads de exemplo)
```

## Nodes padrão de cada workflow

1. **Webhook Trigger** → `path: impulsionando/{{tenant_slug}}/{slug}`
2. **Mode Gate (IF)** → `body.mode === "producao"` divide em dois ramos
3. **Simulate (demo)** → seta `status=skipped`, não dispara nada
4. **Validate tenant/canal/template** → checa `tenant.id`, `consent.lgpd_ok`, canais habilitados e template
5. **Nodes de canal (disabled)** → WhatsApp/Z-API, e-mail/Resend, Impulsionito, notificação interna
6. **Log → /api/public/hooks/n8n-log** → HMAC-SHA256 com `IMPULSIONANDO_WEBHOOK_SECRET`, idempotência por `slug:tenant:entity`
7. **Fallback humano (disabled)** → notifica staff em caso de erro
8. **Respond 200** → devolve `{ ok, workflow, mode }`

## Variáveis de ambiente esperadas no N8N

- `IMPULSIONANDO_API_BASE` — base URL do backend (produção ou preview)
- `IMPULSIONANDO_WEBHOOK_SECRET` — segredo HMAC (idêntico ao backend)
- `ZAPI_BASE`, `ZAPI_INSTANCE`, `ZAPI_TOKEN` — canal WhatsApp (por tenant)
- `RESEND_API_KEY` (via credencial N8N) — canal e-mail

## Import no N8N

1. Importar `_shared/*` primeiro (sub-workflows reutilizáveis).
2. Importar por categoria conforme roadmap de homologação.
3. Substituir `{{tenant_slug}}` no path do webhook pelo slug real do tenant
   ao clonar (não fazer commit dessa versão personalizada).
4. Manter todos os nodes de canal `disabled: true` até checklist aprovado.

## Regeneração

Toda alteração estrutural (adicionar workflow, mudar node padrão) deve ser
feita em `generate-workflows.mjs`. Nunca editar JSONs manualmente — a
próxima regeneração sobrescreve.
