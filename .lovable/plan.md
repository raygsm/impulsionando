# Fábrica de Projetos — Auditoria + Plano de Deltas

## 1. O que JÁ existe (não será recriado)

| Necessidade do prompt | Já existe em |
|---|---|
| Área interna restrita à equipe | `/core` (rota `_authenticated/core.tsx`) — gate `isImpulsionandoStaff` |
| Entidade Cliente | tabela `companies` (33 colunas, com segment/owner/document/branding) |
| Entidade Projeto / Implantação | `companies` + `onboarding_checklist` + `onboarding_domain_requests` |
| Módulo-base | tabela `modules` + `module_versions` |
| Módulo instalado | tabela `company_modules` |
| Biblioteca de módulos | `/core/modulos` + `/core/modulos/$slug` |
| Implantações | `/core/implantacoes` |
| Clonagem de módulos | `/admin/modulos/clonagem` |
| Wizard "Novo projeto com IA" | `/core/nova-implantacao` (prompt → análise → provisionamento async) |
| Cliente 360 | `/core/clientes` + `/core/cliente/$id` |
| Parâmetros globais | `/core/parametros` + `setting_definitions` |
| Templates de mensagem | `message_templates` |
| Saúde / Testes / Eventos | `/core/saude`, `/core/testes`, `/core/eventos` |
| Trials / Demo | `trial_subscriptions` + rotas `/demo.*` |

**Conclusão:** a "Fábrica de Projetos" descrita é, em ~80%, o `/core` atual + `/core/nova-implantacao`. Não há motivo para criar uma área nova nem nova rota `/admin/fabrica-projetos`.

## 2. O que FALTA (deltas mínimos)

### Delta A — Ambiente DEMO/TESTE/REAL explícito por projeto
- Hoje: existem trials, demo público (`/demo.*`) e clientes reais, mas não há um **flag único** em `companies` separando os três.
- Add: coluna `companies.environment` enum `('demo','teste','real')` default `'real'`; preencher por backfill (trials→demo, master→real, demais→real).
- Filtros por ambiente em `/core/clientes` e `/core/implantacoes` (somente UI).
- `core.nova-implantacao` já pergunta o tipo na etapa 2 — só passar a gravar nessa coluna.

### Delta B — Templates de front-end (catálogo reutilizável)
- Nova tabela `site_templates` (nome, nicho, descrição, páginas[], seções[], cores, status).
- Tela `/core/templates` (CRUD restrito a staff) para cadastrar/clonar templates.
- `core.nova-implantacao` passa a sugerir e aplicar `site_template_id` quando a IA escolhe um template existente — se não houver, segue como hoje.

### Delta C — Prompts salvos (biblioteca reutilizável)
- Nova tabela `ai_prompt_library` (nome, categoria, nicho, finalidade, prompt, variables jsonb, version, created_by).
- Tela `/core/prompts` (CRUD staff).
- Botão "Carregar prompt salvo" na etapa 3 do wizard `nova-implantacao`.
- Botão "Salvar este prompt" após uma análise bem-sucedida.

### Delta D — Páginas geradas (rastreio do output)
- Nova tabela `generated_pages` (company_id, generation_id, template_id, name, slug, content jsonb, prompt_used, status).
- Já produzimos páginas no provisionamento; só falta persistir o output para reuso/edição.
- Aba "Páginas geradas" em `/core/cliente/$id`.

### Delta E — Renomear o agrupamento de menu
- No `core.tsx`, adicionar uma seção "Fábrica de Projetos" agrupando os itens já existentes (Nova Implantação, Templates, Prompts, Biblioteca de Módulos, Clonagem, Implantações). Apenas reordenação visual.

## 3. O que NÃO será feito (e por quê)

- ❌ Nova rota `/admin/fabrica-projetos` — duplicaria `/core`.
- ❌ Nova tabela `clients` / `projects` — `companies` já cobre ambos.
- ❌ Reescrita do wizard — o atual já faz prompt → análise → provisionamento async com merge de duplicados.
- ❌ Nova autenticação / permissões — o gate `isImpulsionandoStaff` já existe em `core.tsx`.
- ❌ Mexer em DEMO/`/demo.*` ou trials — já isolados.

## 4. Ordem de execução

1. Migration única: `companies.environment` + `site_templates` + `ai_prompt_library` + `generated_pages` (com GRANTs e RLS staff-only).
2. Server fns em `src/lib/factory.functions.ts` (CRUD templates/prompts; salvar página gerada).
3. UI: `/core/templates`, `/core/prompts` (listas + formulário simples reutilizando `Card`/`Input`/`Button`).
4. Patch leve em `core.nova-implantacao.tsx`: carregar prompt salvo, salvar prompt, gravar `environment`, persistir páginas no fim do provisionamento.
5. Patch leve em `core.cliente.$id.tsx`: aba "Páginas geradas".
6. Patch em `core.tsx`: subgrupo visual "Fábrica de Projetos".

Total estimado: **1 migration + 1 server-fn file + 2 rotas novas + 3 patches leves**. Nenhum arquivo existente é apagado.

## Confirma este plano antes de executar?
