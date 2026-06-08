# Fábrica de Projetos — Entrega Final (Fases 1–6)

> Painel Master Impulsionando → **/core** (acesso exclusivo `is_impulsionando_staff`).

## Mapa de rotas

| Função | Rota | Arquivo |
|---|---|---|
| Painel master (root menu) | `/core` | `src/routes/_authenticated/core.tsx` |
| Criar Projeto (Fábrica, 3 passos) | `/core/criar-projeto` | `src/routes/_authenticated/core.criar-projeto.tsx` |
| Nova Implantação (via IA, opcional) | `/core/nova-implantacao` | `src/routes/_authenticated/core.nova-implantacao.tsx` |
| Instalar Módulo | `/core/instalar-modulo` | `src/routes/_authenticated/core.instalar-modulo.tsx` |
| Assistente Pós-Instalação | `/core/cliente/$id/modulo/$slug/configurar` | `src/routes/_authenticated/core.cliente.$id.modulo.$slug.configurar.tsx` |
| Biblioteca de Templates | `/core/templates` | `src/routes/_authenticated/core.templates.tsx` |
| Biblioteca de Prompts (IA) | `/core/prompts` | `src/routes/_authenticated/core.prompts.tsx` |
| Páginas do Projeto | `/core/cliente/$id/paginas` | `src/routes/_authenticated/core.cliente.$id.paginas.tsx` |
| Editor de Página | `/core/cliente/$id/paginas/$pageId` | `src/routes/_authenticated/core.cliente.$id.paginas.$pageId.tsx` |
| Biblioteca de Módulos | `/core/modulos` | (existente) |
| Clientes 360 | `/core/clientes` | (existente) |

## Como usar

### Criar novo cliente + projeto
1. `/core/criar-projeto` → preencha cliente (CPF/CNPJ reaproveita se já existir) e projeto (ambiente DEMO/TESTE/REAL, domínio, nicho).
2. Escolha modelo (Template / Clonar / Vazio / DEMO base / Módulo base / Combinação), módulos e preset por nicho.
3. Revise e confirme. Resultado: cliente em `companies`, módulos em `company_modules`, presets em `company_settings`, log em `ai_project_generations`.

### Instalar módulo em projeto existente
1. `/core/instalar-modulo` → escolha cliente, módulo certificado, preset.
2. Após instalar, redireciona para `/core/cliente/$id/modulo/$slug/configurar` (assistente 8 passos: Identificação → Recursos → Permissões → Comunicação → Integrações → Automação → Dashboard → Finalização).
3. Agenda Online tem fluxo completo declarativo em `src/data/moduleAssistantSteps.ts`.

### Criar páginas de front-end sem Lovable
1. `/core/cliente/$id/paginas` → aplique template do catálogo (`/core/templates`).
2. Edite cada página em `/core/cliente/$id/paginas/$pageId`:
   - 15 **seções reutilizáveis** (`src/data/pageSections.ts`): Hero, Dor, Solução, Benefícios, Como funciona, Módulos, Demo, Depoimentos, Planos, FAQ, CTA WhatsApp, CTA Contratar, Rodapé, LGPD, Termos.
   - 13 **variáveis** (`src/data/pageVariables.ts`): `{{nome_cliente}}`, `{{nicho}}`, `{{whatsapp}}`, `{{modulos}}`, etc. Substituição automática a partir de `companies` + `company_modules`.
   - **Reusar prompt salvo** (vem de `/core/prompts`, conta `usage_count`).
   - **Copiar para Lovable** apenas quando estrutura não existir.

### Quando ainda precisamos do Lovable
- Criar **novo template** estrutural inédito (ex: site novo de nicho não previsto).
- Criar **novo módulo-base** (ex: lógica de negócio inexistente).
- Iterar componentes UI/UX da plataforma mãe.

Tudo o que é **instalação / configuração / página por template / variáveis / prompts salvos** acontece sem créditos Lovable.

## Blindagem (Fase 5) — já em produção

| Garantia | Onde |
|---|---|
| Rotas `/core/*` exclusivas Impulsionando | `core.tsx` checa `is_impulsionando_staff` |
| Tabelas Fábrica com RLS staff-only | `site_templates`, `ai_prompt_library`, `generated_pages` (1 policy cada, `is_impulsionando_staff(auth.uid())`) |
| Permissão granular por código | `permissions` + `profile_permissions` + `user_permission_overrides` + `user_has_permission(_user, _company, _perm)` (security definer) |
| Isolamento por cliente/projeto | RLS em todas as ~100 tabelas operacionais via `current_user_company_ids()` |
| DEMO ≠ REAL | `companies.environment` enum (`demo`/`teste`/`real`); rotas `/demo.*` separadas |
| Instalação só estrutural | `installModuleWithTemplate` + `createProjectFromFactory` — **nunca** copiam dados reais, usuários, credenciais, tokens, webhooks, financeiro ou mensagens |
| Mocks só em DEMO | aplicados apenas quando `environment='demo'` |
| Credenciais mascaradas | área Integrações, audit em criar/editar/remover |
| LGPD | `lgpd_consents`, `data_deletion_requests`, `data_export_requests`, `customer_anonymize()` (exige motivo + permissão) |
| Logs de segurança | `audit_logs` via trigger `tg_audit` + inserts manuais nas server fns (`factory.project.created`, `factory.module.configured`, `factory.pages.template_applied`) |

## Checklist final (34 itens da Fase 6)

| # | Item | Status |
|---|---|---|
| 1 | Existe Fábrica de Projetos | ✅ `/core` + rotas filhas |
| 2 | Fábrica exclusiva da Impulsionando | ✅ guard em `core.tsx` + RLS staff |
| 3 | Criar novo cliente | ✅ `/core/criar-projeto` passo 1 |
| 4 | Criar novo projeto | ✅ `/core/criar-projeto` passo 1+2 |
| 5 | Escolher nicho | ✅ campo `niche` + presets |
| 6 | Escolher ambiente DEMO/TESTE/REAL | ✅ `companies.environment` |
| 7 | Escolher template de front-end | ✅ `/core/templates` + `/core/cliente/$id/paginas` |
| 8 | Instalar módulos completos | ✅ `/core/instalar-modulo` |
| 9 | Instalar Agenda sem Lovable | ✅ `installModuleWithTemplate` + assistente 8 passos |
| 10 | Aplicar presets por nicho | ✅ `SEGMENT_LABELS` + `getSegmentTemplate` |
| 11 | Configurar permissões | ✅ `/permissions` + `user_permission_overrides` |
| 12 | Configurar comunicação | ✅ `message_templates` + passo 4 do assistente |
| 13 | Configurar integrações | ✅ passo 5 do assistente |
| 14 | Criador de Páginas | ✅ `/core/cliente/$id/paginas` |
| 15 | Templates por nicho | ✅ `site_templates` + `/core/templates` |
| 16 | Seções reutilizáveis | ✅ `src/data/pageSections.ts` (15 seções) |
| 17 | Campo para colar prompt por página | ✅ editor de página |
| 18 | Prompts salvos | ✅ `ai_prompt_library` + `/core/prompts` |
| 19 | Reutilizar prompts | ✅ dropdown no editor + `incrementPromptUsage` |
| 20 | Criar página a partir de template | ✅ `applyTemplateToProject` |
| 21 | Reduzir dependência de créditos | ✅ template + variáveis + prompts salvos atendem casos repetitivos |
| 22 | DEMO/TESTE/REAL separados | ✅ enum `environment` + isolamento RLS |
| 23 | Dados de clientes não se misturam | ✅ RLS via `current_user_company_ids()` |
| 24 | Credenciais não são copiadas | ✅ instalação só copia estrutura |
| 25 | Dados reais não são copiados | ✅ mesma garantia |
| 26 | Logs registrados | ✅ `audit_logs` + `ai_project_generations.events` |
| 27 | LGPD preparada | ✅ tabelas + função de anonimização |
| 28 | Acesso indevido bloqueado | ✅ RLS + `user_has_permission` |
| 29 | White Label padrão não acessa recursos internos | ✅ RLS staff-only nas tabelas da Fábrica |
| 30 | Cliente final não acessa Fábrica | ✅ rotas `/core/*` gated |
| 31 | Usuário comum não acessa Painel Master | ✅ `is_impulsionando_staff` |
| 32 | Nenhuma rota funcional apagada | ✅ apenas adições |
| 33 | Nenhum módulo recriado sem necessidade | ✅ reaproveitamento absoluto |
| 34 | Nenhum dado real foi afetado | ✅ apenas tabelas de templates/páginas/logs novas |

## Resumo de impacto

- **Adicionado** nesta sequência (Fases 1–4): 5 rotas, 5 arquivos de dados/server fns, 4 tabelas (já criadas em fase anterior).
- **Reaproveitado**: `companies`, `company_modules`, `company_settings`, `setting_definitions`, `modules`, `permissions`, `audit_logs`, `ai_project_generations`, `message_templates`, RLS existente, `InstallModuleDialog`, `SEGMENT_LABELS`, `installModuleWithTemplate`.
- **Sem novas migrations** nesta Fase 4.
- **Sem créditos Lovable** em runtime para criação de cliente, projeto, módulo ou página por template.
