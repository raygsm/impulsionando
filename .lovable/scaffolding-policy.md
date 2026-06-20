# Scaffolding Policy

**Regra mãe:** Todo novo projeto/cliente/marca nasce dentro do **core Impulsionando**.
Detalhes e checklist obrigatório: [docs/CORE_IMPULSIONANDO_SCAFFOLDING.md](../docs/CORE_IMPULSIONANDO_SCAFFOLDING.md).

Resumo operacional para o agente:

1. Antes de criar rotas/tabelas para um cliente novo, registrar `company` + branding via `TenantBrandingProvider`.
2. Reusar auth `_authenticated/route.tsx`, RBAC `user_roles` + `has_role`, billing `CheckoutShell`/`BillingGate`/`PlanGate`.
3. Tabelas do cliente: prefixo do nicho, RLS + GRANT, escopo `company_id` + `auth.uid()`.
4. Server logic via `createServerFn`. Marketplace: "Taxa de Intermediação Digital" (0,50% default).
5. Consumidor Final: default-deny em menu sem `audiences`.

Perguntar ao usuário apenas o que é específico do cliente (nome, slug, nicho, paleta, módulos, plano, audiências, integrações).
