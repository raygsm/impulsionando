import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listPublicPlans, startTrial } from '@/lib/contratar.functions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CheckCircle2, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/contratar')({
  component: ContratarPage,
  head: () => ({
    meta: [
      { title: 'Contratar — Impulsionando Tecnologia' },
      { name: 'description', content: 'Escolha seu plano e comece com 3 dias de teste grátis. Essencial, Completo ou Sob Medida.' },
    ],
  }),
})

const PLAN_TO_TRIAL: Record<string, 'essencial' | 'integrado' | 'avancado'> = {
  'essencial-mensal': 'essencial',
  'completo-mensal': 'integrado',
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ContratarPage() {
  const fetchPlans = useServerFn(listPublicPlans)
  const submitTrial = useServerFn(startTrial)
  const { data: plans, isLoading } = useQuery({ queryKey: ['public-plans'], queryFn: () => fetchPlans() })

  const [open, setOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    contact_name: '', contact_company: '', contact_email: '',
    contact_whatsapp: '', contact_doc: '', accept_terms: false,
  })

  const openTrial = (code: string) => {
    if (!PLAN_TO_TRIAL[code]) {
      window.location.href = '/contratar/sob-medida'
      return
    }
    setSelectedPlan(code)
    setOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan || !form.accept_terms) return
    setSubmitting(true)
    try {
      const res = await submitTrial({ data: { ...form, plan_code: PLAN_TO_TRIAL[selectedPlan] } })
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

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" /> 3 dias grátis em qualquer plano
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece com trial de 3 dias. Sem cartão. Setup + 1ª mensalidade só ao ativar.
          </p>
        </header>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando planos…</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans?.map((p) => (
              <Card key={p.code} className={p.code === 'completo-mensal' ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  {p.code === 'completo-mensal' && <Badge className="w-fit mb-2">Mais vendido</Badge>}
                  <CardTitle className="text-2xl">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold">{formatBRL(Number(p.recurring_amount))}</div>
                    <div className="text-sm text-muted-foreground">/mês</div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Setup: {formatBRL(Number(p.setup_fee))}</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{p.included_module_count >= 99 ? 'Módulos ilimitados' : `${p.included_module_count} módulos inclusos`}</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Contrato mínimo {p.min_contract_days} dias</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Trial 3 dias grátis</li>
                  </ul>
                  <Button className="w-full" size="lg" onClick={() => openTrial(p.code)}>
                    {p.cta || 'Começar trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-2xl">Sob Medida</CardTitle>
                <CardDescription>Operação maior, White Label ou integrações específicas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold">Sob consulta</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Briefing dedicado</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Módulos personalizados</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />Suporte priorizado</li>
                </ul>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link to="/contratar/sob-medida">Solicitar proposta</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-12">
          Ao contratar você aceita nossos <Link to="/termos" className="underline">Termos</Link> e <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Começar trial de 3 dias</DialogTitle>
            <DialogDescription>Crie sua conta para acessar o ambiente. Sem cartão.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
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
                {submitting ? 'Criando…' : 'Iniciar trial grátis'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
