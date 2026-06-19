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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { getCatalogIntentsAudit } from '@/lib/catalogo.functions'
import { downloadCsv } from '@/lib/exports'

type IntentRow = {
  id: string
  macro_slug: string | null
  subnicho_slug: string | null
  plan_tier: string | null
  selected_modules: string[] | null
  created_at: string
  consumed_at: string | null
  converted_at: string | null
  conversion_kind: string | null
  reuse_attempts: number | null
  last_reuse_attempt_at: string | null
  validated_fields: Record<string, boolean> | null
}


export const Route = createFileRoute('/_authenticated/admin/catalog-intents')({
  head: () => ({ meta: [{ title: 'Auditoria de Intents — Admin' }] }),
  component: CatalogIntentsAuditPage,
})

const KINDS = ['onboarding_completed', 'contract_signed', 'payment_captured'] as const
const REQUIRED = ['goal', 'niche', 'mainPain', 'metric', 'target'] as const
const RANGES = [7, 30, 90] as const
const PAGE_SIZES = [25, 50, 100, 200] as const

type SortKey = 'macro' | 'subnicho' | 'plano' | 'created_at' | 'converted_at'
type SortDir = 'asc' | 'desc'

function CatalogIntentsAuditPage() {
  const fetchFn = useServerFn(getCatalogIntentsAudit)
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [onlyConverted, setOnlyConverted] = useState(false)
  const [kinds, setKinds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(50)
  const [selected, setSelected] = useState<IntentRow | null>(null)


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

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? rows.filter(
          (r) =>
            (r.macro_slug ?? '').toLowerCase().includes(q) ||
            (r.subnicho_slug ?? '').toLowerCase().includes(q) ||
            (r.plan_tier ?? '').toLowerCase().includes(q) ||
            (r.id ?? '').toLowerCase().includes(q),
        )
      : rows.slice()
    const dir = sortDir === 'asc' ? 1 : -1
    const get = (r: (typeof rows)[number]): string => {
      switch (sortKey) {
        case 'macro':
          return r.macro_slug ?? ''
        case 'subnicho':
          return r.subnicho_slug ?? ''
        case 'plano':
          return r.plan_tier ?? ''
        case 'created_at':
          return r.created_at ?? ''
        case 'converted_at':
          return r.converted_at ?? ''
      }
    }
    filtered.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va === vb) return 0
      // empties last for desc, first for asc
      if (!va) return 1
      if (!vb) return -1
      return va < vb ? -1 * dir : 1 * dir
    })
    return filtered
  }, [rows, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'created_at' || k === 'converted_at' ? 'desc' : 'asc')
    }
  }

  function exportCsv(scope: 'page' | 'all') {
    const source = scope === 'page' ? paginated : filteredSorted
    downloadCsv(
      `catalog-intents-audit-${days}d-${scope}-${new Date().toISOString().slice(0, 10)}.csv`,
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
      source.map((r) => {
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
    setPage(1)
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
                onClick={() => {
                  setDays(d)
                  setPage(1)
                }}
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
            onCheckedChange={(c) => {
              setOnlyConverted(c === true)
              setPage(1)
            }}
          />
          Apenas convertidas
        </label>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv('page')}
            disabled={paginated.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" /> CSV (página)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv('all')}
            disabled={filteredSorted.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" /> CSV (filtrado)
          </Button>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label className="text-xs">Buscar (macro, subnicho, plano, id)</Label>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="ex: saude / clinicas / full"
          />
        </div>
        <div>
          <Label className="text-xs">Ordenar por</Label>
          <div className="flex gap-2 mt-1">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Criada</SelectItem>
                <SelectItem value="converted_at">Convertida</SelectItem>
                <SelectItem value="macro">Macro</SelectItem>
                <SelectItem value="subnicho">Subnicho</SelectItem>
                <SelectItem value="plano">Plano</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              aria-label={sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">Por página</Label>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v) as (typeof PAGE_SIZES)[number]); setPage(1) }}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold">
              {isLoading
                ? 'Carregando…'
                : `${filteredSorted.length} intents (de ${rows.length} no período)`}
            </div>
            <div className="text-xs text-muted-foreground">
              Página {safePage} de {totalPages} · {paginated.length} exibidas
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <SortableTh active={sortKey === 'macro'} dir={sortDir} onClick={() => toggleSort('macro')}>
                  Macro / Sub / Plano
                </SortableTh>
                <SortableTh active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')}>
                  Criada
                </SortableTh>
                <th className="text-left px-3 py-2">Aberta</th>
                <SortableTh active={sortKey === 'converted_at'} dir={sortDir} onClick={() => toggleSort('converted_at')}>
                  Convertida
                </SortableTh>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Campos válidos (Step 4)</th>
                <th className="text-right px-3 py-2">Reusos</th>
                <th className="text-left px-3 py-2">Último reuso</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Nenhuma intent no período/filtros.
                  </td>
                </tr>
              )}
              {paginated.map((r) => {
                const v = (r.validated_fields ?? {}) as Record<string, boolean>
                return (
                  <tr
                    key={r.id}
                    className="border-t align-top cursor-pointer hover:bg-muted/30"
                    onClick={() => setSelected(r as IntentRow)}
                  >

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

function SortableTh({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean
  dir: SortDir
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <th className="text-left px-3 py-2">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground font-medium' : ''}`}
      >
        {children}
        {active && (dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  )
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
