# Catálogo de endpoints HTTP

Fonte: análise estática de `src/routes/api` no commit `d3ab3c8b`.

Este catálogo registra superfície e sinais, não prova segurança. `Auth signal` e `Idempotency signal` são heurísticas textuais; `não detectado` exige revisão manual e não significa necessariamente ausência.

Total: **111 arquivos de endpoint**.

| Arquivo                                                         | Métodos detectados | Classe           | Auth signal   | Idempotency signal | Owner         | Decisão        |
| --------------------------------------------------------------- | ------------------ | ---------------- | ------------- | ------------------ | ------------- | -------------- |
| `src/routes/api/anamadu/anita/chat.ts`                          | POST               | AI/chat          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/catalog.ts`                             | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/health.ts`                              | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/media-migrate.ts`                       | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/order.ts`                               | POST               | general          | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/ourives-request.ts`                     | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/pix-order.ts`                           | GET, POST          | payment          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/anamadu/product-detail.ts`                      | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/documents/deliver.ts`                  | dynamic/unknown    | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/fiscal/focus/validate.ts`              | dynamic/unknown    | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/google-drive/callback.ts`              | GET                | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/google-drive/start.ts`                 | POST               | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/google-drive/status.ts`                | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/google-drive/sync.ts`                  | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/specialty-decision.ts`                 | GET, POST          | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/chrismed/specialty-request.ts`                  | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/colors/iris/chat.ts`                            | dynamic/unknown    | AI/chat          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/communication/whatsapp/chrismed.ts`             | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/communication/whatsapp/impulsionando.ts`        | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/csi/investito/chat.ts`                          | POST               | AI/chat          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/impulsionito/chat.ts`                           | dynamic/unknown    | AI/chat          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/internal/colors/automation-tick.ts`             | dynamic/unknown    | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/mercadopago/webhook.ts`                         | GET, POST          | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/cep.$cep.ts`                             | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/comm/n8n-callback.ts`                    | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/comm/tick.ts`                            | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/cron/agenda-tick.ts`                     | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/cron/crm-touch-dispatch.ts`              | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/cron/funnel-dispatch.ts`                 | POST               | job/cron         | detectado     | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/cron/payouts-consolidate.ts`             | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/cron/support-tick.ts`                    | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/demo/feira-lead.ts`                      | POST               | general          | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/demo/send-test.ts`                       | POST               | general          | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/email/send.ts`                           | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/health.ts`                               | GET, HEAD          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/health/mercadopago.ts`                   | GET, HEAD          | payment          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/health/monetization.ts`                  | GET, HEAD          | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/health/mp-webhook.ts`                    | GET, HEAD          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/health/mp.$slug.ts`                      | GET                | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/aff-advance-commissions.ts`        | GET, POST          | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/billing-tick.ts`                   | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/clube-journey-tick.ts`             | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/comms-self-test.ts`                | POST               | webhook/callback | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/core-notification-event.ts`        | POST, OPTIONS      | webhook/callback | detectado     | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/core-pull-chrismed.ts`             | GET                | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/dispatch-fiscal.ts`                | POST               | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/expire-premium-trials.ts`          | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/fiscal-monthly-email.ts`           | POST               | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/focus-nfe.ts`                      | POST               | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/impulsionito-train.ts`             | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/maintenance-notifier.ts`           | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/marketing-lead-notify.ts`          | POST               | webhook/callback | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/marocas-report.ts`                 | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/meta-chrismed.ts`                  | dynamic/unknown    | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/meta-colors.ts`                    | dynamic/unknown    | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/meta-impulsionando.ts`             | dynamic/unknown    | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/mp-pending-reminders.ts`           | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/n8n-log.ts`                        | GET, POST          | webhook/callback | detectado     | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/n8n-verify.ts`                     | GET, POST          | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/notification-log-cleanup.ts`       | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/postmortem-actions.ts`             | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/reliability-alerts.ts`             | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/retention-sweep.ts`                | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/status-subscribers-maintenance.ts` | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/status-subscribers.ts`             | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/status-webhook-auto-disable.ts`    | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/status-webhook-retries.ts`         | POST               | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/status-webhooks.ts`                | POST               | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/trial-regua.ts`                    | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/uptime-check.ts`                   | POST               | webhook/callback | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/uptime-whatsapp-test.ts`           | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/hooks/zapi-status.ts`                    | GET, POST          | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/mercado-pago.$slug.ts`                   | GET, POST          | payment          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/municipios.$uf.ts`                       | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/outbox/process.ts`                       | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/painel.funnel-hit.ts`                    | POST, OPTIONS      | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/painel.legacy-hit.ts`                    | POST, OPTIONS      | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/payments/close-invoice.replay.ts`        | POST               | payment          | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/payments/webhook.ts`                     | POST               | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/realestate/interest.ts`                  | POST, OPTIONS      | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/realestate/saved-search.ts`              | POST, OPTIONS      | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/referencias.$key.ts`                     | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/ar/overdue.ts`                    | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/broadcasts/due.ts`                | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/broadcasts/mark.ts`               | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/carts/abandoned.ts`               | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/events.ts`                        | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/fx/upsert.ts`                     | GET, POST          | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/riomed/quotes/cold.ts`                   | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status-badge[.]svg.ts`                   | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status-confirm.ts`                       | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status-preferences.ts`                   | GET, POST          | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status-subscribe.ts`                     | POST, OPTIONS      | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status-unsubscribe.ts`                   | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status.$slug.badge[.]svg.ts`             | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status.$slug.rss.ts`                     | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status.$slug.ts`                         | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status.rss.ts`                           | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/status.ts`                               | GET                | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/support/create-ticket.ts`                | POST               | job/cron         | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/version.ts`                              | GET, HEAD          | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/webhooks/maisfy-colors.ts`               | dynamic/unknown    | webhook/callback | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/webhooks/monetizze-colors.ts`            | dynamic/unknown    | webhook/callback | não detectado | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/webhooks/n8n-callback.ts`                | POST               | webhook/callback | detectado     | detectado          | não atribuído | revisar/migrar |
| `src/routes/api/public/webhooks/perfectpay-colors.ts`           | dynamic/unknown    | webhook/callback | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/public/whatsapp/send.ts`                        | GET, POST          | general          | detectado     | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/riomed/medicito/chat.ts`                        | POST               | AI/chat          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/riomed/medicito/upload.ts`                      | POST               | AI/chat          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/wmp/briefing.$id.evidence.ts`                   | POST               | general          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/wmp/millito/chat.ts`                            | POST               | AI/chat          | não detectado | não detectado      | não atribuído | revisar/migrar |
| `src/routes/api/wmp/whereabouts/daily.ts`                       | POST               | general          | detectado     | não detectado      | não atribuído | revisar/migrar |

## Gate de conclusão

Antes de encerrar a Fase 0, endpoints críticos precisam ter consumidor, autenticação, autorização, idempotência, SLA e owner confirmados por revisão manual ou evidência de tráfego.
