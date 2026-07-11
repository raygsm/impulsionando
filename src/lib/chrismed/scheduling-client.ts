/**
 * CHRISMED V4 — Scheduling Client Adapter (INERTE).
 *
 * ATENÇÃO: este módulo é apenas contrato tipado.
 *   - Nenhum fetch.
 *   - Nenhum import de supabase.
 *   - Nenhum mock, nenhum fixture, nenhum dado real.
 *   - Nenhum endpoint hardcoded em runtime.
 *   - Nenhum token/credencial gerado localmente.
 *   - NÃO importado em nenhuma rota ativa.
 *
 * A implementação concreta destes métodos depende integralmente dos
 * endpoints reais entregues pelo Codex (/api/chrismed/scheduling/*,
 * mpago-create-payment, webhooks de confirmação, tabelas de políticas).
 * Enquanto esses endpoints não existirem e não passarem por testes de
 * concorrência, RLS e cross-tenant, este adapter permanece inerte.
 */

import type {
  V4Appointment,
  V4AvailabilityResponse,
  V4CancellationResponse,
  V4ErrorEnvelope,
  V4Offering,
  V4PaymentCreateResponse,
  V4PaymentStatusResponse,
  V4PoliciesResponse,
  V4Professional,
  V4RefundResponse,
  V4RescheduleRequest,
  V4RescheduleResponse,
  V4Slot,
  V4SlotHold,
  V4Payer,
  V4Consents,
  V4PublicToken,
} from '@/content/chrismed/v4/contracts';

/** Erro tipado que a UI deve tratar de forma exaustiva. */
export class V4SchedulingError extends Error {
  readonly envelope: V4ErrorEnvelope;
  constructor(envelope: V4ErrorEnvelope) {
    super(envelope.message);
    this.name = 'V4SchedulingError';
    this.envelope = envelope;
  }
}

/** Sentinela para métodos ainda não implementados. */
const NOT_IMPLEMENTED = (method: string): never => {
  throw new V4SchedulingError({
    code: 'server_error',
    message: `V4 scheduling adapter is inert: ${method} depends on Codex-delivered endpoints.`,
  });
};

// ─── Contratos de entrada ──────────────────────────────────────────────────
export interface V4GetAvailabilityInput {
  offering_id: string;
  professional_id?: string;
  unit_id?: string;
  from: string; // ISO
  to: string;   // ISO
}

export interface V4CreateHoldInput {
  offering_id: string;
  slot: V4Slot;
}

export interface V4CreatePaymentInput {
  hold_id: string;
  payer: V4Payer;
  consents: V4Consents;
  is_courtesy?: boolean;
}

export interface V4CancelInput {
  appointment_id: string;
  reason?: string;
}

export interface V4RefundInput {
  payment_id: string;
  reason?: string;
}

// ─── Interface pública do adapter ──────────────────────────────────────────
export interface V4SchedulingClient {
  // 1. offerings
  getOfferings(): Promise<readonly V4Offering[]>;
  // 2. professionals
  getProfessionals(offeringId: string): Promise<readonly V4Professional[]>;
  // 3. availability
  getAvailability(input: V4GetAvailabilityInput): Promise<V4AvailabilityResponse>;
  // 4. hold create
  createHold(input: V4CreateHoldInput): Promise<V4SlotHold>;
  // 5. hold status (via token público)
  getHold(token: V4PublicToken): Promise<V4SlotHold>;
  // 6. hold release
  releaseHold(holdId: string): Promise<void>;
  // 7. payment create
  createPayment(input: V4CreatePaymentInput): Promise<V4PaymentCreateResponse>;
  // 8. payment status (via token público)
  getPaymentStatus(token: V4PublicToken): Promise<V4PaymentStatusResponse>;
  // 9. appointment confirm (webhook-driven — client apenas observa)
  confirmAppointment(token: V4PublicToken): Promise<V4Appointment>;
  // 10. appointment lookup
  getAppointment(id: string, token: V4PublicToken): Promise<V4Appointment>;
  // 11. reschedule
  rescheduleAppointment(input: V4RescheduleRequest): Promise<V4RescheduleResponse>;
  // 12. cancel
  cancelAppointment(input: V4CancelInput): Promise<V4CancellationResponse>;
  // 13. refund
  requestRefund(input: V4RefundInput): Promise<V4RefundResponse>;
  // + policies
  getPolicies(): Promise<V4PoliciesResponse>;
}

/**
 * Instância inerte. Toda chamada lança V4SchedulingError.
 * A implementação real substituirá este objeto quando o Codex entregar:
 *   - endpoints /api/chrismed/scheduling/*
 *   - mpago-create-payment com public_status_token e cortesia
 *   - webhook idempotente de confirmação de appointment
 *   - tabelas versionadas de políticas (LGPD, termos, cancelamento, comunicação)
 *   - RLS e tokens públicos efêmeros validados
 */
export const schedulingClient: V4SchedulingClient = {
  getOfferings: () => NOT_IMPLEMENTED('getOfferings'),
  getProfessionals: () => NOT_IMPLEMENTED('getProfessionals'),
  getAvailability: () => NOT_IMPLEMENTED('getAvailability'),
  createHold: () => NOT_IMPLEMENTED('createHold'),
  getHold: () => NOT_IMPLEMENTED('getHold'),
  releaseHold: () => NOT_IMPLEMENTED('releaseHold'),
  createPayment: () => NOT_IMPLEMENTED('createPayment'),
  getPaymentStatus: () => NOT_IMPLEMENTED('getPaymentStatus'),
  confirmAppointment: () => NOT_IMPLEMENTED('confirmAppointment'),
  getAppointment: () => NOT_IMPLEMENTED('getAppointment'),
  rescheduleAppointment: () => NOT_IMPLEMENTED('rescheduleAppointment'),
  cancelAppointment: () => NOT_IMPLEMENTED('cancelAppointment'),
  requestRefund: () => NOT_IMPLEMENTED('requestRefund'),
  getPolicies: () => NOT_IMPLEMENTED('getPolicies'),
};
