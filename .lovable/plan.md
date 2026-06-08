# Plano enxuto — Fases 3, 4, 5 e 6 da Fábrica de Projetos

## Diagnóstico antes de codar

| Fase | Status real | Ação |
|---|---|---|
| **Fase 3 — Central de Instalação + Assistente Pós-Instalação** | ✅ **Já entregue** na execução anterior: `core.instalar-modulo.tsx`, `InstallModuleDialog`, `core.cliente.$id.modulo.$slug.configurar.tsx`, `moduleAssistantSteps.ts` (8 passos da Agenda), status em `company_modules.status`, presets por nicho (`SEGMENT_LABELS`), `installModuleWithTemplate` (só estrutura, nunca dados reais). | **Não recriar.** Vou apenas confirmar no checklist final. |
| **Fase 4 — Criador de Páginas / Templates / Prompts** | 🟡 Parcial: já existem `site_templates`, `ai_prompt_library`, `generated_pages` (tabelas + RLS), `/core/templates`, `/core/prompts`. Falta a **tela de geração por projeto** com variáveis, seções, "tentar sem Lovable primeiro". | **Construir aqui.** |
| **Fase 5 — Blindagem / LGPD / Logs** | ✅ Em grande parte já existe: `is_impulsionando_staff`, `user_has_permission`, RLS em todas as tabelas, `audit_logs`, `lgpd_consents`, `data_deletion_requests`, `data_export_requests`, `customer_anonymize`, mascaramento de credenciais. | **Auditar e documentar**, não recriar. |
| **Fase 6 — Checklist final** | — | **Entregar documento** consolidando o que existe e onde. |

## O que vou construir (deltas mínimos)

### Delta A — Fase 4: Criador de Páginas por Projeto
Uma rota nova: `/core/cliente/$id/paginas` que junta o que já existe:
1. **Seletor de Template** — lista `site_templates` (já existe). Botão "Aplicar template" copia páginas para `generated_pages` do cliente.
2. **Lista de páginas geradas** (`generated_pages` filtrado por `company_id`) — editar nome, slug, status.
3. **Editor de página individual** (`/core/cliente/$id/paginas/$pageId`) com:
   - campos: nome, slug, nicho, objetivo, prompt, variáveis (JSON), status
   - botão **"Gerar sem Lovable"** → renderiza substituindo variáveis (`{{nome_cliente}}`, `{{nicho}}`, etc.) com dados de `companies` + módulos instalados, grava em `generated_pages.content`
   - botão **"Copiar prompt para Lovable"** → quando template não cobre
   - dropdown **"Reusar prompt salvo"** → lista `ai_prompt_library`, incrementa `usage_count`
4. **Biblioteca de seções reutilizáveis** — arquivo declarativo `src/data/pageSections.ts` com 15 seções (Hero, Dor, Solução, Benefícios, Como funciona, Módulos, Demo, Depoimentos, Planos, FAQ, CTA WhatsApp, CTA Contratar, Rodapé, LGPD, Termos), cada uma com campos editáveis (título, subtítulo, texto, CTA, ativo, ordem). Renderizado no editor como lista drag/toggle.
5. **Variáveis suportadas** declaradas em `src/data/pageVariables.ts` (lista das 13 variáveis do enunciado).

**Server fns** (append em `factory.functions.ts`):
- `applyTemplateToProject({ companyId, templateId })` — copia páginas do template para `generated_pages`.
- `upsertGeneratedPage({ id?, companyId, name, slug, niche, objective, prompt, variables, status })`.
- `renderPageFromTemplate({ pageId })` — substitui variáveis, popula `content`, grava log em `ai_project_generations`.

### Delta B — Fase 6: Documento de auditoria final
Arquivo `docs/FABRICA_PROJETOS.md` com:
- mapa "onde fica cada coisa" (rotas + arquivos)
- checklist de 34 itens da Fase 6, marcando cada um com ✅ + referência ao arquivo/rota responsável
- passo a passo dos fluxos (criar cliente, instalar módulo, gerar página, quando recorrer ao Lovable)

### Delta C — Fase 5 (auditoria, sem código novo)
No mesmo `FABRICA_PROJETOS.md`, seção "Blindagem": listo as garantias já existentes (RLS, `is_impulsionando_staff`, `user_has_permission`, `audit_logs`, LGPD, mascaramento). **Não recrio nada** — se algo faltar concretamente, abro como pendência no doc para tratarmos em iteração futura.

## O que NÃO vou fazer

- ❌ Recriar Central de Instalação (já feita).
- ❌ Recriar tabelas de templates/prompts/páginas (já existem).
- ❌ Nova migration (tudo cabe nas tabelas atuais).
- ❌ Recriar RLS / auth / LGPD (já blindado).
- ❌ Mexer em `nova-implantacao`, demo, trial.

## Arquivos

**Novos (4):**
- `src/routes/_authenticated/core.cliente.$id.paginas.tsx` — lista + aplicar template
- `src/routes/_authenticated/core.cliente.$id.paginas.$pageId.tsx` — editor de página
- `src/data/pageSections.ts` — 15 seções declarativas
- `src/data/pageVariables.ts` — 13 variáveis declarativas
- `docs/FABRICA_PROJETOS.md` — entrega final (Fase 6)

**Editados (2):**
- `src/lib/factory.functions.ts` — 3 server fns appended
- `src/routes/_authenticated/core.tsx` — link "Páginas do Projeto" no menu (opcional, já há `/core/templates` e `/core/prompts`)

**Sem migration. Sem credito Lovable em runtime.**

## Confirma para eu executar?
