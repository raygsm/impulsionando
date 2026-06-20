// Dashboard de monetização do cliente — extrato, KPIs, CSV.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState, useMemo } from 'react'
import { listMyCompanies, getCompanyMonetization } from '@/lib/payouts.functions'
import { formatBRL } from '@/lib/payouts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'

const myCompaniesQuery = (fetcher: () => Promise<any[]>) =>
  queryOptions({ queryKey: ['monetizacao', 'my-companies'], queryFn: fetcher })

const monetizationQuery = (
  companyId: string,
  fetcher: (args: { data: { company_id: string } }) => Promise<any>,
) =>
  queryOptions({
    queryKey: ['monetizacao', 'company', companyId],
    queryFn: () => fetcher({ data: { company_id: companyId } }),
    enabled: !!companyId,
  })

export const Route = createFileRoute('/_authenticated/monetizacao')({
  component: ClientMonetizacaoPage,
  head: () => ({ meta: [{ title: 'Monetização — Impulsionando' }] }),
  errorComponent: ({ error }) => {
    if (typeof window !== 'undefined') {
      import('@/lib/sentry.client').then(({ Sentry }) => Sentry.captureException(error, { tags: { route: 'monetizacao' } }))
    }
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Erro</h1>
        <p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p>
      </div>
    )
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  refunded: 'outline',
  chargeback: 'destructive',
  cancelled: 'outline',
  failed: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  refunded: 'Reembolsado',
  chargeback: 'Chargeback',
  cancelled: 'Cancelado',
  failed: 'Falhou',
}

function toCSV(events: any[]) {
  const header = ['data', 'evento', 'status', 'bruto', 'taxa', 'liquido', 'pct_bps', 'provider_payment_id']
  const rows = events.map((e) => [
    new Date(e.occurred_at).toISOString(),
    e.event_type,
    e.status,
    (e.gross_cents / 100).toFixed(2),
    (e.fee_cents / 100).toFixed(2),
    (e.net_cents / 100).toFixed(2),
    e.percent_bps_applied,
    e.provider_payment_id ?? '',
  ])
  return [header, ...rows].map((r) => r.join(';')).join('\n')
}

function ClientMonetizacaoPage() {
  const listFn = useServerFn(listMyCompanies)
  const monFn = useServerFn(getCompanyMonetization)
  const { data: companies } = useSuspenseQuery(myCompaniesQuery(() => listFn()))
  const [companyId, setCompanyId] = useState<string>(companies[0]?.id ?? '')

  if (!companyId && companies.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Monetização</h1>
        <p className="text-sm text-muted-foreground mt-2">Nenhuma empresa vinculada à sua conta.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Monetização</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receita bruta, taxa de intermediação digital e extrato dos repasses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.trade_name || c.name}
              </option>
            ))}
          </select>
          <Link to="/_authenticated/core/monetizacao" className="text-sm text-primary hover:underline">
            visão CORE →
          </Link>
        </div>
      </header>

      {companyId && <CompanyPanel companyId={companyId} fetcher={monFn} />}
    </div>
  )
}

function CompanyPanel({ companyId, fetcher }: { companyId: string; fetcher: any }) {
  const { data } = useSuspenseQuery(monetizationQuery(companyId, fetcher))
  const { summary, events, ledger } = data

  const csv = useMemo(() => toCSV(events), [events])
  const handleDownload = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monetizacao-${companyId}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="Receita bruta" value={formatBRL(summary.gross_total)} sub={`${summary.events_count} eventos aprovados`} />
        <Kpi title="Taxa retida" value={formatBRL(summary.fee_total)} sub="intermediação digital" />
        <Kpi title="Líquido recebido" value={formatBRL(summary.net_total)} sub="bruto − taxa" />
        <Kpi title="Pendentes" value={String(summary.pending_count)} sub="aguardando confirmação" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Extrato de eventos</CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={events.length === 0}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{new Date(e.occurred_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="capitalize">{e.event_type}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[e.status] ?? 'outline'}>{STATUS_LABEL[e.status] ?? e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(e.gross_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600">{formatBRL(e.fee_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatBRL(e.net_cents)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {(e.percent_bps_applied / 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum evento de monetização registrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repasses consolidados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recibo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">
                    {new Date(l.period_start).toLocaleDateString('pt-BR')} → {new Date(l.period_end).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{l.event_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(l.gross_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600">{formatBRL(l.fee_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatBRL(l.net_cents)}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'paid' ? 'default' : 'secondary'}>{l.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {l.receipt_url ? (
                      <a href={l.receipt_url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">
                        abrir
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {ledger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Sem repasses consolidados no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function Kpi({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
