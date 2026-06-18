import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query'
import { ArrowRight, Check, Layers, Sparkles, Package, Workflow } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublicHeader } from '@/components/marketing/PublicHeader'
import { PublicFooter } from '@/components/marketing/PublicFooter'
import { getCatalog } from '@/lib/catalogo.functions'

const catalogQuery = queryOptions({
  queryKey: ['catalogo', 'v1'],
  queryFn: () => getCatalog(),
  staleTime: 5 * 60 * 1000,
})

export const Route = createFileRoute('/catalogo')({
  head: () => ({
    meta: [
      { title: 'Catálogo Impulsionando — Macro Nicho, Subnicho, Template e Plano' },
      {
        name: 'description',
        content:
          'Monte sua assinatura em 4 passos: escolha o macro nicho, o subnicho, o template e o plano. Capacidade e módulos automáticos.',
      },
      { property: 'og:title', content: 'Catálogo Impulsionando' },
      {
        property: 'og:description',
        content: 'Macro Nicho → Subnicho → Template → Plano. Simples para escolher, escalável por design.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://impulsionando.com.br/catalogo' }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: CatalogoPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <p className="text-destructive">Não foi possível carregar o catálogo.</p>
      <p className="text-xs text-muted-foreground mt-2">{(error as Error)?.message}</p>
    </div>
  ),
})

function CatalogoPage() {
  const { data } = useSuspenseQuery(catalogQuery)
  const { macros, subs, templates, plans } = data

  const [macroId, setMacroId] = useState<string | null>(macros[0]?.id ?? null)
  const [subId, setSubId] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [planCode, setPlanCode] = useState<string | null>(null)

  const visibleSubs = useMemo(() => subs.filter((s) => s.macro_id === macroId), [subs, macroId])
  const visibleTemplates = useMemo(
    () => templates.filter((t) => t.subnicho_id === subId),
    [templates, subId],
  )
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null
  const selectedPlan = plans.find((p) => p.code === planCode) ?? null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <section className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs mb-4">
            <Layers className="w-3.5 h-3.5" /> Catálogo Impulsionando
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            Monte a sua assinatura em 4 passos.
          </h1>
          <p className="mt-3 text-lg text-white/85 max-w-2xl">
            Macro Nicho → Subnicho → Template → Plano. A plataforma calcula capacidade, módulos e
            faturamento automaticamente.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Step 1 — Macro */}
        <Step n={1} title="Escolha o macro nicho" icon={Layers} done={!!macroId}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {macros.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMacroId(m.id)
                  setSubId(null)
                  setTemplateId(null)
                }}
                aria-pressed={macroId === m.id}
                className={`text-left p-4 rounded-lg border transition ${
                  macroId === m.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold">{m.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.slug}</div>
              </button>
            ))}
          </div>
        </Step>

        {/* Step 2 — Sub */}
        {macroId && (
          <Step n={2} title="Escolha o subnicho" icon={Workflow} done={!!subId}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleSubs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSubId(s.id)
                    setTemplateId(null)
                  }}
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

        {/* Step 3 — Template */}
        {subId && (
          <Step n={3} title="Escolha o template" icon={Package} done={!!templateId}>
            <div className="grid md:grid-cols-2 gap-4">
              {visibleTemplates.map((t) => (
                <Card
                  key={t.id}
                  className={`p-5 cursor-pointer transition ${
                    templateId === t.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setTemplateId(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setTemplateId(t.id)
                    }
                  }}
                  aria-pressed={templateId === t.id}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold">{t.nome}</h3>
                    {t.destaque && <Badge>Recomendado</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.descricao}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(t.modulos ?? []).map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </Step>
        )}

        {/* Step 4 — Plan */}
        {templateId && (
          <Step n={4} title="Escolha o plano" icon={Sparkles} done={!!planCode}>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const active = planCode === p.code
                return (
                  <Card
                    key={p.id}
                    className={`p-5 cursor-pointer transition ${
                      active ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setPlanCode(p.code)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setPlanCode(p.code)
                      }
                    }}
                    aria-pressed={active}
                  >
                    <div className="font-semibold text-lg">{p.name}</div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    )}
                    <div className="mt-3 text-2xl font-bold">
                      {p.recurring_amount
                        ? `R$ ${Number(p.recurring_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Sob consulta'}
                      <span className="text-xs font-normal text-muted-foreground">
                        {' '}
                        / {p.cycle ?? 'mês'}
                      </span>
                    </div>
                    {p.included_module_count != null && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {p.included_module_count} módulos inclusos
                        {p.extra_module_price ? ` · extra R$ ${p.extra_module_price}` : ''}
                      </div>
                    )}
                    {active && (
                      <div className="mt-3 text-sm text-primary flex items-center gap-1">
                        <Check className="w-4 h-4" /> Selecionado
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </Step>
        )}

        {/* Summary CTA */}
        {selectedTemplate && selectedPlan && (
          <Card className="p-6 bg-primary/5 border-primary/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Sua escolha</div>
                <div className="font-semibold text-lg">
                  {selectedTemplate.nome} · {selectedPlan.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(selectedTemplate.modulos ?? []).length} módulos no template ·{' '}
                  {selectedPlan.included_module_count ?? '?'} inclusos no plano
                </div>
              </div>
              <Button asChild size="lg">
                <a
                  href={`/onboarding?template=${encodeURIComponent(selectedTemplate.slug)}&plano=${encodeURIComponent(selectedPlan.code)}`}
                >
                  {selectedPlan.cta ?? 'Começar agora'} <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </Card>
        )}
      </main>

      <PublicFooter />
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
        <h2 id={`step-${n}`} className="text-xl font-semibold flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" /> {title}
        </h2>
      </div>
      {children}
    </section>
  )
}
