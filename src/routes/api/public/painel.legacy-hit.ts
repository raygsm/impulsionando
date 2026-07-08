/**
 * Ingest público de acessos ao subdomínio legado (`painel_legacy_hits`).
 *
 * Chamado antes do redirect `colorssaude.impulsionando.com.br → colors.…`
 * para consolidar hits de qualquer navegador. RLS: INSERT anon; SELECT admin.
 */
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

type IncomingHit = {
  from_host?: string
  to_host?: string
  path?: string
  search?: string
  hash?: string
  ua?: string
  referer?: string
  ts?: number
}

const MAX = 500
function clip(v: unknown, max = MAX): string | null {
  if (v == null) return null
  const s = typeof v === 'string' ? v : String(v)
  return s.length > max ? s.slice(0, max) : s
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.PAINEL_IP_SALT || 'imp-painel-salt-v1'
  return createHash('sha256').update(salt + ':' + ip).digest('hex').slice(0, 24)
}

export const Route = createFileRoute('/api/public/painel/legacy-hit')({
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
        let hit: IncomingHit
        try {
          hit = (await request.json()) as IncomingHit
        } catch {
          return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: cors })
        }
        if (!hit?.from_host || !hit?.to_host) {
          return new Response(JSON.stringify({ error: 'from_host/to_host required' }), { status: 400, headers: cors })
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

        const row = {
          from_host: clip(hit.from_host) ?? '',
          to_host: clip(hit.to_host) ?? '',
          path: clip(hit.path) ?? '/',
          search: clip(hit.search) ?? '',
          hash: clip(hit.hash) ?? '',
          ua: clip(hit.ua ?? request.headers.get('user-agent')),
          referer: clip(hit.referer ?? request.headers.get('referer')),
          ip_hash: hashIp(ipHeader),
          created_at: hit.ts ? new Date(hit.ts).toISOString() : new Date().toISOString(),
        }

        const supabase = createClient(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        })
        const { error } = await supabase.from('painel_legacy_hits').insert(row)
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors })
        }
        return new Response(JSON.stringify({ ok: true }), { status: 202, headers: cors })
      },
    },
  },
})
