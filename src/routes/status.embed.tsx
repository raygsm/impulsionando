import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const getEmbedStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  )
  const [sloRes, incRes] = await Promise.all([
    supabase.from('v_core_slo_status' as any).select('service,uptime_30d,p95_ms').limit(50),
    supabase
      .from('core_incidents')
      .select('id,title,severity,status,started_at,resolved_at')
      .is('resolved_at', null)
      .order('started_at', { ascending: false })
      .limit(3),
  ])
  const services = ((sloRes.data ?? []) as unknown) as Array<{ service: string; uptime_30d: number | null; p95_ms: number | null }>
  const open = ((incRes.data ?? []) as unknown) as Array<{ id: string; title: string; severity: string | null; status: string | null; started_at: string; resolved_at: string | null }>

  const hasOutage = open.some((i) => (i.severity ?? '').toLowerCase() === 'critical' || (i.severity ?? '').toLowerCase() === 'sev1')
  const overall = open.length === 0 ? 'operational' : hasOutage ? 'outage' : 'degraded'
  const avgUptime = services.length
    ? services.reduce((s, x) => s + (x.uptime_30d ?? 0), 0) / services.length
    : null
  return { overall, avgUptime, openCount: open.length, latest: open[0] ?? null, generated_at: new Date().toISOString() }
})

const embedQuery = queryOptions({
  queryKey: ['status-embed'],
  queryFn: () => getEmbedStatus(),
  staleTime: 60_000,
})

export const Route = createFileRoute('/status/embed')({
  loader: ({ context }) => context.queryClient.ensureQueryData(embedQuery),
  head: () => ({
    meta: [
      { title: 'Status — Impulsionando' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: StatusEmbed,
})

function StatusEmbed() {
  const { data } = useSuspenseQuery(embedQuery)
  const color = data.overall === 'operational' ? '#16a34a' : data.overall === 'degraded' ? '#eab308' : '#dc2626'
  const label =
    data.overall === 'operational' ? 'Todos os sistemas operacionais' : data.overall === 'degraded' ? 'Desempenho degradado' : 'Interrupção em andamento'

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#fff',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 4px ${color}22`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.latest ? `Incidente: ${data.latest.title}` : data.avgUptime != null ? `Uptime 30d ${(data.avgUptime).toFixed(2)}%` : 'Operando normalmente'}
        </div>
      </div>
      <a
        href="/status"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none', flexShrink: 0 }}
      >
        Status →
      </a>
    </div>
  )
}
