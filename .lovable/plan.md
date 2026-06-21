# Módulo CORE — Agenda Inteligente / Plantões / Pega Horário — ✅ ENTREGUE

Status: **completo e publicado em produção** (https://impulsionando.com.br).

## O que foi entregue

### Schema (migração única)
14 tabelas com `company_id`, RLS por tenant, GRANTs corretos:
`agenda_locations`, `agenda_rooms`, `agenda_shifts`, `agenda_oncall_shifts`,
`agenda_professional_eligibility`, `agenda_professional_availability`,
`agenda_professional_terms`, `agenda_rules` (JSONB versionado),
`agenda_open_slots`, `agenda_slot_offers`, `agenda_no_show_events`,
`agenda_penalties`, `agenda_settings`, `agenda_audit_log`.
RPC atômica `agenda_claim_open_slot` (FOR UPDATE SKIP LOCKED).

### Server functions (`src/lib/agenda-core.functions.ts`)
CRUD completo, `openSlot`, `claimSlot`, `declineSlotOffer`,
`cancelAppointment`, `registerNoShow`, `confirmAttendance`, `startService`,
`finishService`, `dashboardMetrics`, `listMyOpenOffers`,
`listMyAppointments`, `installAgendaModule`.

### UIs
- `_authenticated/agenda.gestor.tsx` — dashboard + abertura de vagas.
- `_authenticated/agenda.profissional.tsx` — Pega-Horário com realtime.
- `_authenticated/agenda.cliente.tsx` — autoatendimento.
- `_authenticated/core.modulos.agenda.tsx` — edição das regras JSONB.

### Catálogo & instalação
- Linha `agenda-inteligente` em `core_module_catalog`.
- `InstallModuleDialog` chama `installAgendaModule` ao instalar — semeia
  regras default (no-show, cancelamento, distribuição em ondas, lembretes,
  pagamento) e settings.

### Permissões
11 entradas `agenda.*` em `permissions`, distribuídas a:
Super Admin / Admin Impulsionando / Suporte / Gestor / Admin Unidade (full),
Profissional (claim/decline/oncall/metrics/no_show.read),
Recepção (slot.open/no_show.register/no_show.read/metrics.read).

### Automação
- Endpoint `/api/public/cron/agenda-tick`.
- Cron `agenda-tick-every-minute` ativo (expira ofertas, promove próxima
  onda de distribuição).

### Menu
`/agenda/gestor`, `/agenda/profissional`, `/agenda/cliente` no nav lateral
com perms por audience.

## Próximos módulos sugeridos
Financeiro · Estoque · Contratos · PWA do profissional · Templates de
WhatsApp para o módulo Agenda.
