# F — Checklist Operacional do Backend Impulsionito (W110.F)

> Complementa `IMPULSIONITO_BACKEND_ROADMAP_W110.md` (arquitetura) com um **checklist de execução** ordenado por dependência. Nada aqui é executado nesta trava (`frontend-only-lock`) — é o mapa que o Codex/você usará quando destravar.
>
> Objetivo final: substituir "Papo AI" pelo Impulsionito próprio, integrando WhatsApp e canal interno do Core, sem quebrar produção.

---

## Fase 0 — Preparação (fora desta trava)

- [ ] Decidir provedor primário: **Lovable AI Gateway** (default) ou **OpenAI Responses API** direto.
  - Critério: se precisa de vector store gerenciado + file_search → OpenAI direto; se só chat + tools → Gateway.
- [ ] Registrar decisão em `mem://core/impulsionito-provider`.
- [ ] Provisionar secret via ferramenta de secrets: `OPENAI_API_KEY` **ou** confirmar `LOVABLE_API_KEY` já presente.
- [ ] Criar branch `feat/impulsionito-backend` com deploy preview.

## Fase 1 — Schema (migration única)

Tabelas em schema `public`, com RLS + GRANT completos:

- [ ] `imp_conversations` (`id`, `company_id`, `user_id`, `channel` enum[`web`,`whatsapp`,`email`], `status`, `created_at`, `updated_at`)
- [ ] `imp_messages` (`id`, `conversation_id`, `role` enum[`user`,`assistant`,`system`,`tool`], `content` jsonb, `tokens_in`, `tokens_out`, `model`, `latency_ms`, `created_at`)
- [ ] `imp_handoffs` (`id`, `conversation_id`, `from_role`, `to_role`, `assigned_to`, `reason`, `resolved_at`)
- [ ] `imp_knowledge` (`id`, `company_id`, `title`, `content`, `embedding` vector(1536), `tags[]`, `updated_at`) — habilitar extensão `vector`.
- [ ] `imp_agent_configs` (`id`, `company_id` nullable, `niche_code`, `system_prompt`, `tools` jsonb, `model`, `temperature`)
- [ ] Índices: `conversation_id`, `company_id`, `created_at desc`, `ivfflat` em `embedding`.
- [ ] Policies: cliente vê só suas conversas; admin master (`raygs@hotmail.com`) vê tudo via `has_role`.
- [ ] GRANT para `authenticated` + `service_role` (nunca `anon`).
- [ ] Seed do `imp_agent_configs` default por nicho (imob, eventos, bar, clínica, adv, fitness, restaurante).

## Fase 2 — Server functions internas (`createServerFn`)

- [ ] `sendImpulsionitoMessage` — cria/reusa conversa, salva user message, chama LLM (Responses API), grava assistant streaming, retorna `AsyncIterable`.
  - Middleware: `requireSupabaseAuth`.
  - Middleware bearer no `src/start.ts` — já configurado, apenas confirmar.
- [ ] `listImpulsionitoConversations` — histórico paginado por `company_id`.
- [ ] `getImpulsionitoConversation` — mensagens ordenadas.
- [ ] `deleteImpulsionitoConversation` — soft delete.
- [ ] `escalateToHuman` — cria `imp_handoffs`, notifica.
- [ ] `searchImpulsionitoKnowledge` — RAG (embedding query → top-K por `company_id`).
- [ ] Tool schemas (function calling): `open_agenda`, `create_lead`, `open_ticket`, `check_billing_status`, `generate_payment_link` — cada tool é uma server function separada com autorização própria.

## Fase 3 — Rota HTTP interna

- [ ] `src/routes/api/impulsionito/chat.ts` — `POST` recebe `{ messages, conversationId? }`, valida auth, chama `sendImpulsionitoMessage`, retorna `toUIMessageStreamResponse` (padrão AI SDK).
- [ ] Zod validation em toda entrada.
- [ ] Rate limit por `user_id` (janela deslizante, tabela `imp_rate_limits`).

## Fase 4 — Ligar UI existente

- [ ] Trocar `useImpulsionitoTransport` em `src/components/impulsionito/transport.ts` para transport HTTP/SSE apontando para `/api/impulsionito/chat`.
- [ ] Manter fallback mock via env `VITE_IMPULSIONITO_MODE=mock` para dev/demo.
- [ ] Persistir `conversationId` no `localStorage` + reidratar do servidor no login.
- [ ] Ligar histórico real no `ImpulsionitoDock` (aba "Conversas").

## Fase 5 — WhatsApp (canal externo)

- [ ] Escolher provedor fase 1: **Z-API** (rápido, sandbox pronto).
- [ ] Secret: `ZAPI_TOKEN`, `ZAPI_INSTANCE_ID`.
- [ ] Rota pública: `src/routes/api/public/impulsionito/whatsapp-webhook.ts`
  - Verificar assinatura HMAC do provedor.
  - Mapear `phone → user_id` via tabela `customers`.
  - Criar/atualizar `imp_conversations` com `channel="whatsapp"`.
  - Chamar `sendImpulsionitoMessage` (mesma engine que o dock web).
- [ ] Enviar resposta via Z-API HTTP (`sendText`, `sendImage`).
- [ ] Console admin: `/admin/impulsionito/conversas` (web) já mostra WhatsApp integrado.
- [ ] Fase 2 (após validação): migrar para **Meta Cloud API** oficial.

## Fase 6 — Handoff humano

- [ ] Fila de atendimento (`/admin/impulsionito/fila`) com WebSocket/Realtime.
- [ ] Botão "assumir atendimento" (bloqueia IA na conversa).
- [ ] Botão "devolver para IA".
- [ ] Botão "encerrar conversa" (marca `status=closed`).
- [ ] Notificação toast/push para atendentes online.

## Fase 7 — Rollout paralelo (não desligar Papo AI ainda)

- [ ] Feature flag `impulsionito.enabled` por `company_id` (tabela `feature_flags`).
- [ ] Rodar Impulsionito e Papo AI em paralelo por 2 semanas.
- [ ] Métricas comparativas: latência, custo/msg, CSAT, taxa de handoff, deflection rate.
- [ ] Dashboard `/admin/impulsionito/kpis`.

## Fase 8 — Desligar Papo AI

- [ ] Confirmar paridade + KPIs iguais ou melhores.
- [ ] Redirecionar webhooks legados para o novo endpoint.
- [ ] Remover código do Papo AI (`grep -r "papo" src/`).
- [ ] Comunicar mudança nos changelogs / e-mail cliente.

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Custo LLM descontrolado | Rate limit por user, budget por company, alerta em `imp_usage_alerts` |
| Vazamento cross-tenant no RAG | Filtro obrigatório `company_id` em toda query de embedding; testes RLS |
| Latência WhatsApp | Streaming não se aplica ao WhatsApp — enviar resposta em bloco após completar |
| Assistants API descontinuada | Escolha Responses API (não Assistants) — já decidido no roadmap |
| Handoff perde contexto | Sempre enviar transcript completo (últimas N msgs) no card do atendente |
| Provedor WhatsApp instável (Z-API) | Fase 2 migra para Meta Cloud API oficial |

## Definição de pronto (por fase)

- **Backend pronto:** todos os endpoints com auth + rate limit + logs, cobertura de testes ≥ 60%.
- **UI ligada:** dock web funciona ponta-a-ponta em 1 empresa piloto.
- **WhatsApp pronto:** 1 número Z-API recebe e responde, log em `imp_conversations`.
- **Handoff pronto:** atendente humano assume e devolve conversa sem perder contexto.
- **Rollout pronto:** feature flag ligada em 3 empresas piloto por 14 dias sem incidente P0.
- **Papo AI desligado:** grep não encontra referência ativa; rollback documentado.

---

## Ordem enxuta recomendada

1. Fase 0 + 1 (schema).
2. Fase 2 (`sendImpulsionitoMessage` mínimo — sem tools ainda).
3. Fase 3 + 4 (rota + trocar transport, mock permanece atrás de flag).
4. Fase 6 (handoff humano — antes do WhatsApp, para ter escape hatch).
5. Fase 5 (WhatsApp Z-API).
6. Fase 7 (paralelo com Papo AI).
7. Fase 2 (tools/function calling completas).
8. Fase 8 (desligar Papo AI).

Nenhum item acima é executado nesta trava. Este documento é a lista de compras para quando o backend for autorizado.
