# INTEGRATIONS — Impulsionando Core

Panorama das integrações após a Onda 3.

## Cadastro central

Tabela `core_integrations` (slug, environment, status, is_active,
last_test_at, last_error). Logs em `core_integration_logs`.

Diagnóstico consolidado: `getIntegrationsAutomationHealth` (usada por
`/core/hub-automacoes`, `/core/hub-cobranca` e telas de saúde).

## Mercado Pago

- Slug: `mercadopago`.
- Configuração: `/core/integracoes/mercadopago` (Access Token via secret,
  Public Key, Webhook URL, ambiente sandbox/production).
- Webhooks:
  - Legado: `mp_webhook_log`.
  - Atual: `mpago_webhook_events` (com validação de assinatura).
- Auditoria de eventos: `/admin/mpago-eventos`.
- Saúde: `/core/hub-cobranca` (bloco Webhooks MP).
- Pendências externas: credenciais de produção, homologação de webhook.

## N8N

- Slug: `n8n`.
- Configuração: `/core/integracoes/n8n`.
- Execuções: `n8n_workflow_runs` (workflow, régua, canal, latência, http_status).
- Consoles: `/admin/n8n-console`, `/admin/n8n-niches`.
- Hub: `/core/hub-automacoes` (top réguas, canais, credenciais pendentes).
- Pendências externas: instância + token do cliente.

## WhatsApp Cloud API

- Credenciais por cliente: `core_whatsapp_credentials`.
- Roteamento: `core_whatsapp_routing_rules`; fallback: `core_whatsapp_fallback_config`.
- Eventos: `whatsapp_message_events`.
- Pendências externas: phone_number_id + token válidos por cliente.

## E-mail transacional

- Log unificado: `email_send_log` (regra de deduplicação por `message_id`).
- Assinaturas de dispensa: `email_unsubscribe_tokens`, `suppressed_emails`.
- Dashboards seguem o guia oficial de deduplicação por `message_id`.
- Pendências externas: domínio verificado no provedor.

## Webhooks externos (assinantes)

- `core_status_webhooks` / `core_status_webhook_dispatches`.
- `webhook_runs` + `webhook_event_log` para requests entrantes.
- Painel: `/admin/status-webhooks` e `/core/automacao/webhooks`.

## Cérebro IA (Onda 3.4)

Ainda não integra dispatcher real — apenas configuração, base de
conhecimento e histórico. Integração com WhatsApp/e-mail fica para Onda 4
(dispatcher IA).

## Credenciais / secrets

- Access tokens ficam em secrets do servidor, nunca no bundle.
- `LOVABLE_API_KEY` é rotacionado por ferramenta dedicada.
- Secrets de webhook (MP, provedor de e-mail) devem ser adicionados pela
  UI segura de secrets antes de habilitar a integração em produção.
