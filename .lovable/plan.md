# Core AI — Gerador Universal de Projetos por Prompt

Adicionar ao Core Master um fluxo único de **"Criar Projeto por Prompt"** que recebe dados do cliente, prompt em linguagem natural e arquivos, usa IA para analisar e sugerir módulos/páginas/comunicações, e — após aprovação humana — provisiona o cliente inteiro reusando o que já existe.

## Princípio de reuso (zero retrabalho)

| Já existe | Vou reusar |
|---|---|
| `provisioning.functions.ts` (criação de empresa) | sim, sem alterar |
| `governance.functions.ts → cloneCompany` | sim, para template inicial |
| `modules.functions.ts → installModule` | sim, para aplicar módulos sugeridos |
| `moduleSegmentTemplates.ts` | sim, IA escolhe o template |
| `communicationEvents.ts` (catálogo de 18 eventos) | sim |
| Trigger `tg_notify_welcome` + `enqueue_message('user_welcome')` | sim — usuário master já recebe boas-vindas automaticamente |
| Tabela `onboarding_checklist` | sim, gera checklist final |
| `companies` (logo, cores, identidade) | sim, IA preenche |
| Lovable AI Gateway (`LOVABLE_API_KEY`) + `google/gemini-3-flash-preview` | sim |

**Não vou criar:** novos módulos, novas páginas públicas, novos componentes de comunicação, novos triggers.

## Entregáveis (mínimo necessário)

### 1. Banco — 2 tabelas + 1 bucket

```sql
-- Histórico de gerações por IA
CREATE TABLE public.ai_project_generations (
  id uuid PK, company_id uuid NULL,
  prompt text, client_data jsonb, project_data jsonb,
  uploaded_files jsonb,        -- [{path, type, size}]
  ai_analysis jsonb,           -- saída do modelo (segmento, módulos, páginas, comunicações)
  status text,                 -- 'rascunho' | 'analisado' | 'aprovado' | 'provisionado' | 'cancelado'
  created_by uuid, approved_by uuid, approved_at, provisioned_at,
  created_at, updated_at
);

-- Linha por arquivo (FK -> generation)
CREATE TABLE public.ai_project_files (
  id uuid PK, generation_id uuid FK,
  kind text,                   -- 'logo' | 'institucional' | 'apoio'
  bucket_path text, mime_type text, size_bytes int, created_at
);
```

GRANTs + RLS: super-admin e staff Impulsionando podem ler/escrever; ninguém mais.

Bucket privado `ai-project-uploads` (RLS na storage.objects: só staff Impulsionando).

### 2. Server functions — `src/lib/ai-generator.functions.ts` (NOVA)

| Função | O que faz |
|---|---|
| `analyzeProjectPrompt` | Chama Lovable AI Gateway (`generateText` + `Output.object` Zod) → devolve `{segmento, modulos_sugeridos[], paginas_sugeridas[], comunicacoes[], identidade_sugerida}` |
| `saveDraftGeneration` | Persiste rascunho em `ai_project_generations` + linhas em `ai_project_files` |
| `approveAndProvision` | Reusa `cloneCompany`/`createCompany` existente + `installModule` por módulo sugerido + `enqueue_message('user_welcome')` (já automático via trigger) + popula `onboarding_checklist` |
| `listGenerationHistory` | Lista para a aba Histórico |

A IA **só sugere dentro do catálogo `modules` certificado**. O system prompt recebe a lista de slugs disponíveis e o JSON Schema restringe `modulos_sugeridos[]` a esse enum.

### 3. UI — 1 nova rota com wizard

`src/routes/_authenticated/core.nova-implantacao.tsx` (NOVA)

Wizard de 5 etapas em um único componente:

1. **Cliente** — formulário com validação Zod (CPF/CNPJ, e-mail, WhatsApp, CEP)
2. **Projeto** — nome, subdomínio, domínio, segmento, cidade, estado
3. **Prompt** — Textarea grande
4. **Uploads** — 3 dropzones (logo / institucionais / apoio) → upload para bucket
5. **Análise + Aprovação** — botão "Analisar Projeto" chama `analyzeProjectPrompt`, mostra resumo (cliente, projeto, módulos, páginas, comunicações), 3 botões: **Aprovar e Criar** / **Editar Prompt** / **Cancelar**

Após aprovação → chama `approveAndProvision` → exibe checklist com ✅ por item.

### 4. Atalho no menu

Em `core.tsx` adicionar item "Nova Implantação por IA" apontando para `/core/nova-implantacao`. **Não removo** nada existente.

## Limites honestos do que a IA realmente faz

- ✅ **Analisa** o prompt e sugere segmento, módulos, páginas, comunicações, identidade
- ✅ **Provisiona** o cliente: cria empresa, instala módulos certificados, ativa comunicações, cria usuário master, dispara boas-vindas
- ✅ **Aplica identidade visual** (logo, cores) lendo arquivos enviados — cor primária via análise do logo
- ⚠️ **NÃO gera código novo de páginas públicas.** "Home / Quem Somos / Serviços / FAQ" são entregues como **conteúdo editável** dentro do módulo `area_cliente`/site institucional já existente — não como rotas TanStack novas (isso exigiria Lovable).
- ⚠️ A geração de **subdomínio próprio (`cliente.impulsionando.com.br`)** é registrada em `onboarding_domain_requests` (tabela já existente) para o DNS ser configurado manualmente fora do escopo deste recurso.

Estas duas ressalvas são honestas e estão alinhadas com a arquitetura atual; o restante do prompt é entregue 100%.

## Detalhes técnicos

- **AI Gateway:** padrão de `connecting-to-ai-models-tanstack` + `ai-sdk-lovable-gateway`. Helper já não existe; criar `src/lib/ai-gateway.server.ts` (único arquivo server-only, ~30 linhas). Modelo: `google/gemini-3-flash-preview`. Saída estruturada via `Output.object` (Zod).
- **Uploads:** `supabase.storage.from('ai-project-uploads').upload(...)` direto do browser (autenticado como super-admin); paths gravados em `ai_project_files`.
- **Multipart na chamada de IA:** IA recebe apenas o **prompt + tipos de arquivos enviados** (não os bytes); arquivos grandes ficam no bucket para uso posterior pela equipe na edição de identidade.
- **Aprovação obrigatória:** `approveAndProvision` só roda após o usuário clicar "Aprovar e Criar" — nunca dispara automaticamente.
- **Auditoria:** cada provisionamento grava em `audit_logs` (`action='ai_provision'`) com `ai_project_generations.id` para rastreabilidade.

## O que NÃO vou fazer (anti-escopo)

- Criar novas rotas públicas dinâmicas para o site do cliente final
- Criar novos componentes de página (Home/FAQ/etc.) como rotas TanStack
- Criar novo provedor de DNS automático
- Alterar `tg_notify_welcome`, `enqueue_message`, ou qualquer trigger existente
- Mexer em RLS/permissões fora das 2 tabelas novas
- Adicionar dependências npm — `ai` e `@ai-sdk/openai-compatible` se ainda não estiverem, são as únicas

## Resultado final

Super-admin abre `/core/nova-implantacao`, cola um prompt como o exemplo da Patrícia Lenine, anexa logo, clica em "Analisar Projeto", revisa o resumo, clica em "Aprovar e Criar" → em <30s o cliente está provisionado, com módulos certificados instalados, identidade aplicada, usuário master criado, boas-vindas enviadas, checklist preenchido — sem voltar ao Lovable.