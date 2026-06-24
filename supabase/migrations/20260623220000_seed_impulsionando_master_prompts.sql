-- Seed master prompts for the Impulsionando Core prompt library.
-- These prompts are intentionally global: they guide Lovable/AI work so every
-- client remains a tenant/project child of the mother system.

INSERT INTO public.ai_prompt_library (name, category, niche, purpose, prompt, variables, version, status)
SELECT
  'Prompt Mestre - Impulsionando Core',
  'core-governance',
  'global',
  'Orientar qualquer agente/IA a manter a Impulsionando como sistema mae/master.',
  $$Voce esta trabalhando no repositorio Impulsionando Core.

A Impulsionando e o sistema mae/master. Todo cliente, marca, vertical ou projeto deve existir como tenant/projeto filho administravel pelo Admin Global.

Regras:
1. Nunca trate RioMed ou outro cliente como nome do produto principal.
2. Nenhum cliente/projeto deve ser standalone.
3. Use companies, company_modules, company_settings, roles, permissions, ai_prompt_library, message_templates, integrations e audit_logs como camadas centrais.
4. Dados especificos de cliente precisam de company_id, RLS, GRANT e policies por tenant.
5. Acoes sensiveis precisam de permissao e auditoria.
6. O Admin Global deve conseguir operar qualquer cliente/projeto por /core.
7. Reaproveite modulos e templates antes de criar codigo novo.
8. Preserve dados reais, credenciais, financeiro, usuarios e mensagens isolados por tenant.$$,
  '{"scope":"global","owner":"impulsionando-core"}'::jsonb,
  1,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_prompt_library WHERE name = 'Prompt Mestre - Impulsionando Core'
);

INSERT INTO public.ai_prompt_library (name, category, niche, purpose, prompt, variables, version, status)
SELECT
  'Auditoria de Projeto Filho',
  'tenant-audit',
  'global',
  'Auditar se um cliente/projeto esta corretamente conectado ao Core Impulsionando.',
  $$Audite este projeto como tenant/projeto filho da Impulsionando.

Verifique:
- se existe company_id em dados especificos do cliente
- se existem RLS, GRANT e policies corretas
- se a UI separa contexto Global, Cliente e Projeto
- se permissoes sao validadas no frontend, server function e banco
- se acoes sensiveis geram audit_logs
- se prompts, templates, billing, integracoes e modulos reaproveitam o core
- se ha referencias indevidas ao cliente como se fosse o produto principal
- se n8n/workflows e webhooks possuem escopo por tenant

Classifique achados como Critico, Alto, Medio ou Baixo e corrija Critico/Alto antes de encerrar.$$,
  '{"scope":"tenant","owner":"impulsionando-core"}'::jsonb,
  1,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_prompt_library WHERE name = 'Auditoria de Projeto Filho'
);

INSERT INTO public.ai_prompt_library (name, category, niche, purpose, prompt, variables, version, status)
SELECT
  'Converter Cliente em Tenant Administravel',
  'tenant-conversion',
  'global',
  'Transformar um projeto/cliente isolado em tenant controlado pelo Admin Global.',
  $$Converta este cliente/projeto em tenant administravel pelo Core Impulsionando.

Implemente:
- cadastro em companies
- modulos em company_modules
- configuracoes em company_settings
- permissoes por roles/permissions/user_roles
- auditoria em audit_logs
- isolamento de dados por company_id
- RLS e policies no Supabase
- telas ou paineis acessiveis pelo Admin Global
- integracoes e credenciais com escopo global, cliente ou projeto
- prompts/templates reaproveitaveis em ai_prompt_library e message_templates

Preserve funcionalidades especificas do cliente, mas remova qualquer dependencia de identidade standalone.$$,
  '{"scope":"tenant","owner":"impulsionando-core"}'::jsonb,
  1,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_prompt_library WHERE name = 'Converter Cliente em Tenant Administravel'
);
