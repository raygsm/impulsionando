# Scaffolding Policy

**Regra mae:** este repositorio e sempre o **Impulsionando Core**, o sistema mae/master. RioMed, CHRISMED, Marocas, Garrido e qualquer outra marca sao tenants/clientes/projetos administrados pelo core, nunca o produto principal.

Detalhes e checklist obrigatorio: [docs/CORE_IMPULSIONANDO_SCAFFOLDING.md](../docs/CORE_IMPULSIONANDO_SCAFFOLDING.md).
Prompt mestre operacional: [.lovable/master-prompt.md](./master-prompt.md).

Resumo operacional para o agente:

1. Antes de criar rotas/tabelas para cliente novo, registrar `company` + contexto de projeto/tenant + branding via `TenantBrandingProvider`.
2. Reusar auth `_authenticated/route.tsx`, RBAC `user_roles` + `has_role`, billing `CheckoutShell`/`BillingGate`/`PlanGate`.
3. Tabelas de cliente/projeto sempre com escopo `company_id` e, quando existir conceito de projeto, `project_id` ou chave equivalente em `company_settings`/metadados.
4. Toda tabela sensivel precisa de RLS, GRANT explicito, policies por `company_id` + `auth.uid()` e isolamento de tenant.
5. Toda acao sensivel no admin global precisa gerar `audit_logs`.
6. Server logic via `createServerFn`. Marketplace: "Taxa de Intermediação Digital" (0,50% default).
7. Consumidor Final: default-deny em menu sem `audiences`.
8. Admin global da Impulsionando deve conseguir operar qualquer tenant/projeto por `/core`, `/admin/master-hub` ou rotas derivadas.

Perguntar ao usuario apenas o que e especifico do cliente: nome, slug, nicho, paleta, modulos, plano, audiencias, integracoes e regras comerciais.

Nunca renomear o core para o nome de um cliente. Se o pedido citar RioMed ou outro cliente, trate como tenant dentro da Impulsionando.
