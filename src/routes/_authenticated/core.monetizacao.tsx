// Página admin CORE — visão consolidada dos modelos comerciais por cliente.
// Read-only nesta fase. Edição via wizard de implantação (próxima fase).
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listAllMonetizationModels } from '@/lib/monetization.functions'
import { getGlobalPayoutOverview } from '@/lib/payouts.functions'
import { formatBRL } from '@/lib/payouts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { reportError } from '@/lib/report-error'

const modelsQuery = (fetcher: () => Promise<any[]>) =>
  queryOptions({
    queryKey: ['core', 'monetization-models'],
    queryFn: fetcher,
  })

export const Route = createFileRoute('/_authenticated/core/monetizacao')({
  component: MonetizacaoPage,
  head: () => ({
    meta: [{ title: 'Monetização — CORE Impulsionando' }],
  }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'core.monetizacao' })
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Erro ao carregar monetização</h1>
        <p className="text-sm text-muted-foreground mt-2">{String(error?.message ?? error)}</p>
      </div>
    )
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

const MODEL_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  saas: { label: 'SaaS', variant: 'secondary' },
  revshare: { label: 'Revenue Share', variant: 'default' },
  hybrid: { label: 'Híbrido', variant: 'outline' },
}

const FREQ_LABEL: Record<string, string> = {
  instant: 'Instantâneo',
  daily: 'Diário',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
}

function MonetizacaoPage() {
  const fetcher = useServerFn(listAllMonetizationModels)
  const overviewFetcher = useServerFn(getGlobalPayoutOverview)
  const { data } = useSuspenseQuery(modelsQuery(() => fetcher()))
  const { data: overview } = useSuspenseQuery(
    queryOptions({ queryKey: ['core', 'monetization-overview'], queryFn: () => overviewFetcher() }),
  )

  const totals = {
    saas: data.filter((m: any) => m.model === 'saas').length,
    revshare: data.filter((m: any) => m.model === 'revshare').length,
    hybrid: data.filter((m: any) => m.model === 'hybrid').length,
    monthly: data.reduce((acc: number, m: any) => acc + (m.monthly_fee_cents ?? 0), 0),
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Monetização</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modelo comercial vigente por cliente. Edição via assistente de implantação.
          </p>
        </div>
        <Link
          to="/_authenticated/core/clientes"
          className="text-sm text-primary hover:underline"
        >
          ← voltar para clientes
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes SaaS</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.saas}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Share</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.revshare}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Híbrido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totals.hybrid}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR fixo (mensalidades)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatBRL(totals.monthly)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">GMV 90 dias</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{formatBRL(overview.totals.gross)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa retida 90 dias</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">{formatBRL(overview.totals.fee)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Eventos aprovados</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{overview.totals.events}</CardContent>
        </Card>
      </div>

      {overview.top.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top clientes por taxa retida (90 dias)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Nicho</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Eventos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.top.map((t: any) => (
                  <TableRow key={t.company_id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.niche ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(t.gross)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">{formatBRL(t.fee)}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.events}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}



      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Repasse</TableHead>
                <TableHead>Eventos cobertos</TableHead>
                <TableHead>Versão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m: any) => {
                const meta = MODEL_LABEL[m.model] ?? { label: m.model, variant: 'outline' as const }
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.companies?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{m.companies?.niche ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>{formatBRL(m.monthly_fee_cents ?? 0)}</TableCell>
                    <TableCell>{FREQ_LABEL[m.payout_frequency] ?? m.payout_frequency}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(m.covered_events ?? []).length === 0
                        ? '—'
                        : (m.covered_events as string[]).join(', ')}
                    </TableCell>
                    <TableCell className="tabular-nums">v{m.version}</TableCell>
                  </TableRow>
                )
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum modelo cadastrado.
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
