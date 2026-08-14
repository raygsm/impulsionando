# Automação & n8n — estado real e pendências

Atualizado em: 2026-08-14

Este documento substitui o inventário antigo de rascunho. A regra atual do projeto é: não usar Codex, não reconstruir o que já existe e não marcar automação como ativa sem webhook e execução reais homologados.

## Infraestrutura confirmada

- [x] Instância n8n provisionada e publicada em `https://n8n.impulsionando.com.br`.
- [x] Runtime n8n ativo na VPS e integrado ao ecossistema.
- [x] `n8n_workflow_registry` existe e é a fonte de registro dos workflows.
- [x] `tenant_workflow_state` existe e controla ativação/configuração por cliente.
- [x] Dispatcher server-only `dispatchN8nByEvent` usa registry + state, exige webhook canônico, HMAC e registra execução.
- [x] Core Impulsionando possui dezenas de workflows reais ativos para captação, conversão e relacionamento.
- [x] Workflow proativo do Impulsionito está ativo.
- [x] CHRISMED possui worker compartilhado de outbox ativo e homologado.
- [x] WMP possui intake de lead/briefing ativo e homologado.
- [x] WMP partner intake compartilha intencionalmente o workflow de intake e está registrado como ativo.

## Inventário n8n verificado em produção

Diagnóstico de 2026-08-14: 31 workflows exportados, 28 ativos.

Há três workflows inativos no runtime que devem permanecer sem uso até limpeza controlada:
- uma versão antiga de `Impulsionando · captacao · lead-qualificado`;
- uma versão antiga de `Impulsionando · conversao · pagamento-aprovado`;
- um workflow genérico chamado `My workflow`.

Não excluir sem validar ausência de referências; as versões ativas correspondentes já existem para os dois primeiros.

## CHRISMED

### Ativo e homologado
- [x] `chrismed.outbox.processor`
  - workflow id: `chrismedOutboxWorker01`;
  - execução: shared outbox worker;
  - registry: ACTIVE;
  - tenant state: ACTIVE;
  - `communication_automations`: sincronizado para ACTIVE em 2026-08-14.

### Preparado, mas ainda não ativo
Os itens abaixo existem no registry e em `communication_automations`, porém permanecem READY/DRAFT porque não possuem workflow/webhook individual homologado. Não criar workflows separados automaticamente sem comprovar que o evento precisa de orquestração além do worker/outbox compartilhado.

- appointment-created
- appointment-cancelled
- appointment-rescheduled
- appointment-reminders
- booking-abandoned
- critical-alerts
- daily-operational-digest
- event-checkin
- event-confirmation
- event-invitation
- event-post-survey
- event-reminder
- failed-delivery-recovery
- new-lead
- payment-approved
- pega-agenda-expiration
- pega-agenda-offer
- pega-agenda-open-slot
- reactivation
- registration-abandoned

Próxima regra de execução: localizar o ponto transacional real de cada evento e decidir se ele deve apenas gerar item no outbox ou também disparar workflow n8n. Somente então ativar registry/state.

## WMP

### Ativo e homologado
- [x] `wmp_lead_intake` → `wmpLeadIntake01`.
- [x] `wmp_partner_intake` → compartilhado com `wmpLeadIntake01`.
- [x] Backend de briefing despacha `wmp.lead.received`.
- [x] Backend de parceiro despacha `wmp.partner.received`.
- [x] Envio real de proposta passou a despachar `wmp.proposal.sent` em 2026-08-14; o dispatcher permanece seguro porque o lifecycle ainda está READY e portanto não chama webhook inexistente.

### Preparado, ainda não ativo
- `wmp_proposal_lifecycle`
- `wmp_dj_booking_lifecycle`
- `wmp_post_event_relationship`

Esses workflows só devem ser ativados depois que os eventos correspondentes existirem em pontos transacionais reais e houver automação útil implementada no n8n.

## Impulsionito e agentes

- [x] Impulsionito é o agente master do Core e usa a rota omnichannel.
- [x] Oliver é a instância CHRISMED e usa a rota omnichannel.
- [x] Milito é a instância WMP e passou a usar a rota omnichannel em 2026-08-14.
- [ ] A chave técnica WMP ainda é `wmp-millito` e algumas rotas/nomes de arquivo internos ainda usam `millito` por compatibilidade. Isso é dívida técnica controlada; a experiência visível deve usar sempre `Milito`.

## Credenciais e canais externos

Validar por cliente antes de considerar comunicação 100% homologada:
- WhatsApp/provider: número, token e webhook de entrada;
- e-mail: domínio/remetente, SPF, DKIM e DMARC;
- Meta Business: aprovação de templates quando o canal exigir;
- gateways financeiros específicos.

Nunca inserir segredo em código, log ou documentação.

## Observabilidade e LGPD

Pendências de evolução que não devem ser confundidas com ausência do n8n:
- política jurídica de retenção de logs;
- garantia de esquecimento/anonimização de PII em logs de automação;
- alertas operacionais por taxa de falha;
- dashboards externos de observabilidade, se adotados;
- propagação de trace/correlation id entre backend, n8n e canais.

## Regra definitiva

Um workflow só pode passar para ACTIVE quando todos os itens forem verdadeiros:
1. evento real existe no backend/banco;
2. workflow real existe no n8n;
3. webhook canônico foi verificado;
4. registry possui `n8n_workflow_id` e webhook corretos;
5. tenant state está ACTIVE;
6. assinatura/HMAC e idempotência estão preservadas;
7. execução de teste retorna sucesso;
8. efeito de negócio esperado foi comprovado.
