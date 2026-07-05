# Roadmap — Impulsionito próprio (sem Papo AI) — W110

> **Não executado**. Documento entregue como pré-requisito para o time de
> backend/infra (ou próximo turno com autorização explícita destravando a
> regra `mem/core/frontend-only-lock.md`).

## 1. Objetivo

Substituir o Papo AI por uma arquitetura própria dentro do Core
Impulsionando, com o Impulsionito atendendo:

1. **No site** (visitantes públicos e usuários logados no Core).
2. **No WhatsApp** (via Z-API / Evolution / Meta Cloud API).

Fluxo alvo:

```text
[Site / Painel Core]           [WhatsApp]
        ↓                          ↓
                       Webhook / server fn
                                ↓
                      CRM próprio (conversations)
                                ↓
                        Impulsionito (orquestrador)
                                ↓
              Lovable AI Gateway (google/gemini-3-flash-preview)
                            OU OpenAI Responses API direta
                                ↓
                        Resposta → mesmo canal
```

**Chave**: nenhum secret de IA ou WhatsApp no front-end. Tudo em server
fn / server route no Worker.

## 2. Escolha do provedor de IA

Prioridade recomendada:

1. **Lovable AI Gateway** (`google/gemini-3-flash-preview`) — já
   disponível no projeto (`src/lib/ai-gateway.server.ts`), sem secret
   adicional, multimodal (T+I+A+V), custo baixo. **Escolha padrão**.
2. **OpenAI Responses API direta** — se cliente exigir OpenAI:
   `POST https://api.openai.com/v1/responses` com `OPENAI_API_KEY` como
   secret runtime. Assistants API está legada; **usar Responses API**.

Ambos passam pelo mesmo endpoint interno `/api/impulsionito/chat` — o
provedor é detalhe de implementação.

## 3. Escolha do provedor de WhatsApp

| Provedor | Prós | Contras | Recomendação |
|---|---|---|---|
| **Z-API** | Setup em minutos, número comum, R$/mês fixo | Não oficial Meta | Fase 1 (piloto) |
| **Evolution API** | Self-hosted, sem mensalidade | Precisa VPS + manutenção | Fase 1 alternativa |
| **Meta WhatsApp Cloud API** | Oficial, escala, template messages | Verificação de empresa, número dedicado, custo por conversa | Fase 2 (produção madura) |

Recomendação: começar com **Z-API** para validar o pipeline; migrar para
Meta Cloud quando volume justificar.

## 4. Modelo de dados (schema mínimo)

Novas tabelas em `public`, seguindo padrão do core (RLS por
`company_id`, GRANT explícito, `has_role`):

```sql
-- Conversas (uma por thread contato+canal)
CREATE TABLE public.imp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('site','panel','whatsapp','instagram','manual')),
  contact_phone text,
  contact_name text,
  contact_email text,
  external_id text,                   -- id do provedor (Z-API msg id, etc.)
  status text NOT NULL DEFAULT 'ai',  -- ai | waiting_human | human | closed
  assigned_user_id uuid REFERENCES auth.users(id),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mensagens
CREATE TABLE public.imp_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.imp_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool','human_agent')),
  content text NOT NULL,
  parts jsonb,                         -- UIMessage parts do AI SDK
  intent text,                         -- intenção detectada
  context_snapshot jsonb,              -- tenant/módulos/página/plano usados
  provider text,                       -- lovable-gateway | openai | zapi | evolution
  provider_msg_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Handoffs (transferências IA↔humano)
CREATE TABLE public.imp_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.imp_conversations(id) ON DELETE CASCADE,
  from_role text NOT NULL,             -- ai | human
  to_role text NOT NULL,
  reason text,
  by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Base de conhecimento (por tenant + global)
CREATE TABLE public.imp_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE, -- null = global core
  scope text NOT NULL,                 -- core | plano | modulo | nicho | tenant
  title text NOT NULL,
  body_md text NOT NULL,
  tags text[] DEFAULT '{}',
  embedding vector(1536),              -- pgvector, opcional para RAG
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Config por tenant do agente
CREATE TABLE public.imp_agent_configs (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  system_prompt text,                  -- override do prompt central
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature numeric DEFAULT 0.4,
  max_tokens int DEFAULT 800,
  handoff_email text,
  handoff_whatsapp text,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Logs (métricas + auditoria)
CREATE TABLE public.imp_agent_logs (
  id bigserial PRIMARY KEY,
  conversation_id uuid REFERENCES public.imp_conversations(id) ON DELETE CASCADE,
  company_id uuid,
  event text NOT NULL,                 -- request | response | error | handoff | tool_call
  payload jsonb,
  latency_ms int,
  tokens_in int,
  tokens_out int,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**GRANTs obrigatórios** (padrão core): `authenticated` recebe CRUD nas
tabelas onde a política permitir; `service_role` recebe ALL; `anon` NÃO
recebe nada (mensagens do site vêm via server fn autenticada anon-safe
ou via `/api/public/impulsionito/chat` com rate limit + captcha).

**RLS** (esboço):
- `imp_conversations` / `imp_messages` / `imp_handoffs`: `USING
  (user_belongs_to_company(company_id))` + admin master bypass via
  `has_role`.
- `imp_knowledge` scope=`core`: leitura livre para `authenticated`;
  escrita só admin master. Escopo tenant: usual `company_id`.
- `imp_agent_configs`: leitura tenant, escrita admin do tenant.

## 5. Endpoints

Todos em TanStack Start. **Server fns** para chamadas do próprio app,
**server routes `/api/public/*`** apenas para webhook externo.

### 5.1 `POST /api/impulsionito/chat` (server fn)

Arquivo: `src/lib/impulsionito/chat.functions.ts`

Input: `{ conversationId?: string, message: string, channel: 'site'|'panel', pageContext?: {...} }`

Fluxo:
1. Middleware `requireSupabaseAuth` (ou anonymous com rate limit se site
   público).
2. Resolver `company_id` via `useTenant`/host.
3. Carregar/criar `imp_conversation`.
4. Inserir mensagem `role='user'`.
5. Montar contexto (tenant, plano, módulos, página, últimas 10
   mensagens, top-K knowledge por embedding).
6. Chamar Lovable AI Gateway com `streamText` + `toUIMessageStreamResponse`.
7. Em `onFinish`, salvar mensagem `role='assistant'` + `imp_agent_logs`.

### 5.2 `POST /api/public/impulsionito/whatsapp-webhook` (server route)

Arquivo: `src/routes/api/public/impulsionito/whatsapp-webhook.ts`

- Verificar assinatura HMAC do provedor (Z-API token).
- Identificar tenant pelo número receptor.
- Criar/atualizar `imp_conversation`.
- Chamar mesmo pipeline do chat.
- Enviar resposta via API do provedor (`fetch` para Z-API/Meta).
- Idempotência via `provider_msg_id` UNIQUE.

### 5.3 `POST /api/impulsionito/handoff` (server fn)

Marca conversa como `waiting_human`, notifica atendentes do tenant
(email/whatsapp interno), registra `imp_handoff`.

### 5.4 `GET /api/impulsionito/status` (server fn)

Estado do atendimento por tenant (fila, disponibilidade IA, atendentes
online). Alimenta o badge do widget.

### 5.5 `GET/POST /api/impulsionito/knowledge` (server fn, admin)

CRUD da base de conhecimento por escopo, com regeneração de embedding
via Lovable AI (`text-embedding` — verificar catálogo antes).

## 6. Segurança

- Nenhum secret no front (`OPENAI_API_KEY`, `ZAPI_TOKEN`,
  `LOVABLE_API_KEY` etc.) — todos via `process.env` em server fns.
- `service_role` só em `client.server.ts` (já isolado); jamais
  importado top-level em `.functions.ts`.
- Rate limit no endpoint público de chat (site anônimo): por IP + por
  fingerprint.
- Nunca vazar contexto de outro tenant: sempre scoped por `company_id`
  do host resolvido, não do input do usuário.
- Prompt central versionado em `src/lib/impulsionito/prompt.ts` (ou
  tabela `imp_agent_configs.system_prompt`).
- Sanitize saída: strip HTML, verificar allowed markdown, prevenir
  prompt injection ("ignore previous instructions").

## 7. Frontend (dentro da trava atual — só D dos blocos A–F)

Componentes já existentes ou a criar (visuais):
- `ImpulsionitoPanel.tsx` (existe, visual). Wire-up para `useChat` do
  AI SDK apontando para `/api/impulsionito/chat`.
- `ImpulsionitoFab.tsx` (existe). Trocar destino do CTA de WhatsApp
  externo para abrir o `ImpulsionitoPanel` — WhatsApp vira ação
  secundária dentro do painel.
- CRM próprio (painel `_authenticated/atendimento/impulsionito`):
  lista de conversas, filtros, botões assumir/devolver/encerrar,
  histórico.

## 8. Variáveis de ambiente necessárias

Runtime (via `add_secret`, quando autorizado):

| Nome | Uso | Obrigatório |
|---|---|---|
| `LOVABLE_API_KEY` | Gateway IA | ✔ (já existe) |
| `OPENAI_API_KEY` | Fallback OpenAI direto | Opcional |
| `ZAPI_INSTANCE_ID` | Provedor WhatsApp | Fase 1 |
| `ZAPI_TOKEN` | Provedor WhatsApp | Fase 1 |
| `ZAPI_WEBHOOK_SECRET` | Assinatura HMAC | Fase 1 |
| `META_WA_TOKEN` | Meta Cloud API | Fase 2 |
| `META_WA_PHONE_ID` | Meta Cloud API | Fase 2 |
| `META_WA_VERIFY_TOKEN` | Webhook Meta | Fase 2 |

## 9. Ordem de execução (destravar por fases)

**Fase 0 — só front (já autorizado, aguarda "vai")**
- D: janela visual `ImpulsionitoPanel` no Core, mock de mensagens,
  histórico local, contexto de rota. Sem backend.

**Fase 1 — MVP Impulsionito no site (precisa autorização backend)**
- Migração: `imp_conversations`, `imp_conversation_messages`,
  `imp_agent_configs`, `imp_agent_logs`.
- Server fn `/api/impulsionito/chat` com Lovable AI Gateway.
- Wire-up `ImpulsionitoPanel` → `useChat`.
- Testar em `impulsionando.com.br` como visitante e como usuário logado.

**Fase 2 — WhatsApp via Z-API (paralelo ao Papo AI)**
- Setup Z-API + secrets.
- `/api/public/impulsionito/whatsapp-webhook`.
- Painel CRM básico (lista de conversas + handoff).
- Rodar em paralelo ao Papo AI, mesmo número não — número dedicado.

**Fase 3 — Migração completa**
- Migrar número do Papo AI para o Core.
- Desligar Papo AI.
- Adicionar Meta Cloud API se volume justificar.

**Fase 4 — Enriquecimento**
- Base de conhecimento com RAG (pgvector).
- Handoff humano completo, notificações.
- Métricas: NPS, taxa de resolução IA, tempo médio de resposta.

## 10. Pendências / decisões pendentes do usuário

1. Confirmar provedor de IA: Lovable AI Gateway (recomendado) ou OpenAI
   Responses API direta?
2. Confirmar provedor WhatsApp Fase 1: **Z-API** ou Evolution?
3. Número WhatsApp: usar o mesmo do Papo AI (após migração) ou dedicado?
4. Persistência: manter histórico por quanto tempo? (LGPD)
5. Base de conhecimento inicial: quem escreve? (produto/marketing)
6. Handoff humano: para quem toca? (todos os atendentes do tenant, ou
   fila por skill?)

## 11. Confirmação final

Este documento é a **planta**. Nenhuma migração, endpoint, secret ou
integração foi criado. Ao receber "vai fase 1", executo migração + server
fn + wire-up do painel em passos verificáveis, com checkpoint entre
cada passo.
