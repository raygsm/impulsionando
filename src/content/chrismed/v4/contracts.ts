/**
 * CHRISMED V4 — contratos de props e schemas backend (inertes).
 *
 * ESTE ARQUIVO É APENAS TIPAGEM.
 * Nenhum valor real. Nenhuma chamada. Nenhum mock.
 * Nenhum componente ativo importa isto.
 *
 * Todo campo/estado marcado `TODO(Codex)` aguarda contrato oficial do
 * backend (endpoints /api/chrismed/scheduling/*, mpago-create-payment,
 * webhooks de confirmação, tabelas de políticas versionadas).
 *
 * Cobertura obrigatória (13 contratos):
 *   1. offerings
 *   2. professionals
 *   3. availability
 *   4. hold (create)
 *   5. hold (status/get)
 *   6. hold (release)
 *   7. payment (create)
 *   8. payment (status)
 *   9. appointment (confirm via webhook)
 *  10. appointment (lookup)
 *  11. reschedule
 *  12. cancel
 *  13. refund
 *  + policies & consents (versionadas)
 */

// ─── Comuns ────────────────────────────────────────────────────────────────
export type V4Lang = 'pt' | 'en' | 'es';
export type V4Currency = 'BRL';
export type V4ISODate = string; // ISO-8601 UTC (definido pelo backend)

/** Token público efêmero — TODO(Codex): TTL, escopo, algoritmo. */
export type V4PublicToken = string;

/** Envelope de erro tipado devolvido pelos endpoints. */
export interface V4ErrorEnvelope {
  code:
    | 'validation_error'
    | 'not_found'
    | 'conflict'
    | 'hold_expired'
    | 'hold_conflict'
    | 'payment_declined'
    | 'gateway_unavailable'
    | 'rate_limited'
    | 'unauthorized'
    | 'forbidden'
    | 'server_error';
  message: string;
  details?: Record<string, unknown>;
  // TODO(Codex): trace_id/request_id para observabilidade.
}

/** Correção de deriva do relógio para countdowns server-authoritative. */
export interface V4ServerClock {
  server_time: V4ISODate; // devolvido em toda resposta com expires_at
}

// ─── 1. Offerings ──────────────────────────────────────────────────────────
export type V4Modality =
  | 'presencial'
  | 'telemedicina'
  | 'domiciliar'
  | 'retorno'
  | 'ocupacional';

export interface V4Offering {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modality: V4Modality;
  price_cents: number;
  currency: V4Currency;
  duration_minutes: number;
  requires_prepayment: boolean;
  /** TODO(Codex): cortesia/retorno autorizado pelo backend, nunca client-side. */
  is_courtesy?: boolean;
}

// ─── 2. Professionals / Units ──────────────────────────────────────────────
export interface V4Professional {
  id: string;
  display_name: string;
  crm?: string;
  specialties: string[];
  photo_url?: string;
  // TODO(Codex): vínculo service_offering_professional + unidades.
}

export interface V4Unit {
  id: string;
  name: string;
  address_short?: string;
}

// ─── 3. Availability ───────────────────────────────────────────────────────
export interface V4Slot {
  starts_at: V4ISODate;
  ends_at: V4ISODate;
  professional_id: string;
  unit_id?: string;
  room_id?: string;
}

export interface V4AvailabilityResponse extends V4ServerClock {
  slots: readonly V4Slot[];
}

// ─── 4–6. Hold (estados oficiais) ──────────────────────────────────────────
export type V4HoldStatus =
  | 'active'
  | 'expired'
  | 'released'
  | 'consumed'
  | 'conflict';

export interface V4SlotHold extends V4ServerClock {
  hold_id: string;
  slot: V4Slot;
  status: V4HoldStatus;
  expires_at: V4ISODate; // fonte única do countdown (servidor)
  /** Token público para consultar status sem sessão autenticada. */
  public_status_token: V4PublicToken;
}

// ─── 7–8. Payment ──────────────────────────────────────────────────────────
export type V4PaymentStatus =
  | 'creating'
  | 'awaiting_pix'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'charged_back'
  | 'error_gateway'
  | 'error_network';

export interface V4PixPayload {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  expires_at: V4ISODate; // do gateway (Mercado Pago)
}

export interface V4PaymentCreateResponse extends V4ServerClock {
  payment_id: string;
  status: V4PaymentStatus;
  pix?: V4PixPayload;
  public_status_token: V4PublicToken;
  /** TODO(Codex): appointment_id só é atribuído após webhook aprovado. */
  appointment_id?: string;
}

export interface V4PaymentStatusResponse extends V4ServerClock {
  payment_id: string;
  status: V4PaymentStatus;
  appointment_id?: string;
}

// ─── 9–10. Appointment ─────────────────────────────────────────────────────
export type V4AppointmentStatus =
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed'
  | 'rescheduled';

export interface V4Appointment {
  id: string;
  offering_id: string;
  professional_id: string;
  unit_id?: string;
  starts_at: V4ISODate;
  ends_at: V4ISODate;
  status: V4AppointmentStatus;
  payment_id?: string;
  // TODO(Codex): links de calendário, meeting_url para telemedicina.
}

// ─── 11. Reschedule ────────────────────────────────────────────────────────
export type V4RescheduleStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface V4RescheduleRequest {
  appointment_id: string;
  new_slot: V4Slot;
  reason?: string;
}

export interface V4RescheduleResponse {
  appointment_id: string;
  status: V4RescheduleStatus;
  appointment?: V4Appointment;
}

// ─── 12. Cancellation ──────────────────────────────────────────────────────
export type V4CancellationStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'auto_no_show';

export interface V4CancellationResponse {
  appointment_id: string;
  status: V4CancellationStatus;
  /** TODO(Codex): valor de reembolso e taxa vêm da política versionada. */
  refund_preview_cents?: number;
}

// ─── 13. Refund ────────────────────────────────────────────────────────────
export type V4RefundStatus =
  | 'requested'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'failed';

export interface V4RefundResponse {
  refund_id: string;
  payment_id: string;
  status: V4RefundStatus;
  amount_cents: number;
}

// ─── Policies & Consents (versionadas) ─────────────────────────────────────
export type V4PolicyKind =
  | 'lgpd'
  | 'terms_of_care'
  | 'cancellation'
  | 'communication';

export interface V4Policy {
  kind: V4PolicyKind;
  version: string;
  effective_at: V4ISODate;
  html?: string;
  url?: string;
}

export interface V4PoliciesResponse {
  policies: readonly V4Policy[];
}

// ─── Payer / Consents ──────────────────────────────────────────────────────
export interface V4Payer {
  first_name: string;
  last_name?: string;
  email: string;
  phone_e164?: string;
  doc_type?: 'CPF' | 'PASSPORT';
  doc_number?: string;
}

export interface V4Consents {
  lgpd_version: string;
  terms_version: string;
  cancellation_version: string;
  communication_version: string;
  accepted_at: V4ISODate;
}

// ─── Props dos componentes visuais (esqueletos em _unmounted/) ─────────────
export interface V4StepIndicatorProps {
  current: 1 | 2 | 3 | 4 | 5;
  lang: V4Lang;
}

export interface V4ModalityGridProps {
  offerings: readonly V4Offering[];
  onSelect(id: V4Offering['id']): void;
  state: 'loading' | 'ready' | 'empty' | 'error';
  lang: V4Lang;
}

export interface V4SlotPickerProps {
  professionals: readonly V4Professional[];
  slots: readonly V4Slot[];
  hold?: V4SlotHold;
  state:
    | 'idle'
    | 'loading_availability'
    | 'no_availability'
    | 'slot_selected'
    | 'hold_pending'
    | 'hold_active'
    | 'hold_expired'
    | 'hold_conflict'
    | 'error';
  onPickProfessional(id: string): void;
  onPickSlot(slot: V4Slot): void;
  onReleaseHold(): void;
  lang: V4Lang;
}

export interface V4PayerFormProps {
  value: Partial<V4Payer>;
  onChange(next: Partial<V4Payer>): void;
  consents: Partial<V4Consents>;
  onConsentsChange(next: Partial<V4Consents>): void;
  policies?: readonly V4Policy[];
  state: 'draft' | 'validating' | 'invalid' | 'valid' | 'submit_blocked_by_consent';
  onSubmit(): void;
  lang: V4Lang;
}

export interface V4PaymentProps {
  pix?: V4PixPayload;
  status: V4PaymentStatus;
  onCancel(): void;
  onOpenOliver(): void;
  lang: V4Lang;
}

export interface V4ConfirmationProps {
  appointment: V4Appointment;
  warnings?: readonly string[];
  onNew(): void;
  lang: V4Lang;
}
