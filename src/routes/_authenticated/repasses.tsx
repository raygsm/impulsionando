// Tenant-side: dashboard de Repasses (lotes consolidados) ao lado de /monetizacao.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { listMyCompanies } from '@/lib/payouts.functions'
import { listPayoutBatches } from '@/lib/payout-batches.functions'
import { formatBRL } from '@/lib/payouts'
import { reportError } from '@/lib/report-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_VARIANT: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Agendado', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  processing: { label: 'Processando', variant: 'secondary' },
  paid: { label: 'Pago', variant: 'outline' },
  retained: { label: 'Retido', variant: 'destructive' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
}

const companiesQuery = (fetcher: () => Promise<any[]>) =>
  queryOptions({ queryKey: ['my-companies'], queryFn: fetcher })

const batchesQuery = (fetcher: () => Promise<any[]>, companyId: string) =>
  queryOptions({ queryKey: ['my-payout-batches', companyId], queryFn: fetcher, enabled: !!companyId })

export const Route = createFileRoute('/_authenticated/repasses')({
  component: RepassesClientePage,
  head: () => ({ meta: [{ title: 'Meus Repasses — Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'repasses' })
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Erro</h1>
        <p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p>
      </div>
    )
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

function RepassesClientePage() {
  const listCompanies = useServerFn(listMyCompanies)
  const listBatches = useServerFn(listPayoutBatches)

  const { data: companies } = useSuspenseQuery(companiesQuery(() => listCompanies()))
  const [companyId, setCompanyId] = useState<string>((companies as any[])[0]?.id ?? '')

  const { data: batches } = useSuspenseQuery(
    batchesQuery(() => listBatches({ data: { company_id: companyId } }), companyId),
  )

  const rows = (batches as any[]) ?? []
  const totals = {
    scheduled: rows.filter((r) => r.status === 'scheduled').reduce((a, r) => a + (r.net_cents ?? 0), 0),
    paid: rows.filter((r) => r.status === 'paid').reduce((a, r) => a + (r.net_cents ?? 0), 0),
    retained: rows.filter((r) => r.status === 'retained').reduce((a, r) => a + (r.net_cents ?? 0), 0),
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Meus Repasses</h1>
          <p className="text-sm text-muted-foreground">
            Lotes consolidados por período. <Link to="/monetizacao" className="underline">Ver extrato</Link>.
          </p>
        </div>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            {(companies as any[]).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.trade_name ?? c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="A receber" value={formatBRL(totals.scheduled)} />
        <KpiCard title="Recebido" value={formatBRL(totals.paid)} />
        <KpiCard title="Retido (abaixo do mínimo)" value={formatBRL(totals.retained)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico de lotes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comprovante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => {
                const meta = STATUS_VARIANT[b.status] ?? { label: b.status, variant: 'secondary' as const }
                return (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs">
                      {new Date(b.period_start).toLocaleDateString('pt-BR')} →{' '}
                      {new Date(b.period_end).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(b.gross_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(b.fee_cents)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatBRL(b.net_cents)}</TableCell>
                    <TableCell className="text-right">{b.event_count}</TableCell>
                    <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                    <TableCell>
                      {b.receipt_url ? (
                        <Button asChild size="sm" variant="ghost">
                          <a href={b.receipt_url} target="_blank" rel="noreferrer">Abrir</a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum lote ainda. Lotes são criados conforme a periodicidade do seu plano.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
