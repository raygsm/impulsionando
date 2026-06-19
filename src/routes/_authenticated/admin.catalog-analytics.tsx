import { createFileRoute } from '@tanstack/react-router'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  History,
} from 'lucide-react'
import {
  getCatalogAnalytics,
  getTrackerStats,
  getDedupeThresholds,
  setDedupeThresholds,
  recordDedupeThresholdCheck,
  getDedupeThresholdEvents,
  getDedupeThresholdAudit,
} from '@/lib/catalogo.functions'

import { downloadCsv } from '@/lib/exports'
import { Checkbox } from '@/components/ui/checkbox'

const CONVERSION_KINDS = ['onboarding_completed', 'contract_signed', 'payment_captured'] as const

export const Route = createFileRoute('/_authenticated/admin/catalog-analytics')({
  head: () => ({ meta: [{ title: 'Conversão do Catálogo — Admin' }] }),
  component: CatalogAnalyticsPage,
})

const RANGES = [7, 30, 90] as const
const DEFAULT_DEDUPE_MIN = 5
const DEFAULT_DEDUPE_MAX = 40

function CatalogAnalyticsPage() {
  const qc = useQueryClient()
  const fetchFn = useServerFn(getCatalogAnalytics)
  const fetchTrackerStats = useServerFn(getTrackerStats)
  const fetchThresholds = useServerFn(getDedupeThresholds)
  const saveThresholds = useServerFn(setDedupeThresholds)
  const recordCrossing = useServerFn(recordDedupeThresholdCheck)
  const fetchEvents = useServerFn(getDedupeThresholdEvents)
  const fetchAudit = useServerFn(getDedupeThresholdAudit)


  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [fMacro, setFMacro] = useState('')
  const [fSub, setFSub] = useState('')
  const [fPlan, setFPlan] = useState('')
  const [selectedKinds, setSelectedKinds] = useState<string[]>([])

  const thresholdsQuery = useQuery({
    queryKey: ['admin', 'dedupe-thresholds'],
    queryFn: () => fetchThresholds(),
  })
  const dedupeMin = thresholdsQuery.data?.min ?? DEFAULT_DEDUPE_MIN
  const dedupeMax = thresholdsQuery.data?.max ?? DEFAULT_DEDUPE_MAX
  const [draftMin, setDraftMin] = useState(DEFAULT_DEDUPE_MIN)
  const [draftMax, setDraftMax] = useState(DEFAULT_DEDUPE_MAX)
  useEffect(() => {
    if (thresholdsQuery.data) {
      setDraftMin(thresholdsQuery.data.min)
      setDraftMax(thresholdsQuery.data.max)
    }
  }, [thresholdsQuery.data])

  const saveMut = useMutation({
    mutationFn: (vars: { min: number; max: number }) => saveThresholds({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'dedupe-thresholds'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dedupe-threshold-audit'] })
    },
  })


  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'catalog-analytics', days],
    queryFn: () => fetchFn({ data: { days } }),
  })

  const { data: trackerStats } = useQuery({
    queryKey: ['admin', 'tracker-stats', days],
    queryFn: () => fetchTrackerStats({ data: { days: Math.min(days, 30) } }),
  })

  const auditQuery = useQuery({
    queryKey: ['admin', 'dedupe-threshold-audit'],
    queryFn: () => fetchAudit({ data: { limit: 50 } }),
  })


  const eventsQuery = useQuery({
    queryKey: ['admin', 'dedupe-threshold-events'],
    queryFn: () => fetchEvents({ data: { limit: 50 } }),
  })


  const dedupePct = trackerStats?.dedupePct ?? 0
  const dedupeAlert: { kind: 'low' | 'high'; msg: string; causes: string[] } | null =
    trackerStats && trackerStats.totals.samples > 0
      ? dedupePct > dedupeMax
        ? {
            kind: 'high',
            msg: `Dedupe alto: ${dedupePct}% (limite ${dedupeMax}%).`,
            causes: [
              'Possível SUBCONTAGEM de cliques legítimos (janela de 800ms agrupando ações distintas).',
              'Usuário repetindo a mesma seleção rápido demais (UX confusa, botão pouco responsivo).',
              'Re-render disparando eventos duplicados no mesmo componente.',
            ],
          }
        : dedupePct < dedupeMin
          ? {
              kind: 'low',
              msg: `Dedupe baixo: ${dedupePct}% (mínimo ${dedupeMin}%).`,
              causes: [
                'Possível SUPERCONTAGEM: dedupe deixou de agrupar cliques repetidos esperados.',
                'Tracker reiniciando entre eventos (sessionToken trocando, key de dedupe instável).',
                'Janela de 800ms curta demais para o fluxo atual.',
              ],
            }
          : null
      : null

  // Log threshold crossings (state changes) to the backend, exactly once
  // per unique (state, min, max, days) combination per page session. The
  // server still does its own state-change check, so dupes are safe.
  const loggedKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!trackerStats || trackerStats.totals.samples === 0) return
    if (!thresholdsQuery.data) return
    const state: 'below' | 'normal' | 'above' =
      dedupePct > dedupeMax ? 'above' : dedupePct < dedupeMin ? 'below' : 'normal'
    const key = `${state}|${dedupeMin}|${dedupeMax}|${days}`
    if (loggedKeyRef.current === key) return
    loggedKeyRef.current = key
    recordCrossing({
      data: {
        dedupePct,
        min: dedupeMin,
        max: dedupeMax,
        daysWindow: days,
        samples: trackerStats.totals.samples,
        tracker: {
          attempted: trackerStats.totals.attempted,
          sent: trackerStats.totals.sent,
          deduped: trackerStats.totals.deduped,
          dropped: trackerStats.totals.dropped,
          batches: trackerStats.totals.batches,
        },
      },
    })
      .then((res) => {
        if (res?.logged) qc.invalidateQueries({ queryKey: ['admin', 'dedupe-threshold-events'] })
      })
      .catch(() => {
        loggedKeyRef.current = null
      })
  }, [trackerStats, thresholdsQuery.data, dedupePct, dedupeMin, dedupeMax, days, recordCrossing, qc])



  const rows = data?.rows ?? []
  const filtered = useMemo(() => {
    const mc = fMacro.trim().toLowerCase()
    const sc = fSub.trim().toLowerCase()
    const pc = fPlan.trim().toLowerCase()
    return rows
      .filter(
        (r) =>
          (!mc || r.macro.toLowerCase().includes(mc)) &&
          (!sc || r.sub.toLowerCase().includes(sc)) &&
          (!pc || r.plan.toLowerCase().includes(pc)),
      )
      .filter((r) => {
        if (selectedKinds.length === 0) return true
        // keep only rows that have at least one of the selected kinds
        return selectedKinds.some((k) => (r.conversionKinds[k] ?? 0) > 0)
      })
  }, [rows, fMacro, fSub, fPlan, selectedKinds])

  // When kinds are selected, restrict the "converted" totals to that subset
  // so KPIs and CSV reflect the same selection.
  const scopedConverted = (r: (typeof rows)[number]) => {
    if (selectedKinds.length === 0) return r.converted
    return selectedKinds.reduce((sum, k) => sum + (r.conversionKinds[k] ?? 0), 0)
  }

  const totals = useMemo(
    () =>
      filtered.reduce(
        (a, r) => {
          a.views += r.views
          a.selects += r.selects
          a.intents += r.intents
          a.opened += r.opened
          a.converted += scopedConverted(r)
          a.reuseAttempts += r.reuseAttempts
          return a
        },
        { views: 0, selects: 0, intents: 0, opened: 0, converted: 0, reuseAttempts: 0 },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, selectedKinds],
  )

  const convPct = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : '—')

  function toggleKind(k: string) {
    setSelectedKinds((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    )
  }

  function exportCsv() {
    const kindsToInclude =
      selectedKinds.length > 0 ? selectedKinds : (CONVERSION_KINDS as readonly string[])
    const suffix = selectedKinds.length > 0 ? `-${selectedKinds.join('+')}` : ''
    downloadCsv(
      `catalog-analytics-${days}d${suffix}-${new Date().toISOString().slice(0, 10)}.csv`,
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
      filtered.map((r) => {
        const conv = scopedConverted(r)
        return {
          macro: r.macro,
          subnicho: r.sub,
          plano: r.plan,
          views: r.views,
          selecoes: r.selects,
          intencoes: r.intents,
          abertas_onboarding: r.opened,
          convertidas: conv,
          taxa_conversao: convPct(conv, r.intents),
          tentativas_reuso: r.reuseAttempts,
          conversion_kinds: kindsToInclude
            .filter((k) => (r.conversionKinds[k] ?? 0) > 0)
            .map((k) => `${k}:${r.conversionKinds[k]}`)
            .join('; '),
          ultima_conversao: r.lastConvertedAt ?? '',
          ultima_tentativa_reuso: r.lastReuseAt ?? '',
        }
      }),
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

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground">Filtrar por conversion_kind:</span>
        {CONVERSION_KINDS.map((k) => (
          <label key={k} className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox checked={selectedKinds.includes(k)} onCheckedChange={() => toggleKind(k)} />
            <code className="text-[11px]">{k}</code>
          </label>
        ))}
        {selectedKinds.length > 0 && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedKinds([])}>
            limpar
          </Button>
        )}
        <span className="ml-auto text-muted-foreground">
          {selectedKinds.length > 0
            ? `KPIs e CSV restritos a: ${selectedKinds.join(', ')}`
            : 'Todos os tipos de conversão'}
        </span>
      </div>

      {trackerStats && (
        <Card className="p-3 text-xs space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold">Tracker (qualidade dos KPIs)</span>
            <span>
              Tentativas: <strong className="tabular-nums">{trackerStats.totals.attempted.toLocaleString('pt-BR')}</strong>
            </span>
            <span>
              Enviadas: <strong className="tabular-nums">{trackerStats.totals.sent.toLocaleString('pt-BR')}</strong>
            </span>
            <span>
              Dedupe (800ms):{' '}
              <strong
                className={`tabular-nums ${
                  dedupeAlert ? (dedupeAlert.kind === 'high' ? 'text-amber-600' : 'text-red-600') : ''
                }`}
              >
                {trackerStats.totals.deduped.toLocaleString('pt-BR')}
              </strong>
              <span className="text-muted-foreground"> ({dedupePct}%)</span>
            </span>
            <span>
              Descartadas (falha): <strong className="tabular-nums">{trackerStats.totals.dropped.toLocaleString('pt-BR')}</strong>
            </span>
            <span>
              Lotes: <strong className="tabular-nums">{trackerStats.totals.batches.toLocaleString('pt-BR')}</strong>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-[11px] text-muted-foreground">Limiar dedupe %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-7 w-16"
                value={draftMin}
                onChange={(e) => setDraftMin(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-7 w-16"
                value={draftMax}
                onChange={(e) => setDraftMax(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={
                  saveMut.isPending ||
                  draftMin > draftMax ||
                  (draftMin === dedupeMin && draftMax === dedupeMax)
                }
                onClick={() => saveMut.mutate({ min: draftMin, max: draftMax })}
              >
                {saveMut.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
              {thresholdsQuery.data?.updatedAt && (
                <span className="text-[10px] text-muted-foreground">
                  salvo {new Date(thresholdsQuery.data.updatedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>

          </div>
          {dedupeAlert && (
            <div
              className={`flex gap-2 rounded p-2 text-xs border ${
                dedupeAlert.kind === 'high'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                  : 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">
                  {dedupeAlert.kind === 'high'
                    ? 'Risco de subcontagem de cliques'
                    : 'Risco de supercontagem de cliques'}
                </div>
                <div>{dedupeAlert.msg}</div>
                <ul className="list-disc ml-4 mt-1">
                  {dedupeAlert.causes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b p-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          <div className="font-semibold text-sm">Histórico de cruzamentos do limiar de dedupe</div>
          <span className="text-xs text-muted-foreground ml-2">
            Registrado automaticamente toda vez que o dedupe % muda de estado (abaixo / normal / acima) para os seus limites.
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => eventsQuery.refetch()}
          >
            Atualizar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Quando</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">De → Para</th>
                <th className="text-right px-3 py-2">Dedupe %</th>
                <th className="text-right px-3 py-2">Limiar (min–max)</th>
                <th className="text-right px-3 py-2">Janela</th>
                <th className="text-right px-3 py-2">Amostras</th>
              </tr>
            </thead>
            <tbody>
              {(eventsQuery.data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    {eventsQuery.isLoading
                      ? 'Carregando…'
                      : 'Nenhum cruzamento registrado ainda.'}
                  </td>
                </tr>
              )}
              {(eventsQuery.data?.rows ?? []).map((e) => {
                const icon =
                  e.state === 'above' ? (
                    <ArrowUpCircle className="w-3.5 h-3.5 text-amber-600" />
                  ) : e.state === 'below' ? (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  )
                return (
                  <Fragment key={e.id}>
                  <tr className="border-t">

                    <td className="px-3 py-2 tabular-nums align-top">
                      {new Date(e.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-flex items-center gap-1">
                        {icon} {e.state}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground align-top">
                      {e.prev_state ?? '—'} → <strong>{e.state}</strong>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums align-top">{Number(e.dedupe_pct).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground align-top">
                      {Number(e.min_pct).toFixed(0)} – {Number(e.max_pct).toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums align-top">{e.days_window}d</td>
                    <td className="px-3 py-2 text-right tabular-nums align-top">{e.samples}</td>
                  </tr>
                  {e.causes && (e.causes.findings?.length ?? 0) > 0 && (
                    <tr key={e.id + '-causes'} className="bg-muted/20">
                      <td colSpan={7} className="px-3 pb-3 pt-1">
                        <div className="text-[11px] text-muted-foreground italic mb-1">
                          {e.causes.summary}
                        </div>
                        <ul className="space-y-1">
                          {e.causes.findings.map((f) => (
                            <li
                              key={f.code}
                              className={`text-[11px] flex items-start gap-1 ${
                                f.severity === 'high'
                                  ? 'text-red-700 dark:text-red-400'
                                  : f.severity === 'warn'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              <span className="font-mono opacity-60">[{f.severity}]</span>
                              <span>{f.label}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b p-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          <div className="font-semibold text-sm">Auditoria — alterações de limiar</div>
          <span className="text-xs text-muted-foreground ml-2">
            Quem alterou o limiar mínimo/máximo de dedupe, com valores antigos e novos.
          </span>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => auditQuery.refetch()}>
            Atualizar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Quando (updated_at)</th>
                <th className="text-left px-3 py-2">Alterado por (changed_by)</th>
                <th className="text-left px-3 py-2">Usuário-alvo</th>
                <th className="text-right px-3 py-2">Antigo (min–max)</th>
                <th className="text-right px-3 py-2">Novo (min–max)</th>
                <th className="text-left px-3 py-2">Δ</th>
              </tr>
            </thead>
            <tbody>
              {(auditQuery.data?.rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    {auditQuery.isLoading ? 'Carregando…' : 'Nenhuma alteração registrada.'}
                  </td>
                </tr>
              )}
              {(auditQuery.data?.rows ?? []).map((a) => {
                const oldStr = a.old_min_pct === null || a.old_max_pct === null
                  ? '—'
                  : `${Number(a.old_min_pct).toFixed(0)} – ${Number(a.old_max_pct).toFixed(0)}`
                const newStr = `${Number(a.new_min_pct).toFixed(0)} – ${Number(a.new_max_pct).toFixed(0)}`
                const dMin = a.old_min_pct === null ? null : Number(a.new_min_pct) - Number(a.old_min_pct)
                const dMax = a.old_max_pct === null ? null : Number(a.new_max_pct) - Number(a.old_max_pct)
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2 tabular-nums">{new Date(a.changed_at).toLocaleString('pt-BR')}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{a.changed_by.slice(0, 8)}…</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{a.target_user.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{oldStr}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{newStr}</td>
                    <td className="px-3 py-2 text-muted-foreground text-[11px]">
                      {dMin === null
                        ? 'primeira definição'
                        : `min ${dMin >= 0 ? '+' : ''}${dMin.toFixed(0)} · max ${(dMax ?? 0) >= 0 ? '+' : ''}${(dMax ?? 0).toFixed(0)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>






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
                  <Td className="text-right tabular-nums">{scopedConverted(r)}</Td>
                  <Td className="text-right tabular-nums font-medium">
                    {convPct(scopedConverted(r), r.intents)}
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
