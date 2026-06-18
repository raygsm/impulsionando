import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { ArrowRight, Check, Layers, Workflow, Sparkles, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublicHeader } from '@/components/marketing/PublicHeader'
import { PublicFooter } from '@/components/marketing/PublicFooter'
import { getCatalog } from '@/lib/catalogo.functions'
import { CORE_BASE, PLAN_TIERS, PLANS_BY_MACRO, type PlanTier } from '@/lib/niche-plans'

const catalogQuery = queryOptions({
  queryKey: ['catalogo', 'v2'],
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
        content: 'Escolha seu Macro Nicho e Subnicho. Os planos se adaptam aos módulos do seu segmento.',
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
  const { macros, subs } = data

  const [macroSlug, setMacroSlug] = useState<string | null>(null)
  const [subId, setSubId] = useState<string | null>(null)

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

  const planSpec = selectedMacro ? PLANS_BY_MACRO[selectedMacro.slug] : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
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
              const supported = !!PLANS_BY_MACRO[m.slug]
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!supported}
                  onClick={() => {
                    setMacroSlug(m.slug)
                    setSubId(null)
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

        {/* STEP 3 — PLANOS POR NICHO */}
        {selectedMacro && selectedSub && planSpec && (
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

            {/* Core Base banner */}
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

            {/* Plans grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {PLAN_TIERS.map((p) => (
                <PlanCard
                  key={p.tier}
                  tier={p.tier}
                  name={p.name}
                  price={p.price}
                  tagline={p.tagline}
                  spec={planSpec}
                  subSlug={selectedSub.slug}
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

function PlanCard({
  tier,
  name,
  price,
  tagline,
  spec,
  subSlug,
}: {
  tier: PlanTier
  name: string
  price: string
  tagline: string
  spec: (typeof PLANS_BY_MACRO)[string]
  subSlug: string
}) {
  const highlighted = tier === 'ideal'
  return (
    <Card
      className={`p-6 flex flex-col h-full ${
        highlighted ? 'ring-2 ring-primary shadow-lg relative' : ''
      }`}
    >
      {highlighted && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Recomendado</Badge>
      )}

      <div className="font-semibold text-lg">{name}</div>
      <div className="text-2xl font-bold mt-1">{price}</div>
      <p className="text-sm text-muted-foreground mt-1">{tagline}</p>

      <div className="mt-5 flex-1 space-y-3">
        {tier === 'essencial' && (
          <ModuleList
            title="Escolha 1 módulo principal"
            modules={spec.essencialChoose1}
            limit={1}
          />
        )}
        {tier === 'ideal' && (
          <ModuleList title="Escolha até 3 módulos" modules={spec.idealChoose3} limit={3} />
        )}
        {tier === 'full' && (
          <div className="text-sm">
            <div className="font-medium mb-2">{spec.fullLabel}</div>
            <p className="text-xs text-muted-foreground">
              Sem limite de módulos especializados do nicho. Ideal para operações maduras e
              multi-unidade.
            </p>
          </div>
        )}
      </div>

      <Button asChild className="mt-5 w-full">
        <a
          href={`/onboarding?subnicho=${encodeURIComponent(subSlug)}&plano=${tier}`}
        >
          Contratar {name} <ArrowRight className="w-4 h-4 ml-2" />
        </a>
      </Button>
    </Card>
  )
}

function ModuleList({
  title,
  modules,
  limit,
}: {
  title: string
  modules: string[]
  limit: number
}) {
  return (
    <div className="text-sm">
      <div className="font-medium mb-2 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden /> {title}
      </div>
      <ul className="space-y-1.5">
        {modules.map((m) => (
          <li key={m} className="flex items-center gap-2 text-sm">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden /> {m}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground mt-2">
        Limite: até {limit} módulo{limit > 1 ? 's' : ''} do nicho.
      </p>
    </div>
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
