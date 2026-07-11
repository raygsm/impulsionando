# CHRISMED V4 — Execution Prompt & Handoff (congelado)

Documento de rastreabilidade da rota pública `/chrismed/agendar` V4.
Nenhum item aqui está implementado em runtime. Este arquivo existe para
que Codex e Lovable convirjam sobre contratos, responsabilidades e
critérios de descongelamento.

## 1. Objetivo da V4

Reconstruir a experiência visual e funcional de agenda, reserva e
pagamento (Quiet Luxury: marfim, carvão, champagne) consumindo os
contratos backend V4 reais — sem inventar confirmação de consulta,
pagamento, reembolso, slot ou WhatsApp quando o backend não retornar
evidência.

## 2. Contratos esperados (13)

1. `offerings` — catálogo real (modalidade, preço, duração, cortesia).
2. `professionals` — vinculados às ofertas e unidades.
3. `availability` — janela real por profissional/unidade, com `server_time`.
4. `hold create` — lock transacional com `expires_at` e `public_status_token`.
5. `hold status` — leitura por token público, sem sessão.
6. `hold release` — liberação idempotente.
7. `payment create` — Mercado Pago (PIX) com `public_status_token` e
   suporte a cortesia sem cobrança (`appointment_id` só após webhook).
8. `payment status` — leitura por token público, idempotente.
9. `appointment confirm` — dirigido por webhook idempotente (`event_id`).
10. `appointment lookup` — por id + token público.
11. `reschedule` — validado contra política versionada.
12. `cancel` — status oficial + preview de reembolso vindo do backend.
13. `refund` — via `mpago-refund`, status oficial.

Complementos:

- `policies` versionadas (LGPD, termos, cancelamento, comunicação).
- Observabilidade (`trace_id`/`request_id`) e correção de deriva
  (`server_time`) em toda resposta com `expires_at`.

Referências de tipo: `src/content/chrismed/v4/contracts.ts`.
Assinaturas do adapter inerte: `src/lib/chrismed/scheduling-client.ts`.

## 3. Trava frontend-only (ativa)

Ver `mem/core/frontend-only-lock.md`. Enquanto ativa, é PROIBIDO alterar
Supabase, migrations, RLS, edge functions, Mercado Pago, webhooks, N8N,
secrets, endpoints reais ou qualquer lógica transacional. Permitido:
markup, estilos, contratos tipados, dicionários, documentação e
adapters inertes.

## 4. Bloqueadores atuais (Codex)

- Endpoints reais `/api/chrismed/scheduling/*` inexistentes.
- Schema/migrations de `offerings`, `professionals`, `units`,
  `service_offering_professional`, `slot_holds`, `appointments`,
  `policies_versions` não confirmados.
- RLS por tenant/paciente/token público não testada.
- Lock transacional de slot (conflito 409, expiração server-side) não
  validado.
- `mpago-create-payment` ainda não expõe `public_status_token` nem
  fluxo de cortesia sem cobrança.
- Webhook de confirmação de appointment ainda não idempotente por
  `event_id`.
- Tokens públicos efêmeros (TTL, escopo, algoritmo) não definidos.
- Políticas versionadas (LGPD, termos, cancelamento, comunicação) sem
  tabela pública para leitura anônima.
- Endpoint/realtime de status autorizado por token público não definido.
- Testes de concorrência e cross-tenant ausentes.

## 5. Responsabilidades — Lovable

- Manter componentes V4 desmontados em `src/components/chrismed/v4/_unmounted/`.
- Manter contratos tipados e dicionários PT/EN/ES atualizados.
- Manter adapter inerte `src/lib/chrismed/scheduling-client.ts` refletindo
  as assinaturas oficiais.
- Preparar UI Quiet Luxury sem simular estados de sucesso.
- Nunca renderizar confirmação/pagamento aprovado/slot travado sem
  resposta real do backend.
- Countdown do hold no cliente é apenas espelho, calculado a partir de
  `expires_at` corrigido por `server_time` — reconciliado com o backend,
  nunca fonte de verdade.

## 6. Responsabilidades — Codex

- Entregar schema, migrations, RLS, GRANTs.
- Implementar os 13 endpoints com idempotência, tokens públicos e
  observabilidade.
- Refatorar `mpago-create-payment` para novo contrato (cortesia +
  `public_status_token` + `appointment_id` pós-webhook).
- Implementar webhook idempotente de confirmação de appointment.
- Publicar tabelas de políticas versionadas com leitura pública segura.
- Fornecer testes de concorrência, RLS e cross-tenant.
- Definir ambiente Mercado Pago (sandbox/prod) e credenciais via
  secrets.
- Ajustar N8N para consumir eventos reais (`appointment_confirmed`,
  `payment_expired`, `hold_conflict`, `refund_processed`).

## 7. Critérios para descongelar a V4

A V4 só poderá ser montada em rota real quando o Codex entregar e
comprovar:

- endpoints reais respondendo com contratos definidos;
- schema real com migrations aplicadas;
- RLS testada por tenant/paciente/token público;
- lock transacional de slot validado sob concorrência;
- appointment persistido apenas após webhook aprovado;
- Mercado Pago em ambiente definido (sandbox ou prod);
- webhook idempotente por `event_id`;
- tokens públicos efêmeros com TTL claro;
- políticas versionadas acessíveis publicamente;
- fluxos de remarcação, cancelamento e reembolso implementados;
- observabilidade (`trace_id`, logs, métricas);
- testes de concorrência e cross-tenant passando.

## 8. Checklist de integração (para quando descongelar)

- [ ] Substituir `schedulingClient` inerte por implementação real
      isolada (nunca acessar Supabase direto na UI).
- [ ] Montar `Step1..Step5` a partir de `_unmounted/` com loaders reais.
- [ ] Wire dos estados oficiais (`hold`, `payment`, `appointment`).
- [ ] Countdown server-authoritative com reconciliação periódica.
- [ ] i18n PT/EN/ES cobrindo todos os estados.
- [ ] Erros tipados via `V4SchedulingError`.
- [ ] Fallback humano (Oliver) em `error_gateway` e `error_network`.

## 9. Checklist de segurança

- [ ] Nenhum token/credencial no cliente além dos públicos efêmeros.
- [ ] Nenhum PII gravado em `localStorage`/`sessionStorage`.
- [ ] Tokens públicos com escopo mínimo (hold ou pagamento específico).
- [ ] RLS validada por endpoint e por tenant.
- [ ] Webhooks com verificação de assinatura + idempotência.
- [ ] Sem exposição de payment_id/appointment_id sem token.

## 10. Checklist de testes

- [ ] Concorrência de hold (dois clientes disputando slot).
- [ ] Expiração de hold durante pagamento.
- [ ] Webhook duplicado (idempotência).
- [ ] Cortesia sem cobrança gera appointment sem payment aprovado.
- [ ] Remarcação respeitando política versionada.
- [ ] Cancelamento com preview de reembolso do backend.
- [ ] Reembolso end-to-end via Mercado Pago.
- [ ] Cross-tenant: nenhum vazamento entre clínicas.
- [ ] i18n PT/EN/ES em todos os estados.

## 11. Proibição de mocks funcionais

Enquanto os endpoints reais não existirem, é PROIBIDO:

- conectar componentes V4 a mocks/fixtures;
- simular lock, agendamento ou pagamento aprovado;
- criar contagem regressiva client-side sem `expires_at` do backend;
- criar confirmação de appointment sem persistência real;
- inventar tokens, IDs, `event_id` ou status.

## 12. Dependências externas

- **Mercado Pago:** `mpago-create-payment` e `mpago-refund` com contrato
  V4 (cortesia, `public_status_token`, mapeamento canônico de status,
  webhook idempotente).
- **RLS:** políticas por tenant + acesso público controlado por token
  para hold/payment/appointment lookup.
- **Webhooks:** assinatura verificada, idempotência por `event_id`.
- **N8N:** consumir eventos reais; não disparar comunicação sem
  confirmação backend.

---

**Status:** Preparação inerte concluída (contratos + adapter +
documentação). Nenhuma tela V4 montada. Aguardando entrega e validação
do Codex para descongelar.
