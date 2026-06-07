## Diagnóstico — o que JÁ existe (não recriar)

Já implementado no projeto, será 100% reaproveitado:

- **Multi-tenant**: tabela `companies`, `company_modules`, `modules`, `company_units`, `is_master` flag, `CompanyPicker`, `useActiveCompany`.
- **Catálogo de módulos**: `src/data/motherModules.ts` + página `/modules` (já permite ativar/desativar módulo por empresa para super admin).
- **Billing/Contratos**: `billing_contracts`, `billing_invoices`, `billing_plans`, `billing_dunning_policy`, `BillingGate`, páginas `admin.billing-*`.
- **Onboarding/contratação**: `quotes`, `checkout.success.tsx`, `DemoContractFlow`, `payments/infinitepay.*`, `fin_transactions`.
- **Comunicação**: `message_outbox`, `message_templates`, `agendaComunicacao`, e-mails, WhatsApp via z-api.
- **CRM/Timeline**: `crm_leads`, `crm_activities`, `audit_logs`.
- **Permissões**: `permissions`, `profile_permissions`, `user_permission_overrides`.
- **Clone/instalação**: `CloneWizard`, `cloneCentral`, `admin.modulos.clonagem`.

## O que falta de verdade (única coisa a criar)

Exclusivamente uma **camada administrativa superior** ("Core Manager") + **fluxo pós-pagamento** de onboarding com **domínio/subdomínio/e-mails**. Nenhum módulo novo, nenhuma duplicação.

### 1. Hub Core Manager (super admin)
Rota nova `/_authenticated/core/` agregando o que já existe (sem duplicar telas):
- `core.index.tsx` — dashboard com KPIs (clientes ativos, MRR, módulos instalados, onboardings pendentes) lendo de tabelas existentes.
- `core.clientes.tsx` — lista de `companies` (não master) com status de implantação.
- `core.cliente.$id.tsx` — **Cliente 360°**: aba Dados (companies), Contratos (billing_contracts), Pagamentos (fin_transactions), Módulos (company_modules), Comunicações (message_outbox), Domínio (novo), Usuários (user_profiles), Logs (audit_logs), Checklist (novo).

Tudo são **views agregadoras** sobre tabelas existentes — sem novas tabelas para dados já armazenados.

### 2. Instalador de módulos por cliente
Reaproveitar `/modules` existente; adicionar botão **"Instalar"** que, além do toggle atual em `company_modules`:
- escreve linha em `audit_logs` ("module_installed")
- dispara `message_outbox` (e-mail de boas-vindas do módulo via template existente)
- marca item no checklist de implantação

Nenhum código de módulo é clonado — apenas a flag `is_enabled=true` já existente.

### 3. Onboarding pós-pagamento (novo, mínimo)
Disparado em `checkout.success.tsx` (já existe). Novo wizard `OnboardingWizard.tsx` com 4 passos:
1. **Domínio**: rádio (já possuo / não possuo / quero registrar) + campos condicionais → grava em nova tabela `onboarding_domain_requests`.
2. **Subdomínio** (se "não possuo"): valida disponibilidade em `companies.slug` (já existe) + confirmação dupla → reserva.
3. **E-mails corporativos**: se subdomínio → 3 campos fixos; se domínio próprio → multiselect de prefixos (contato/sac/financeiro/…) → grava em `onboarding_email_requests`.
4. **Resumo + Checklist**: marca itens em `onboarding_checklist`.

Cada passo registra em `message_outbox` (e-mail + WhatsApp) e em `crm_activities` (timeline).

### 4. Schema novo (apenas o estritamente necessário)

Uma migration com 3 tabelas pequenas + RLS + GRANTs:

- `onboarding_domain_requests` (company_id, mode `subdomain|own|register`, requested_value, contact_*, status)
- `onboarding_email_requests` (company_id, address_prefix, full_address, status)
- `onboarding_checklist` (company_id, item_key, status, completed_at) — 8 itens fixos da spec

Tudo escopado por `company_id` com RLS via `has_role` existente.

### 5. Nav + acesso
Adicionar grupo "Core Manager" em `nav-config.tsx` visível apenas para `isImpulsionandoStaff` — não toca em nada que cliente final vê.

## O que NÃO será feito

- Não criar tabelas para dados que já existem (clientes, módulos, billing, contratos, comunicações, logs).
- Não duplicar páginas de Agenda, CRM, PDV, Financeiro, etc.
- Não criar "Core Manager > Billing" — vai apontar para `/admin/billing-contracts` que já existe.
- Não criar verificação real de DNS / registro real de domínio: apenas **registrar solicitação** (a spec pede isso explicitamente: "Nossa equipe entrará em contato").
- Não criar provisionamento real de e-mail: apenas registrar solicitação + criar tarefa interna (a spec pede isso).

## Resumo de arquivos

**Migration**: 1 migration nova (3 tabelas + RLS + GRANTs).

**Criar (poucos arquivos)**:
- `src/routes/_authenticated/core.tsx` (layout com Outlet)
- `src/routes/_authenticated/core.index.tsx` (dashboard agregador)
- `src/routes/_authenticated/core.clientes.tsx` (lista)
- `src/routes/_authenticated/core.cliente.$id.tsx` (360°)
- `src/components/core/OnboardingWizard.tsx`
- `src/components/core/DomainStep.tsx`, `EmailStep.tsx`, `ChecklistView.tsx`
- `src/lib/onboarding.functions.ts` (server fns)

**Editar (cirurgicamente)**:
- `src/components/app/nav-config.tsx` — adicionar grupo "Core Manager" (staff only)
- `src/routes/checkout.success.tsx` — disparar `OnboardingWizard` quando pagamento for de novo cliente
- `src/routes/_authenticated/modules.tsx` — adicionar botão "Instalar" que log+notifica (sem alterar lógica do toggle)

Confirmação esperada antes de implementar.