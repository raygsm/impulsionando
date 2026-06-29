import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

type Overall = 'operational' | 'degraded' | 'outage'

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

function badge(label: string, message: string, color: string) {
  // Approx widths (Verdana 11px ~6px/char). Good enough for shields-style.
  const charW = 6.5
  const padX = 6
  const labelW = Math.max(40, Math.round(label.length * charW + padX * 2))
  const msgW = Math.max(60, Math.round(message.length * charW + padX * 2))
  const total = labelW + msgW
  const labelX = labelW / 2
  const msgX = labelW + msgW / 2
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}">
  <title>${escapeXml(label)}: ${escapeXml(message)}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${msgW}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelX}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(label)}</text>
    <text x="${labelX}" y="14">${escapeXml(label)}</text>
    <text x="${msgX}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(message)}</text>
    <text x="${msgX}" y="14">${escapeXml(message)}</text>
  </g>
</svg>`
}

export const Route = createFileRoute('/api/public/status-badge.svg')({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        )
        const { data: incidents } = await supabase
          .from('core_incidents')
          .select('severity')
          .is('resolved_at', null)
        const open = (incidents ?? []) as Array<{ severity: string | null }>
        const hasOutage = open.some((i) => {
          const s = (i.severity ?? '').toLowerCase()
          return s === 'critical' || s === 'sev1'
        })
        const overall: Overall = open.length === 0 ? 'operational' : hasOutage ? 'outage' : 'degraded'
        const map: Record<Overall, { msg: string; color: string }> = {
          operational: { msg: 'operacional', color: '#16a34a' },
          degraded: { msg: 'degradado', color: '#eab308' },
          outage: { msg: 'interrupção', color: '#dc2626' },
        }
        const { msg, color } = map[overall]
        const svg = badge('status', msg, color)
        return new Response(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60',
            'Access-Control-Allow-Origin': '*',
          },
        })
      },
    },
  },
})
