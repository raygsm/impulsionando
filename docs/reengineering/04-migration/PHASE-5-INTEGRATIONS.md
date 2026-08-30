# Fase 5 — Workers e integrações

## Objetivo

Retirar processamento demorado e dependências externas do ciclo de vida web.

## Trabalho

- definir filas, visibility timeout, retry e dead-letter;
- extrair workers do container SSR;
- criar adapters para n8n, Evolution, pagamentos, e-mail e OAuth;
- validar assinatura e replay de webhooks;
- aplicar idempotência e outbox onde necessário;
- criar dashboards de backlog, falha e latência;
- documentar recuperação manual segura.

## Critério de saída

Falha de integração não derruba frontend/API, jobs podem ser reprocessados sem duplicar efeitos e cada integração possui owner e runbook.

