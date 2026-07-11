/**
 * CHRISMED V4 — contratos de props (schemas visuais).
 * NENHUM valor real, nenhuma chamada, nenhum mock.
 * Todo bloco `TODO(Codex)` aguarda contrato oficial do backend.
 */

// ─── Offering ──────────────────────────────────────────────────────────────
// TODO(Codex): confirmar fonte de verdade e política de override por
// profissional/plano/convênio.
export type V4Modality = 'presencial' | 'telemedicina' | 'domiciliar' | 'retorno' | 'ocupacional';

export interface V4Offering {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modality: V4Modality;
  price_cents: number;
  currency: 'BRL';
  duration_minutes: number;
  requires_prepayment: boolean;
}

// ─── Professional / Unit ───────────────────────────────────────────────────
// TODO(Codex): tabelas `professionals`, `units`, `rooms` e junção
// `service_offering_professional`. RLS anon-safe para leitura pública.
export interface V4Professional {
  id: string;
  display_name: string;
  crm?: string;
  specialties: string[];
  photo_url?: string;
}

export interface V4Unit {
  id: string;
  name: string;
  address_short?: string;
}

// ─── Availability & Slot Hold ──────────────────────────────────────────────
// TODO(Codex): endpoints `availability`, `hold-slot`, `release-slot`.
// `expires_at` SEMPRE vem do backend. Front nunca inventa contagem.
export interface V4Slot {
  starts_at: string; // ISO
  ends_at: string;   // ISO
  professional_id: string;
  unit_id?: string;
  room_id?: string;
}

export interface V4SlotHold {
  hold_id: string;
  slot: V4Slot;
  expires_at: string; // ISO — fonte única do countdown
}

// ─── Payer / Consents ──────────────────────────────────────────────────────
// TODO(Codex): política oficial de cancelamento/reembolso (parar de
// hardcodar "24h"). Termos e Política de Privacidade versionados.
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
  accepted_at: string; // ISO
}

// ─── Payment ───────────────────────────────────────────────────────────────
// TODO(Codex): contrato estável de `mpago-create-payment` (idempotência,
// expires_at, mapeamento canônico de status). Webhook documentado.
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
  expires_at: string; // ISO — do gateway
}

// ─── Appointment (persistido) ──────────────────────────────────────────────
// TODO(Codex): entidade `appointments` real, vinculada ao hold consumido e
// ao pagamento aprovado. Regras de remarcação/cancelamento/reembolso.
export interface V4Appointment {
  id: string;
  offering_id: string;
  professional_id: string;
  unit_id?: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed' | 'rescheduled';
  payment_id?: string;
}

// ─── Props dos componentes visuais (esqueletos em _unmounted/) ─────────────

export interface V4StepIndicatorProps {
  current: 1 | 2 | 3 | 4 | 5;
  lang: 'pt' | 'en' | 'es';
}

export interface V4ModalityGridProps {
  offerings: readonly V4Offering[]; // fornecido por loader real futuro
  onSelect(id: V4Offering['id']): void;
  state: 'loading' | 'ready' | 'empty' | 'error';
  lang: 'pt' | 'en' | 'es';
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
  lang: 'pt' | 'en' | 'es';
}

export interface V4PayerFormProps {
  value: Partial<V4Payer>;
  onChange(next: Partial<V4Payer>): void;
  consents: Partial<V4Consents>;
  onConsentsChange(next: Partial<V4Consents>): void;
  state: 'draft' | 'validating' | 'invalid' | 'valid' | 'submit_blocked_by_consent';
  onSubmit(): void;
  lang: 'pt' | 'en' | 'es';
}

export interface V4PaymentProps {
  pix?: V4PixPayload;
  status: V4PaymentStatus;
  onCancel(): void;
  onOpenOliver(): void;
  lang: 'pt' | 'en' | 'es';
}

export interface V4ConfirmationProps {
  appointment: V4Appointment;
  warnings?: readonly string[];
  onNew(): void;
  lang: 'pt' | 'en' | 'es';
}
