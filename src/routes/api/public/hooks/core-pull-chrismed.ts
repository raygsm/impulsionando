/**
 * Core ↔ CHRISMED pull connector.
 *
 * Puxa os eventos espelhados no endpoint /api/public/core-sync do projeto
 * CHRISMED (https://chrismed.lovable.app) e grava como linhas em
 * `runtime_events` (scope='core_pull.chrismed') vinculadas ao company_id
 * do tenant CHRISMED dentro do Core Impulsionando.
 *
 * Segurança:
 * Segurança:
 *   - O Core assina a query string com HMAC-SHA256 usando
 *     IMPULSIONANDO_CORE_SECRET (mesmo segredo cadastrado no CHRISMED).
 *   - Endpoint é idempotente (cursor incremental); seguro para ser chamado
 *     por pg_cron com o apikey padrão do Supabase.
 *
 * Estado:
 *   - O último timestamp processado fica em runtime_events
 *     (scope='core_pull.chrismed.cursor') — pega o último occurred_at.
 *
 * Uso (pg_cron a cada 5 min):
 *   GET https://impulsionando.lovable.app/api/public/hooks/core-pull-chrismed
 */
import { createFileRoute } from '@tanstack/react-router'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2'
const CHRISMED_BASE_URL = 'https://chrismed.lovable.app'
const SOURCE_SCOPE = 'core_pull.chrismed'
const CURSOR_SCOPE = 'core_pull.chrismed.cursor'

type RemoteEvent = {
  id: string
  event_type: string
  reference_id: string | null
  status: string | null
  resumo: string | null
  payload: unknown
  created_at: string
  tenant_id: string | null
}

async function getCursor(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('runtime_events')
    .select('occurred_at, context')
    .eq('scope', CURSOR_SCOPE)
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const since = (data?.context as any)?.next_since as string | undefined
  return since ?? new Date(Date.now() - 24 * 3600_000).toISOString()
}

async function setCursor(nextSince: string, count: number) {
  await supabaseAdmin.from('runtime_events').insert({
    level: 'info',
    scope: CURSOR_SCOPE,
    message: `cursor advanced to ${nextSince} (${count} eventos)`,
    company_id: CHRISMED_COMPANY_ID,
    context: { next_since: nextSince, batch_size: count },
  })
}

export const Route = createFileRoute('/api/public/hooks/core-pull-chrismed')({
  server: {
    handlers: {
      GET: async () => {

        const coreSecret = process.env.IMPULSIONANDO_CORE_SECRET
        if (!coreSecret) {
          return Response.json(
            {
              ok: false,
              error: 'missing_secret',
              hint: 'Adicione o secret IMPULSIONANDO_CORE_SECRET no Core (mesmo valor cadastrado no projeto CHRISMED).',
            },
            { status: 503 },
          )
        }

        const since = await getCursor()
        const url = new URL(`${CHRISMED_BASE_URL}/api/public/core-sync`)
        url.searchParams.set('since', since)
        url.searchParams.set('limit', '500')
        const sig = createHmac('sha256', coreSecret)
          .update(url.pathname + url.search)
          .digest('hex')

        const resp = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'x-core-signature': sig, 'user-agent': 'Impulsionando-Core/1.0' },
        })
        if (!resp.ok) {
          const body = await resp.text().catch(() => '')
          const lower = body.toLowerCase()
          let reason: 'config_missing' | 'hmac_invalid' | 'http_error' = 'http_error'
          let message = `falha ao puxar CHRISMED: HTTP ${resp.status}`
          let hint: string | undefined

          if (resp.status === 503 && lower.includes('core sync') && lower.includes('configurado')) {
            reason = 'config_missing'
            message = 'CHRISMED respondeu "Core sync não configurado": o secret IMPULSIONANDO_CORE_SECRET não está presente no projeto CHRISMED.'
            hint = 'Adicione o secret IMPULSIONANDO_CORE_SECRET no projeto CHRISMED com EXATAMENTE o mesmo valor cadastrado no Core e publique o CHRISMED.'
          } else if (resp.status === 401 || lower.includes('signature') || lower.includes('hmac') || lower.includes('unauthorized')) {
            reason = 'hmac_invalid'
            message = 'CHRISMED rejeitou a assinatura HMAC (401): o valor do secret IMPULSIONANDO_CORE_SECRET no CHRISMED é diferente do cadastrado no Core.'
            hint = 'Confirme que o secret IMPULSIONANDO_CORE_SECRET tem EXATAMENTE o mesmo valor nos dois projetos (Core e CHRISMED).'
          }

          await supabaseAdmin.from('runtime_events').insert({
            level: 'error',
            scope: SOURCE_SCOPE,
            message,
            company_id: CHRISMED_COMPANY_ID,
            context: { reason, status: resp.status, hint, body: body.slice(0, 500), url: url.pathname },
          })
          return Response.json({ ok: false, reason, status: resp.status, hint, body: body.slice(0, 500) }, { status: 502 })
        }

        const payload = (await resp.json()) as { eventos?: RemoteEvent[]; next_since?: string; count?: number }
        const eventos = payload.eventos ?? []

        if (eventos.length === 0) {
          return Response.json({ ok: true, count: 0, since, nextSince: payload.next_since ?? since })
        }

        const rows = eventos.map((e) => ({
          level: e.status === 'error' ? 'error' : 'info',
          scope: SOURCE_SCOPE,
          message: e.resumo ?? e.event_type,
          company_id: CHRISMED_COMPANY_ID,
          context: JSON.parse(
            JSON.stringify({
              remote_id: e.id,
              event_type: e.event_type,
              reference_id: e.reference_id,
              status: e.status,
              tenant_id: e.tenant_id,
              payload: e.payload ?? null,
            }),
          ),
          occurred_at: e.created_at,
        }))

        const { error: insErr } = await supabaseAdmin.from('runtime_events').insert(rows)
        if (insErr) {
          return Response.json({ ok: false, error: insErr.message }, { status: 500 })
        }

        const nextSince = payload.next_since ?? eventos[eventos.length - 1].created_at
        await setCursor(nextSince, eventos.length)

        return Response.json({ ok: true, count: eventos.length, since, nextSince })
      },
    },
  },
})
