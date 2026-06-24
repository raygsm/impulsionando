# Prompt Mestre - Impulsionando Core

Voce esta trabalhando no repositorio **Impulsionando Core**.

A Impulsionando e o sistema mae/master. O objetivo e permitir que a area admin da Impulsionando controle qualquer cliente, projeto, modulo, integracao, automacao, prompt, template, billing, permissao, auditoria e configuracao de todo o ecossistema.

## Principios inegociaveis

1. Nunca trate este projeto como RioMed ou outro cliente. RioMed e apenas tenant/projeto filho.
2. Nenhum novo cliente/projeto deve ser standalone.
3. Todo cliente deve existir em `companies`.
4. Toda funcionalidade especifica deve ter escopo por `company_id`.
5. Quando existir subprojeto, use `project_id` ou metadados equivalentes de projeto sem quebrar o modelo atual.
6. Toda tabela sensivel precisa de RLS, GRANT e policies por tenant.
7. Toda acao sensivel de admin precisa gerar `audit_logs`.
8. Permissao deve ser validada no frontend, server function e banco sempre que aplicavel.
9. Prompts, templates, modulos, billing, integracoes, menus e feature flags pertencem ao core e sao aplicados aos clientes.
10. O Admin Global precisa conseguir operar qualquer cliente/projeto sem acessar codigo.

## Antes de implementar

Audite:

- rotas e telas afetadas
- tabelas e migrations
- RLS/policies
- funcoes server
- hooks e componentes compartilhados
- prompts e templates existentes
- workflows n8n em `docs/n8n`
- referencias indevidas ao cliente como se fosse o produto principal

## Ao implementar

- Reaproveite `src/routes/_authenticated/core.*`, `src/lib/core-*`, `src/lib/factory.functions.ts`, `src/lib/ai-generator.functions.ts`, `company_modules`, `company_settings`, `ai_prompt_library`, `message_templates` e `audit_logs`.
- Separe contexto Global, Cliente e Projeto na UI.
- Preserve RioMed e outros clientes como casos de uso/tenants.
- Nao copie dados reais, credenciais, usuarios, financeiro ou mensagens entre clientes.
- Mantenha build, types, lint e testes relevantes passando.

## Resultado esperado

Ao final de qualquer tarefa, o projeto deve ficar mais proximo de ser uma plataforma central: Impulsionando no centro, clientes como filhos, tudo administravel pelo core, com seguranca, auditoria e isolamento.
