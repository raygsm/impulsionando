/**
 * Core ↔ CHRISMED pull connector.
 *
 * Puxa os eventos espelhados no endpoint /api/public/core-sync do projeto
 * CHRISMED (https://chrismed.lovable.app) e grava como linhas em
 * `runtime_events` (scope='core_pull.chrismed') vinculadas ao company_id
 * do tenant CHRISMED dentro do Core Impulsionando.
 *
 * Segurança:
 *   - Header `x-cron-secret` deve bater com env CRON_PULL_SECRET.
 *   - O Core assina a query string com HMAC-SHA256 usando
 *     IMPULSIONANDO_CORE_SECRET (mesmo segredo cadastrado no CHRISMED).
 *
 * Estado:
 *   - O último timestamp processado fica em runtime_events
 *     (scope='core_pull.chrismed.cursor') — pega o último occurred_at.
 *
 * Uso (cron / pg_cron / agendador externo):
 *   GET https://impulsionando.lovable.app/api/public/hooks/core-pull-chrismed
 *     -H "x-cron-secret: $CRON_PULL_SECRET"
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
      GET: async ({ request }) => {
        const cronSecret = process.env.CRON_PULL_SECRET
        if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
          return new Response('unauthorized', { status: 401 })
        }
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
          await supabaseAdmin.from('runtime_events').insert({
            level: 'error',
            scope: SOURCE_SCOPE,
            message: `falha ao puxar CHRISMED: HTTP ${resp.status}`,
            company_id: CHRISMED_COMPANY_ID,
            context: { status: resp.status, body: body.slice(0, 500) },
          })
          return Response.json({ ok: false, status: resp.status, body: body.slice(0, 500) }, { status: 502 })
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
          context: {
            remote_id: e.id,
            event_type: e.event_type,
            reference_id: e.reference_id,
            status: e.status,
            tenant_id: e.tenant_id,
            payload: e.payload,
          },
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
