---
name: Agenda Inteligente module
description: Módulo CORE universal de agenda/plantões/no-show/pega-horário — tabelas, RPC atômico, server fns e rotas
type: feature
---
Módulo CORE `agenda-inteligente` (instalável em qualquer tenant via `installAgendaModule`):

Tabelas (todas com RLS por `user_has_permission` + `is_super_admin`, isoladas por `company_id`):
`agenda_locations`, `agenda_rooms`, `agenda_shifts`, `agenda_oncall_shifts`,
`agenda_professional_eligibility`, `agenda_professional_availability`, `agenda_professional_terms`,
`agenda_rules` (kind ∈ no_show_customer/no_show_professional/cancellation/rescheduling/substitution/distribution/reminder/payment, JSONB versionado),
`agenda_open_slots`, `agenda_slot_offers` (unique slot+prof), `agenda_no_show_events`, `agenda_penalties`,
`agenda_settings` (chave/valor), `agenda_audit_log`. Estendem `agenda_appointments`/`agenda_professionals` existentes.

Aceite atômico: RPC `agenda_claim_open_slot(_slot_id, _professional_id, _ip, _user_agent)` faz UPDATE com guarda `status='open'` — race-safe; trava demais ofertas (`locked`), marca plantão `covered` ou reatribui o appointment.

Server fns em `src/lib/agenda-core.functions.ts`: listLocations/upsertLocation, upsertRoom, createOncallShift, getRules/upsertRule, getSettings/setSetting, openSlot (cria vaga + dispara ofertas para `agenda_professional_eligibility` por prioridade), claimSlot, declineSlotOffer, listMyOpenOffers, cancelAppointment (reabre slot), registerNoShow (gera substituição automática se for do profissional), confirmAttendance/startService/finishService, dashboardMetrics, installAgendaModule.

Rotas:
- `_authenticated/agenda.profissional.tsx` — inbox realtime + botão "PEGAR HORÁRIO"
- `_authenticated/agenda.gestor.tsx` — métricas, vagas abertas, novo plantão, cancelar/no-show
- `_authenticated/core.modulos.agenda.tsx` — configuração das 8 regras + settings JSONB
- `api/public/cron/agenda-tick.ts` — tick por minuto (expira ofertas/slots, marca plantões descobertos)

Permissões usadas em policies: `agenda.{location,room,shift,oncall,professional,rule,slot,no_show,penalty,settings,audit}.{read|write}` — devem ser cadastradas em `permissions` ao habilitar para um nicho.
