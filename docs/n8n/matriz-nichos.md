# Matriz de Workflows por Nicho

Cada nicho adiciona variações específicas sobre a base do `CATALOGO.md`.
Todos nascem em `modo: demo`, prefixo `{niche}-{slug}`.

## Clínica Médica (`clinica_medica`)

| Slug                              | Gatilho                             | Canais              |
| --------------------------------- | ----------------------------------- | ------------------- |
| clinica-agendamento               | appointment.created                 | whatsapp, email     |
| clinica-consulta-confirmada       | appointment.confirmed               | whatsapp, email     |
| clinica-remarcacao                | appointment.rescheduled             | whatsapp, email     |
| clinica-cancelamento              | appointment.cancelled               | whatsapp, email     |
| clinica-retorno                   | appointment.followup_due            | whatsapp, email     |
| clinica-no-show                   | appointment.no_show                 | whatsapp, interno   |
| clinica-teleconsulta              | appointment.tele_scheduled          | whatsapp, email     |
| clinica-pagamento-consulta        | payment.appointment_paid            | email, whatsapp     |
| clinica-aviso-nf                  | payment → tenant emitir NF          | interno, email      |

## Bar / Restaurante (`bar_restaurante`)

| Slug                              | Gatilho                       | Canais              |
| --------------------------------- | ----------------------------- | ------------------- |
| bar-pedido-recebido               | order.received                | whatsapp            |
| bar-pedido-preparo                | order.in_preparation          | whatsapp            |
| bar-pedido-saiu-entrega           | order.out_for_delivery        | whatsapp            |
| bar-pedido-delivery               | order.delivered               | whatsapp            |
| bar-avaliacao-pos-consumo         | order.completed +2h           | whatsapp, email     |
| bar-cupom-retorno                 | 7d após consumo               | whatsapp            |
| bar-sorteio                       | evento manual                 | whatsapp, email     |
| bar-fidelidade                    | milestone atingido            | whatsapp, email     |

## Imobiliária (`imobiliaria`)

| Slug                              | Gatilho                       | Canais              |
| --------------------------------- | ----------------------------- | ------------------- |
| imob-lead-imovel                  | lead.property_interest        | whatsapp, email     |
| imob-visita-agendada              | visit.scheduled               | whatsapp, email     |
| imob-visita-confirmada            | visit.confirmed               | whatsapp            |
| imob-proposta-enviada             | proposal.sent                 | email               |
| imob-proposta-sem-resposta        | proposal.no_response 48h      | whatsapp, email     |
| imob-captacao-imovel              | listing.created               | interno, email      |
| imob-comprador                    | buyer.registered              | email, impulsionito |
| imob-locador                      | landlord.registered           | email, impulsionito |

## Eventos (`eventos`)

| Slug                              | Gatilho                       | Canais              |
| --------------------------------- | ----------------------------- | ------------------- |
| eventos-ingresso-vendido          | ticket.purchased              | email, whatsapp     |
| eventos-lembrete-antes            | 24h antes                     | whatsapp, email     |
| eventos-checkin                   | attendee.checked_in           | interno             |
| eventos-pos-evento                | event.ended +2h               | email, whatsapp     |
| eventos-avaliacao                 | event.ended +1d               | email               |
| eventos-proximo-evento            | recomendação                  | email, whatsapp     |

## White Label (`white_label`)

| Slug                              | Gatilho                       | Canais              |
| --------------------------------- | ----------------------------- | ------------------- |
| wl-novo-cliente                   | partner.tenant_created        | email, interno      |
| wl-cliente-onboarding             | tenant.onboarding_started     | email, impulsionito |
| wl-limite-pontos                  | partner.points_limit_near     | interno, email      |
| wl-tenant-suspenso                | tenant.suspended              | interno, email      |
| wl-tenant-convertido              | tenant.converted_paid         | email, interno      |

## Clube PF / Consumidor Final (`clube_pf`)

| Slug                              | Gatilho                       | Canais              |
| --------------------------------- | ----------------------------- | ------------------- |
| clube-boas-vindas                 | consumer.created              | email, impulsionito |
| clube-voucher-disponivel          | voucher.available             | email, impulsionito |
| clube-empresa-proxima             | geo match                     | impulsionito, email |
| clube-beneficio-expirando         | benefit.expires_in 3d         | email, impulsionito |
| clube-recomendacao-historico      | recomendação IA               | impulsionito, email |
