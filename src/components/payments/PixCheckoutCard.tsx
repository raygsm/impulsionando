import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Copy, QrCode, CheckCircle2, Clock3, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { createPixCharge, getPixChargeStatus, getInitialCheckoutQuote } from '@/lib/pix-charges.functions'

type Props = {
  planCode: 'ESSENCIAL' | 'PRO' | 'ENTERPRISE'
  description?: string
  whatsappPhone?: string
  initialPayer?: { name?: string; email?: string; whatsapp?: string; doc?: string }
  onPaid?: () => void
}

function formatBRL(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PixCheckoutCard({ planCode, description, whatsappPhone='5521993075000', initialPayer, onPaid }: Props) {
  const create = useServerFn(createPixCharge)
  const fetchStatus = useServerFn(getPixChargeStatus)
  const fetchQuote = useServerFn(getInitialCheckoutQuote)
  const [charge,setCharge]=useState<Awaited<ReturnType<typeof create>>|null>(null)
  const [accepted,setAccepted]=useState(false)
  const [payer,setPayer]=useState({ name:initialPayer?.name??'',email:initialPayer?.email??'',whatsapp:initialPayer?.whatsapp??'',doc:initialPayer?.doc??'' })

  const quoteQuery=useQuery({ queryKey:['canonical-initial-quote',planCode], queryFn:()=>fetchQuote({data:{planCode}}) })
  const quote:any=quoteQuery.data?.quote
  const plan:any=quoteQuery.data?.plan

  const createMut=useMutation({
    mutationFn:()=>create({data:{planCode,acceptTerms:true,payerName:payer.name.trim(),payerEmail:payer.email.trim(),payerWhatsapp:payer.whatsapp.trim()||undefined,payerDoc:payer.doc.trim()||undefined,description}}),
    onSuccess:setCharge,
    onError:(e:any)=>toast.error(e?.message??'Falha ao gerar Pix.'),
  })

  const status=useQuery({queryKey:['pix-charge-status',charge?.id],queryFn:()=>fetchStatus({data:{id:charge!.id}}),enabled:!!charge?.id,refetchInterval:15_000})
  useEffect(()=>{if(status.data?.status==='paid'){toast.success('Pagamento confirmado! Acesso liberado pelo Core.');onPaid?.()}},[status.data?.status,onPaid])

  const wppLink=useMemo(()=>{if(!charge)return'';const msg=encodeURIComponent(`Olá! Acabei de pagar o Pix de ${charge.amountFormatted} para o plano ${planCode}. Identificador: ${charge.txid}.`);return`https://wa.me/${whatsappPhone}?text=${msg}`},[charge,planCode,whatsappPhone])
  async function copy(value:string,what:string){try{await navigator.clipboard.writeText(value);toast.success(`${what} copiado!`)}catch{toast.error('Não foi possível copiar.')}}
  const isPaid=status.data?.status==='paid'
  const canGenerate=accepted&&!!payer.name.trim()&&!!payer.email.trim()&&!quoteQuery.isLoading&&!quoteQuery.error

  return <Card className="border-primary/30">
    <CardHeader>
      <div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-primary"/>Pagar via Pix</CardTitle>{isPaid?<Badge className="bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/>Confirmado</Badge>:charge?<Badge variant="secondary"><Clock3 className="w-3 h-3 mr-1"/>Aguardando pagamento</Badge>:<Badge variant="outline">Pré-pagamento</Badge>}</div>
      <CardDescription>Checkout de contingência integrado ao Core. O valor canônico é calculado no servidor; os centavos adicionais do Pix servem somente para conciliação e ficam auditados.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {!charge&&!isPaid&&<>
        {quoteQuery.isLoading?<div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Calculando pró-rata…</div>:quoteQuery.error?<div className="text-sm text-destructive">{(quoteQuery.error as Error).message}</div>:quote&&<div className="grid sm:grid-cols-3 gap-3 text-sm"><div className="rounded border p-3"><div className="text-xs text-muted-foreground">Setup integral</div><div className="font-semibold">{formatBRL(quote.setup_amount)}</div></div><div className="rounded border p-3"><div className="text-xs text-muted-foreground">Pró-rata até {new Date(`${quote.next_anchor_date}T12:00:00`).toLocaleDateString('pt-BR')}</div><div className="font-semibold">{formatBRL(quote.prorata_amount)}</div><div className="text-[11px] text-muted-foreground">{quote.remaining_days}/{quote.cycle_days} dias</div></div><div className="rounded border border-primary/30 bg-primary/5 p-3"><div className="text-xs text-muted-foreground">Valor canônico inicial</div><div className="font-bold text-primary">{formatBRL(quote.initial_total)}</div><div className="text-[11px] text-muted-foreground">Depois: {formatBRL(quote.monthly_amount)} todo dia 5</div></div></div>}

        <div className="grid sm:grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="pix-name">Nome do pagador</Label><Input id="pix-name" value={payer.name} onChange={e=>setPayer({...payer,name:e.target.value})}/></div><div className="space-y-1"><Label htmlFor="pix-doc">CPF/CNPJ (opcional)</Label><Input id="pix-doc" value={payer.doc} onChange={e=>setPayer({...payer,doc:e.target.value})}/></div><div className="space-y-1"><Label htmlFor="pix-mail">E-mail</Label><Input id="pix-mail" type="email" value={payer.email} onChange={e=>setPayer({...payer,email:e.target.value})}/></div><div className="space-y-1"><Label htmlFor="pix-wpp">WhatsApp</Label><Input id="pix-wpp" value={payer.whatsapp} onChange={e=>setPayer({...payer,whatsapp:e.target.value})}/></div></div>

        <div className="rounded-md border p-4 space-y-3"><div className="font-medium text-sm">Condições da contratação</div><p className="text-xs leading-relaxed text-muted-foreground">{plan?.legal_text}</p><label className="flex items-start gap-2 text-sm cursor-pointer"><Checkbox checked={accepted} onCheckedChange={v=>setAccepted(v===true)} className="mt-0.5"/><span>Li e aceito as condições acima, o plano <strong>{plan?.name}</strong>, o setup, o valor proporcional apresentado e a recorrência com vencimento no dia 5.</span></label></div>

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"/><p className="text-xs text-amber-900 dark:text-amber-200">Após gerar, o Pix terá de R$ 0,01 a R$ 0,99 adicionais para identificação automática. <strong>Pague exatamente o valor do QR Code.</strong> A diferença fica registrada como variação de conciliação e não altera sua mensalidade.</p></div>
        <Button size="lg" className="w-full" disabled={!canGenerate||createMut.isPending} onClick={()=>createMut.mutate()}>{createMut.isPending?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Gerando Pix…</>:<>Aceitar e gerar QR Code Pix</>}</Button>
      </>}

      {charge&&!isPaid&&<div className="grid md:grid-cols-[260px_1fr] gap-5 items-start"><div className="flex flex-col items-center"><img src={charge.qrUrl} alt="QR Code Pix" width={260} height={260} className="rounded-md border bg-white"/><p className="text-xs text-muted-foreground mt-2 text-center">Abra o app do seu banco e leia o QR Code.</p></div><div className="space-y-4"><div className="rounded-md bg-primary/5 border border-primary/20 p-3"><div className="text-xs text-muted-foreground">Pague exatamente</div><div className="text-3xl font-bold text-primary tabular-nums">{charge.amountFormatted}</div><div className="text-xs text-muted-foreground mt-1">Valor canônico: {charge.canonicalAmountFormatted} · Identificador: <code>{charge.txid}</code></div></div><div className="space-y-1"><Label className="text-xs">Pix Copia e Cola</Label><div className="flex gap-2"><Input readOnly value={charge.payload} className="font-mono text-xs"/><Button variant="secondary" onClick={()=>copy(charge.payload,'Código Pix')}><Copy className="w-4 h-4"/></Button></div></div><Button asChild variant="outline" className="w-full"><a href={wppLink} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 mr-2"/>Enviar comprovante ao WhatsApp oficial</a></Button><p className="text-xs text-muted-foreground text-center">O status é consultado automaticamente. A liberação só ocorre quando o pagamento for confirmado no Core.</p></div></div>}

      {isPaid&&<div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-600"/><div><div className="font-semibold">Pagamento confirmado</div><div className="text-sm text-muted-foreground">Seu contrato foi ativado pelo Core. O dashboard completo será liberado automaticamente.</div></div></div>}
    </CardContent>
  </Card>
}
