// Webhook público que recebe callbacks da Z-API e registra
// status de envio / entrega / leitura / falha em whatsapp_message_events.
// Configurar na Z-API → Webhooks:
//   • Ao enviar mensagem        → POST https://impulsionando.com.br/api/public/hooks/zapi-status
//   • Ao receber status         → POST https://impulsionando.com.br/api/public/hooks/zapi-status
//   • Ao desconectar            → POST https://impulsionando.com.br/api/public/hooks/zapi-status
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const PayloadSchema = z
  .object({
    instanceId: z.string().optional(),
    messageId: z.string().optional(),
    ids: z.array(z.string()).optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    momment: z.union([z.number(), z.string()]).optional(),
    error: z.union([z.string(), z.object({}).passthrough()]).optional(),
    code: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
    connected: z.boolean().optional(),
  })
  .passthrough()

type Payload = z.infer<typeof PayloadSchema>

function normalizeStatus(p: Payload): string {
  const raw = (p.status ?? p.type ?? '').toString().toUpperCase()
  if (raw) return raw
  if (typeof p.connected === 'boolean') return p.connected ? 'CONNECTED' : 'DISCONNECTED'
  return 'UNKNOWN'
}

function toTimestamp(v: Payload['momment']): string | null {
  if (v == null) return null
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n) || n <= 0) return null
  // Z-API envia epoch ms; alguns eventos enviam segundos.
  const ms = n > 1e12 ? n : n * 1000
  return new Date(ms).toISOString()
}

function extractIds(p: Payload): string[] {
  const list = new Set<string>()
  if (p.messageId) list.add(p.messageId)
  if (Array.isArray(p.ids)) p.ids.forEach((id) => id && list.add(id))
  return [...list]
}

const TERMINAL_FAIL = new Set(['FAILED', 'FAILED_DELIVERY', 'ERROR', 'EXPIRED', 'BLOCKED'])
const MAP_OUTBOX_STATUS: Record<string, string> = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  RECEIVED: 'delivered',
  READ: 'read',
  PLAYED: 'read',
  FAILED: 'failed',
  FAILED_DELIVERY: 'failed',
  ERROR: 'failed',
  EXPIRED: 'failed',
  BLOCKED: 'failed',
}

export const Route = createFileRoute('/api/public/hooks/zapi-status')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return new Response('invalid json', { status: 400 })
        }

        const parsed = PayloadSchema.safeParse(raw)
        if (!parsed.success) {
          return new Response(JSON.stringify({ ok: false, error: 'schema' }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const p = parsed.data

        // Valida instância: só aceita callbacks da nossa Z-API.
        const expectedInstance = process.env.ZAPI_INSTANCE_ID
        if (expectedInstance && p.instanceId && p.instanceId !== expectedInstance) {
          return new Response('forbidden instance', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        const status = normalizeStatus(p)
        const momment = toTimestamp(p.momment)
        const ids = extractIds(p)
        const phone = p.phone ?? null
        const errorMessage =
          typeof p.error === 'string'
            ? p.error
            : p.error
              ? JSON.stringify(p.error)
              : (p.message ?? null)
        const errorCode = p.code != null ? String(p.code) : null

        // Eventos sem messageId (ex.: connected/disconnected) também são úteis para auditoria.
        const records =
          ids.length > 0
            ? ids.map((external_id) => ({
                external_id,
                phone,
                status,
                error_code: errorCode,
                error_message: errorMessage,
                instance_id: p.instanceId ?? expectedInstance ?? null,
                momment,
                raw: p as Record<string, unknown>,
              }))
            : [
                {
                  external_id: `instance:${p.instanceId ?? expectedInstance ?? 'unknown'}:${Date.now()}`,
                  phone,
                  status,
                  error_code: errorCode,
                  error_message: errorMessage,
                  instance_id: p.instanceId ?? expectedInstance ?? null,
                  momment,
                  raw: p as Record<string, unknown>,
                },
              ]

        // Tenta correlacionar com message_outbox via external_message_id (preenchido no envio).
        if (ids.length > 0) {
          const { data: outboxRows } = await supabaseAdmin
            .from('message_outbox')
            .select('id, external_message_id, status')
            .in('external_message_id', ids)

          const byExt = new Map<string, { id: string; status: string | null }>()
          for (const row of outboxRows ?? []) {
            if (row.external_message_id) {
              byExt.set(row.external_message_id, { id: row.id, status: row.status })
            }
          }

          for (const rec of records) {
            const match = byExt.get(rec.external_id)
            if (match) (rec as Record<string, unknown>).outbox_id = match.id
          }

          // Atualiza o status no outbox (sem regressão: read > delivered > sent).
          const rank: Record<string, number> = {
            queued: 0,
            sent: 1,
            delivered: 2,
            read: 3,
            failed: 4,
          }
          const newOutboxStatus = MAP_OUTBOX_STATUS[status]
          if (newOutboxStatus) {
            for (const [extId, info] of byExt) {
              const currentRank = rank[info.status ?? 'queued'] ?? 0
              const nextRank = rank[newOutboxStatus] ?? 0
              if (
                newOutboxStatus === 'failed' ||
                nextRank > currentRank
              ) {
                await supabaseAdmin
                  .from('message_outbox')
                  .update({
                    status: newOutboxStatus,
                    last_error: TERMINAL_FAIL.has(status) ? errorMessage : null,
                  })
                  .eq('id', info.id)
              }
              void extId
            }
          }
        }

        const { error } = await supabaseAdmin
          .from('whatsapp_message_events')
          .insert(records as never)
        if (error) {

          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ ok: true, recorded: records.length }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      // Z-API faz um GET de teste ao salvar o webhook.
      GET: async () =>
        new Response(JSON.stringify({ ok: true, hook: 'zapi-status' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    },
  },
})
