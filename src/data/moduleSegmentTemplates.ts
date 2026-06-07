/**
 * Templates de parametrização por segmento.
 *
 * Estrutura: SEGMENT_TEMPLATES[moduleSlug][segmentSlug] = { [setting_key]: value }
 *
 * Usado por `installModuleWithTemplate` para fazer `upsert` em `company_settings`
 * automaticamente após instalar o módulo no cliente.
 *
 * Editar este arquivo NÃO requer migration. É a única fonte de verdade para
 * presets — alterações refletem na próxima instalação.
 */

export type SegmentKey =
  | "default"
  | "clinica"
  | "psicologia"
  | "gastroenterologia"
  | "academia"
  | "crossfit"
  | "restaurante"
  | "bar"
  | "microcervejaria"
  | "escritorio"
  | "eventos"
  | "educacao"
  | "viagens";

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  default: "Padrão Impulsionando",
  clinica: "Clínica",
  psicologia: "Psicologia",
  gastroenterologia: "Gastroenterologia",
  academia: "Academia",
  crossfit: "CrossFit",
  restaurante: "Restaurante",
  bar: "Bar",
  microcervejaria: "Microcervejaria",
  escritorio: "Escritório",
  eventos: "Eventos",
  educacao: "Educação",
  viagens: "Viagens",
};

type SettingValue = string | number | boolean | null;

export const SEGMENT_TEMPLATES: Record<string, Partial<Record<SegmentKey, Record<string, SettingValue>>>> = {
  agenda: {
    default: {
      "agenda.confirm_after_payment": false,
      "agenda.hold_minutes": 15,
      "agenda.cancel_min_hours": 12,
      "agenda.reschedule_min_hours": 6,
      "agenda.notify_professional": true,
      "agenda.notify_manager": false,
    },
    clinica: {
      "agenda.confirm_after_payment": true,
      "agenda.hold_minutes": 30,
      "agenda.cancel_min_hours": 24,
      "agenda.reschedule_min_hours": 12,
      "agenda.notify_professional": true,
      "agenda.notify_manager": true,
    },
    psicologia: {
      "agenda.confirm_after_payment": true,
      "agenda.hold_minutes": 30,
      "agenda.cancel_min_hours": 24,
      "agenda.reschedule_min_hours": 24,
      "agenda.notify_professional": true,
    },
    gastroenterologia: {
      "agenda.confirm_after_payment": true,
      "agenda.hold_minutes": 45,
      "agenda.cancel_min_hours": 48,
      "agenda.reschedule_min_hours": 24,
    },
    academia: {
      "agenda.confirm_after_payment": false,
      "agenda.hold_minutes": 10,
      "agenda.cancel_min_hours": 2,
      "agenda.reschedule_min_hours": 1,
    },
    crossfit: {
      "agenda.confirm_after_payment": false,
      "agenda.hold_minutes": 5,
      "agenda.cancel_min_hours": 2,
    },
    restaurante: {
      "agenda.hold_minutes": 15,
      "agenda.cancel_min_hours": 4,
    },
    bar: { "agenda.hold_minutes": 15 },
    microcervejaria: { "agenda.hold_minutes": 20 },
    escritorio: {
      "agenda.confirm_after_payment": true,
      "agenda.hold_minutes": 30,
      "agenda.cancel_min_hours": 24,
    },
    eventos: {
      "agenda.confirm_after_payment": true,
      "agenda.hold_minutes": 60,
      "agenda.cancel_min_hours": 72,
    },
    educacao: {
      "agenda.confirm_after_payment": false,
      "agenda.hold_minutes": 20,
      "agenda.cancel_min_hours": 24,
    },
    viagens: {
      "agenda.confirm_after_payment": true,
      "agenda.cancel_min_hours": 48,
    },
  },
  crm: {
    default: {
      "crm.default_source": "site",
      "crm.auto_followup_days": 3,
      "crm.notify_owner_on_new_lead": true,
    },
    clinica: { "crm.default_source": "indicacao", "crm.auto_followup_days": 2 },
    psicologia: { "crm.default_source": "indicacao", "crm.auto_followup_days": 5 },
    academia: { "crm.default_source": "instagram", "crm.auto_followup_days": 1 },
    crossfit: { "crm.default_source": "instagram", "crm.auto_followup_days": 1 },
    restaurante: { "crm.default_source": "ifood", "crm.auto_followup_days": 7 },
    bar: { "crm.default_source": "instagram" },
    escritorio: { "crm.default_source": "linkedin", "crm.auto_followup_days": 3 },
    eventos: { "crm.default_source": "site", "crm.auto_followup_days": 2 },
    educacao: { "crm.default_source": "google", "crm.auto_followup_days": 2 },
    viagens: { "crm.default_source": "instagram", "crm.auto_followup_days": 1 },
  },
  erp: {
    default: {
      "billing.due_day": 10,
      "billing.tolerance_days": 3,
      "billing.late_fee_percent": 2,
      "billing.interest_per_day_percent": 0.033,
      "billing.auto_suspend": true,
      "billing.auto_reactivate": true,
      "billing.allow_manual_payment": true,
    },
    clinica: { "billing.due_day": 5, "billing.tolerance_days": 5 },
    academia: { "billing.due_day": 5, "billing.tolerance_days": 7 },
    crossfit: { "billing.due_day": 5, "billing.tolerance_days": 7 },
    educacao: { "billing.due_day": 10, "billing.tolerance_days": 10 },
  },
};

/**
 * Retorna o template de parametrização para um módulo+segmento.
 * Faz merge com o "default" do módulo (segment-specific overrides têm prioridade).
 */
export function getSegmentTemplate(moduleSlug: string, segment: SegmentKey): Record<string, SettingValue> {
  const mod = SEGMENT_TEMPLATES[moduleSlug] ?? {};
  return { ...(mod.default ?? {}), ...(mod[segment] ?? {}) };
}
