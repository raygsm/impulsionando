import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { PageHeader } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Receipt,
  Download,
  AlertTriangle,
  DoorOpen,
  Info,
} from 'lucide-react'
import { getCatalogAnalytics } from '@/lib/catalogo.functions'
import { downloadCsv } from '@/lib/exports'

export const Route = createFileRoute('/_authenticated/admin/catalog-analytics')({
  head: () => ({ meta: [{ title: 'Conversão do Catálogo — Admin' }] }),
  component: CatalogAnalyticsPage,
})

const RANGES = [7, 30, 90] as const

function CatalogAnalyticsPage() {
  const fetchFn = useServerFn(getCatalogAnalytics)
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [fMacro, setFMacro] = useState('')
  const [fSub, setFSub] = useState('')
  const [fPlan, setFPlan] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'catalog-analytics', days],
    queryFn: () => fetchFn({ data: { days } }),
  })

  const rows = data?.rows ?? []
  const filtered = useMemo(() => {
    const mc = fMacro.trim().toLowerCase()
    const sc = fSub.trim().toLowerCase()
    const pc = fPlan.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!mc || r.macro.toLowerCase().includes(mc)) &&
        (!sc || r.sub.toLowerCase().includes(sc)) &&
        (!pc || r.plan.toLowerCase().includes(pc)),
    )
  }, [rows, fMacro, fSub, fPlan])

  const totals = useMemo(
    () =>
      filtered.reduce(
        (a, r) => {
          a.views += r.views
          a.selects += r.selects
          a.intents += r.intents
          a.opened += r.opened
          a.converted += r.converted
          a.reuseAttempts += r.reuseAttempts
          return a
        },
        { views: 0, selects: 0, intents: 0, opened: 0, converted: 0, reuseAttempts: 0 },
      ),
    [filtered],
  )

  const convPct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

  function exportCsv() {
    downloadCsv(
      `catalog-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'macro',
        'subnicho',
        'plano',
        'views',
        'selecoes',
        'intencoes',
        'abertas_onboarding',
        'convertidas',
        'taxa_conversao',
        'tentativas_reuso',
        'conversion_kinds',
        'ultima_conversao',
        'ultima_tentativa_reuso',
      ],
      filtered.map((r) => ({
        macro: r.macro,
        subnicho: r.sub,
        plano: r.plan,
        views: r.views,
        selecoes: r.selects,
        intencoes: r.intents,
        abertas_onboarding: r.opened,
        convertidas: r.converted,
        taxa_conversao: convPct(r.converted, r.intents),
        tentativas_reuso: r.reuseAttempts,
        conversion_kinds: Object.entries(r.conversionKinds)
          .map(([k, v]) => `${k}:${v}`)
          .join('; '),
        ultima_conversao: r.lastConvertedAt ?? '',
        ultima_tentativa_reuso: r.lastReuseAt ?? '',
      })),
    )
  }


  return (
    <TooltipProvider delayDuration={150}>
    <div className="container mx-auto py-6 space-y-6">

      <PageHeader
        title="Conversão do Catálogo"
        description="Funil do catálogo público até a conversão (onboarding concluído / contrato / pagamento), por macro, subnicho e plano."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          {RANGES.map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 flex-1 min-w-[260px]">
          <div>
            <Label className="text-xs">Macro</Label>
            <Input value={fMacro} onChange={(e) => setFMacro(e.target.value)} placeholder="ex: saude" />
          </div>
          <div>
            <Label className="text-xs">Subnicho</Label>
            <Input value={fSub} onChange={(e) => setFSub(e.target.value)} placeholder="ex: clinicas" />
          </div>
          <div>
            <Label className="text-xs">Plano</Label>
            <Input value={fPlan} onChange={(e) => setFPlan(e.target.value)} placeholder="essencial / ideal / full" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="w-4 h-4 mr-1.5" /> Exportar CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      <Card className="p-3 text-xs text-muted-foreground bg-muted/30 flex gap-2 items-start">
        <Info className="w-3.5 h-3.5 mt-0.5 text-foreground shrink-0" aria-hidden />
        <div>
          <strong className="text-foreground">Definições:</strong>{' '}
          <strong className="text-foreground">Intenções</strong> = cliques em
          "Contratar" no catálogo (registro em <code>catalog_intents</code>).{' '}
          <strong className="text-foreground">Abertas (consumed)</strong> = intent
          aberto pelo usuário autenticado no onboarding (<code>consumed_at</code>{' '}
          preenchido pela 1ª vez; reaberturas só incrementam{' '}
          <code>reuse_attempts</code> e geram <code>intent_reuse_attempt</code>).{' '}
          <strong className="text-foreground">Convertidas</strong> = intent com{' '}
          <code>converted_at</code> preenchido — onboarding concluído (todos
          campos válidos ao chegar no Step 4), contrato assinado ou pagamento
          capturado. Fórmula da taxa:{' '}
          <code>convertidas ÷ intenções × 100</code>.
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {(error as Error).message}
        </Card>
      )}

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi
          icon={BarChart3}
          label="Views de planos"
          value={totals.views}
          tip="Quantas vezes a tela de planos foi exibida (evento view_plans, deduplicado por sessão)."
        />
        <Kpi
          icon={MousePointerClick}
          label="Seleções"
          value={totals.selects}
          tip="Cliques em subnicho + módulos (eventos select_sub e select_module, com dedupe de 800 ms)."
        />
        <Kpi
          icon={Receipt}
          label="Intenções"
          value={totals.intents}
          tip="Registros em catalog_intents — usuário clicou em Contratar no catálogo."
        />
        <Kpi
          icon={DoorOpen}
          label="Abertas no onboarding"
          value={totals.opened}
          tip="Intents com consumed_at preenchido (usuário autenticado abriu /onboarding?intent=…)."
        />
        <Kpi
          icon={TrendingUp}
          label="Convertidas"
          value={totals.converted}
          extra={convPct(totals.converted, totals.intents)}
          tip="Intents com converted_at. Conta apenas a 1ª conversão (onboarding_completed, contract_signed ou payment_captured). Taxa = convertidas ÷ intenções."
        />
        <Kpi
          icon={AlertTriangle}
          label="Reusos detectados"
          value={totals.reuseAttempts}
          extra="tentativas com intent já consumido"
          tip="Soma de reuse_attempts em catalog_intents. Cada reabertura gera intent_reuse_attempt em catalog_events."
        />
      </div>


      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="font-semibold">Por nicho, subnicho e plano</div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando…' : `${filtered.length} combinações (de ${rows.length} no período)`}
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
                <Th className="text-right">Abertas</Th>
                <Th className="text-right">Convertidas</Th>
                <Th className="text-right">Taxa</Th>
                <Th className="text-right">Reusos</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum evento no período/filtros.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr key={`${r.macro}-${r.sub}-${r.plan}-${i}`} className="border-t">
                  <Td>{r.macro}</Td>
                  <Td>{r.sub}</Td>
                  <Td>
                    <Badge variant="secondary" className="capitalize">{r.plan}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{r.views}</Td>
                  <Td className="text-right tabular-nums">{r.selects}</Td>
                  <Td className="text-right tabular-nums">{r.intents}</Td>
                  <Td className="text-right tabular-nums">{r.opened}</Td>
                  <Td className="text-right tabular-nums">{r.converted}</Td>
                  <Td className="text-right tabular-nums font-medium">
                    {convPct(r.converted, r.intents)}
                  </Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{r.reuseAttempts}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    </TooltipProvider>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  extra,
  tip,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  extra?: string
  tip?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> <span>{label}</span>
        {tip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Detalhes de ${label}`}
                className="ml-0.5 inline-flex items-center text-muted-foreground hover:text-foreground"
              >
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-snug">
              {tip}
            </TooltipContent>
          </Tooltip>
        )}
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
