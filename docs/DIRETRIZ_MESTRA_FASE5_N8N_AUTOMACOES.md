# Diretriz Mestra Final - Fase 5: N8N e Automacoes por Tenant

Data: 2026-06-25  
Branch: `codex/security-autonomy-audit`  
Escopo: consolidar o contrato operacional entre Core Impulsionando e N8N. Nao houve alteracao em producao nem execucao de migration.

## Total de fases

O plano completo tem 7 fases:

1. Auditoria do Core.
2. Criacao segura de tenants.
3. Marketplace de modulos.
4. Cobranca, wallet e Mercado Pago.
5. N8N e automacoes por tenant.
6. Reducao do Lovable a legado.
7. Validacao final de independencia.

## Objetivo da Fase 5

Garantir que N8N seja motor operacional de automacoes, mas nunca fonte de verdade:

- Core decide o tenant, evento, payload e regra;
- N8N executa a automacao;
- Core recebe callback/log assinado;
- cada execucao fica vinculada a tenant, exceto automacoes internas com `scope: "core"`;
- nenhuma automacao de cliente roda sem assinatura HMAC.

## Decisao oficial

O N8N fica como executor externo, preferencialmente na VPS Hostinger atual.

O Core Impulsionando continua sendo o sistema-mae:

- cria tenants;
- instala/desinstala modulos;
- define regras de funil;
- agenda disparos;
- registra logs;
- audita falhas;
- bloqueia vazamento entre clientes.

## Fonte de verdade

Fila de disparo:

- `core_funnel_dispatch_queue`

Logs e auditoria:

- `n8n_workflow_runs`
- `webhook_runs`
- `core_incidents`

Endpoints:

- `POST /api/public/cron/funnel-dispatch`
- `POST /api/public/hooks/n8n-log`
- `POST /api/public/webhooks/n8n-callback`

Templates:

- `docs/n8n/*.json`
- `docs/n8n/niches/*.json`

## Correcoes aplicadas

### 1. Helper unico para assinatura N8N

Arquivo criado:

- `src/lib/n8n-webhook-security.server.ts`

Ele centraliza:

- header oficial `x-impulsionando-signature`;
- assinatura HMAC-SHA256;
- validacao timing-safe;
- regra de escopo por tenant/Core.

### 2. Callback e log agora exigem HMAC

Arquivos ajustados:

- `src/routes/api/public/webhooks/n8n-callback.ts`
- `src/routes/api/public/hooks/n8n-log.ts`

Regra atual:

- sem `IMPULSIONANDO_WEBHOOK_SECRET`, nao aceita;
- sem assinatura valida, retorna `401`;
- fluxo de cliente sem `tenant_id` retorna `422`;
- fluxo interno pode usar `scope: "core"`.

Removido:

- fallback por `SUPABASE_ANON_KEY`/`apikey` no hook de log.

### 3. Dispatch Core -> N8N agora e assinado

Arquivo ajustado:

- `src/routes/api/public/cron/funnel-dispatch.ts`

Correcoes:

- exige `N8N_BASE_URL`;
- exige `IMPULSIONANDO_WEBHOOK_SECRET`;
- assina o body enviado ao N8N;
- inclui `scope: "tenant"`;
- inclui `tenant_id`;
- registra log com `status: "ok"` quando o envio ao N8N foi aceito;
- registra `channel: "api"`, valor aceito pela tabela `n8n_workflow_runs`.

### 4. Documentacao operacional atualizada

Arquivos:

- `.env.example`
- `docs/n8n/README.md`
- `docs/n8n/niches/README.md`

Nova variavel documentada:

- `IMPULSIONANDO_API_BASE`

Contrato documentado:

- N8N nao usa chave anon;
- N8N valida HMAC;
- N8N envia callback/log com HMAC;
- workflows de cliente carregam `scope: "tenant"` e `tenant_id`;
- workflows internos carregam `scope: "core"`.

## Teste adicionado

Arquivo:

- `tests/n8n-tenant-automation-static.test.ts`

Ele bloqueia regressao para:

- volta de fallback por anon key;
- callback/log sem validacao HMAC;
- automacao de cliente sem tenant;
- dispatch sem assinatura;
- uso de `sent` ou `http` em campos que quebram constraint do banco.

## Regras para importar fluxos no N8N

1. Cada workflow importado deve validar `x-impulsionando-signature`.
2. Cada workflow de cliente deve carregar `tenant_id`.
3. Cada workflow deve chamar `/api/public/hooks/n8n-log` em steps relevantes.
4. Cada callback/log deve ser assinado com `IMPULSIONANDO_WEBHOOK_SECRET`.
5. N8N nao deve guardar regra de negocio de plano, modulo, tenant ou permissao.
6. O dashboard Core e quem liga/desliga automacoes por cliente.

## O que ainda depende da VPS/N8N real

Para concluir operacionalmente em ambiente real:

- configurar `IMPULSIONANDO_API_BASE`;
- configurar `IMPULSIONANDO_WEBHOOK_SECRET`;
- configurar `N8N_BASE_URL`;
- importar os JSONs em `docs/n8n`;
- validar assinatura HMAC no primeiro node de cada workflow;
- ativar um workflow sandbox;
- disparar evento real por tenant;
- confirmar linha em `core_funnel_dispatch_queue`;
- confirmar linha em `n8n_workflow_runs`;
- confirmar ausencia de vazamento entre tenants.

## Proxima fase

Fase 6 - Reducao do Lovable a legado.

Objetivo:

- identificar dependencias restantes de Lovable;
- separar o que e apenas historico do que ainda executa;
- impedir que publicacao, build, email, auth ou webhook dependam do Lovable;
- deixar GitHub, Supabase, VPS/Hostinger e N8N como operacao independente.
