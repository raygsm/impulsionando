/**
 * Ingest público de eventos de funil (`painel_funnel_events`).
 *
 * Chamado do browser (fire-and-forget via `sendBeacon`/`fetch`) para consolidar
 * a jornada CTA → checkout → lead entre navegadores. RLS permite INSERT anon;
 * SELECT segue admin-only (ver migration). Sem PII sensível — só eventos de
 * marketing + UTMs. Rate-limit soft por IP hash.
 */
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

type IncomingEvent = {
  event_name?: string
  session_id?: string
  visitor_id?: string
  host?: string
  path?: string
  href?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  params?: Record<string, unknown>
  ua?: string
  ts?: number
}

const ALLOWED_EVENTS = new Set([
  'cta_click',
  'checkout_click',
  'whatsapp_click',
  'ebook_download',
  'lead_submit',
  'painel_ping',
])

const MAX_BATCH = 20
const MAX_FIELD_LEN = 500

function clip(v: unknown, max = MAX_FIELD_LEN): string | null {
  if (v == null) return null
  const s = typeof v === 'string' ? v : String(v)
  return s.length > max ? s.slice(0, max) : s
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.PAINEL_IP_SALT || 'imp-painel-salt-v1'
  return createHash('sha256').update(salt + ':' + ip).digest('hex').slice(0, 24)
}

function parseUtmFromHref(href: string | null | undefined) {
  if (!href) return {}
  try {
    const u = new URL(href, 'https://impulsionando.com.br')
    return {
      utm_source: u.searchParams.get('utm_source') ?? undefined,
      utm_medium: u.searchParams.get('utm_medium') ?? undefined,
      utm_campaign: u.searchParams.get('utm_campaign') ?? undefined,
      utm_content: u.searchParams.get('utm_content') ?? undefined,
      utm_term: u.searchParams.get('utm_term') ?? undefined,
    }
  } catch {
    return {}
  }
}

export const Route = createFileRoute('/api/public/painel/funnel-hit')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST, OPTIONS',
            'access-control-allow-headers': 'content-type',
            'access-control-max-age': '86400',
          },
        }),
      POST: async ({ request }) => {
        const cors = {
          'access-control-allow-origin': '*',
          'content-type': 'application/json',
        } as Record<string, string>
        let body: { events?: IncomingEvent[] } | IncomingEvent
        try {
          body = await request.json()
        } catch {
          return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: cors })
        }
        const items: IncomingEvent[] = Array.isArray((body as { events?: IncomingEvent[] }).events)
          ? (body as { events: IncomingEvent[] }).events
          : [body as IncomingEvent]
        if (items.length === 0 || items.length > MAX_BATCH) {
          return new Response(JSON.stringify({ error: 'batch out of range' }), { status: 400, headers: cors })
        }

        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
        const key =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_ANON_KEY ||
          ''
        if (!url || !key) {
          return new Response(JSON.stringify({ error: 'supabase env missing' }), { status: 500, headers: cors })
        }

        const ipHeader =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          null
        const ip_hash = hashIp(ipHeader)
        const ua = clip(request.headers.get('user-agent'))

        const rows = items
          .filter((e) => e.event_name && ALLOWED_EVENTS.has(e.event_name) && e.session_id && e.host)
          .map((e) => {
            const utmFromHref = parseUtmFromHref(e.href)
            return {
              session_id: clip(e.session_id) ?? 'unknown',
              visitor_id: clip(e.visitor_id),
              event_name: clip(e.event_name) ?? 'unknown',
              host: clip(e.host) ?? '',
              path: clip(e.path),
              href: clip(e.href, 1000),
              utm_source: clip(e.utm_source) ?? utmFromHref.utm_source ?? null,
              utm_medium: clip(e.utm_medium) ?? utmFromHref.utm_medium ?? null,
              utm_campaign: clip(e.utm_campaign) ?? utmFromHref.utm_campaign ?? null,
              utm_content: clip(e.utm_content) ?? utmFromHref.utm_content ?? null,
              utm_term: clip(e.utm_term) ?? utmFromHref.utm_term ?? null,
              params: e.params && typeof e.params === 'object' ? e.params : {},
              ua,
              ip_hash,
              created_at: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString(),
            }
          })

        if (rows.length === 0) {
          return new Response(JSON.stringify({ inserted: 0, skipped: items.length }), { status: 202, headers: cors })
        }

        const supabase = createClient(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        })
        const { error } = await supabase.from('painel_funnel_events').insert(rows)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors })
        }
        return new Response(JSON.stringify({ inserted: rows.length, skipped: items.length - rows.length }), {
          status: 202,
          headers: cors,
        })
      },
    },
  },
})
