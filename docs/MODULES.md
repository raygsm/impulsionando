# MODULES — Impulsionando Core

Catálogo lógico de módulos (fonte de verdade em `modules`,
`core_module_catalog`, `core_niche_modules`, `company_modules`).

## Módulos-núcleo (todo cliente)

- **Autenticação e RBAC** — `user_roles`, `has_role`, `_authenticated` layout.
- **Cliente 360** — 12 abas em `/admin/clientes/$slug/*`.
- **Cortesia Full** — parâmetro global + estado por cliente + auditoria.
- **Cérebro IA por Cliente** — configuração, base de conhecimento, eventos.
- **Financeiro** — `fin_*`, contratos, cobranças, saúde, régua.
- **Automação & N8N** — hub, fluxos, canais, webhooks, fallback humano.
- **Marketplace B2B** — `mp_*` (Taxa de Intermediação Digital).
- **Observabilidade** — `runtime_events`, `core_incidents`, `uptime_*`.

## Módulos verticais (nichos)

Ver tabelas prefixadas por vertical (agenda, brewery, clube, comm,
contab, eco, educ, ehr, evt, marocas, realestate, restaurant, riomed,
talentos, wmp). Ativados por `core_niche_plan_modules` e
`company_modules`.

## Habilitação por cliente

- Cadastro: `company_modules` (empresa × módulo × status).
- Governança: `module_versions`, `module_change_log`.
- Feature flags: `core_feature_flags`.

## Boas práticas

- Reutilizar primitivos em `src/components/impulsionando/` antes de
  reimplementar (Onda 2.9).
- Novos módulos precisam RLS + GRANT + auditoria desde o dia 1.
- Copy: “cliente/empresa”, não “tenant”.
