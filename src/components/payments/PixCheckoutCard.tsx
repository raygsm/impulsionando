/**
 * Pix manual checkout card — generates a Pix charge with a unique cents
 * suffix so the payment can be identified when it arrives. Used while
 * Mercado Pago transparent checkout isn't finalized.
 */
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Copy,
  QrCode,
  CheckCircle2,
  Clock3,
  MessageCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { createPixCharge, getPixChargeStatus } from '@/lib/pix-charges.functions'

type Props = {
  planCode: string
  baseAmountCents: number
  description?: string
  contractId?: string
  companyId?: string
  whatsappPhone?: string
  initialPayer?: { name?: string; email?: string; whatsapp?: string; doc?: string }
  onPaid?: () => void
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PixCheckoutCard({
  planCode,
  baseAmountCents,
  description,
  contractId,
  companyId,
  whatsappPhone = '5521972554500',
  initialPayer,
  onPaid,
}: Props) {
  const create = useServerFn(createPixCharge)
  const fetchStatus = useServerFn(getPixChargeStatus)

  const [charge, setCharge] = useState<Awaited<ReturnType<typeof create>> | null>(null)
  const [payer, setPayer] = useState({
    name: initialPayer?.name ?? '',
    email: initialPayer?.email ?? '',
    whatsapp: initialPayer?.whatsapp ?? '',
    doc: initialPayer?.doc ?? '',
  })

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          planCode,
          baseAmountCents,
          description,
          contractId,
          companyId,
          payerName: payer.name || undefined,
          payerEmail: payer.email || undefined,
          payerWhatsapp: payer.whatsapp || undefined,
          payerDoc: payer.doc || undefined,
        },
      }),
    onSuccess: (res) => setCharge(res),
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao gerar Pix.'),
  })

  // Poll status every 15s while we have a pending charge.
  const status = useQuery({
    queryKey: ['pix-charge-status', charge?.id],
    queryFn: () => fetchStatus({ data: { id: charge!.id } }),
    enabled: !!charge?.id,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (status.data?.status === 'paid') {
      toast.success('Pagamento confirmado! Liberando acesso…')
      onPaid?.()
    }
  }, [status.data?.status, onPaid])

  const wppLink = useMemo(() => {
    if (!charge) return ''
    const msg = encodeURIComponent(
      `Olá! Acabei de pagar o Pix de ${charge.amountFormatted} para o plano ${planCode}. ` +
        `Identificador: ${charge.txid}. Segue o comprovante.`,
    )
    return `https://wa.me/${whatsappPhone}?text=${msg}`
  }, [charge, planCode, whatsappPhone])

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${what} copiado!`)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  const isPaid = status.data?.status === 'paid'

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Pagar via Pix
          </CardTitle>
          {isPaid ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmado
            </Badge>
          ) : charge ? (
            <Badge variant="secondary">
              <Clock3 className="w-3 h-3 mr-1" /> Aguardando pagamento
            </Badge>
          ) : (
            <Badge variant="outline">Pré-pagamento</Badge>
          )}
        </div>
        <CardDescription>
          Pagamentos do ecossistema Impulsionando são processados via{" "}
          <strong>Mercado Pago</strong> (PIX, cartão e boleto). O valor abaixo já vem com
          identificação única para conciliação automática.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!charge && !isPaid && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pix-name">Nome do pagador</Label>
                <Input
                  id="pix-name"
                  value={payer.name}
                  onChange={(e) => setPayer({ ...payer, name: e.target.value })}
                  placeholder="Como aparece no extrato"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pix-doc">CPF/CNPJ (opcional)</Label>
                <Input
                  id="pix-doc"
                  value={payer.doc}
                  onChange={(e) => setPayer({ ...payer, doc: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pix-mail">E-mail</Label>
                <Input
                  id="pix-mail"
                  type="email"
                  value={payer.email}
                  onChange={(e) => setPayer({ ...payer, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pix-wpp">WhatsApp</Label>
                <Input
                  id="pix-wpp"
                  value={payer.whatsapp}
                  onChange={(e) => setPayer({ ...payer, whatsapp: e.target.value })}
                  placeholder="(11) 9..."
                />
              </div>
            </div>

            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-900 dark:text-amber-200">
                O valor exibido após gerar o Pix terá centavos únicos (ex.: R$ 199,07).
                <strong> Pague exatamente esse valor</strong> — é assim que vinculamos o
                pagamento à sua contratação.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Pix…
                </>
              ) : (
                <>Gerar QR Code Pix de {formatBRL(baseAmountCents)}</>
              )}
            </Button>
          </>
        )}

        {charge && !isPaid && (
          <div className="grid md:grid-cols-[260px_1fr] gap-5 items-start">
            <div className="flex flex-col items-center">
              <img
                src={charge.qrUrl}
                alt="QR Code Pix"
                width={260}
                height={260}
                className="rounded-md border border-border bg-white"
                loading="lazy"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Abra o app do seu banco e leia o QR Code.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <div className="text-xs text-muted-foreground">Pague exatamente</div>
                <div className="text-3xl font-bold text-primary tabular-nums">
                  {charge.amountFormatted}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Identificador: <code className="text-foreground">{charge.txid}</code>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Pix Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input readOnly value={charge.payload} className="font-mono text-xs" />
                  <Button
                    variant="secondary"
                    onClick={() => copy(charge.payload, 'Código Pix')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-border p-2">
                  <div className="text-muted-foreground">Chave Pix (CNPJ)</div>
                  <button
                    onClick={() => copy(charge.pixKey, 'Chave Pix')}
                    className="font-mono text-foreground hover:text-primary text-left w-full"
                  >
                    {charge.pixKey} <Copy className="w-3 h-3 inline" />
                  </button>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="text-muted-foreground">Recebedor</div>
                  <div className="text-foreground">Impulsionando Tecnologia LTDA</div>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <a href={wppLink} target="_blank" rel="noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar comprovante por WhatsApp
                </a>
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Status atualiza automaticamente a cada 15s. Pagamentos costumam ser
                identificados em minutos. Em dia útil comercial, liberação em até 1h
                após confirmação.
              </p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <div className="font-semibold">Pagamento confirmado</div>
              <div className="text-sm text-muted-foreground">
                Seu plano <strong>{planCode}</strong> foi liberado. Você já pode acessar
                o ambiente.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
