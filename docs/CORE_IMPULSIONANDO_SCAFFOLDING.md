# Core Impulsionando — Regra de Scaffolding (Inegociável)

> Todo projeto novo nasce **acoplado ao core Impulsionando**. Não existe projeto "standalone".
> Clientes (CHRISMED, Marocas, Garrido, etc.) são **tenants/marcas** dentro do core, nunca sistemas isolados.

## 1. Princípio

O core Impulsionando é a **camada-mãe** de:

- **Identidade & Auth** — login, sessão, Google OAuth, RBAC (`user_roles` + `has_role`), perfis (`profiles`, `user_profiles`).
- **Dados & Multi-tenant** — `companies`, `company_modules`, `company_settings`, `company_units`, RLS por `auth.uid()` + `company_id`.
- **Billing & Planos** — `billing_*`, `consumer_memberships`, `subscriptions`, `trial_*`, `CheckoutShell`, `BillingGate`, `PlanGate`.
- **Governança** — `core_*` (menu items, feature flags, módulos, nichos, integrações, settings).
- **Comunicação** — `message_outbox`, `message_templates`, `notifications`, n8n workflows.
- **Marketplace & Comissionamento** — `mp_*` ("Taxa de Intermediação Digital", default 0,50%).
- **Audiência** — política default-deny consumidor, `AudienceBadge`, `useAudience`.

## 2. Checklist obrigatório ao iniciar QUALQUER projeto novo

Antes de escrever qualquer rota, componente ou tabela do cliente, confirme:

1. [ ] O cliente é registrado como `company` (linha em `public.companies`) — não cria schema/instância separada.
2. [ ] Branding via `TenantBrandingProvider` + `company_settings`, nunca CSS hardcoded fora do core.
3. [ ] Auth reutiliza `_authenticated/route.tsx` gerido pela integração — sem login custom paralelo.
4. [ ] Roles via `public.user_roles` + `has_role(_user_id, _role)` — nunca `is_admin` em profile.
5. [ ] Dados do cliente em tabelas com prefixo do nicho (ex.: `marocas_*`, `chrismed_*`) com:
   - `GRANT` explícito (`authenticated`/`service_role`, `anon` só se público).
   - RLS habilitado, policies escopadas por `company_id` + `auth.uid()`.
6. [ ] Menu, módulos e planos passam por `core_menu_items` / `core_module_catalog` / `core_niche_modules`.
7. [ ] Billing reaproveita `CheckoutShell`, `BillingGate`, `PlanGate`, `consumer_memberships`.
8. [ ] Server logic em `createServerFn` do core (TanStack Start) — nunca Edge Function para lógica interna.
9. [ ] Marketplace usa **"Taxa de Intermediação Digital"** (nunca "comissão"), default 0,50%.
10. [ ] Consumidor Final: itens de menu sem `audiences` declarado ficam **ocultos** (default-deny).

## 3. O que NÃO fazer

- ❌ Criar `src/routes/<cliente>/auth.tsx` paralelo ao core.
- ❌ Tabelas do cliente sem RLS ou sem GRANT.
- ❌ Roles armazenados em `profiles` ou `companies`.
- ❌ Schema próprio do cliente (tudo em `public` com prefixo).
- ❌ Edge Functions para lógica interna (use `createServerFn`).
- ❌ Hardcode de cores/fontes — sempre tokens do core + branding por tenant.
- ❌ Chamar "comissão" no marketplace — sempre "Taxa de Intermediação Digital".

## 4. Perguntas permitidas ao iniciar um novo cliente

Assuma o core como dado. Pergunte APENAS o que é específico do cliente:

- Nome comercial, slug (`companies.slug`) e nicho (`niches.code`).
- Paleta/logo do tenant (vão para `company_settings` + `TenantBrandingProvider`).
- Quais módulos do `core_module_catalog` ativar.
- Plano inicial (`billing_plans`).
- Audiências liberadas (operacional, gestor, consumidor final).
- Integrações específicas (WhatsApp oficial, pagamento, etc.).

## 5. Aplicação

Esta regra é **global e retroativa**: qualquer refatoração de projeto existente
deve migrar para esta camada-mãe assim que houver oportunidade. Qualquer PR
que crie projeto/cliente novo fora deste padrão deve ser rejeitado.
