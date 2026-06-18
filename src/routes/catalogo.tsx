import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { ArrowRight, Check, Layers, Workflow, Sparkles, Lock, Receipt, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { PublicHeader } from '@/components/marketing/PublicHeader'
import { PublicFooter } from '@/components/marketing/PublicFooter'
import { getCatalog, saveCatalogIntent, trackCatalogEvent } from '@/lib/catalogo.functions'
import { CORE_BASE, PLAN_TIERS, type PlanTier } from '@/lib/niche-plans'

const STORAGE_KEY = 'impulsionando.catalogo.selection.v1'
type Persisted = {
  macroSlug: string | null
  subId: string | null
  selectionByTier: Record<PlanTier, string[]>
}
function loadPersisted(): Persisted | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}
function sessionToken(): string {
  if (typeof window === 'undefined') return 'ssr'
  const k = 'impulsionando.session.token'
  let t = localStorage.getItem(k)
  if (!t) {
    t = crypto.randomUUID()
    localStorage.setItem(k, t)
  }
  return t
}

const catalogQuery = queryOptions({
  queryKey: ['catalogo', 'v3'],
  queryFn: () => getCatalog(),
  staleTime: 5 * 60 * 1000,
})

export const Route = createFileRoute('/catalogo')({
  head: () => ({
    meta: [
      { title: 'Planos por nicho — Impulsionando' },
      {
        name: 'description',
        content:
          'Primeiro o nicho, depois o plano. Core Base comum + módulos especializados do seu segmento. Essencial, Ideal e Full.',
      },
      { property: 'og:title', content: 'Planos por nicho — Impulsionando' },
      {
        property: 'og:description',
        content:
          'Escolha seu Macro Nicho e Subnicho. Os planos se adaptam aos módulos do seu segmento.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://impulsionando.com.br/catalogo' }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: CatalogoPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-destructive font-medium">Não foi possível carregar o catálogo.</p>
      <p className="text-xs text-muted-foreground mt-2">{(error as Error)?.message}</p>
    </div>
  ),
})

function CatalogoPage() {
  const { data } = useSuspenseQuery(catalogQuery)
  const { macros, subs, mappings, mappedMacros } = data
  const mappedSet = useMemo(() => new Set(mappedMacros), [mappedMacros])
  const saveIntent = useServerFn(saveCatalogIntent)
  const track = useServerFn(trackCatalogEvent)

  const [macroSlug, setMacroSlug] = useState<string | null>(null)
  const [subId, setSubId] = useState<string | null>(null)
  const [selectionByTier, setSelectionByTier] = useState<Record<PlanTier, string[]>>({
    essencial: [],
    ideal: [],
    full: [],
  })
  const [submitting, setSubmitting] = useState<PlanTier | null>(null)
  const restoredRef = useRef(false)
  const lastViewedMacroRef = useRef<string | null>(null)

  // Restore persisted selection once
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const p = loadPersisted()
    if (!p) return
    if (p.macroSlug && mappedSet.has(p.macroSlug)) {
      setMacroSlug(p.macroSlug)
      if (p.subId && subs.some((s) => s.id === p.subId)) setSubId(p.subId)
      if (p.selectionByTier) setSelectionByTier(p.selectionByTier)
      toast.success('Suas escolhas anteriores foram restauradas.', { duration: 2500 })
    }
  }, [mappedSet, subs])

  // Persist on every change
  useEffect(() => {
    if (!restoredRef.current || typeof window === 'undefined') return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ macroSlug, subId, selectionByTier }),
    )
  }, [macroSlug, subId, selectionByTier])

  function trackEvent(eventName: string, extra: Record<string, unknown> = {}) {
    track({
      data: {
        eventName,
        macroSlug: macroSlug ?? null,
        subnichoSlug: subs.find((s) => s.id === subId)?.slug ?? null,
        sessionToken: sessionToken(),
        ...extra,
      },
    }).catch(() => {})
  }

  function clearSelection() {
    setMacroSlug(null)
    setSubId(null)
    setSelectionByTier({ essencial: [], ideal: [], full: [] })
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }


  const selectedMacro = useMemo(
    () => macros.find((m) => m.slug === macroSlug) ?? null,
    [macros, macroSlug],
  )
  const visibleSubs = useMemo(
    () => (selectedMacro ? subs.filter((s) => s.macro_id === selectedMacro.id) : []),
    [subs, selectedMacro],
  )
  const selectedSub = useMemo(
    () => visibleSubs.find((s) => s.id === subId) ?? null,
    [visibleSubs, subId],
  )

  const tierMap = useMemo(() => {
    const map: Record<PlanTier, (typeof mappings)[number] | undefined> = {
      essencial: undefined,
      ideal: undefined,
      full: undefined,
    }
    if (!selectedMacro) return map
    for (const m of mappings) {
      if (m.macro_slug === selectedMacro.slug) {
        map[m.plan_tier as PlanTier] = m
      }
    }
    return map
  }, [mappings, selectedMacro])

  function toggleModule(tier: PlanTier, module: string, limit: number) {
    setSelectionByTier((prev) => {
      const current = prev[tier]
      if (current.includes(module)) {
        return { ...prev, [tier]: current.filter((m) => m !== module) }
      }
      if (limit > 0 && current.length >= limit) {
        toast.warning(`Você já escolheu ${limit} módulo${limit > 1 ? 's' : ''} neste plano.`)
        return prev
      }
      trackEvent('select_module', { planTier: tier, selectedModules: [module] })
      return { ...prev, [tier]: [...current, module] }
    })
  }

  // Fire view_plans once per (macro,sub) pairing
  useEffect(() => {
    if (!selectedMacro || !selectedSub) return
    const key = `${selectedMacro.slug}|${selectedSub.slug}`
    if (lastViewedMacroRef.current === key) return
    lastViewedMacroRef.current = key
    trackEvent('view_plans')
     
  }, [selectedMacro, selectedSub])

  async function handleContract(tier: PlanTier) {
    if (!selectedMacro || !selectedSub) return
    const mapping = tierMap[tier]
    if (!mapping) return
    const picked = tier === 'full' ? mapping.modules : selectionByTier[tier]
    if (tier !== 'full' && mapping.choose_limit > 0 && picked.length === 0) {
      toast.error('Selecione ao menos um módulo para continuar.')
      return
    }
    setSubmitting(tier)
    try {
      trackEvent('contract_click', { planTier: tier, selectedModules: picked })
      const res = await saveIntent({
        data: {
          macroSlug: selectedMacro.slug,
          subnichoSlug: selectedSub.slug,
          planTier: tier,
          selectedModules: picked,
          source: 'catalogo',
        },
      })
      trackEvent('intent_saved', { planTier: tier, selectedModules: picked, intentId: res.id })
      window.location.href = `/onboarding?intent=${encodeURIComponent(res.id)}`
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? 'Não foi possível salvar sua seleção.')
      setSubmitting(null)
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs mb-4">
            <Layers className="w-3.5 h-3.5" /> Planos por nicho
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            Primeiro o nicho. Depois o plano.
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl">
            Todo plano vem com o <strong>Core Base</strong>. Os módulos especializados mudam
            conforme o seu segmento — sem poluição visual, sem oferta genérica.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10">
        {/* STEP 1 — MACRO */}
        <Step n={1} title="Escolha o macro nicho" icon={Layers} done={!!macroSlug}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {macros.map((m) => {
              const active = macroSlug === m.slug
              const supported = mappedSet.has(m.slug)
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!supported}
                  onClick={() => {
                    setMacroSlug(m.slug)
                    setSubId(null)
                    setSelectionByTier({ essencial: [], ideal: [], full: [] })
                  }}
                  aria-pressed={active}
                  className={`text-left p-4 rounded-lg border transition ${
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : supported
                        ? 'border-border hover:border-primary/50'
                        : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold text-sm sm:text-base">{m.nome}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {supported ? 'Planos disponíveis' : 'Em breve'}
                  </div>
                </button>
              )
            })}
          </div>
        </Step>

        {/* STEP 2 — SUB */}
        {selectedMacro && (
          <Step n={2} title="Escolha o subnicho" icon={Workflow} done={!!subId}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleSubs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubId(s.id)}
                  aria-pressed={subId === s.id}
                  className={`text-left p-3 rounded-lg border text-sm transition ${
                    subId === s.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {s.nome}
                </button>
              ))}
            </div>
          </Step>
        )}

        {/* STEP 3 — PLANS */}
        {selectedMacro && selectedSub && (
          <section aria-labelledby="planos-titulo" className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold"
                aria-hidden
              >
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h2 id="planos-titulo" className="text-xl sm:text-2xl font-semibold">
                  Planos para {selectedSub.nome}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMacro.nome} · módulos específicos do seu segmento
                </p>
              </div>
            </div>

            <Card className="p-5 bg-muted/30 border-dashed">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden />
                <div className="flex-1">
                  <div className="font-semibold mb-2">
                    Core Base — incluso em todos os planos
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CORE_BASE.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[11px] font-normal">
                        <Check className="w-3 h-3 mr-1" /> {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {PLAN_TIERS.map((p) => (
                <PlanCard
                  key={p.tier}
                  meta={p}
                  mapping={tierMap[p.tier]}
                  selection={selectionByTier[p.tier]}
                  onToggle={(mod, limit) => toggleModule(p.tier, mod, limit)}
                  submitting={submitting === p.tier}
                  onContract={() => handleContract(p.tier)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}

interface PlanMeta {
  tier: PlanTier
  name: string
  price: string
  tagline: string
}

interface MappingRow {
  macro_slug: string
  plan_tier: string
  choose_limit: number
  modules: string[]
  base_price_label: string | null
}

function PlanCard({
  meta,
  mapping,
  selection,
  onToggle,
  submitting,
  onContract,
}: {
  meta: PlanMeta
  mapping: MappingRow | undefined
  selection: string[]
  onToggle: (module: string, limit: number) => void
  submitting: boolean
  onContract: () => void
}) {
  const highlighted = meta.tier === 'ideal'
  const isFull = meta.tier === 'full'
  const price = mapping?.base_price_label ?? meta.price
  const limit = mapping?.choose_limit ?? 0
  const modules = mapping?.modules ?? []
  const visibleSelected = isFull ? modules : selection

  return (
    <Card
      className={`p-6 flex flex-col h-full ${
        highlighted ? 'ring-2 ring-primary shadow-lg relative' : ''
      }`}
    >
      {highlighted && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Recomendado</Badge>
      )}

      <div className="font-semibold text-lg">{meta.name}</div>
      <div className="text-2xl font-bold mt-1">{price}</div>
      <p className="text-sm text-muted-foreground mt-1">{meta.tagline}</p>

      {/* Module selector */}
      <div className="mt-5 flex-1 space-y-3">
        {!mapping ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum mapeamento para este plano ainda.
          </p>
        ) : isFull ? (
          <div className="text-sm">
            <div className="font-medium mb-2">Todos os módulos do nicho</div>
            <ul className="space-y-1.5">
              {modules.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden /> {m}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-sm">
            <div className="font-medium mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              {limit === 1
                ? 'Escolha 1 módulo principal'
                : `Escolha até ${limit} módulos`}
            </div>
            <div className="space-y-2" role="group" aria-label={`Módulos do ${meta.name}`}>
              {modules.map((m) => {
                const id = `${meta.tier}-${m}`
                const checked = selection.includes(m)
                const disabled = !checked && limit > 0 && selection.length >= limit
                return (
                  <div key={m} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => onToggle(m, limit)}
                    />
                    <Label
                      htmlFor={id}
                      className={`text-sm cursor-pointer ${
                        disabled ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {m}
                    </Label>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {selection.length}/{limit} selecionado{selection.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="mt-5 rounded-md border bg-muted/30 p-3 text-xs space-y-1">
        <div className="font-medium flex items-center gap-1.5 text-foreground">
          <Receipt className="w-3.5 h-3.5" aria-hidden /> O que está incluso
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Core Base</span>
          <span>{CORE_BASE.length} módulos</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Módulos do nicho {isFull ? '(todos)' : 'selecionados'}
          </span>
          <span>{visibleSelected.length}</span>
        </div>
        <div className="flex justify-between border-t pt-1 mt-1 font-semibold text-foreground">
          <span>Total no plano</span>
          <span>{CORE_BASE.length + visibleSelected.length} módulos</span>
        </div>
      </div>

      <Button
        className="mt-4 w-full"
        onClick={onContract}
        disabled={submitting || !mapping}
      >
        {submitting ? 'Salvando…' : `Contratar ${meta.name}`}{' '}
        {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
      </Button>
    </Card>
  )
}

function Step({
  n,
  title,
  icon: Icon,
  done,
  children,
}: {
  n: number
  title: string
  icon: React.ComponentType<{ className?: string }>
  done: boolean
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
          aria-hidden
        >
          {done ? <Check className="w-4 h-4" /> : n}
        </div>
        <h2 id={`step-${n}`} className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" aria-hidden /> {title}
        </h2>
      </div>
      {children}
    </section>
  )
}
