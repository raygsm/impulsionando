# Réguas N8N por Nicho — Funil Impulsionando

Cada nicho (tenant) opera pelo mesmo funil **captar → converter → relacionar → reter → expandir**, mas com **eventos próprios** e **réguas próprias** definidos em `core_funnel_rules` (coluna `niche_slug`).

Os disparos passam pela fila `core_funnel_dispatch_queue` (cron `funnel-dispatch` a cada minuto), que renderiza o `payload_template` da regra e faz `POST` no webhook N8N correspondente.

## Convenção de webhook

```
POST {{N8N_BASE}}/webhook/<niche>-<event>
Header: X-Impulsionando-Signature: hmac-sha256(body, IMPULSIONANDO_WEBHOOK_SECRET)
Body:   payload renderizado a partir de payload_template (Mustache simples {{path.dot}})
```

Todo workflow N8N deve **validar a assinatura HMAC** antes de processar (vide `01-captacao-lead-nurturing.json` como referência).

Todo workflow de cliente deve carregar `scope: "tenant"` e `tenant_id`. Eventos sem tenant so podem ser usados quando forem automacoes internas do Core com `scope: "core"`.

## Mapa Nicho × Estágio × Evento × Workflow

| Nicho | Estágio | Evento | Workflow N8N | Canal principal |
|---|---|---|---|---|
| **imobiliaria** | capture | `realestate.visit_scheduled` | `imob.regua_visita` | WhatsApp (lembrete D-1, D-0 2h, pós-visita) |
| **imobiliaria** | convert | `realestate.proposal_sent` | `imob.followup_proposta` | WhatsApp + e-mail (D+1, D+3, D+7) |
| **imobiliaria** | retain | `realestate.contract_anniversary` | `imob.aniversario_contrato` | E-mail + voucher renovação |
| **clinica** | convert | `agenda.appointment_confirmed` | `clinica.confirmacao_consulta` | WhatsApp (confirmação imediata + lembrete D-1) |
| **clinica** | relate | `agenda.exam_reminder` | `clinica.lembrete_exame` | WhatsApp + SMS |
| **clinica** | retain | `agenda.return_due` | `clinica.retorno_6m` | WhatsApp + e-mail |
| **eventos** | convert | `event.ticket_purchased` | `evt.confirmacao_ingresso` | E-mail com QR + WhatsApp |
| **eventos** | relate | `event.starts_in_24h` | `evt.lembrete_d1` | WhatsApp (logística, mapa, dress code) |
| **eventos** | retain | `event.completed` | `evt.nps_pos_evento` | E-mail NPS + foto-recap |
| **restaurante** | capture | `restaurant.first_visit` | `resto.convite_clube` | WhatsApp (convite clube fidelidade) |
| **restaurante** | relate | `customer.birthday` | `resto.aniversario` | WhatsApp (cortesia mês do aniversário) |
| **restaurante** | retain | `restaurant.no_visit_30d` | `resto.ganha_recompra` | WhatsApp (voucher) |
| **bar** | capture | `clube.first_checkin` | `bar.convite_clube` | WhatsApp |
| **bar** | relate | `customer.birthday` | `bar.aniversario` | WhatsApp |
| **bar** | retain | `clube.no_visit_30d` | `bar.ganha_recompra` | WhatsApp |
| **cervejaria** | relate | `brewery.tasting_open` | `brew.convite_degustacao` | E-mail + WhatsApp |
| **cervejaria** | retain | `brewery.sellout_close` | `brew.sellout_mensal` | E-mail (relatório PDV) |
| **contabilidade** | relate | `contab.obligation_due` | `contab.alerta_obrigacao` | E-mail + WhatsApp |
| **contabilidade** | retain | `contab.month_close` | `contab.fechamento_mensal` | E-mail (resumo + documentos) |
| **advocacia** | relate | `legal.case_update` | `adv.atualizacao_processual` | WhatsApp + e-mail |
| **advocacia** | retain | `customer.birthday` | `adv.aniversario` | WhatsApp |
| **educacao** | capture | `educ.matricula_efetivada` | `educ.boas_vindas_aluno` | E-mail + WhatsApp |
| **educacao** | retain | `educ.evasao_risco` | `educ.alerta_evasao` | WhatsApp (coordenador) + e-mail (aluno) |
| **educacao** | expand | `educ.matricula_renovavel` | `educ.renovacao_matricula` | E-mail + WhatsApp |

## Template parametrizável

Veja `_template-niche-regua.json` — esqueleto N8N com:
- Webhook + verificação HMAC
- Switch por `niche_slug` (caso queira um único workflow multi-tenant)
- Branches para WhatsApp (Z-API) e e-mail (Resend)
- Wait nodes para réguas multi-toque (D+1, D+3, D+7…)

Para cada nicho, duplique o template, renomeie o path do webhook para
`<niche>-<event>` e ajuste templates de mensagem.

### Réguas prontas (wave 15)

| Arquivo | Nicho | Evento | Toques |
|---|---|---|---|
| `imob-visit_scheduled.json` | imobiliaria | `realestate.visit_scheduled` | WA confirmação + WA D-1 + WA D-0 2h |
| `clinica-appointment_confirmed.json` | clinica | `agenda.appointment_confirmed` | WA confirmação + WA D-1 |
| `eventos-ticket_purchased.json` | eventos | `event.ticket_purchased` | E-mail QR + WA confirmação |

Próximos a gerar (mesmo padrão): `resto.convite_clube`, `bar.aniversario`, `brew.convite_degustacao`, `contab.alerta_obrigacao`, `adv.atualizacao_processual`, `educ.boas_vindas_aluno`.

## Como ativar uma régua

1. Importar o JSON no N8N → copiar URL do webhook
2. Em `/admin/funnel-rules`, abrir a regra → colar a URL no `workflow_name` ou no `payload_template.webhook_url`
3. Marcar `active = true`
4. Testar com **Dry Run** (botão na própria tela admin) — valida render de template
5. Disparar evento real → conferir em `/admin/n8n-console` o status no `core_funnel_dispatch_queue`

## Observabilidade

- `core_funnel_dispatch_queue` — fila + status (`pending|sent|failed|dead`)
- `n8n_workflow_runs` — log de execução vindo do N8N (via webhook callback)
- `/admin/n8n-console` — visão consolidada por nicho + retry manual
