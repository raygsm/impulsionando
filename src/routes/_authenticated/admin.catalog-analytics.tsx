import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { PageHeader } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, MousePointerClick, Receipt } from 'lucide-react'
import { getCatalogAnalytics } from '@/lib/catalogo.functions'

export const Route = createFileRoute('/_authenticated/admin/catalog-analytics')({
  head: () => ({ meta: [{ title: 'Conversão do Catálogo — Admin' }] }),
  component: CatalogAnalyticsPage,
})

const RANGES = [7, 30, 90] as const

function CatalogAnalyticsPage() {
  const fetchFn = useServerFn(getCatalogAnalytics)
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'catalog-analytics', days],
    queryFn: () => fetchFn({ data: { days } }),
  })

  const totals = data?.totals
  const rows = data?.rows ?? []

  const convPct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Conversão do Catálogo"
        description="Funil completo do catálogo público até o onboarding, por macro, subnicho e plano."
      />

      <div className="flex items-center gap-2">
        {RANGES.map((d) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(d)}
          >
            Últimos {d} dias
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}

      <div className="grid sm:grid-cols-4 gap-3">
        <Kpi icon={BarChart3} label="Views de planos" value={totals?.views ?? 0} />
        <Kpi icon={MousePointerClick} label="Seleções" value={totals?.selects ?? 0} />
        <Kpi icon={Receipt} label="Intenções" value={totals?.intents ?? 0} />
        <Kpi
          icon={TrendingUp}
          label="Convertidas"
          value={totals?.consumed ?? 0}
          extra={convPct(totals?.consumed ?? 0, totals?.intents ?? 0)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="font-semibold">Por nicho, subnicho e plano</div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando…' : `${rows.length} combinações no período`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <Th>Macro</Th>
                <Th>Subnicho</Th>
                <Th>Plano</Th>
                <Th className="text-right">Views</Th>
                <Th className="text-right">Seleções</Th>
                <Th className="text-right">Intenções</Th>
                <Th className="text-right">Convertidas</Th>
                <Th className="text-right">Taxa</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum evento ainda no período.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={`${r.macro}-${r.sub}-${r.plan}-${i}`} className="border-t">
                  <Td>{r.macro}</Td>
                  <Td>{r.sub}</Td>
                  <Td>
                    <Badge variant="secondary" className="capitalize">{r.plan}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{r.views}</Td>
                  <Td className="text-right tabular-nums">{r.selects}</Td>
                  <Td className="text-right tabular-nums">{r.intents}</Td>
                  <Td className="text-right tabular-nums">{r.consumed}</Td>
                  <Td className="text-right tabular-nums font-medium">
                    {convPct(r.consumed, r.intents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  extra?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString('pt-BR')}</div>
      {extra && <div className="text-xs text-muted-foreground mt-1">{extra}</div>}
    </Card>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>
}
