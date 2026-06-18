/**
 * Log centralizado de tentativas e bloqueios de notificação ao cliente.
 *
 * Cada chamada a um canal (e-mail, push, whatsapp, sms) — bem-sucedida ou
 * bloqueada — passa por `logNotificationAttempt`. Os motivos canônicos
 * estão em `BLOCK_REASONS`, alinhados com as guardas:
 *   - internal_template: tentativa de enviar template USO INTERNO ao cliente
 *   - timing_window:     ainda dentro da janela mínima do nicho (pós-visita)
 *   - opt_in_missing:    cliente não optou pelo canal
 *   - idempotent_dup:    já enviado para o mesmo idempotency_key
 *   - event_not_whitelisted, event_not_in_niche_segment, transport_failed
 *
 * Falhas no insert NUNCA propagam (best-effort) — log não pode quebrar fluxo.
 */

export const BLOCK_REASONS = [
  'internal_template',
  'timing_window',
  'opt_in_missing',
  'idempotent_dup',
  'event_not_whitelisted',
  'event_not_in_niche_segment',
  'transport_failed',
  'recipient_missing',
  'suppressed',
  'bill_not_closed_yet',
  'session_not_found',
  'item_not_found',
  'no_customer_email',
  'unknown',
] as const
export type BlockReason = (typeof BLOCK_REASONS)[number]

export type AttemptChannel = 'email' | 'push' | 'whatsapp' | 'sms' | 'internal' | 'webhook'
export type AttemptStatus = 'sent' | 'queued' | 'blocked' | 'skipped' | 'error'

export interface AttemptInput {
  request_id?: string | null
  company_id?: string | null
  channel: AttemptChannel
  event: string
  niche?: string | null
  recipient?: string | null
  status: AttemptStatus
  reason?: BlockReason | string | null
  idempotency_key?: string | null
  metadata?: Record<string, unknown>
}

let _testSink: AttemptInput[] | null = null
/** Apenas para testes. Quando setado, o log vai para o array em memória. */
export function __setAttemptLogSink(sink: AttemptInput[] | null) {
  _testSink = sink
}

export async function logNotificationAttempt(input: AttemptInput): Promise<void> {
  if (_testSink) {
    _testSink.push(input)
    return
  }
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('notification_attempt_log' as any).insert({
      request_id: input.request_id ?? null,
      company_id: input.company_id ?? null,
      channel: input.channel,
      event: input.event,
      niche: input.niche ?? null,
      recipient: input.recipient ?? null,
      status: input.status,
      reason: input.reason ?? null,
      idempotency_key: input.idempotency_key ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (err) {
    // best-effort — nunca propaga
    console.warn('logNotificationAttempt failed', { err, event: input.event })
  }
}

/** Helper: gera um request_id curto para correlacionar a mesma jornada. */
export function newRequestId(): string {
  return 'req_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
