import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { startTrial } from '@/lib/contratar.functions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CheckCircle2, Sparkles, ShieldCheck, Crown, Users } from 'lucide-react'
import { OfficialChannelNotice } from '@/components/marketing/OfficialChannelNotice'
import { useMinimumWage } from '@/hooks/useCoreSetting'

type PlanoParam = 'essencial' | 'integrado' | 'avancado'
const VALID_PLANS: readonly PlanoParam[] = ['essencial', 'integrado', 'avancado'] as const

interface CheckoutPlanInfo {
  code: PlanoParam
  name: string
  displayName: string
  factor: number
  factorLabel: string
  highlight: boolean
}

const CHECKOUT_PLANS: readonly CheckoutPlanInfo[] = [
  { code: 'essencial', name: 'Essencial',  displayName: 'Essencial', factor: 0.5, factorLabel: '½ salário mínimo', highlight: false },
  { code: 'integrado', name: 'Integrado',  displayName: 'Ideal',     factor: 1,   factorLabel: '1 salário mínimo', highlight: true  },
  { code: 'avancado',  name: 'Avançado',   displayName: 'Full',      factor: 2,   factorLabel: '2 salários mínimos', highlight: false },
]

export const Route = createFileRoute('/contratar')({
  component: ContratarPage,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.plano === 'string' ? (search.plano as string) : undefined
    const plano = raw && (VALID_PLANS as readonly string[]).includes(raw) ? (raw as PlanoParam) : undefined
    return { plano } as { plano?: PlanoParam }
  },
  head: () => ({
    meta: [
      { title: 'Contratar — Impulsionando Tecnologia' },
      { name: 'description', content: 'Contrate agora ou experimente 7 dias grátis (opcional). Essencial, Ideal, Full ou Sob Medida.' },
    ],
  }),
})


function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ContratarPage() {
  const submitTrial = useServerFn(startTrial)
  const { plano } = Route.useSearch()
  const wage = useMinimumWage()
  const selectedInfo = plano ? CHECKOUT_PLANS.find((p) => p.code === plano) : undefined

  const [open, setOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanoParam | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    contact_name: '', contact_company: '', contact_email: '',
    contact_whatsapp: '', contact_doc: '', accept_terms: false,
  })

  const openTrial = (code: PlanoParam) => {
    setSelectedPlan(code)
    setOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !form.accept_terms) return
    setSubmitting(true)
    try {
      const res = await submitTrial({ data: { ...form, plan_code: selectedPlan } })
      if (res.ok) {
        toast.success('Trial criado! Verifique seu e-mail e WhatsApp.')
        setOpen(false)
        window.location.href = '/auth?mode=signup&email=' + encodeURIComponent(form.contact_email)
      } else {
        toast.error(res.message || 'Não foi possível iniciar o trial.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao iniciar trial.')
    } finally {
      setSubmitting(false)
    }
  }

  const businessPlans = CHECKOUT_PLANS.map((p) => ({
    ...p,
    monthly: wage * p.factor,
    setup: wage * p.factor,
    modules: p.code === 'essencial'
      ? '3 módulos inclusos'
      : p.code === 'integrado'
        ? 'Até 6 módulos do seu nicho'
        : 'Todos os módulos do nicho',
    minDays: p.code === 'essencial' ? 90 : p.code === 'integrado' ? 120 : 180,
  }))

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" /> Trial de 7 dias grátis é opcional
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Contrate agora e comece a usar imediatamente, ou experimente 7 dias grátis antes — sem cartão.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Preços atrelados ao salário mínimo vigente ({formatBRL(wage)}).
          </p>
        </header>

        {selectedInfo && (
          <section
            aria-labelledby="contratar-selected-heading"
            className="mb-10 max-w-3xl mx-auto"
            data-testid="contratar-selected-plan"
            data-plan-code={selectedInfo.code}
          >
            <Card className="border-primary shadow-lg">
              <CardHeader className="text-center">
                {selectedInfo.highlight && (
                  <Badge className="mx-auto mb-2" data-testid="contratar-selected-badge">
                    Recomendado
                  </Badge>
                )}
                <CardTitle
                  id="contratar-selected-heading"
                  className="text-2xl"
                  data-testid="contratar-selected-name"
                >
                  Plano {selectedInfo.displayName} selecionado
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-1 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  Preço vigente — {selectedInfo.factorLabel} (SM {formatBRL(wage)})
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-1">
                <div
                  className="text-4xl font-bold"
                  data-testid="contratar-selected-price"
                  data-price-cents={Math.round(wage * selectedInfo.factor * 100)}
                >
                  {formatBRL(wage * selectedInfo.factor)}
                </div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Planos empresariais */}
        <section aria-labelledby="planos-empresariais" className="mb-16">
          <h2 id="planos-empresariais" className="sr-only">Planos empresariais</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {businessPlans.map((p) => (
              <Card key={p.code} className={p.highlight ? 'border-primary shadow-lg relative' : 'relative'}>
                <CardHeader>
                  {p.highlight && <Badge className="w-fit mb-2">Recomendado</Badge>}
                  <CardTitle className="text-2xl">{p.displayName}</CardTitle>
                  <CardDescription>{p.factorLabel} do salário mínimo vigente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold">{formatBRL(p.monthly)}</div>
                    <div className="text-sm text-muted-foreground">/mês</div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Setup: {formatBRL(p.setup)}</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{p.modules}</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Contrato mínimo {p.minDays} dias</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Trial 7 dias grátis (opcional)</li>
                  </ul>
                  <div className="space-y-2">
                    <Button asChild className="w-full" size="lg">
                      <Link to="/checkout/$slug" params={{ slug: p.code }}>
                        Contratar agora
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      size="sm"
                      onClick={() => openTrial(p.code)}
                    >
                      Ou testar 7 dias grátis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* White Label + Clube */}
        <section aria-labelledby="planos-especiais" className="mb-8">
          <h2 id="planos-especiais" className="text-center text-lg font-semibold mb-6 text-muted-foreground">
            Outras opções
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-dashed">
              <CardHeader>
                <Crown className="w-6 h-6 text-primary mb-2" aria-hidden="true" />
                <CardTitle className="text-2xl">White Label</CardTitle>
                <CardDescription>Operação maior, marca própria ou integrações específicas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">Sob consulta</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Briefing dedicado</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Módulos personalizados e marca própria</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />SLA e suporte priorizado</li>
                </ul>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link to="/contratar/sob-medida">Solicitar proposta</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-6 h-6 text-primary mb-2" aria-hidden="true" />
                <CardTitle className="text-2xl">Clube Impulsionando</CardTitle>
                <CardDescription>Para o consumidor final — benefícios, cashback e alertas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Free</div>
                    <div className="text-2xl font-bold">R$ 0</div>
                    <div className="text-xs text-muted-foreground">para sempre</div>
                  </div>
                  <div className="rounded-md border-2 border-primary p-3">
                    <div className="text-xs font-medium text-primary">Premium</div>
                    <div className="text-2xl font-bold">R$ 9,99</div>
                    <div className="text-xs text-muted-foreground">/mês</div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Cashback e alertas inteligentes</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Histórico e biblioteca pessoal</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Enquetes e ofertas exclusivas (Premium)</li>
                </ul>
                <Button asChild className="w-full" size="lg" variant="secondary">
                  <Link to="/clube">Entrar no Clube</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Ao contratar você aceita nossos <Link to="/termos" className="underline">Termos</Link> e <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Começar trial de 7 dias</DialogTitle>
            <DialogDescription>Crie sua conta para acessar o ambiente por 7 dias. Sem cartão.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <OfficialChannelNotice origin="contratar" />
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" required value={form.contact_company} onChange={(e) => setForm({ ...form, contact_company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wpp">WhatsApp</Label>
                <Input id="wpp" required placeholder="(11) 9..." value={form.contact_whatsapp} onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc">CNPJ/CPF (opcional)</Label>
              <Input id="doc" value={form.contact_doc} onChange={(e) => setForm({ ...form, contact_doc: e.target.value })} />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={form.accept_terms} onCheckedChange={(v) => setForm({ ...form, accept_terms: v === true })} />
              <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                Aceito os Termos de Uso e a Política de Privacidade.
              </Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || !form.accept_terms} className="w-full">
                {submitting ? 'Criando…' : 'Iniciar trial de 7 dias'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
