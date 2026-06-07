# Revisão Final de Governança — Core Master

Auditoria dos 10 pontos solicitados. Para cada item: **(A) Já existe** — apenas exponho/conecto no painel; **(N) Falta** — crio o mínimo. Sem recriar módulos.

## Mapa de cobertura atual × ações

| # | Item | Estado hoje | Ação |
|---|------|-------------|------|
| 1 | Matriz global de parâmetros | Parcial — `setting_definitions` + `company_settings` existem; falta aplicação em massa | **N parcial**: nova aba "Parâmetros Globais" em `/core` com aplicar em (todos / white-label / cliente) |
| 2 | Versionamento de módulos | `module_versions` existe; falta escopo de aplicação | **N parcial**: diálogo "Aplicar versão" com escopo (cliente / WL / todos) |
| 3 | Clonagem de projeto | Não existe | **N**: serverFn `cloneCompany` + botão em `/core/cliente/$id` |
| 4 | Clonagem de configurações | Não existe | **N**: diálogo "Copiar configurações" (origem→destino, marcar áreas: agenda, comunicação, cobrança, CRM, dashboard, permissões) |
| 5 | Checklist de implantação | `onboarding_checklist` existe; já exposto | **A**: garantir aba "Implantação" visível no cliente com os 10 itens padronizados |
| 6 | Central de testes | Não existe | **N**: `/core/testes` + serverFn `runClientHealthCheck` (login, whatsapp, email, agenda, cobrança, pix, NF, dashboard) |
| 7 | Central de eventos (tela) | Catálogo em código + `message_outbox` + `message_templates`; falta tela unificada | **N parcial**: `/core/eventos` listando evento × canal × template × última/próxima execução |
| 8 | Visão financeira master | `billing_invoices` + `subscriptions` existem; falta dashboard | **N**: `/core/financeiro-master` com MRR, ARR, ativos, suspensos, churn, LTV, inadimplência, receita por módulo/WL/segmento |
| 9 | Modo suporte (entrar como cliente) | Não existe | **N**: serverFn `enterAsClient` (super-admin → qualquer; WL → próprios) + log em `audit_logs` obrigatório + banner "Modo Suporte" |
| 10 | Certificação real | Já implementado (readiness_status + checklist) | **A**: filtro "somente certificados" no marketplace de instalação |

## Arquivos a criar (mínimos)

**Server functions** (`src/lib/governance.functions.ts` — novo):
- `applyGlobalSetting({ key, value, scope: 'all'|'white_label'|'company', target_id })`
- `applyModuleVersion({ module_id, version_id, scope, target_id })`
- `cloneCompany({ source_company_id, new_name, new_owner_email })`
- `copyCompanySettings({ source_id, target_id, areas: string[] })`
- `runClientHealthCheck({ company_id })` — retorna `{ login, whatsapp, email, agenda, cobranca, pix, nf, dashboard: 'pass'|'fail'|'pending' }`
- `enterAsClient({ company_id })` — valida escopo, grava `audit_logs`, retorna token de impersonação curto

**Rotas** (em `src/routes/_authenticated/`):
- `core.parametros.tsx` — Matriz global
- `core.eventos.tsx` — Central de eventos
- `core.testes.tsx` — Central de testes
- `core.financeiro-master.tsx` — Visão financeira

**Componentes** (em `src/components/core/`):
- `CloneCompanyDialog.tsx`
- `CopySettingsDialog.tsx`
- `ApplyVersionScopeDialog.tsx`
- `SupportModeBanner.tsx` (renderizado no `_authenticated` layout quando há impersonação ativa)

**Edições pontuais**:
- `core.tsx` — adicionar 4 entradas de menu (Parâmetros, Eventos, Testes, Financeiro Master)
- `core.cliente.$id.tsx` — botões "Clonar projeto", "Copiar configurações de…", "Entrar como cliente"
- `core.modulos.$slug.tsx` — diálogo de aplicação com escopo na aba Versões
- `_authenticated.tsx` (layout) — montar `SupportModeBanner`

## Migração necessária

Uma única migração:
- `support_sessions` (id, super_user_id, company_id, started_at, ended_at, reason) — log obrigatório de "entrar como cliente"
- `governance_applications` (id, kind: setting|version, scope, target_id, payload, applied_by, applied_at) — auditoria de aplicações em massa
- GRANTs + RLS (super-admin only)

Sem alterar tabelas existentes.

## Fora de escopo

- Não recriar módulos, telas de cliente, fluxos de cobrança, comunicação ou agenda.
- Não trocar arquitetura de RLS.
- Item 10 não precisa de código novo — já está pronto, só filtro.

## Validação

Ao final, super-admin consegue, a partir de `/core`:
1. Aplicar um parâmetro a todos os clientes em 2 cliques.
2. Promover uma versão de módulo para todos.
3. Clonar Patrícia Lenine → novo cliente em <1min.
4. Rodar teste completo em qualquer cliente e ver pass/fail.
5. Ver MRR/ARR/Churn em tempo real.
6. Entrar como cliente com log automático.

Confirma para eu executar?
