# Plano Mestre Lovable - Impulsionando Core

Status: este repositorio deve ser mantido como **Impulsionando Core**, o sistema mae/master. Todo cliente, vertical, marca ou projeto especifico deve entrar como tenant/projeto administrado pelo core.

## Prioridade permanente

1. Preservar e fortalecer `/core` como centro de comando global.
2. Garantir que qualquer cliente/projeto seja operavel pelo Admin Global da Impulsionando.
3. Manter RioMed e demais marcas como tenants, nao como identidade principal do produto.
4. Reaproveitar modulos, templates, prompts, permissoes, billing, auditoria e integracoes globais.
5. Corrigir qualquer criacao standalone para o padrao multi-tenant com `company_id`, RLS e auditoria.

## Contrato obrigatorio para novas alteracoes

- Auth, RBAC, billing, menu, auditoria, integracoes e templates pertencem ao core.
- Dados especificos de cliente usam `company_id`; dados especificos de projeto usam tambem `project_id` ou metadados equivalentes.
- Toda acao sensivel passa por permissao backend/banco e gera `audit_logs`.
- Toda nova tela admin deve indicar claramente o contexto: Global, Cliente ou Projeto.
- Prompts de IA devem reforcar que o core e a fonte da verdade e que clientes sao filhos administraveis.

## Areas que o Lovable deve revisar antes de novas entregas

- `.lovable/master-prompt.md`
- `docs/CORE_IMPULSIONANDO_SCAFFOLDING.md`
- `docs/FABRICA_PROJETOS.md`
- `src/lib/ai-generator.functions.ts`
- `src/lib/factory.functions.ts`
- `src/routes/_authenticated/core.*`
- `src/components/app/nav-config.tsx`
- `supabase/migrations/*` relacionadas a RBAC, RLS, `ai_prompt_library`, `companies`, `company_modules`, `audit_logs`

## Regra para RioMed

RioMed e um tenant medico-hospitalar dentro da Impulsionando. Manter rotas, funcoes e workflows RioMed quando forem especificos do cliente, mas nunca promover RioMed a nome do produto, repositorio, app ou sistema mae.
