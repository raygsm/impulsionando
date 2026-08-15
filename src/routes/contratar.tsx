import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'
import { getContratarPricing, requestPlanQuote } from '@/lib/contratar.functions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CheckCircle2, Crown, ShieldCheck, Users } from 'lucide-react'
import { OfficialChannelNotice } from '@/components/marketing/OfficialChannelNotice'

type PlanCode = 'ESSENCIAL' | 'PRO' | 'ENTERPRISE' | 'WHITE_LABEL'
type Plan = {
  code: PlanCode
  name: string
  description: string | null
  setup_fee: number | string
  recurring_amount: number | string
  cycle: string
  status_comercial: string
  min_contract_days: number
  min_installments: number
  included_module_count: number
  extra_module_price: number | string
  discount_percent: number | string
  show_on_site: boolean
  show_in_checkout: boolean
  allow_direct_checkout: boolean
  route_to_quote: boolean
  route_to_whatsapp: boolean
  cta: string | null
  legal_text: string | null
  sort_order: number
}

export const Route = createFileRoute('/contratar')({
  component: ContratarPage,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.plano === 'string' ? search.plano.toUpperCase() : undefined
    const allowed = ['ESSENCIAL','PRO','ENTERPRISE','WHITE_LABEL'] as const
    const plano = raw && (allowed as readonly string[]).includes(raw) ? raw as PlanCode : undefined
    return { plano }
  },
  head: () => ({ meta: [
    { title: 'Contratar — Impulsionando Tecnologia' },
    { name: 'description', content: 'Conheça os planos vigentes da Impulsionando Tecnologia e solicite uma proposta comercial.' },
  ] }),
})

function money(v: number | string) {
  const n = Number(v || 0)
  return n > 0 ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null
}

function statusLabel(status: string) {
  if (status === 'sob_consulta') return 'Sob consulta'
  if (status === 'exclusivo_white_label') return 'Projeto White Label'
  if (status === 'em_breve') return 'Em breve'
  if (status === 'disponivel_contratacao') return 'Disponível'
  return 'Atendimento comercial'
}

function ContratarPage() {
  const loadPricing = useServerFn(getContratarPricing)
  const submitQuote = useServerFn(requestPlanQuote)
  const { plano } = Route.useSearch()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(plano ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ contact_name: '', contact_company: '', contact_email: '', contact_whatsapp: '', contact_doc: '', accept_terms: false })

  useEffect(() => {
    let active = true
    loadPricing()
      .then((result) => { if (active) setPlans((result.plans ?? []) as Plan[]) })
      .catch((err) => { if (active) toast.error(err?.message || 'Não foi possível carregar os planos.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadPricing])

  const visiblePlans = useMemo(() => plans.filter((p) => p.show_on_site || p.code === selectedPlan), [plans, selectedPlan])
  const selected = plans.find((p) => p.code === selectedPlan)

  function openQuote(code: PlanCode) {
    setSelectedPlan(code)
    setOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan || !form.accept_terms) return
    setSubmitting(true)
    try {
      const result = await submitQuote({ data: { ...form, plan_code: selectedPlan } })
      if (!result.ok) throw new Error(result.message || 'Não foi possível registrar a solicitação.')
      toast.success('Solicitação registrada. Nossa equipe comercial dará continuidade ao atendimento.')
      setOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar solicitação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <Badge variant="secondary" className="mb-4"><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Catálogo comercial oficial</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Planos Impulsionando</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Os planos, condições e disponibilidade exibidos aqui vêm diretamente do Core comercial. Nenhuma cobrança é iniciada sem que o plano esteja formalmente liberado para checkout.</p>
        </header>

        {loading ? <p className="text-center text-muted-foreground">Carregando catálogo oficial…</p> : visiblePlans.length === 0 ? (
          <Card className="max-w-2xl mx-auto"><CardContent className="py-10 text-center"><p className="font-medium">Os planos públicos estão temporariamente em configuração comercial.</p><p className="text-sm text-muted-foreground mt-2">Você ainda pode solicitar atendimento sob medida.</p><Button asChild className="mt-6"><Link to="/contratar/sob-medida">Solicitar proposta</Link></Button></CardContent></Card>
        ) : (
          <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {visiblePlans.map((p) => {
              const monthly = money(p.recurring_amount)
              const setup = money(p.setup_fee)
              return <Card key={p.code} className={p.code === selectedPlan ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  {p.code === 'PRO' && <Badge className="w-fit mb-2">Recomendado</Badge>}
                  {p.code === 'WHITE_LABEL' && <Crown className="w-6 h-6 text-primary mb-2" />}
                  <CardTitle className="text-2xl">{p.name}</CardTitle>
                  <CardDescription>{p.description || statusLabel(p.status_comercial)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><div className="text-3xl font-bold">{monthly ?? statusLabel(p.status_comercial)}</div>{monthly && <div className="text-sm text-muted-foreground">/{p.cycle === 'yearly' ? 'ano' : 'mês'}</div>}</div>
                  <ul className="space-y-2 text-sm">
                    {setup && <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />Setup: {setup}</li>}
                    {p.included_module_count > 0 && <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />{p.included_module_count} módulos inclusos</li>}
                    {p.min_contract_days > 0 && <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />Contrato mínimo: {p.min_contract_days} dias</li>}
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />Condições confirmadas antes da contratação</li>
                  </ul>
                  <Button className="w-full" onClick={() => openQuote(p.code)}>{p.cta || 'Solicitar proposta'}</Button>
                </CardContent>
              </Card>
            })}
          </section>
        )}

        <section className="mt-14 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card><CardHeader><Crown className="w-6 h-6 text-primary mb-2"/><CardTitle>Projeto sob medida</CardTitle><CardDescription>Operações complexas, integrações específicas, marca própria e estruturas especiais.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="w-full"><Link to="/contratar/sob-medida">Falar com o comercial</Link></Button></CardContent></Card>
          <Card><CardHeader><Users className="w-6 h-6 text-primary mb-2"/><CardTitle>Clube Impulsionando</CardTitle><CardDescription>Área destinada ao consumidor final e benefícios do ecossistema.</CardDescription></CardHeader><CardContent><Button asChild variant="secondary" className="w-full"><Link to="/clube">Conhecer o Clube</Link></Button></CardContent></Card>
        </section>

        <p className="text-center text-sm text-muted-foreground mt-12">Ao enviar uma solicitação você aceita nossos <Link to="/termos" className="underline">Termos</Link> e <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Solicitar proposta{selected ? ` — ${selected.name}` : ''}</DialogTitle><DialogDescription>Preencha os dados essenciais para a equipe comercial continuar o atendimento. Nenhuma cobrança será feita nesta etapa.</DialogDescription></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <OfficialChannelNotice origin="contratar" />
            <div className="space-y-2"><Label htmlFor="name">Seu nome</Label><Input id="name" required value={form.contact_name} onChange={(e)=>setForm({...form,contact_name:e.target.value})}/></div>
            <div className="space-y-2"><Label htmlFor="company">Empresa</Label><Input id="company" required value={form.contact_company} onChange={(e)=>setForm({...form,contact_company:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={form.contact_email} onChange={(e)=>setForm({...form,contact_email:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="wpp">WhatsApp</Label><Input id="wpp" required value={form.contact_whatsapp} onChange={(e)=>setForm({...form,contact_whatsapp:e.target.value})}/></div></div>
            <div className="space-y-2"><Label htmlFor="doc">CPF/CNPJ (opcional)</Label><Input id="doc" value={form.contact_doc} onChange={(e)=>setForm({...form,contact_doc:e.target.value})}/></div>
            <div className="flex items-start gap-2"><Checkbox id="terms" checked={form.accept_terms} onCheckedChange={(v)=>setForm({...form,accept_terms:v===true})}/><Label htmlFor="terms" className="text-sm font-normal leading-tight">Aceito os Termos de Uso e a Política de Privacidade.</Label></div>
            <DialogFooter><Button type="submit" disabled={submitting || !form.accept_terms} className="w-full">{submitting ? 'Enviando…' : 'Enviar solicitação'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}