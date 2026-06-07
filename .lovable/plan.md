# Revisão Final do Core Master — Plano Cirúrgico

## Premissa
Tudo que segue **só toca o que falta**. Não recriar módulos, telas, tabelas ou componentes existentes. A maior parte do escopo do prompt **já foi entregue** nas Fases A, B, C, Certificação e Instalação. Esta revisão **fecha as últimas pontas** e consolida o Core como painel suficiente.

---

## O que já existe (não mexer)

| Pedido do prompt | Onde já está |
|---|---|
| Acessar como cliente | `useImpersonation` + `ImpersonationBanner` + botão em `core.cliente.$id` |
| Instalador 1-clique | `InstallModuleDialog` + `installModuleWithTemplate` |
| Certificação de módulos | `ModuleCertificationPanel` + colunas em `modules` |
| Templates por segmento | `src/data/moduleSegmentTemplates.ts` (12 segmentos) |
| Parâmetros Sim/Não por cliente | `ClientSettingsPanel` + `setting_definitions` + `company_settings` |
| Comunicação editável (eventos × canais) | `ClientCommunicationPanel` + `message_templates` + `message_outbox` |
| Pendências por cliente | `ClientPendingsPanel` |
| Logs por cliente | `ClientLogsPanel` + `audit_logs` |
| Identidade White Label (envio técnico Impulsionando, percepção do cliente) | `enqueue_message` + `company_identity_payload` |
| Cobrança / suspensão / reativação automática | `billing_run_cycle` + `billing_mark_paid` |
| Hierarquia I/WL/Cliente/Final | `companies.is_master`, `is_impulsionando_staff`, RLS por `company_id` |
| Menu Master /adm | `core.tsx` |
| Construtor de campos/formulários/dashboards | `setting_definitions` + `ClientSettingsPanel` (parâmetros tipados) |

**Conclusão:** o Core já é administrável. Faltam **apenas 4 ajustes finos**.

---

## O que falta (executar agora)

### 1. Catálogo global de eventos de comunicação
Hoje `ClientCommunicationPanel` lista só eventos que **já têm pelo menos um template**. Se um evento nunca foi semeado, o usuário não consegue criar do painel.

**Ação:**
- Criar `src/data/communicationEvents.ts` listando os 18 eventos do prompt (boas-vindas, primeiro acesso, criação de senha, cadastro, agendamento, aprovação, rejeição, confirmação, cancelamento, remarcação, lembrete, cobrança, pagamento aprovado, pagamento vencido, suspensão, reativação, nota fiscal emitida, recuperação de senha) × 3 canais.
- Atualizar `ClientCommunicationPanel` para fazer **union** entre o catálogo e os templates existentes, permitindo criar do zero por cliente.

### 2. Painel global de Saúde & Pendências
Hoje pendências existem **por cliente**. Falta a visão agregada do prompt ("Painel de saúde e pendências").

**Ação:**
- Nova rota `src/routes/_authenticated/core.saude.tsx` (read-only, agrega queries existentes):
  - Clientes ativos / incompletos
  - Módulos com erro de instalação (lê `audit_logs` action `module.install.failed`)
  - Comunicações com erro (lê `message_outbox` status `failed`)
  - Pagamentos vencidos (lê `billing_invoices` status `overdue`)
  - Configurações incompletas (lê `onboarding_checklist` com pendências)
- Adicionar entrada "Saúde" no `core.tsx` antes de "Clientes".

### 3. Construtor de definições de parâmetro (Sim/Não)
`ClientSettingsPanel` aplica `setting_definitions`, mas só **staff Impulsionando via SQL** consegue criar uma definição nova. Falta UI.

**Ação:**
- Novo componente `src/components/core/SettingDefinitionsAdmin.tsx`: CRUD em `setting_definitions` (key, label, type boolean|text|number|enum, default, scope, módulo).
- Aba "Definições" em `core.modulos.$slug.tsx` (já tem tabs), restrita a super-admin, para criar parâmetros por módulo direto no painel.

### 4. Centralizar baixa manual / reenvio / reprocesso
Já existem `billing_mark_paid` e `message_outbox`. Falta o **botão de ação** no painel.

**Ação:**
- Em `ClientLogsPanel` ou nova aba "Operações" no `core.cliente.$id`: 3 botões — "Baixa manual de fatura" (chama `billing_mark_paid`), "Reenviar comunicação" (re-enqueue de uma linha `message_outbox`), "Reprocessar nota fiscal" (placeholder server fn — emite log de pedido manual; emissão real depende do conector NFe, fora deste escopo).

---

## Fora deste escopo (não tocar)
- Não criar módulos novos (Agenda/CRM/PDV/NFe/etc) — já existem como tabelas + páginas demo.
- Não criar novos conectores externos (NFe, gateway Pix real) — exige integração externa, é trabalho separado de "core administrável".
- Não mexer em RLS existente nem em `clients.ts` da Supabase.
- Não criar telas de "construtor visual drag-and-drop" — os parâmetros tipados via `setting_definitions` já cumprem o requisito funcional do prompt.

---

## Entregáveis

| Arquivo | Tipo |
|---|---|
| `src/data/communicationEvents.ts` | novo (catálogo) |
| `src/components/core/ClientCommunicationPanel.tsx` | editar (union catálogo+DB) |
| `src/routes/_authenticated/core.saude.tsx` | novo |
| `src/routes/_authenticated/core.tsx` | editar (1 entrada de menu) |
| `src/components/core/SettingDefinitionsAdmin.tsx` | novo |
| `src/routes/_authenticated/core.modulos.$slug.tsx` | editar (1 aba) |
| `src/components/core/ClientOperationsPanel.tsx` | novo (3 botões) |
| `src/routes/_authenticated/core.cliente.$id.tsx` | editar (1 aba) |
| `src/lib/operations.functions.ts` | novo (server fns para baixa/reenvio) |

**Migrations: nenhuma.** Tudo usa tabelas e funções já existentes.

---

## Validação final
Após aplicar:
- Super-admin cria parâmetro novo → aparece automaticamente em `ClientSettingsPanel` de todos os clientes.
- Super-admin cria template de comunicação para evento que nunca tinha → salva e dispara.
- `/core/saude` mostra todas as pendências agregadas em uma tela.
- Baixa manual de fatura grava `audit_log` e reativa módulos.

Aprovado? Executo Fases 1–4 em sequência, num único lote de mudanças.
