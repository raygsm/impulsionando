import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { getUptimeOverview } from '@/lib/uptime.functions'
import { PageHeader, StatCard } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/admin/uptime')({
  head: () => ({ meta: [{ title: 'Uptime — Impulsionando Tecnologia' }] }),
  component: AdminUptimePage,
})

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

function AdminUptimePage() {
  const fn = useServerFn(getUptimeOverview)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-uptime'],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>

  const state = data?.state ?? []
  const recent = data?.recent ?? []
  const uptime24h = data?.uptime24h ?? {}

  const allUp = state.every((s) => s.is_up)
  const downCount = state.filter((s) => !s.is_up).length

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={Activity}
        title="Monitoramento de Uptime"
        description="Verificação automática a cada 5 minutos. Alertas por e-mail quando o site cai e quando volta."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={allUp ? CheckCircle2 : AlertTriangle}
          label="Status geral"
          value={allUp ? 'Todos no ar' : `${downCount} fora do ar`}
        />
        <StatCard icon={Activity} label="URLs monitoradas" value={state.length} />
        <StatCard
          icon={Activity}
          label="Verificações (últimas 100)"
          value={recent.length}
        />
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">URLs monitoradas</h2>
        <div className="space-y-3">
          {state.map((s) => {
            const u = uptime24h[s.url]
            return (
              <div key={s.url} className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Desde {fmt(s.since)} · Última verificação {fmt(s.last_check_at)}
                  </div>
                  {s.last_error && !s.is_up ? (
                    <div className="text-xs text-destructive mt-1">Erro: {s.last_error}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Uptime 24h</div>
                    <div className="text-sm font-medium">{u ? `${u.pct}%` : '—'}</div>
                  </div>
                  <Badge variant={s.is_up ? 'default' : 'destructive'}>
                    {s.is_up ? 'No ar' : 'Fora do ar'}
                  </Badge>
                </div>
              </div>
            )
          })}
          {state.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma URL cadastrada.</div>
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          Alertas vão para: {state[0]?.alert_emails?.join(', ') ?? '—'}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas 100 verificações</h2>
          <button
            onClick={() => refetch()}
            className="text-xs text-primary hover:underline"
          >
            Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2">Quando</th>
                <th>URL</th>
                <th>Status</th>
                <th>HTTP</th>
                <th>Latência</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 whitespace-nowrap">{fmt(r.checked_at)}</td>
                  <td className="truncate max-w-[220px]">{r.url}</td>
                  <td>
                    <Badge variant={r.is_up ? 'default' : 'destructive'}>
                      {r.is_up ? 'OK' : 'Falha'}
                    </Badge>
                  </td>
                  <td>{r.http_status ?? '—'}</td>
                  <td>{r.response_ms ? `${r.response_ms} ms` : '—'}</td>
                  <td className="text-xs text-muted-foreground truncate max-w-[260px]">
                    {r.error_message ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
