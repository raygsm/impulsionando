import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Loader2, Save } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PageHeader } from '@/components/app/PageElements'
import { getCatalog, upsertNichePlanModules } from '@/lib/catalogo.functions'
import type { PlanTier } from '@/lib/niche-plans'

export const Route = createFileRoute('/_authenticated/admin/niche-plans')({
  head: () => ({ meta: [{ title: 'Planos por nicho — Admin' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminNichePlansPage,
})

const TIERS: PlanTier[] = ['essencial', 'ideal', 'full']

function AdminNichePlansPage() {
  const qc = useQueryClient()
  const upsert = useServerFn(upsertNichePlanModules)

  const { data, isLoading } = useQuery({
    queryKey: ['catalogo', 'admin'],
    queryFn: () => getCatalog(),
  })

  const [selectedMacro, setSelectedMacro] = useState<string | null>(null)
  const [draft, setDraft] = useState<
    Record<PlanTier, { chooseLimit: number; modules: string; basePriceLabel: string }>
  >({
    essencial: { chooseLimit: 1, modules: '', basePriceLabel: '0,5 Salário Mínimo' },
    ideal: { chooseLimit: 3, modules: '', basePriceLabel: '1 Salário Mínimo' },
    full: { chooseLimit: 0, modules: '', basePriceLabel: '2 Salários Mínimos' },
  })
  const [saving, setSaving] = useState<PlanTier | null>(null)

  const macros = data?.macros ?? []
  const mappings = data?.mappings ?? []

  const macroMappings = useMemo(() => {
    if (!selectedMacro) return null
    const map: Record<PlanTier, (typeof mappings)[number] | undefined> = {
      essencial: undefined,
      ideal: undefined,
      full: undefined,
    }
    for (const m of mappings) {
      if (m.macro_slug === selectedMacro) map[m.plan_tier as PlanTier] = m
    }
    return map
  }, [mappings, selectedMacro])

  function loadMacro(slug: string) {
    setSelectedMacro(slug)
    const map: Record<PlanTier, (typeof mappings)[number] | undefined> = {
      essencial: undefined,
      ideal: undefined,
      full: undefined,
    }
    for (const m of mappings) if (m.macro_slug === slug) map[m.plan_tier as PlanTier] = m
    setDraft({
      essencial: {
        chooseLimit: map.essencial?.choose_limit ?? 1,
        modules: (map.essencial?.modules ?? []).join('\n'),
        basePriceLabel: map.essencial?.base_price_label ?? '0,5 Salário Mínimo',
      },
      ideal: {
        chooseLimit: map.ideal?.choose_limit ?? 3,
        modules: (map.ideal?.modules ?? []).join('\n'),
        basePriceLabel: map.ideal?.base_price_label ?? '1 Salário Mínimo',
      },
      full: {
        chooseLimit: map.full?.choose_limit ?? 0,
        modules: (map.full?.modules ?? []).join('\n'),
        basePriceLabel: map.full?.base_price_label ?? '2 Salários Mínimos',
      },
    })
  }

  async function save(tier: PlanTier) {
    if (!selectedMacro) return
    const modules = draft[tier].modules
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean)
    setSaving(tier)
    try {
      await upsert({
        data: {
          macroSlug: selectedMacro,
          planTier: tier,
          chooseLimit: draft[tier].chooseLimit,
          modules,
          basePriceLabel: draft[tier].basePriceLabel,
        },
      })
      toast.success(`Plano ${tier} salvo.`)
      await qc.invalidateQueries({ queryKey: ['catalogo'] })
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? 'Falha ao salvar.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Planos por nicho"
        subtitle="Gerencie os módulos especializados de cada macro nicho por plano (Essencial, Ideal, Full)."
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <Card className="p-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground px-2 pb-2">
              Macro nichos
            </div>
            <ul className="space-y-1">
              {macros.map((m) => {
                const hasAny = mappings.some((x) => x.macro_slug === m.slug)
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => loadMacro(m.slug)}
                      aria-pressed={selectedMacro === m.slug}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${
                        selectedMacro === m.slug
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span>{m.nome}</span>
                      {!hasAny && (
                        <Badge variant="outline" className="text-[10px]">
                          Em breve
                        </Badge>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Editor */}
          <div className="space-y-4">
            {!selectedMacro && (
              <Card className="p-6 text-sm text-muted-foreground">
                Escolha um macro nicho ao lado para editar os planos.
              </Card>
            )}
            {selectedMacro &&
              TIERS.map((tier) => (
                <Card key={tier} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold capitalize">Plano {tier}</div>
                      <div className="text-xs text-muted-foreground">
                        {macroMappings?.[tier] ? 'Mapeamento existente' : 'Ainda sem mapeamento'}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => save(tier)} disabled={saving === tier}>
                      {saving === tier ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`price-${tier}`}>Rótulo de preço</Label>
                      <Input
                        id={`price-${tier}`}
                        value={draft[tier].basePriceLabel}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            [tier]: { ...d[tier], basePriceLabel: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`limit-${tier}`}>
                        Limite de escolha (0 = todos no Full)
                      </Label>
                      <Input
                        id={`limit-${tier}`}
                        type="number"
                        min={0}
                        max={50}
                        value={draft[tier].chooseLimit}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            [tier]: {
                              ...d[tier],
                              chooseLimit: Math.max(
                                0,
                                Math.min(50, Number(e.target.value) || 0),
                              ),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`mods-${tier}`}>
                      Módulos (um por linha)
                    </Label>
                    <Textarea
                      id={`mods-${tier}`}
                      rows={6}
                      placeholder={'Agenda\nProntuário\nTeleconsulta'}
                      value={draft[tier].modules}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [tier]: { ...d[tier], modules: e.target.value },
                        }))
                      }
                    />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
