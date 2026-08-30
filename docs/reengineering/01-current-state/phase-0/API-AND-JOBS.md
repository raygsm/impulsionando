# API, server functions e jobs

Fonte: análise estática do commit `d3ab3c8b`. Não representa tráfego real nem comprova autorização.

## Superfície observada

| Superfície                          | Quantidade | Observação                                                           |
| ----------------------------------- | ---------: | -------------------------------------------------------------------- |
| arquivos de rota                    |      1.083 | páginas e endpoints misturados no TanStack Start                     |
| endpoints em `src/routes/api`       |        111 | catálogo arquivo a arquivo em [`API-ENDPOINTS.md`](API-ENDPOINTS.md) |
| arquivos com `createServerFn`       |        331 | backend adicional acoplado aos módulos do frontend                   |
| arquivos server-only                |         45 | `*.server.ts` e `*.server.tsx`                                       |
| Supabase Edge Functions             |          8 | runtimes separados, implantados no Supabase                          |
| workers iniciados com o web runtime |          2 | Pulsonitor e automação Colors                                        |

Dos 111 arquivos HTTP, a heurística encontrou 76 declarações `POST`, 45 `GET`, 6 `OPTIONS` e 5 `HEAD`; um arquivo pode declarar mais de um método. Existem 42 candidatos a webhook/callback, 41 candidatos a cron/tick e 8 candidatos de IA/chat. Sinal textual de autenticação apareceu em 30 arquivos e de idempotência/deduplicação em 12. Ausência do sinal não prova ausência do controle.

## Runtimes de execução

`scripts/start-core-runtime.mjs` inicia o servidor web e, quando configurados, `pulsonitor-worker.mjs` e `colors-automation-worker.mjs` no mesmo container/unidade. Portanto uma falha, restart ou rollout do core pode afetar HTTP e jobs juntos.

O publisher da VPS é separado: `deploy/impulsionando-publish-worker.service` chama `scripts/core-publish-worker.sh`. Ele é infraestrutura de publicação, não uma API do produto.

## Edge Functions

- `billing-create-payment`
- `chrismed-communication-worker`
- `chrismed-healthcheck`
- `core-initial-checkout-payment`
- `core-initial-checkout-webhook`
- `mpago-create-payment`
- `mpago-refund`
- `mpago-webhook`

## Riscos para a migração

- Não existe uma única fronteira de API: HTTP routes, server functions, Edge Functions, workers e n8n podem alterar o mesmo estado.
- Rotas denominadas `public/hooks` e `public/cron` não podem ser consideradas públicas ou seguras apenas pelo nome.
- Jobs chamados por HTTP precisam de consumidor, segredo, timeout, retry e chave de idempotência documentados.
- O NestJS futuro só pode absorver um contrato por vez, com comparação de comportamento; não se deve mover os 331 server functions de uma vez.

## Pendente para o gate

Confirmar consumidores, frequência, autenticação/autorização, idempotência, SLA e owner das entradas críticas com logs de 30/90 dias.
