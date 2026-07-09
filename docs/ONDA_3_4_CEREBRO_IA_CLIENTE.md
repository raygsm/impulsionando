# Onda 3.4 — Cérebro IA por Cliente

Fase 3.4 do Core Impulsionando. Base real (schema + server functions + tela funcional) do assistente virtual por cliente, com destravamento backend controlado.

## Escopo

- Configuração persistida do cérebro IA por empresa (1:1).
- Base de conhecimento (FAQs, notas, docs, URLs, scripts, políticas).
- Auditoria de alterações (create/update/status/kb_add/kb_remove).
- Tela funcional em `/admin/clientes/$slug/cerebro-ia`.

Fora de escopo: execução real do agente, integrações com WhatsApp/N8N, embeddings, custo por chamada. Entram na Fase 3.5 após credenciais.

## Migration

`supabase/migrations/*` (Fase 3.4):

- `core_ai_brains` — 1 registro por `company_id` (UNIQUE). Campos: `agent_name`, `tone`, `approach`, `languages[]`, `channels[]`, `schedule jsonb`, `base_prompt`, `complementary_prompt`, `status` ∈ {draft, active, inactive}, `created_by`, `updated_by`.
- `core_ai_brain_knowledge` — itens da base de conhecimento (`kind` ∈ note/faq/doc/url/script/policy).
- `core_ai_brain_events` — auditoria de eventos.

### RLS

- Staff Impulsionando (`is_impulsionando_staff(auth.uid())`): acesso total (ALL).
- Membros do próprio cliente (`user_roles.company_id = company_id`): leem e editam apenas a configuração da sua empresa e a KB.
- Eventos: staff + membros do cliente leem; ambos podem inserir.
- Nenhum acesso `anon`. Dados nunca cruzam entre clientes.

### Compat

- `ai_prompt_library` intacta (não referenciada).
- Aditivo: nenhuma tabela existente foi alterada.

## Arquivos alterados

- `supabase/migrations/*_cerebro_ia_cliente.sql` (novo).
- `src/lib/ai-brain.functions.ts` (novo) — `getAiBrain`, `upsertAiBrain`, `setAiBrainStatus`, `addAiBrainKnowledge`, `removeAiBrainKnowledge`.
- `src/routes/_authenticated/admin.clientes.$slug.cerebro-ia.tsx` — reescrito em modo funcional (formulário, KB, histórico).
- `src/integrations/supabase/types.ts` — regenerado.

## Regras de acesso resumidas

| Ator                          | Ler | Editar cérebro | KB add/remove | Ver histórico |
| ----------------------------- | :-: | :------------: | :-----------: | :-----------: |
| Staff Impulsionando           |  ✓  |       ✓        |       ✓       |       ✓       |
| Membro da empresa (user_role) |  ✓  |       ✓        |       ✓       |       ✓       |
| Outro cliente                 |  —  |       —        |       —       |       —       |
| Anônimo                       |  —  |       —        |       —       |       —       |

## Testes recomendados

1. Como staff: abrir `/admin/clientes/{slug}/cerebro-ia`, preencher nome do agente, tom, idiomas (`pt-BR, es-BO`), canais (`WhatsApp, Web`), horários (JSON), prompts, salvar. Confirmar registro `create` no histórico.
2. Trocar status para `active` via Select — confirmar evento `status_change`.
3. Adicionar item de KB (FAQ) e remover — confirmar `kb_add` e `kb_remove`.
4. Autenticar como membro de outra empresa: tentar abrir a URL do cliente A → 401/erro "Sem acesso a este cliente".
5. Verificar que `ai_prompt_library` não foi tocada.

## Riscos

- `schedule` aceita JSON livre — validação apenas de forma. Formalizar shape na Fase 3.5.
- `base_prompt`/`complementary_prompt` limitados a 8k chars (defensivo). Ajustar se surgirem casos maiores.
- Sem versionamento de prompt — auditoria captura apenas metadados. Versionamento completo (diff) entra na 3.5 junto do sandbox de teste.

## Pendências (Fase 3.5 e 3.6)

- Integração real com WhatsApp Cloud API + N8N (credenciais por cliente, `core_whatsapp_credentials`).
- Sandbox de conversa e testes com Lovable AI Gateway.
- Embeddings da KB para RAG.
- Versionamento e diff de prompts.
- Governança de custos (limites por cliente, alertas).
