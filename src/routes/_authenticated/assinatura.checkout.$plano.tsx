import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { listPublicPlans } from '@/lib/contratar.functions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PixCheckoutCard } from '@/components/payments/PixCheckoutCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Info, ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/assinatura/checkout/$plano')({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: 'Checkout — Impulsionando' }, { name: 'robots', content: 'noindex' }] }),
})

const CANONICAL_CODES = ['ESSENCIAL','PRO','ENTERPRISE'] as const
type CanonicalCode = (typeof CANONICAL_CODES)[number]
function isCanonicalCode(v:string):v is CanonicalCode{return (CANONICAL_CODES as readonly string[]).includes(v)}
function money(v:number|string|null|undefined){return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}

function CheckoutPage(){
  const { plano }=useParams({from:'/_authenticated/assinatura/checkout/$plano'})
  const fetchPlans=useServerFn(listPublicPlans)
  const {data:plans,isLoading}=useQuery({queryKey:['public-plans'],queryFn:()=>fetchPlans()})
  const {data:user}=useCurrentUser()
  const plan:any=plans?.find((p:any)=>p.code===plano)

  return <main className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
    <div><Button asChild variant="ghost" size="sm" className="mb-2"><Link to="/minha-assinatura"><ArrowLeft className="w-4 h-4 mr-1"/>Minha assinatura</Link></Button><h1 className="text-3xl font-bold flex items-center gap-2"><CreditCard className="w-7 h-7 text-primary"/>Checkout</h1><p className="mt-1 text-sm text-muted-foreground">Contratação vinculada ao Core financeiro da Impulsionando.</p></div>

    {isLoading?<Card><CardContent className="py-12 text-center text-muted-foreground">Carregando plano…</CardContent></Card>:!plan||!isCanonicalCode(plano)?<Card><CardContent className="py-12 text-center text-muted-foreground">Este plano não está disponível para contratação automática. <Link to="/planos" className="underline">Voltar aos planos</Link>.</CardContent></Card>:<>
      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>{plan.name}</CardTitle><Badge variant="secondary">Recorrência mensal</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid sm:grid-cols-3 gap-3 text-sm"><div className="rounded border p-3"><div className="text-xs text-muted-foreground">Mensalidade cheia</div><div className="font-semibold">{money(plan.recurring_amount)}</div></div><div className="rounded border p-3"><div className="text-xs text-muted-foreground">Setup</div><div className="font-semibold">{money(plan.setup_fee)}</div></div><div className="rounded border border-primary/30 bg-primary/5 p-3"><div className="text-xs text-muted-foreground">Vencimento recorrente</div><div className="font-bold text-primary">Todo dia 5</div></div></div><div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground flex gap-2"><Info className="h-4 w-4 shrink-0 text-primary"/><span>A primeira cobrança não usa uma mensalidade inteira automaticamente: o Core calcula <strong className="text-foreground">setup integral + valor proporcional até o próximo dia 5</strong>. O cálculo exato aparece abaixo antes do aceite.</span></div><div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600"/><span>Plano, condições, aceite, pagamento, contrato e reativação ficam auditados no Core. O acesso operacional só é liberado após confirmação do pagamento.</span></div></CardContent></Card>

      <PixCheckoutCard planCode={plano} description={`Impulsionando ${plan.name}`} initialPayer={{name:user?.user?.email??'',email:user?.user?.email??''}} />

      <p className="text-center text-xs text-muted-foreground">O checkout transparente do Mercado Pago será exibido quando a homologação E2E estiver concluída. Até lá, o Pix de contingência usa o mesmo contrato e as mesmas regras do Core.</p>
    </>}
  </main>
}
