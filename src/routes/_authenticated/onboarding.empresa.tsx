import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, Globe2, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createMyCompany, getMyCompanyOnboardingState } from '@/lib/company-onboarding.functions'

const PLAN_CODES = ['ESSENCIAL','PRO','ENTERPRISE'] as const
type PlanCode = (typeof PLAN_CODES)[number]

export const Route = createFileRoute('/_authenticated/onboarding/empresa')({
  validateSearch: (s: Record<string, unknown>) => ({
    plano: typeof s.plano === 'string' && (PLAN_CODES as readonly string[]).includes(s.plano.toUpperCase()) ? s.plano.toUpperCase() as PlanCode : undefined,
  }),
  component: CompanyOnboardingPage,
})

function slugPreview(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)
}

function CompanyOnboardingPage() {
  const { plano } = Route.useSearch()
  const navigate = useNavigate()
  const loadState = useServerFn(getMyCompanyOnboardingState)
  const create = useServerFn(createMyCompany)
  const [form,setForm]=useState({name:'',legalName:'',document:'',phone:'',requestedSlug:''})

  const state=useQuery({queryKey:['my-company-onboarding'],queryFn:()=>loadState()})
  const suggested=useMemo(()=>slugPreview(form.name),[form.name])
  const targetPlan: PlanCode = plano ?? 'ESSENCIAL'

  const mutation=useMutation({
    mutationFn:()=>create({data:{name:form.name,legalName:form.legalName||undefined,document:form.document||undefined,phone:form.phone||undefined,requestedSlug:(form.requestedSlug||suggested)||undefined}}),
    onSuccess:(res)=>{
      toast.success(res.created?'Empresa criada e conectada ao Core.':'Sua empresa já está conectada ao Core.')
      navigate({to:'/assinatura/checkout/$plano',params:{plano:targetPlan}})
    },
    onError:(e:Error)=>toast.error(e.message),
  })

  if(state.isLoading)return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>
  if(state.data?.hasCompany){
    return <div className="mx-auto max-w-2xl space-y-5 py-8"><Card className="p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600"/><h1 className="mt-4 text-2xl font-bold">Sua empresa já está no Core</h1><p className="mt-2 text-sm text-muted-foreground">{state.data.policy?.company_name ?? 'Empresa'} · {state.data.policy?.subdomain ? `${state.data.policy.subdomain}.${state.data.policy.root_domain}` : 'subdomínio em provisionamento'}</p><Button className="mt-6" onClick={()=>navigate({to:'/assinatura/checkout/$plano',params:{plano:targetPlan}})}>Continuar para contratação</Button></Card></div>
  }

  return <div className="mx-auto max-w-3xl space-y-6 py-8">
    <div><h1 className="text-3xl font-bold">Crie o ambiente da sua empresa</h1><p className="mt-2 text-muted-foreground">Esse cadastro cria sua empresa no Core da Impulsionando e reserva automaticamente a identidade do subdomínio. A operação completa é liberada após a contratação e confirmação do pagamento.</p></div>

    <div className="grid gap-4 md:grid-cols-3">{[
      [Building2,'Empresa no Core','Cadastro comercial único e isolado.'],
      [Globe2,'Subdomínio próprio','Identidade criada automaticamente e publicada pelo reconciliador seguro.'],
      [ShieldCheck,'Governança financeira','Vencimento dia 5, cobrança, suspensão e reativação pelo Core.'],
    ].map(([Icon,title,text]:any)=><Card key={title} className="p-4"><Icon className="h-5 w-5 text-primary"/><div className="mt-2 font-semibold">{title}</div><div className="mt-1 text-xs text-muted-foreground">{text}</div></Card>)}</div>

    <Card className="space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Nome da empresa *</Label><Input id="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: Minha Empresa"/></div><div className="space-y-2"><Label htmlFor="legal">Razão social</Label><Input id="legal" value={form.legalName} onChange={e=>setForm({...form,legalName:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="doc">CNPJ/CPF</Label><Input id="doc" value={form.document} onChange={e=>setForm({...form,document:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="phone">Telefone/WhatsApp</Label><Input id="phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div></div>
      <div className="space-y-2"><Label htmlFor="slug">Subdomínio desejado</Label><div className="flex"><Input id="slug" className="rounded-r-none" value={form.requestedSlug||suggested} onChange={e=>setForm({...form,requestedSlug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}/><div className="flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">.impulsionando.com.br</div></div><p className="text-xs text-muted-foreground">Se o nome já estiver em uso, o Core gera automaticamente uma variação exclusiva sem substituir outro cliente.</p></div>
      <div className="rounded-md border bg-muted/30 p-4 text-sm"><strong>Próximo passo:</strong> plano {targetPlan}. Nenhuma mensalidade é ativada nesta tela. Depois do cadastro, você verá setup, pró-rata até o próximo dia 5, termos e pagamento antes da confirmação.</div>
      <Button size="lg" className="w-full" disabled={mutation.isPending||form.name.trim().length<2} onClick={()=>mutation.mutate()}>{mutation.isPending?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Criando ambiente…</>:<>Criar empresa e continuar</>}</Button>
    </Card>
  </div>
}
