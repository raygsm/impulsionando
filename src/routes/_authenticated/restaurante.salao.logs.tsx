/**
 * /restaurante/salao/logs — Tentativas e bloqueios de e-mail/push em tempo real.
 *
 *  - Atualizações em tempo real via Supabase Realtime (sem aguardar polling).
 *    Polling de 30s mantido como fallback caso a conexão caia.
 *  - Painel de detalhes lateral: clique em um request_id para ver a sequência
 *    completa (passos, canal, status, motivo e payload de cada tentativa).
 *  - Paginação, ordenação e busca textual rápida (event/recipient/reason/
 *    request_id/idempotency_key).
 *  - Exportação CSV (internos + pós-visita).
 *  - Modo simulação por nicho (18h/24h/36h/48h).
 *  - Política de retenção (dias) editável, alinhada com o job de limpeza.
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Download,
  Filter,
  RefreshCw,
  FlaskConical,
  Search,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Save,
  Clock,
  History,
  FileDown,
} from 'lucide-react'
import {
  listAttemptLogs,
  exportNotificationsCsv,
  simulatePostvisitWindow,
  getAttemptLogDetails,
  getRetentionSettings,
  setRetentionSettings,
  listRetentionAudit,
  exportAttemptLogsCsv,
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
    q?: string
    from?: string
    to?: string
  }>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'channel' | 'event' | 'niche'>(
    'created_at',
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [realtimeOn, setRealtimeOn] = useState(false)

  const queryClient = useQueryClient()
  const fetcher = useServerFn(listAttemptLogs)
  const exportFn = useServerFn(exportNotificationsCsv)
  const exportAttemptsFn = useServerFn(exportAttemptLogsCsv)
  const simFn = useServerFn(simulatePostvisitWindow)

  const queryKey = ['salao-attempt-logs', filters, page, pageSize, sortBy, sortDir] as const
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetcher({
        data: { ...filters, page, pageSize, sortBy, sortDir } as any,
      }),
    refetchInterval: 30_000, // fallback se realtime cair
  })

  // Realtime: invalida a query sempre que houver INSERT no log
  useEffect(() => {
    const channel = supabase
      .channel('notification-attempt-log-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_attempt_log' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['salao-attempt-logs'] })
        },
      )
      .subscribe((status) => {
        setRealtimeOn(status === 'SUBSCRIBED')
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

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

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const onExport = async () => {
    const res = await exportFn({
      data: { niche: filters.niche, from: filters.from, to: filters.to } as any,
    })
    downloadCsv(res.csv, res.filename)
  }

  const onExportAttempts = async () => {
    const res = await exportAttemptsFn({
      data: { ...filters, sortBy, sortDir } as any,
    })
    downloadCsv(res.csv, res.filename)
  }

  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">Logs de notificações do salão</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Tentativas e bloqueios de e-mail/push com motivo canônico e correlação por{' '}
            <code className="text-xs">request_id</code>.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {realtimeOn ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" /> Tempo real ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" /> Conectando…
              </Badge>
            )}
            <span className="text-muted-foreground">
              {total.toLocaleString('pt-BR')} registro{total === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Atualizar logs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportAttempts}
            aria-label="Exportar logs filtrados em CSV"
          >
            <FileDown className="h-4 w-4 mr-2" /> Exportar logs (filtros)
          </Button>
          <Button size="sm" onClick={onExport} aria-label="Exportar CSV consolidado">
            <Download className="h-4 w-4 mr-2" /> CSV consolidado
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Simulator simFn={simFn} />
        <RetentionCard />
      </div>

      <RetentionHistoryCard />

      <Card className="p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" /> Filtros, busca e ordenação
        </h2>

        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Busca rápida — evento, destinatário, motivo, request_id, idempotency_key…"
            value={filters.q ?? ''}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, q: e.target.value || undefined })
            }}
            className="pl-9"
            aria-label="Busca textual"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            value={filters.niche ?? '__all'}
            onValueChange={(v) => {
              setPage(1)
              setFilters({ ...filters, niche: v === '__all' ? undefined : v })
            }}
          >
            <SelectTrigger><SelectValue placeholder="Nicho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos os nichos</SelectItem>
              {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.channel ?? '__all'}
            onValueChange={(v) => {
              setPage(1)
              setFilters({ ...filters, channel: v === '__all' ? undefined : v })
            }}
          >
            <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos canais</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? '__all'}
            onValueChange={(v) => {
              setPage(1)
              setFilters({ ...filters, status: v === '__all' ? undefined : v })
            }}
          >
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={filters.reason ?? '__all'}
            onValueChange={(v) => {
              setPage(1)
              setFilters({ ...filters, reason: v === '__all' ? undefined : v })
            }}
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
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, request_id: e.target.value || undefined })
            }}
            className="font-mono"
            aria-label="Filtrar por request_id"
          />
          <Input
            type="datetime-local"
            value={filters.from ?? ''}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, from: e.target.value || undefined })
            }}
            aria-label="De"
          />
          <Input
            type="datetime-local"
            value={filters.to ?? ''}
            onChange={(e) => {
              setPage(1)
              setFilters({ ...filters, to: e.target.value || undefined })
            }}
            aria-label="Até"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({})
              setPage(1)
            }}
          >
            Limpar filtros
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Ordenar por</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="channel">Canal</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
                <SelectItem value="niche">Nicho</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPage(1)
                setPageSize(Number(v))
              }}
            >
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / página</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular-nums">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <section>
        {isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : grouped.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            Nenhum log para esses filtros.
          </Card>
        ) : (
          <div className="space-y-3">
            {grouped.map(([reqId, rows]) => {
              const isCorrelated = !reqId.startsWith('__')
              return (
                <Card key={reqId} className="p-3">
                  <button
                    type="button"
                    onClick={() => isCorrelated && setSelectedRequestId(reqId)}
                    className="block w-full text-left text-xs font-mono text-muted-foreground mb-2 hover:text-foreground transition-colors disabled:cursor-default"
                    disabled={!isCorrelated}
                    aria-label={isCorrelated ? `Ver detalhes do request ${reqId}` : undefined}
                  >
                    request_id:{' '}
                    {isCorrelated ? (
                      <span className="underline decoration-dotted">{reqId}</span>
                    ) : (
                      <em>(sem correlação)</em>
                    )}{' '}
                    · {rows.length} evento{rows.length > 1 ? 's' : ''}
                  </button>
                  <div className="space-y-1">
                    {rows.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 text-sm border-t border-border/40 py-2 first:border-0 first:pt-0"
                      >
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
              )
            })}
          </div>
        )}
      </section>

      <DetailsSheet
        requestId={selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
      />
    </div>
  )
}

function DetailsSheet({
  requestId,
  onClose,
}: {
  requestId: string | null
  onClose: () => void
}) {
  const fetcher = useServerFn(getAttemptLogDetails)
  const { data, isLoading } = useQuery({
    queryKey: ['attempt-log-details', requestId],
    queryFn: () => fetcher({ data: { request_id: requestId! } }),
    enabled: !!requestId,
  })

  return (
    <Sheet open={!!requestId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do request</SheetTitle>
        </SheetHeader>
        {requestId ? (
          <div className="mt-4 space-y-4">
            <div className="text-xs font-mono text-muted-foreground break-all">
              {requestId}
            </div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : !data?.rows.length ? (
              <div className="text-sm text-muted-foreground">Nenhuma tentativa encontrada.</div>
            ) : (
              <ol className="space-y-3 relative border-l border-border/60 pl-4">
                {data.rows.map((r: any, idx: number) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={statusVariant(r.status)} className="capitalize">
                        {r.status}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        #{idx + 1}
                      </Badge>
                      <span className="font-mono text-xs">{r.channel}</span>
                      <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                    </div>
                    <div className="mt-1 font-medium text-sm">{r.event}</div>
                    {r.reason ? (
                      <div className="text-xs text-destructive mt-0.5">
                        Motivo: <span className="font-mono">{r.reason}</span>
                      </div>
                    ) : null}
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                      {r.niche ? (
                        <>
                          <dt className="text-muted-foreground">Nicho</dt>
                          <dd>{r.niche}</dd>
                        </>
                      ) : null}
                      {r.recipient ? (
                        <>
                          <dt className="text-muted-foreground">Destinatário</dt>
                          <dd className="font-mono break-all">{r.recipient}</dd>
                        </>
                      ) : null}
                      {r.idempotency_key ? (
                        <>
                          <dt className="text-muted-foreground">Idempotency</dt>
                          <dd className="font-mono break-all">{r.idempotency_key}</dd>
                        </>
                      ) : null}
                    </dl>
                    {r.metadata && Object.keys(r.metadata).length > 0 ? (
                      <details className="mt-2 group">
                        <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                          Payload
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-muted/50 text-[11px] overflow-x-auto max-h-72">
                          {JSON.stringify(r.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function RetentionCard() {
  const getFn = useServerFn(getRetentionSettings)
  const setFn = useServerFn(setRetentionSettings)
  const queryClient = useQueryClient()
  const { data, refetch } = useQuery({
    queryKey: ['notification-log-retention'],
    queryFn: () => getFn({}),
  })
  const [days, setDays] = useState<number>(90)
  const [reason, setReason] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data?.days) setDays(data.days)
  }, [data?.days])

  const save = async () => {
    setSaving(true)
    try {
      await setFn({ data: { days, reason: reason || undefined } })
      setReason('')
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['notification-retention-audit'] })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4" /> Retenção do log
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Registros mais antigos que esse limite são removidos pelo job diário automático.
        Mínimo 7 dias, máximo 365. Cada alteração fica registrada no histórico abaixo.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <label htmlFor="retention-days" className="text-xs text-muted-foreground">
            Dias mantidos
          </label>
          <Input
            id="retention-days"
            type="number"
            min={7}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 90)}
          />
        </div>
        <Button
          onClick={save}
          disabled={saving || days === data?.days}
          size="sm"
          aria-label="Salvar nova retenção"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      <div className="mt-2">
        <label htmlFor="retention-reason" className="text-xs text-muted-foreground">
          Motivo da alteração (opcional, vai para o histórico)
        </label>
        <Input
          id="retention-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: ajuste para compliance/LGPD"
        />
      </div>
      {data?.updated_at ? (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Última atualização: {fmt(data.updated_at)}
        </div>
      ) : null}
    </Card>
  )
}

function RetentionHistoryCard() {
  const fetcher = useServerFn(listRetentionAudit)
  const { data, isLoading } = useQuery({
    queryKey: ['notification-retention-audit'],
    queryFn: () => fetcher({}),
  })
  const rows = data?.rows ?? []

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <History className="h-4 w-4" /> Histórico de alterações da retenção
      </h2>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          Nenhuma alteração registrada ainda.
        </div>
      ) : (
        <ol className="text-sm divide-y divide-border/60">
          {rows.map((r: any) => (
            <li key={r.id} className="py-2 grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <Badge variant="outline" className="font-mono">
                {r.previous_days ?? '—'} → {r.new_days}d
              </Badge>
              <div className="min-w-0">
                <div className="text-xs truncate">
                  {r.changed_by_email ?? <span className="text-muted-foreground">(sistema)</span>}
                </div>
                {r.reason ? (
                  <div className="text-[11px] text-muted-foreground truncate">{r.reason}</div>
                ) : null}
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {fmt(r.created_at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function Simulator({ simFn }: { simFn: (a: any) => Promise<any> }) {
  const [niche, setNiche] = useState<string>('bares-restaurantes')
  const [closedAt, setClosedAt] = useState<string>(() =>
    new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16),
  )
  const [res, setRes] = useState<any>(null)

  const run = async () => {
    const r = await simFn({
      data: { bill_closed_at: new Date(closedAt).toISOString(), niche },
    })
    setRes(r)
  }

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <FlaskConical className="h-4 w-4" /> Simulador de janela pós-visita
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        18h café · 24h restaurantes · 36h cervejaria · 48h eventos. Apenas calcula
        a janela — nada é enviado.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          type="datetime-local"
          value={closedAt}
          onChange={(e) => setClosedAt(e.target.value)}
        />
      </div>
      <Button onClick={run} className="mt-3 w-full" size="sm">
        Simular liberação
      </Button>
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
