import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

function badge(label: string, message: string, color: string) {
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

function unknownBadge(label: string) {
  const svg = badge(label, 'desconhecido', '#6b7280')
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export const Route = createFileRoute('/api/public/status/$slug/badge.svg')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const slug = String(params.slug ?? '').toLowerCase()
          if (!slug) return unknownBadge('status')

          const stRes = await supabaseAdmin
            .from('uptime_state')
            .select('url,label,public_slug,show_on_public,paused')
            .eq('public_slug', slug)
            .maybeSingle()
          const target = stRes.data as any
          if (!target || target.show_on_public === false) return unknownBadge(slug)

          const url = target.url as string
          const since = new Date(Date.now() - 7 * 86400000).toISOString()
          const [sloRes, incRes] = await Promise.all([
            supabaseAdmin
              .from('v_core_slo_status' as any)
              .select('currently_up,availability_bps_30d')
              .eq('url', url)
              .maybeSingle(),
            supabaseAdmin
              .from('core_incidents')
              .select('severity,status,resolved_at')
              .eq('url', url)
              .gte('detected_at', since)
              .is('resolved_at', null),
          ])

          const up = (sloRes.data as any)?.currently_up
          const bps = (sloRes.data as any)?.availability_bps_30d as number | null
          const openIncidents = (incRes.data ?? []) as any[]
          const hasSev1 = openIncidents.some((i) => {
            const s = String(i.severity ?? '').toLowerCase()
            return s === 'sev1' || s === 'critical'
          })

          let msg: string
          let color: string
          if (up === false || hasSev1) {
            msg = 'indisponível'
            color = '#dc2626'
          } else if (openIncidents.length > 0) {
            msg = 'degradado'
            color = '#eab308'
          } else {
            const pct = bps == null ? null : (bps / 100).toFixed(2) + '%'
            msg = pct ? `operacional · ${pct}` : 'operacional'
            color = '#16a34a'
          }
          const label = String(target.label || slug).slice(0, 32)
          const svg = badge(label, msg, color)
          return new Response(svg, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml; charset=utf-8',
              'Cache-Control': 'public, max-age=60, s-maxage=60',
              'Access-Control-Allow-Origin': '*',
            },
          })
        } catch {
          return unknownBadge(String(params.slug ?? 'status'))
        }
      },
    },
  },
})
