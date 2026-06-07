/**
 * Catálogo global de eventos de comunicação do Core Master.
 * Cada evento × canal pode ser criado/editado por cliente em ClientCommunicationPanel,
 * mesmo que nunca tenha sido semeado em message_templates.
 */
export type CommChannel = "email" | "whatsapp" | "in_app";

export interface CommEvent {
  code: string;
  label: string;
  group: string;
  defaultChannels: CommChannel[];
}

export const COMMUNICATION_EVENTS: CommEvent[] = [
  // Onboarding
  { code: "user_welcome", label: "Boas-vindas", group: "Onboarding", defaultChannels: ["email", "whatsapp", "in_app"] },
  { code: "user_first_access", label: "Primeiro acesso", group: "Onboarding", defaultChannels: ["email", "in_app"] },
  { code: "user_password_create", label: "Criação de senha", group: "Onboarding", defaultChannels: ["email"] },
  { code: "user_signup", label: "Cadastro concluído", group: "Onboarding", defaultChannels: ["email", "whatsapp"] },
  { code: "password_recovery", label: "Recuperação de senha", group: "Onboarding", defaultChannels: ["email"] },

  // Agenda
  { code: "appointment_new_customer", label: "Agendamento criado (cliente)", group: "Agenda", defaultChannels: ["whatsapp", "email"] },
  { code: "appointment_new_professional", label: "Agendamento criado (profissional)", group: "Agenda", defaultChannels: ["email", "in_app"] },
  { code: "appointment_approved", label: "Agendamento aprovado", group: "Agenda", defaultChannels: ["whatsapp", "email"] },
  { code: "appointment_rejected", label: "Agendamento rejeitado", group: "Agenda", defaultChannels: ["whatsapp", "email"] },
  { code: "appointment_confirmed", label: "Confirmação de horário", group: "Agenda", defaultChannels: ["whatsapp"] },
  { code: "appointment_cancelled", label: "Cancelamento", group: "Agenda", defaultChannels: ["whatsapp", "email"] },
  { code: "appointment_rescheduled", label: "Remarcação", group: "Agenda", defaultChannels: ["whatsapp", "email"] },
  { code: "appointment_reminder", label: "Lembrete", group: "Agenda", defaultChannels: ["whatsapp"] },

  // Cobrança / financeiro
  { code: "billing_due_soon", label: "Cobrança gerada", group: "Cobrança", defaultChannels: ["email", "whatsapp"] },
  { code: "billing_payment_approved", label: "Pagamento aprovado", group: "Cobrança", defaultChannels: ["email", "whatsapp"] },
  { code: "billing_overdue", label: "Pagamento vencido", group: "Cobrança", defaultChannels: ["email", "whatsapp"] },
  { code: "subscription_suspended", label: "Suspensão", group: "Cobrança", defaultChannels: ["email", "whatsapp"] },
  { code: "subscription_reactivated", label: "Reativação", group: "Cobrança", defaultChannels: ["email", "whatsapp"] },

  // Fiscal
  { code: "invoice_issued", label: "Nota fiscal emitida", group: "Fiscal", defaultChannels: ["email"] },
];

export const EVENT_BY_CODE: Record<string, CommEvent> = Object.fromEntries(
  COMMUNICATION_EVENTS.map((e) => [e.code, e]),
);
