import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { CheckCircle2, Copy, Loader2, QrCode, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInitialCheckoutPix, getInitialCheckoutPaymentStatus } from '@/lib/initial-checkout.functions'

type PlanCode = 'ESSENCIAL' | 'PRO' | 'ENTERPRISE'
type Props = {
  planCode: PlanCode
  initialPayer?: { name?: string; email?: string; whatsapp?: string; doc?: string }
  onPaid?: () => void
}

function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function InitialCheckoutPixCard({ planCode, initialPayer, onPaid }: Props) {
  const create = useServerFn(createInitialCheckoutPix)
  const statusFn = useServerFn(getInitialCheckoutPaymentStatus)
  const [accepted, setAccepted] = useState(false)
  const [payer, setPayer] = useState({
    name: initialPayer?.name ?? '',
    email: initialPayer?.email ?? '',
    whatsapp: initialPayer?.whatsapp ?? '',
    doc: initialPayer?.doc ?? '',
  })
  const [payment, setPayment] = useState<Awaited<ReturnType<typeof create>> | null>(null)

  const start = useMutation({
    mutationFn: () => create({ data: { planCode, acceptTerms: true, payerName: payer.name, payerEmail: payer.email, payerWhatsapp: payer.whatsapp || undefined, payerDoc: payer.doc || undefined } }),
    onSuccess: (data) => setPayment(data),
    onError: (error: Error) => toast.error(error.message || 'Não foi possível gerar o Pix.'),
  })

  const status = useQuery({
    queryKey: ['initial-checkout-payment', payment?.checkoutSessionId],
    enabled: !!payment?.checkoutSessionId,
    queryFn: () => statusFn({ data: { checkoutSessionId: payment!.checkoutSessionId } }),
    refetchInterval: (q) => q.state.data?.completed ? false : 10_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (status.data?.completed) {
      toast.success('Pagamento confirmado. Seu ecossistema foi ativado!')
      onPaid?.()
    }
  }, [status.data?.completed, onPaid])

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Pix Copia e Cola copiado.') }
    catch { toast.error('Não foi possível copiar.') }
  }

  const completed = status.data?.completed === true

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" />Pagamento e ativação</CardTitle>
        <CardDescription>Pix oficial Mercado Pago. O valor é calculado pelo Core e a ativação ocorre automaticamente após a confirmação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!payment && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Nome do responsável</Label><Input value={payer.name} onChange={(e)=>setPayer({...payer,name:e.target.value})} /></div>
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={payer.email} onChange={(e)=>setPayer({...payer,email:e.target.value})} /></div>
              <div className="space-y-1.5"><Label>CPF/CNPJ</Label><Input value={payer.doc} onChange={(e)=>setPayer({...payer,doc:e.target.value})} /></div>
              <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={payer.whatsapp} onChange={(e)=>setPayer({...payer,whatsapp:e.target.value})} /></div>
            </div>
            <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <Checkbox checked={accepted} onCheckedChange={(v)=>setAccepted(v===true)} />
              <span>Li e aceito as condições do plano, a cobrança inicial composta pelo setup integral + período proporcional até o próximo dia 5, o ciclo inicial de 90 dias e as regras de suspensão/reativação financeira.</span>
            </label>
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Preço, empresa, plano e valor da cobrança são validados no servidor. Nenhum valor informado pelo navegador é usado como fonte da verdade.</span>
            </div>
            <Button className="w-full" size="lg" disabled={!accepted || !payer.name || !payer.email || start.isPending} onClick={()=>start.mutate()}>
              {start.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando Pix oficial…</> : 'Aceitar e gerar Pix'}
            </Button>
          </>
        )}

        {payment && !completed && (
          <div className="grid gap-5 md:grid-cols-[260px_1fr] md:items-start">
            <div className="rounded-xl border bg-white p-3">
              {payment.qrCodeBase64 ? <img className="mx-auto h-[236px] w-[236px] object-contain" src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix Mercado Pago" /> : <div className="grid h-[236px] place-items-center text-sm text-muted-foreground">Use o Pix Copia e Cola ao lado.</div>}
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="text-xs text-muted-foreground">Valor da contratação inicial</div>
                <div className="mt-1 text-3xl font-bold text-primary">{money(payment.amountCents)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Setup integral + pró-rata até o próximo dia 5.</div>
              </div>
              <div className="space-y-1.5"><Label>Pix Copia e Cola</Label><div className="flex gap-2"><Input readOnly value={payment.qrCode} className="font-mono text-xs"/><Button variant="secondary" onClick={()=>copy(payment.qrCode)} disabled={!payment.qrCode}><Copy className="h-4 w-4"/></Button></div></div>
              <div className="rounded-lg border p-3 text-sm"><strong>Status:</strong> {status.data?.status ?? payment.status}. O Core verifica automaticamente a confirmação.</div>
            </div>
          </div>
        )}

        {completed && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
            <div><div className="font-semibold">Pagamento confirmado e plano ativado</div><div className="mt-1 text-sm text-muted-foreground">Contrato, fatura e acesso foram atualizados pelo Core. O Impulsionito pode iniciar seu onboarding.</div></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
