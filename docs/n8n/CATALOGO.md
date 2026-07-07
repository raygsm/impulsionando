# Catálogo Mestre — Workflows N8N Impulsionando

63 workflows core + variações por nicho. Todos nascem em `modo: demo`,
status `rascunho`. Colunas:

- **ID**: id numérico do prompt-mãe.
- **Slug**: usado no webhook e no arquivo JSON.
- **Régua**: captacao | conversao | relacionamento | retencao | financeiro | suporte | vitrine | operacao.
- **Gatilho**: evento que dispara.
- **Canais**: canais usados quando em produção.
- **Plano mín.**: menor plano do tenant que habilita.
- **Status**: estado atual (rascunho até aprovação).

## Captação (1–8)

| ID | Slug                        | Régua     | Gatilho                                | Canais              | Plano mín. | Status    |
| -- | --------------------------- | --------- | -------------------------------------- | ------------------- | ---------- | --------- |
| 1  | lead-captado                | captacao  | form/lp/vitrine → lead novo            | email, impulsionito | Free       | rascunho  |
| 2  | lead-qualificado            | captacao  | score ≥ threshold                      | whatsapp, email     | Essencial  | rascunho  |
| 3  | lead-sem-resposta           | captacao  | 48h sem interação                      | whatsapp, email     | Essencial  | rascunho  |
| 4  | lead-quente                 | captacao  | intent alto (revisita, download)       | whatsapp, interno   | Pro        | rascunho  |
| 5  | lead-vitrine                | captacao  | clique/contato via vitrine             | email, impulsionito | Free       | rascunho  |
| 6  | lead-whatsapp               | captacao  | msg recebida no WhatsApp oficial       | whatsapp            | Essencial  | rascunho  |
| 7  | lead-quiz                   | captacao  | finalizou quiz de recomendação         | email, impulsionito | Free       | rascunho  |
| 8  | lead-redes-sociais          | captacao  | webhook Meta/Insta/TikTok Ads          | whatsapp, email     | Pro        | rascunho  |

## Conversão (9–19)

| ID | Slug                        | Régua     | Gatilho                          | Canais              | Plano mín. | Status    |
| -- | --------------------------- | --------- | -------------------------------- | ------------------- | ---------- | --------- |
| 9  | cadastro-iniciado           | conversao | POST /signup start               | email               | Free       | rascunho  |
| 10 | cadastro-abandonado         | conversao | 30min sem completar              | email, whatsapp     | Essencial  | rascunho  |
| 11 | cadastro-concluido          | conversao | user.created                     | email, impulsionito | Free       | rascunho  |
| 12 | checkout-iniciado           | conversao | checkout.started                 | email               | Essencial  | rascunho  |
| 13 | pix-gerado                  | conversao | invoice.pix_created              | whatsapp, email     | Essencial  | rascunho  |
| 14 | pix-expirado                | conversao | invoice.pix_expired              | whatsapp, email     | Essencial  | rascunho  |
| 15 | cartao-recusado             | conversao | payment.card_declined            | email, whatsapp     | Essencial  | rascunho  |
| 16 | pagamento-aprovado          | conversao | payment.approved                 | email, whatsapp, imp| Essencial  | rascunho  |
| 17 | boleto-emitido              | conversao | invoice.boleto_created           | email               | Essencial  | rascunho  |
| 18 | boleto-pago                 | conversao | invoice.boleto_paid              | email, whatsapp     | Essencial  | rascunho  |
| 19 | trial-premium-iniciado      | conversao | subscription.trial_started       | email, impulsionito | Free       | rascunho  |

## Relacionamento (20–30)

| ID | Slug                     | Régua           | Gatilho                          | Canais              | Plano mín. | Status    |
| -- | ------------------------ | --------------- | -------------------------------- | ------------------- | ---------- | --------- |
| 20 | boas-vindas              | relacionamento  | account.activated                | email, impulsionito | Free       | rascunho  |
| 21 | onboarding-d0            | relacionamento  | +0d                              | impulsionito, email | Free       | rascunho  |
| 22 | onboarding-d1            | relacionamento  | +1d                              | email, whatsapp     | Free       | rascunho  |
| 23 | onboarding-d3            | relacionamento  | +3d                              | email               | Free       | rascunho  |
| 24 | onboarding-d7            | relacionamento  | +7d                              | email               | Free       | rascunho  |
| 25 | modulo-nao-configurado   | relacionamento  | módulo instalado sem config 48h  | impulsionito, email | Essencial  | rascunho  |
| 26 | cliente-sem-uso          | relacionamento  | 14d sem login                    | email, whatsapp     | Essencial  | rascunho  |
| 27 | cliente-engajado         | relacionamento  | uso alto → parabéns/case         | email, impulsionito | Pro        | rascunho  |
| 28 | sugestao-recurso         | relacionamento  | heurística + IA                  | impulsionito        | Pro        | rascunho  |
| 29 | tutorial-automatico      | relacionamento  | primeira vez em módulo           | impulsionito        | Free       | rascunho  |
| 30 | impulsionito-proativo    | relacionamento  | detecção de padrão               | impulsionito        | Pro        | rascunho  |

## Retenção (31–40)

| ID | Slug                     | Régua     | Gatilho                          | Canais              | Plano mín. | Status    |
| -- | ------------------------ | --------- | -------------------------------- | ------------------- | ---------- | --------- |
| 31 | trial-d15                | retencao  | +15d de trial                    | email, impulsionito | Free       | rascunho  |
| 32 | trial-d25                | retencao  | +25d de trial                    | email, whatsapp     | Free       | rascunho  |
| 33 | trial-d29                | retencao  | +29d (última chance)             | whatsapp, email     | Free       | rascunho  |
| 34 | trial-expirado           | retencao  | trial.ended                      | email, impulsionito | Free       | rascunho  |
| 35 | renovacao-proxima        | retencao  | 7d antes do vencimento           | email, whatsapp     | Essencial  | rascunho  |
| 36 | cancelamento-solicitado  | retencao  | cancel.requested                 | interno, email      | Essencial  | rascunho  |
| 37 | cancelamento-confirmado  | retencao  | cancel.confirmed                 | email, interno      | Essencial  | rascunho  |
| 38 | reativacao               | retencao  | ex-cliente volta                 | email, whatsapp     | Essencial  | rascunho  |
| 39 | upsell-oportunidade      | retencao  | heurística de uso                | impulsionito, email | Pro        | rascunho  |
| 40 | downgrade-preventivo     | retencao  | baixo uso + próximo do venc.     | impulsionito, email | Pro        | rascunho  |

## Financeiro (41–50)

| ID | Slug                            | Régua       | Gatilho                       | Canais              | Plano mín. | Status    |
| -- | ------------------------------- | ----------- | ----------------------------- | ------------------- | ---------- | --------- |
| 41 | pagamento-confirmado            | financeiro  | payment.confirmed             | email, whatsapp     | Essencial  | rascunho  |
| 42 | pagamento-recusado              | financeiro  | payment.failed                | email, whatsapp     | Essencial  | rascunho  |
| 43 | inadimplencia                   | financeiro  | 3d após vencimento            | whatsapp, email     | Essencial  | rascunho  |
| 44 | suspensao-automatica            | financeiro  | 15d de inadimplência          | email, interno      | Essencial  | rascunho  |
| 45 | reativacao-pos-pagamento        | financeiro  | payment após suspensão        | email, impulsionito | Essencial  | rascunho  |
| 46 | repasse-pendente                | financeiro  | payout.pending (WL)           | interno, email      | WL         | rascunho  |
| 47 | repasse-realizado               | financeiro  | payout.completed              | email               | WL         | rascunho  |
| 48 | nota-fiscal-pendente            | financeiro  | invoice.nf_pending            | interno, email      | Pro        | rascunho  |
| 49 | nota-fiscal-emitida             | financeiro  | invoice.nf_issued             | email               | Pro        | rascunho  |
| 50 | tenant-emitir-nf-cliente-final  | financeiro  | pedido pago pelo consumidor   | interno, email      | Pro        | rascunho  |

## Suporte (51–56)

| ID | Slug                     | Régua     | Gatilho                          | Canais              | Plano mín. | Status    |
| -- | ------------------------ | --------- | -------------------------------- | ------------------- | ---------- | --------- |
| 51 | chamado-aberto           | suporte   | ticket.created                   | email, interno      | Free       | rascunho  |
| 52 | sla-vencendo             | suporte   | 30min do SLA                     | interno             | Essencial  | rascunho  |
| 53 | sla-vencido              | suporte   | SLA passou                       | interno, email      | Essencial  | rascunho  |
| 54 | chamado-resolvido        | suporte   | ticket.resolved                  | email               | Free       | rascunho  |
| 55 | avaliacao-negativa       | suporte   | csat ≤ 2                         | interno, email      | Essencial  | rascunho  |
| 56 | escalonamento-humano     | suporte   | flag manual/IA                   | interno             | Free       | rascunho  |

## Vitrine & Clube (57–63)

| ID | Slug                     | Régua     | Gatilho                          | Canais              | Plano mín. | Status    |
| -- | ------------------------ | --------- | -------------------------------- | ------------------- | ---------- | --------- |
| 57 | vitrine-publicado        | vitrine   | tenant.vitrine_enabled           | email, interno      | Essencial  | rascunho  |
| 58 | vitrine-removido         | vitrine   | tenant.vitrine_disabled          | interno             | Essencial  | rascunho  |
| 59 | clube-favorito-novo      | vitrine   | consumer favorited tenant        | impulsionito, email | Free       | rascunho  |
| 60 | clube-voucher-usado      | vitrine   | voucher.redeemed                 | email, whatsapp     | Free       | rascunho  |
| 61 | vitrine-avaliacao        | vitrine   | review.created                   | email               | Essencial  | rascunho  |
| 62 | clube-empresa-proxima    | vitrine   | geo match por CEP                | impulsionito, email | Free       | rascunho  |
| 63 | clube-recomendacao       | vitrine   | recomendação por histórico       | impulsionito, email | Free       | rascunho  |

## Variações por nicho

Ver `matriz-nichos.md`. Cada linha ali gera um sub-workflow com prefixo
`{niche}-` (ex.: `clinica-consulta-confirmada`, `bar-pedido-delivery`).
