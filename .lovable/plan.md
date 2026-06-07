# Central Master de Configuração — Plano de Execução

O escopo é grande demais para uma única entrega. Vou trabalhar em fases curtas, **sempre reaproveitando** as telas, tabelas e funções que já existem no projeto (companies, company_modules, company_settings, setting_definitions, message_templates, message_outbox, billing_*, audit_logs, user_profiles, profile_permissions, customers, agenda_*, crm_*, fin_*, etc.).

Nada será reconstruído. Só vou **expor, conectar e parametrizar** no painel `/core` (Master).

---

## O que JÁ existe e será apenas exposto/conectado (sem refazer)

- **Impersonação** (`use-impersonation` + `ImpersonationBanner`) — já implementada na fase anterior.
- **Instalador de módulos por empresa** — aba "Módulos" em `core.cliente.$id.tsx` usando `company_modules` + `module_versions`.
- **Parâmetros Sim/Não por cliente** — `ClientSettingsPanel` + tabela `setting_definitions`/`company_settings` (18 parâmetros já semeados).
- **Templates de comunicação** — `message_templates` + `message_outbox` + `enqueue_message()` (e-mail/WhatsApp/in-app já funcionam).
- **Régua de cobrança** — `billing_contracts`, `billing_invoices`, `billing_dunning_policy`, `billing_run_cycle()`.
- **Auditoria** — `audit_logs` + trigger `tg_audit` (basta exibir).
- **Permissões** — `profiles`, `profile_permissions`, `user_permission_overrides`, `user_has_permission()`.
- **Pendências** — calculáveis a partir das tabelas existentes (sem nova tabela).

---

## Fases (entrego uma por vez, validamos, seguimos)

### Fase A — Hub Central + Pendências por cliente
1. Refinar `/core/cliente/:id` para virar o **hub único** com abas claras: **Dados Gerais · Módulos · Parâmetros · Comunicação · Financeiro · Fiscal · Agenda · CRM · Permissões · Pendências · Logs**.
2. Cada aba reaproveita componente existente (ex.: `IdentityTab`, `ClientSettingsPanel`, `OnboardingWizard`, billing já pronto).
3. Nova aba **Pendências**: consulta agregada (sem nova tabela) que lista o que falta — e-mail, WhatsApp, Pix, QR, gateway, CNPJ inválido, módulo incompleto, fatura vencida, etc.
4. Nova aba **Logs**: lê `audit_logs` filtrando por `company_id`.

### Fase B — Parâmetros expandidos (Sim/Não para tudo que é mutável)
Adicionar definições novas em `setting_definitions` cobrindo:
- Agenda (já existe parcial) — completar regras de cancelamento/remarcação/confirmar após pagamento.
- Financeiro — multa, juros, desconto, dia vencimento, tolerância, gateway ativo, recorrência, suspensão/reativação automática.
- Fiscal — emitir NF Sim/Não, automático após pagto, código serviço, alíquota, município, e-mail fiscal.
- Comunicação — remetente, e-mail técnico, e-mail resposta, WhatsApp envio/suporte, assinatura, rodapé, links.
- CRM — origem padrão, responsável padrão, follow-up.
- Portal cliente, Relatórios, Notificações, Aparência.

Tudo via `ClientSettingsPanel` (já agrupa por categoria automaticamente). **Zero código novo de UI.**

### Fase C — Editor de comunicação por cliente
Tela única que lista eventos (a partir de `message_templates`), permite por evento:
- Toggle e-mail / WhatsApp
- Editar assunto + corpo (override por `company_id` — a coluna já existe)
- Inserir variáveis dinâmicas (palette com `[NOME_CLIENTE]`, `[VALOR]`, etc. mapeadas para o payload do `enqueue_message`)
- Testar envio (chama `enqueue_message` com dados de teste)
- Histórico → consulta `message_outbox` filtrada

### Fase D — Construtor de campos personalizados
**Esta é a única tabela nova realmente necessária**: `custom_fields` + `custom_field_values` (por entidade: customer, lead, appointment, etc.), com:
- Tipo (texto, número, CPF, CNPJ, CEP, data, lista, sim/não, upload, etc.)
- Obrigatório/Visível/Editável/Exibir em X — todos Sim/Não
- Validação, máscara, valor padrão, ordem, campo dependente
- UI no master para criar/editar; renderização condicional onde fizer sentido (começo pelo cadastro de cliente)

### Fase E — Painel Financeiro/Fiscal acionável
- Botões já no hub: **Baixa manual** (com modal: valor, data, forma, obs, comprovante → grava `fin_transactions` + `billing_invoices`), **Reprocessar NF**, **Reenviar comunicação**, **Suspender/Reativar** manualmente.
- Tudo registra em `audit_logs` (trigger já faz).

### Fase F — White Label (escopo reduzido)
RLS já distingue `is_super_admin` vs `is_impulsionando_staff` vs usuários de empresa. Adicionar:
- Flag `is_white_label` em `companies` + `parent_company_id` (relação WL → clientes).
- Helper `is_white_label_of(_user, _company)` + ajuste de policies para que WL veja só seus clientes.
- Reaproveita a mesma UI `/core` com filtro automático.

---

## O que NÃO vou fazer (para não gastar créditos à toa)

- Não vou criar telas novas paralelas às existentes (`/settings`, `/audit`, `/permissions`, `/admin/billing-*` continuam vivos — viram links/abas do hub).
- Não vou refazer agenda, CRM, financeiro, PDV — eles já estão parametrizados via `company_settings` + flags.
- Não vou trocar o stack nem migrar dados.
- Não vou adicionar integrações fiscais novas se já existir uma; só vou expor parâmetros.

---

## Detalhes técnicos (resumidos)

- Toda escrita passa pelas tabelas que **já têm trigger `tg_audit`** → logs automáticos.
- Parâmetros: chave única `(company_id, key)` em `company_settings` — já existe `onConflict` no upsert.
- Variáveis dinâmicas: `enqueue_message` já faz `company_identity_payload || payload` — a paleta apenas mostra as chaves disponíveis.
- Pendências: query única no servidor (server function) que devolve um array tipado `{ key, label, severity, fix_path }`.
- Custom fields (Fase D): única migração SQL real do plano; tudo o resto é UI + seeds.

---

## Por onde começar?

Sugiro **Fase A + Fase B juntas** (hub + parâmetros expandidos) — entregam a maior parte da sensação de "tudo configurável pelo painel" sem mexer em schema novo. Depois decidimos as próximas.

Confirma que posso seguir por aí, ou quer priorizar outra fase primeiro (ex.: começar pela Fase C — editor de comunicação, já que e-mail/WhatsApp foi a dor original)?
