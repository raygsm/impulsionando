import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { PageHeader } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { getCatalogIntentsAudit } from '@/lib/catalogo.functions'
import { downloadCsv } from '@/lib/exports'

export const Route = createFileRoute('/_authenticated/admin/catalog-intents')({
  head: () => ({ meta: [{ title: 'Auditoria de Intents — Admin' }] }),
  component: CatalogIntentsAuditPage,
})

const KINDS = ['onboarding_completed', 'contract_signed', 'payment_captured'] as const
const REQUIRED = ['goal', 'niche', 'mainPain', 'metric', 'target'] as const
const RANGES = [7, 30, 90] as const

function CatalogIntentsAuditPage() {
  const fetchFn = useServerFn(getCatalogIntentsAudit)
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [onlyConverted, setOnlyConverted] = useState(false)
  const [kinds, setKinds] = useState<string[]>([])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'catalog-intents-audit', days, onlyConverted, kinds.join(',')],
    queryFn: () =>
      fetchFn({
        data: {
          days,
          onlyConverted,
          conversionKinds: kinds.length > 0 ? kinds : undefined,
          limit: 500,
        },
      }),
  })

  const rows = data?.rows ?? []

  function exportCsv() {
    downloadCsv(
      `catalog-intents-audit-${days}d-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'id',
        'macro',
        'subnicho',
        'plano',
        'modulos',
        'created_at',
        'consumed_at',
        'converted_at',
        'conversion_kind',
        'reuse_attempts',
        'last_reuse_attempt_at',
        'validated_fields',
        'missing_fields',
      ],
      rows.map((r) => {
        const v = (r.validated_fields ?? {}) as Record<string, boolean>
        const missing = REQUIRED.filter((k) => !v[k]).join(';')
        return {
          id: r.id,
          macro: r.macro_slug ?? '',
          subnicho: r.subnicho_slug ?? '',
          plano: r.plan_tier ?? '',
          modulos: (r.selected_modules ?? []).join(';'),
          created_at: r.created_at,
          consumed_at: r.consumed_at ?? '',
          converted_at: r.converted_at ?? '',
          conversion_kind: r.conversion_kind ?? '',
          reuse_attempts: r.reuse_attempts ?? 0,
          last_reuse_attempt_at: r.last_reuse_attempt_at ?? '',
          validated_fields: JSON.stringify(v),
          missing_fields: missing,
        }
      }),
    )
  }

  function toggleKind(k: string) {
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Auditoria de Intents do Catálogo"
        description="Lista detalhada das intents com timestamps de consumo, conversão, reusos e o snapshot exato dos campos válidos no momento em que cada conversão foi marcada."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-xs">Janela</Label>
          <div className="flex gap-2 mt-1">
            {RANGES.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? 'default' : 'outline'}
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Tipo de conversão</Label>
          <div className="flex gap-3 mt-2">
            {KINDS.map((k) => (
              <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <Checkbox checked={kinds.includes(k)} onCheckedChange={() => toggleKind(k)} />
                {k}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <Checkbox
            checked={onlyConverted}
            onCheckedChange={(c) => setOnlyConverted(c === true)}
          />
          Apenas convertidas
        </label>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-1.5" /> Exportar CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4">
          <div className="font-semibold">{isLoading ? 'Carregando…' : `${rows.length} intents`}</div>
          <div className="text-xs text-muted-foreground">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Macro / Sub / Plano</th>
                <th className="text-left px-3 py-2">Criada</th>
                <th className="text-left px-3 py-2">Aberta</th>
                <th className="text-left px-3 py-2">Convertida</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Campos válidos (Step 4)</th>
                <th className="text-right px-3 py-2">Reusos</th>
                <th className="text-left px-3 py-2">Último reuso</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Nenhuma intent no período/filtros.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const v = (r.validated_fields ?? {}) as Record<string, boolean>
                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.macro_slug ?? '—'} / {r.subnicho_slug ?? '—'}</div>
                      <Badge variant="secondary" className="mt-1 capitalize">{r.plan_tier ?? '—'}</Badge>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(r.consumed_at)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(r.converted_at)}</td>
                    <td className="px-3 py-2">
                      {r.conversion_kind ? (
                        <Badge>{r.conversion_kind}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {REQUIRED.map((k) => (
                          <span
                            key={k}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${
                              v[k]
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {v[k] ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5" />
                            )}
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {(r.reuse_attempts ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3 h-3" /> {r.reuse_attempts}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {fmt(r.last_reuse_attempt_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
