# DECISIONS — Impulsionando Core

Registro formal de decisões arquiteturais irreversíveis sem nova revisão.

---

## 2026-07-10 — Congelamento da arquitetura-base

> **A arquitetura-base do ecossistema Impulsionando está congelada. Novas
> evoluções devem ser incrementais, compatíveis e fundamentadas nas fontes
> únicas da verdade existentes.**

### Fontes únicas da verdade (oficiais)

| Domínio | Fonte oficial |
|---|---|
| Clientes / tenants | `public.companies` + `src/data/tenant-registry.ts` (modelos de vitrine) |
| Nichos | `public.niches` + `src/data/nichos-taxonomy.ts` |
| Módulos | `public.core_module_catalog` + `public.modules` + `public.company_modules` |
| Planos | `public.billing_plans` |
| Domínios / subdomínios | `public.core_tenant_identity` + `CORE_HOSTS` em `src/hooks/use-tenant.ts` |
| Integrações | `public.core_integrations` + `public.core_integration_logs` |
| Workflows N8N | `docs/n8n/workflows/**` (fonte) → `public/downloads/n8n/**` (espelho público) |
| Cérebro IA | `public.core_ai_brains` (1:1 com company) + `core_ai_brain_knowledge` + `core_ai_brain_events` |
| Permissões | `public.user_roles` + função `public.has_role` |
| Vitrines | função `getPublicVitrine` (dinâmica) + `TENANT_MODELS` (estática) |
| Demos | `public.demo_environments` + `public.demo_sessions` |
| Publicação | `public.core_tenant_publication_state` |

### Vedado sem decisão arquitetural explícita

- Novo registry paralelo de clientes.
- Nova estrutura multi-tenant concorrente.
- Novo catálogo paralelo de módulos.
- Nova lógica de planos fora de `billing_plans`.
- Novo sistema de permissões fora de `user_roles` + `has_role`.
- Novo shell administrativo concorrente ao `/core` / Cliente 360.
- Duplicação de Cérebro IA por cliente (é `UNIQUE (company_id)`).
- Novo fluxo de publicação desconectado do Core.

### Reutilização obrigatória

Novas funcionalidades devem consumir: Core, Cliente 360, planos, módulos,
permissões, auditoria, Cérebro IA, Design System e registries oficiais.

### Governança

- Alterações estruturais exigem entrada nova em `DECISIONS.md`.
- Alterações de dados usam ferramentas de migração/insert do Supabase.
- Testes de RLS e workflows continuam obrigatórios (`tests-gate.yml`).
