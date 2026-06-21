import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { listRuntimeEvents, getObservabilityOverview, type RuntimeLevel } from '@/lib/runtime-observability.functions'
import { PageHeader, StatCard, EmptyState } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, AlertOctagon, Info } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/core/observabilidade')({
  head: () => ({ meta: [{ title: 'Observabilidade — Impulsionando' }] }),
  component: Page,
})

const LEVEL_COLOR: Record<string, string> = {
  debug: 'bg-muted text-muted-foreground',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  error: 'bg-destructive/15 text-destructive',
  fatal: 'bg-destructive text-destructive-foreground',
}

function Page() {
  const [days, setDays] = useState(1)
  const [level, setLevel] = useState<RuntimeLevel | 'all'>('all')
  const [search, setSearch] = useState('')
  const ovFn = useServerFn(getObservabilityOverview)
  const listFn = useServerFn(listRuntimeEvents)

  const overview = useQuery({
    queryKey: ['obs-overview', days],
    queryFn: () => ovFn({ data: { days } }),
    staleTime: 30_000,
  })
  const events = useQuery({
    queryKey: ['obs-events', days, level, search],
    queryFn: () => listFn({ data: { days, level: level === 'all' ? undefined : level, search: search || undefined, limit: 200 } }),
    staleTime: 30_000,
  })

  const forbidden =
    (overview.error as Error | undefined)?.message?.includes('Forbidden') ||
    (events.error as Error | undefined)?.message?.includes('Forbidden')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observabilidade de Runtime"
        description="Telemetria estruturada das server functions e fluxos críticos do core."
        action={
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              <TabsTrigger value="1">24h</TabsTrigger>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {forbidden ? (
        <Card className="p-6 text-sm text-destructive">Acesso restrito a admins do core.</Card>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Eventos" value={String(overview.data?.total ?? '…')} icon={Activity} />
            <StatCard label="Erros + Fatais" value={String(overview.data?.errors ?? '…')} icon={AlertOctagon} />
            <StatCard label="Warnings" value={String(overview.data?.warns ?? '…')} icon={AlertTriangle} />
            <StatCard label="Infos" value={String(overview.data?.infos ?? '…')} icon={Info} />
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">Top scopes com erro</h3>
              {overview.data?.topScopes.length ? (
                <ul className="space-y-1.5 text-sm">
                  {overview.data.topScopes.map((s) => (
                    <li key={s.scope} className="flex items-center justify-between">
                      <code className="text-xs">{s.scope}</code>
                      <Badge variant="destructive">{s.count}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sem erros no período. 🎉</p>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">Tenants com mais erros</h3>
              {overview.data?.topCompanies.length ? (
                <ul className="space-y-1.5 text-sm">
                  {overview.data.topCompanies.map((c) => (
                    <li key={c.companyId} className="flex items-center justify-between">
                      <code className="text-xs">{c.companyId.slice(0, 8)}…</code>
                      <Badge variant="destructive">{c.count}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum tenant com erro associado.</p>
              )}
            </Card>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Nível" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="debug">debug</SelectItem>
                  <SelectItem value="info">info</SelectItem>
                  <SelectItem value="warn">warn</SelectItem>
                  <SelectItem value="error">error</SelectItem>
                  <SelectItem value="fatal">fatal</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar na mensagem…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card className="overflow-hidden">
              {events.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Carregando eventos…</div>
              ) : !events.data?.events.length ? (
                <EmptyState title="Sem eventos no filtro" description="Ajuste período, nível ou busca." />
              ) : (
                <div className="divide-y">
                  {events.data.events.map((ev: any) => (
                    <div key={ev.id} className="p-4 text-sm flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLOR[ev.level] ?? ''}`}>
                          {ev.level}
                        </span>
                        <code className="text-xs text-muted-foreground">{ev.scope}</code>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(ev.occurred_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="font-medium">{ev.message}</div>
                      {(ev.company_id || ev.route) && (
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                          {ev.company_id && <span>tenant: <code>{ev.company_id.slice(0, 8)}…</code></span>}
                          {ev.route && <span>rota: <code>{ev.route}</code></span>}
                        </div>
                      )}
                      {ev.context && Object.keys(ev.context).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">contexto</summary>
                          <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto text-[11px]">
                            {JSON.stringify(ev.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
