# Módulo CORE — Agenda Inteligente / Plantões / Pega Horário

Vou montar isso como um módulo do CORE Impulsionando, instalável em 1 clique por qualquer tenant, sem nenhuma regra fixa em código. O escopo é grande — entrego em **5 fases incrementais** dentro do mesmo módulo, cada fase deployável e testável.

## Decisões de arquitetura

- **Tenant**: tudo isolado por `company_id` com RLS (padrão core). Profissional, cliente e gestor são `auth.users` com papéis em `user_roles` (escopo `company_id`).
- **Reuso**: já existem `agenda_*` tables (appointments, professionals, services, schedules, blocks, waitlist) — vou estender, não duplicar. Adiciono o que falta: locais, salas, turnos, plantões, regras, alertas, aceites, auditoria de agenda.
- **Pagamentos**: Mercado Pago (já migrado). Reuso `mpago_payments` ligando ao `appointment_id`.
- **Mensageria**: reuso `message_outbox` + `message_templates` para WhatsApp/e-mail/push.
- **Parametrização**: tudo em `agenda_settings` (JSON por chave) + `core_settings`/`setting_definitions` para o painel do CORE — zero hardcode.
- **Alerta "Pega Horário"**: tabela `agenda_open_slots` + `agenda_slot_offers` + `agenda_slot_claims`. Aceite usa `SELECT ... FOR UPDATE SKIP LOCKED` numa server fn para garantir que só 1 profissional ganha.
- **Server logic**: `createServerFn` com `requireSupabaseAuth` (padrão TanStack do projeto). Webhook MP já existe.
- **Auditoria**: tabela `agenda_audit_log` com `actor_id`, `ip`, `device`, `before/after JSONB`, alimentada por triggers + server fns.

## Fases

### Fase 1 — Schema CORE (migração única)
Tabelas novas (todas com `company_id`, RLS por `has_role` + membership, GRANTs corretos):
- `agenda_locations` (unidades de atendimento)
- `agenda_rooms` (salas/consultórios/posições, FK location)
- `agenda_shifts` (turnos)
- `agenda_oncall_shifts` (plantões: especialidade, sala, janela, status)
- `agenda_professional_eligibility` (matriz especialidade × serviço × local × profissional, prioridade, rodízio, performance)
- `agenda_professional_availability` (estende `agenda_schedules`: encaixe, plantão, emergência, tele, domiciliar, raio km, antecedência min/max)
- `agenda_professional_terms_acceptance` (aceite das regras)
- `agenda_rules` (no-show cliente, no-show profissional, cancelamento, remarcação, substituição, distribuição — JSONB versionado)
- `agenda_open_slots` (vaga aberta: origem = cancel/no-show/plantão/encaixe)
- `agenda_slot_offers` (oferta enviada a cada profissional elegível, com ordem)
- `agenda_slot_claims` (aceite — único por slot via unique constraint)
- `agenda_no_show_events` (cliente e profissional, com política aplicada)
- `agenda_penalties` (multas, bloqueios, perda de prioridade)
- `agenda_settings` (chave/valor JSONB por company — parametrização)
- `agenda_audit_log` (log universal)

Catálogo no core:
- Linha em `core_module_catalog` com slug `agenda-inteligente`, audiences `[admin, gestor, profissional, cliente]`.
- `setting_definitions` para todas as chaves (tipos de agenda permitidos, prazos, multas, templates, etc.).

### Fase 2 — Server functions
`src/lib/agenda-core.functions.ts`:
- CRUD: locations, rooms, shifts, oncall, eligibility, rules, settings.
- `openSlot` (cria vaga + dispara ofertas conforme `distribution_strategy` da rule).
- `claimSlot` (FOR UPDATE SKIP LOCKED, registra IP/device, trava demais, escreve auditoria, enfileira notificações).
- `declineSlot`, `cancelAppointment`, `rescheduleAppointment`, `confirmAttendance`, `startService`, `finishService`.
- `registerNoShow` (cliente/profissional, aplica política).
- `requestPayment` / `refundPayment` (delega para MP).
- `dashboardMetrics` (queries agregadas para os painéis).

Server route `src/routes/api/public/agenda/notification-webhook.ts` para confirmações por link de WhatsApp.

### Fase 3 — UI CORE de parametrização
- `src/routes/_authenticated/core.modulos.agenda.tsx` — admin CORE configura tudo por tenant (ativar, tipos permitidos, regras default, templates, dashboards ativos, permissões).
- Instalação em 1 clique via `InstallModuleDialog` existente: ao instalar `agenda-inteligente`, semeia `agenda_rules` + `agenda_settings` default.

### Fase 4 — Painéis operacionais (por audience)
- `_authenticated/agenda.gestor.tsx` — abrir/fechar agenda, bloqueios, encaixes, plantões, convocar, substituir, ver ofertas/aceites/ignorados, aprovar manual, dashboards.
- `_authenticated/agenda.profissional.tsx` — minha agenda, plantões disponíveis, inbox de alertas com botão **PEGAR HORÁRIO**, recusar, justificar ausência, iniciar/finalizar, repasses.
- `_authenticated/agenda.cliente.tsx` — agendar, pagar (MP), confirmar, cancelar, remarcar, lembretes, comprovante, aceite de termos.
- Componente `<PegaHorarioInbox/>` com realtime (`postgres_changes` em `agenda_slot_offers`).

### Fase 5 — Automações e auditoria
- Cron `pg_cron` chamando `/api/public/cron/agenda-tick` a cada minuto:
  - dispara lembretes, marca no-show por tolerância expirada, abre vaga emergencial, escala alertas para o próximo nível de distribuição se ninguém aceitou em N min, alerta plantão descoberto, alerta sala parada, alerta agenda ociosa.
- Triggers SQL gravando em `agenda_audit_log` para todas as tabelas operacionais.
- Dashboards: views materializadas `agenda_metrics_*` atualizadas no tick.

## Detalhes técnicos chave

- **Race no aceite**: `claimSlot` faz `UPDATE agenda_open_slots SET claimed_by=$1, claimed_at=now() WHERE id=$2 AND claimed_by IS NULL RETURNING *` — atomicidade garantida; segundo clique recebe null e retorna "horário já foi tomado".
- **Distribuição em ondas**: `distribution_strategy` JSONB define níveis `[{filter, wait_seconds}]`. O tick promove para a próxima onda quando expira.
- **RLS**: profissional só vê ofertas onde `professional_id = me`; gestor vê tudo da company; cliente só seus appointments.
- **Sem hardcode**: todos os textos de notificação vêm de `message_templates` por `template_key`; toda regra vem de `agenda_rules`/`agenda_settings`.

## O que NÃO está no escopo desta entrega
- Apps nativos (push usa Web Push / PWA).
- Integração com convênios reais (campo existe, integração fica para depois).
- Telemedicina vídeo (campo de link existe; provider não).

Aprovo e começo pela **Fase 1 (migração)**?
