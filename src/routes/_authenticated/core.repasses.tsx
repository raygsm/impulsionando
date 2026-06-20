// Painel STAFF de Repasses: lista lotes, marca como pago, reabre, drill-down.
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState, useMemo } from 'react'
import { listPayoutBatches, getPayoutBatch, markPayoutPaid, reopenPayout } from '@/lib/payout-batches.functions'
import { formatBRL } from '@/lib/payouts'
import { reportError } from '@/lib/report-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const STATUS_VARIANT: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Agendado', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  processing: { label: 'Processando', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'outline' },
  retained: { label: 'Retido', variant: 'destructive' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
}

const batchesQuery = (fetcher: () => Promise<any>, status: string) =>
  queryOptions({
    queryKey: ['core', 'payout-batches', status],
    queryFn: () => fetcher(),
  })

export const Route = createFileRoute('/_authenticated/core/repasses')({
  component: RepassesPage,
  head: () => ({ meta: [{ title: 'Repasses — CORE Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'core.repasses' })
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Erro ao carregar repasses</h1>
        <p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p>
      </div>
    )
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

function RepassesPage() {
  const list = useServerFn(listPayoutBatches)
  const detail = useServerFn(getPayoutBatch)
  const markPaid = useServerFn(markPayoutPaid)
  const reopen = useServerFn(reopenPayout)
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const fetcher = () => list({ data: statusFilter === 'all' ? {} : { status: statusFilter as any } })
  const { data: batches } = useSuspenseQuery(batchesQuery(fetcher, statusFilter))

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [providerId, setProviderId] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')

  const kpis = useMemo(() => {
    const rows = batches as any[]
    return {
      toPay: rows.filter((r) => r.status === 'scheduled').reduce((a, r) => a + (r.net_cents ?? 0), 0),
      paidCount: rows.filter((r) => r.status === 'paid').length,
      retainedCount: rows.filter((r) => r.status === 'retained').length,
      total: rows.length,
    }
  }, [batches])

  async function refreshAll() {
    await qc.invalidateQueries({ queryKey: ['core', 'payout-batches'] })
  }

  async function onMarkPaid() {
    if (!selectedId) return
    try {
      await markPaid({
        data: {
          ledger_id: selectedId,
          provider_payout_id: providerId || undefined,
          receipt_url: receiptUrl || undefined,
        },
      })
      toast.success('Lote marcado como pago')
      setPayOpen(false)
      setProviderId('')
      setReceiptUrl('')
      await refreshAll()
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  async function onReopen(id: string) {
    try {
      await reopen({ data: { ledger_id: id } })
      toast.success('Lote reaberto')
      await refreshAll()
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  function exportCSV() {
    const rows = batches as any[]
    const header = ['empresa', 'periodo_inicio', 'periodo_fim', 'bruto', 'taxa', 'liquido', 'eventos', 'status']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push(
        [
          (r.companies?.name ?? '').replace(/,/g, ' '),
          r.period_start,
          r.period_end,
          (r.gross_cents / 100).toFixed(2),
          (r.fee_cents / 100).toFixed(2),
          (r.net_cents / 100).toFixed(2),
          r.event_count,
          r.status,
        ].join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repasses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Repasses — CORE</h1>
          <p className="text-sm text-muted-foreground">Lotes consolidados de Revenue Share por empresa.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="scheduled">Agendados</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="retained">Retidos</SelectItem>
              <SelectItem value="failed">Falhos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="A pagar" value={formatBRL(kpis.toPay)} />
        <KpiCard title="Pagos" value={String(kpis.paidCount)} />
        <KpiCard title="Retidos" value={String(kpis.retainedCount)} />
        <KpiCard title="Total de lotes" value={String(kpis.total)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Lotes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(batches as any[]).map((b) => {
                const meta = STATUS_VARIANT[b.status] ?? { label: b.status, variant: 'secondary' as const }
                return (
                  <TableRow key={b.id}>
                    <TableCell>{b.companies?.name ?? '—'}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(b.period_start).toLocaleDateString('pt-BR')} →{' '}
                      {new Date(b.period_end).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(b.gross_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(b.fee_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatBRL(b.net_cents)}</TableCell>
                    <TableCell className="text-right">{b.event_count}</TableCell>
                    <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(b.id)}>Ver</Button>
                      {b.status === 'scheduled' && (
                        <Button size="sm" onClick={() => { setSelectedId(b.id); setPayOpen(true) }}>
                          Pagar
                        </Button>
                      )}
                      {b.status === 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => onReopen(b.id)}>Reabrir</Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {(batches as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum lote para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BatchDetailDialog
        ledgerId={selectedId && !payOpen ? selectedId : null}
        onClose={() => setSelectedId(null)}
        fetcher={(id) => detail({ data: { ledger_id: id } })}
      />

      <Dialog open={payOpen} onOpenChange={(o) => { if (!o) { setPayOpen(false); setSelectedId(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como pago</DialogTitle>
            <DialogDescription>Registre o ID da transferência e o link do comprovante.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ID da transferência (provedor)</Label>
              <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="ex.: MP-TR-12345" />
            </div>
            <div>
              <Label>Link do comprovante (opcional)</Label>
              <Input value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button onClick={onMarkPaid}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold tabular-nums">{value}</div></CardContent>
    </Card>
  )
}

function BatchDetailDialog({
  ledgerId,
  onClose,
  fetcher,
}: {
  ledgerId: string | null
  onClose: () => void
  fetcher: (id: string) => Promise<any>
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const open = !!ledgerId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (!ledgerId) { setData(null); return }
    setLoading(true)
    fetcher(ledgerId).then(setData).finally(() => setLoading(false))
  }, [ledgerId])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhe do lote</DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              <strong>{data.batch.companies?.name ?? '—'}</strong> ·{' '}
              {new Date(data.batch.period_start).toLocaleDateString('pt-BR')} →{' '}
              {new Date(data.batch.period_end).toLocaleDateString('pt-BR')}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-muted-foreground">Bruto</div><div className="font-semibold">{formatBRL(data.batch.gross_cents)}</div></div>
              <div><div className="text-muted-foreground">Taxa</div><div className="font-semibold">{formatBRL(data.batch.fee_cents)}</div></div>
              <div><div className="text-muted-foreground">Líquido</div><div className="font-semibold">{formatBRL(data.batch.net_cents)}</div></div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.event_type}</TableCell>
                    <TableCell className="text-xs">{new Date(e.occurred_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(e.gross_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(e.fee_cents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
