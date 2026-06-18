/**
 * /restaurante/salao/logs — Tentativas e bloqueios de e-mail/push.
 *
 * Lista atemporal de cada disparo de comunicação ao cliente (sucesso ou
 * bloqueio) com motivo canônico, correlacionados por `request_id`.
 *
 * Inclui:
 *  - Filtros por nicho, canal, status, motivo, intervalo de datas e request_id.
 *  - Export CSV de notificações internas + pós-visita (filtra por nicho/data).
 *  - Modo simulação: escolhe o nicho (18h/24h/36h/48h), informa o instante
 *    de fechamento de uma conta e mostra quando a pós-visita seria liberada.
 *  - Atualização em tempo "quase real" via polling (10s).
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Filter, RefreshCw, FlaskConical } from 'lucide-react'
import {
  listAttemptLogs,
  exportNotificationsCsv,
  simulatePostvisitWindow,
} from '@/lib/salao-attempt-logs.functions'

export const Route = createFileRoute('/_authenticated/restaurante/salao/logs')({
  component: SalaoLogsPage,
})

const NICHES = ['cafe-confeitaria', 'bares-restaurantes', 'cervejaria', 'eventos-casas-show'] as const
const CHANNELS = ['email', 'push', 'whatsapp', 'sms', 'internal', 'webhook'] as const
const STATUSES = ['sent', 'queued', 'blocked', 'skipped', 'error'] as const
const REASONS = [
  'internal_template',
  'timing_window',
  'opt_in_missing',
  'idempotent_dup',
  'event_not_whitelisted',
  'event_not_in_niche_segment',
  'transport_failed',
  'recipient_missing',
  'suppressed',
  'bill_not_closed_yet',
  'session_not_found',
] as const

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'sent' || s === 'queued') return 'default'
  if (s === 'blocked' || s === 'error') return 'destructive'
  return 'secondary'
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function SalaoLogsPage() {
  const [filters, setFilters] = useState<{
    niche?: string
    channel?: string
    status?: string
    reason?: string
    request_id?: string
    from?: string
    to?: string
  }>({})

  const fetcher = useServerFn(listAttemptLogs)
  const exportFn = useServerFn(exportNotificationsCsv)
  const simFn = useServerFn(simulatePostvisitWindow)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['salao-attempt-logs', filters],
    queryFn: () => fetcher({ data: { ...filters, limit: 200 } as any }),
    refetchInterval: 10_000,
  })

  // Agrupamos por request_id para destacar a correlação visualmente
  const grouped = useMemo(() => {
    const rows = data?.rows ?? []
    const map = new Map<string, any[]>()
    for (const r of rows) {
      const k = r.request_id ?? `__${r.id}`
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    }
    return Array.from(map.entries())
  }, [data])

  const onExport = async () => {
    const res = await exportFn({ data: { niche: filters.niche, from: filters.from, to: filters.to } as any })
    const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Logs de notificações do salão</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Tentativas e bloqueios de e-mail/push (motivo canônico + correlação por
            request_id). Atualiza a cada 10s.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </header>

      <Simulator simFn={simFn} />

      <Card className="p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" /> Filtros
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            value={filters.niche ?? '__all'}
            onValueChange={(v) => setFilters({ ...filters, niche: v === '__all' ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Nicho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os nichos</SelectItem>
              {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.channel ?? '__all'}
            onValueChange={(v) => setFilters({ ...filters, channel: v === '__all' ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos canais</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? '__all'}
            onValueChange={(v) => setFilters({ ...filters, status: v === '__all' ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.reason ?? '__all'}
            onValueChange={(v) => setFilters({ ...filters, reason: v === '__all' ? undefined : v })}
          >
            <SelectTrigger><SelectValue placeholder="Motivo do bloqueio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos motivos</SelectItem>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="request_id"
            value={filters.request_id ?? ''}
            onChange={(e) => setFilters({ ...filters, request_id: e.target.value || undefined })}
            className="font-mono"
          />
          <Input
            type="datetime-local"
            value={filters.from ?? ''}
            onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
          />
          <Input
            type="datetime-local"
            value={filters.to ?? ''}
            onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
          />
          <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Limpar</Button>
        </div>
      </Card>

      <section>
        {isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : grouped.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum log para esses filtros.</Card>
        ) : (
          <div className="space-y-3">
            {grouped.map(([reqId, rows]) => (
              <Card key={reqId} className="p-3">
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  request_id: {reqId.startsWith('__') ? <em>(sem correlação)</em> : reqId} ·{' '}
                  {rows.length} evento{rows.length > 1 ? 's' : ''}
                </div>
                <div className="space-y-1">
                  {rows.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm border-t border-border/40 py-2 first:border-0 first:pt-0">
                      <Badge variant={statusVariant(r.status)} className="shrink-0 capitalize">
                        {r.status}
                      </Badge>
                      <span className="font-mono text-xs shrink-0">{r.channel}</span>
                      <span className="font-medium truncate">{r.event}</span>
                      {r.reason ? (
                        <span className="text-xs text-destructive">· {r.reason}</span>
                      ) : null}
                      {r.niche ? (
                        <Badge variant="outline" className="shrink-0">{r.niche}</Badge>
                      ) : null}
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {r.recipient ? <span className="mr-2">{r.recipient}</span> : null}
                        {fmt(r.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Simulator({ simFn }: { simFn: (a: any) => Promise<any> }) {
  const [niche, setNiche] = useState<string>('bares-restaurantes')
  const [closedAt, setClosedAt] = useState<string>(() =>
    new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16),
  )
  const [res, setRes] = useState<any>(null)

  const run = async () => {
    const r = await simFn({ data: { bill_closed_at: new Date(closedAt).toISOString(), niche } })
    setRes(r)
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4" /> Simulador de janela pós-visita
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Escolha o nicho (18h café · 24h restaurantes · 36h cervejaria · 48h eventos) e o
        horário do fechamento; o sistema mostra quando a pós-visita seria liberada.
        Não envia nada — só calcula a janela usando o registry versionado.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} />
        <Button onClick={run}>Simular</Button>
      </div>
      {res ? (
        <div className="mt-3 text-sm grid gap-1">
          <div>Delay configurado: <strong>{res.delayHours}h</strong></div>
          <div>Liberação prevista: <strong>{fmt(res.earliestAt)}</strong></div>
          <div>
            Status:{' '}
            <Badge variant={res.releasedNow ? 'default' : 'secondary'}>
              {res.releasedNow ? 'liberada agora' : 'ainda dentro da janela'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">registry v{res.registryVersion}</div>
        </div>
      ) : null}
    </Card>
  )
}
