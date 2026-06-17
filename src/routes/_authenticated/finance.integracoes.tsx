/**
 * Financeiro › Integrações de pagamento — hub central onde a equipe
 * Impulsionando administra os gateways disponíveis no checkout.
 *
 * Por enquanto:
 *  - Pix manual (CNPJ) → ATIVO. Painel de baixa em /admin/pix-pendentes.
 *  - Mercado Pago → em configuração (a chave Access Token será adicionada
 *    em Secrets do projeto). Tela de credenciais em /core/integracoes/mercadopago.
 *  - InfinitePay → integração legada já existente.
 *
 * Quando um gateway é habilitado aqui, ele aparece no /checkout/$plano.
 */
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import {
  listPendingPixCharges,
  updatePixReceipt,
} from '@/lib/pix-charges.functions'
import { getIntegration } from '@/lib/core-integrations.functions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  QrCode, CreditCard, Wallet, ArrowRight, CheckCircle2, Clock3, Settings2,
  ExternalLink, Receipt, Download, Pencil, Printer,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/finance/integracoes')({
  component: FinanceIntegrationsPage,
  head: () => ({
    meta: [
      { title: 'Integrações de pagamento — Financeiro' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
})

type Status = 'active' | 'pending' | 'inactive'

function StatusBadge({ status }: { status: Status }) {
  if (status === 'active')
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
      </Badge>
    )
  if (status === 'pending')
    return (
      <Badge variant="secondary">
        <Clock3 className="w-3 h-3 mr-1" /> Em configuração
      </Badge>
    )
  return <Badge variant="outline">Inativo</Badge>
}

function FinanceIntegrationsPage() {
  const fetchPix = useServerFn(listPendingPixCharges)
  const getInteg = useServerFn(getIntegration)

  const { data: pixCharges } = useQuery({
    queryKey: ['admin-pix-pending'],
    queryFn: () => fetchPix({ data: { statuses: ['pending', 'paid'], limit: 100 } }),
    refetchInterval: 60_000,
  })
  const { data: mp } = useQuery({
    queryKey: ['integ', 'mp'],
    queryFn: () => getInteg({ data: { slug: 'mercadopago' } }),
  })
  const { data: ip } = useQuery({
    queryKey: ['integ', 'infinitepay'],
    queryFn: () => getInteg({ data: { slug: 'infinitepay' } }),
  })

  const pendingCount = (pixCharges ?? []).filter((c: any) => c.status === 'pending').length
  const paidCount = (pixCharges ?? []).filter((c: any) => c.status === 'paid').length

  const mpConfigured = Boolean((mp as any)?.config?.public_key)
  const mpStatus: Status = mpConfigured
    ? (mp as any)?.environment === 'production'
      ? 'active'
      : 'pending'
    : 'pending'

  const ipConfigured = Boolean((ip as any)?.config)
  const ipStatus: Status = ipConfigured ? 'active' : 'inactive'

  return (
    <main className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="w-7 h-7 text-primary" />
          Integrações de pagamento
        </h1>
        <p className="text-muted-foreground mt-1">
          Gateways disponíveis no checkout. Habilite, configure credenciais e veja o
          status de cada provedor.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pix manual */}
        <Card className="border-emerald-500/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pix manual (CNPJ)</CardTitle>
                  <CardDescription>
                    QR Code + Copia e Cola com identificação por centavos únicos.
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status="active" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Chave</dt>
                <dd className="font-mono text-xs">CNPJ</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pendentes</dt>
                <dd className="font-semibold">{pendingCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Confirmados</dt>
                <dd className="font-semibold">{paidCount}</dd>
              </div>
            </dl>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link to="/admin/pix-pendentes">
                  Confirmar pagamentos
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mercado Pago */}
        <Card className={mpStatus === 'active' ? 'border-emerald-500/30' : 'border-amber-500/30'}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-500/10">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mercado Pago</CardTitle>
                  <CardDescription>
                    Pix automático, cartão à vista e parcelado, boleto.
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={mpStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Ambiente</dt>
                <dd className="font-semibold capitalize">
                  {(mp as any)?.environment ?? 'sandbox'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Public key</dt>
                <dd className="text-xs">{mpConfigured ? '✓ Configurada' : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Webhook</dt>
                <dd className="text-xs">
                  {(mp as any)?.config?.webhook_url ? '✓' : '—'}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Quando configurado, o card transparente do MP aparece no checkout acima do
              Pix manual. Liberação do plano segue o mesmo fluxo (webhook → ativar).
            </p>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" variant="secondary" className="flex-1">
                <Link to="/core/integracoes/mercadopago">
                  <Settings2 className="w-3 h-3 mr-1" />
                  Configurar credenciais
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <a
                  href="https://www.mercadopago.com.br/developers/panel/credentials"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* InfinitePay */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">InfinitePay</CardTitle>
                  <CardDescription>
                    Integração legada (checkout redirect). Usada por contratos antigos.
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={ipStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Mantida ativa para clientes existentes. Novos checkouts devem usar Pix
              manual ou Mercado Pago.
            </p>
            <Button asChild size="sm" variant="ghost" className="w-full">
              <Link to="/core/integracoes/diagnostico">
                Diagnóstico de integrações
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Próximos</CardTitle>
            <CardDescription>Habilitáveis quando a operação justificar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• API Pix do banco (Inter / Efí / BB) — baixa automática 100%</li>
              <li>• Stripe (cartão internacional)</li>
              <li>• Boleto bancário direto (sem MP)</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <ReceiptsSection charges={pixCharges ?? []} />

      <Card className="bg-muted/40">
        <CardContent className="py-4 text-xs text-muted-foreground">
          <strong>Como funciona a identificação automática:</strong> cada cobrança Pix
          recebe um valor com centavos exclusivos (ex.: R$ 199,07). O time financeiro
          cruza o valor no extrato e confirma em 1 clique. A mesma rotina de liberação
          (ativar contrato, enviar boas-vindas) será disparada pelo webhook do Mercado
          Pago quando ele estiver no ar — sem alterar nada no resto do ecossistema.
        </CardContent>
      </Card>
    </main>
  )
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ReceiptsSection({ charges }: { charges: any[] }) {
  const qc = useQueryClient()
  const updateFn = useServerFn(updatePixReceipt)
  const paid = charges.filter((c) => c.status === 'paid')
  const [editing, setEditing] = useState<any>(null)
  const [url, setUrl] = useState('')

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: { id: editing.id, receiptUrl: url.trim() || null },
      }),
    onSuccess: () => {
      toast.success('Comprovante atualizado.')
      setEditing(null); setUrl('')
      qc.invalidateQueries({ queryKey: ['admin-pix-pending'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao salvar.'),
  })

  const printReceipt = (c: any) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Recibo ${c.txid}</title>
      <style>body{font-family:system-ui;max-width:560px;margin:40px auto;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 4px}.muted{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      td{padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
      td.k{color:#666;width:160px}.total{font-size:22px;font-weight:700;color:#0a7a3b}
      .stamp{margin-top:24px;padding:12px;border:2px dashed #0a7a3b;color:#0a7a3b;text-align:center;font-weight:600;border-radius:8px}
      </style></head><body>
      <h1>Recibo de pagamento — Impulsionando Tecnologia LTDA</h1>
      <div class="muted">CNPJ 54.295.500/0001-27</div>
      <table>
        <tr><td class="k">Identificador</td><td>${c.txid}</td></tr>
        <tr><td class="k">Plano</td><td>${c.plan_code ?? '—'}</td></tr>
        <tr><td class="k">Pagador</td><td>${c.payer_name ?? '—'}</td></tr>
        <tr><td class="k">E-mail</td><td>${c.payer_email ?? '—'}</td></tr>
        <tr><td class="k">Confirmado em</td><td>${c.paid_at ? new Date(c.paid_at).toLocaleString('pt-BR') : '—'}</td></tr>
        <tr><td class="k">Valor pago</td><td class="total">${formatBRL(c.unique_amount_cents)}</td></tr>
      </table>
      <div class="stamp">PAGO via Pix</div>
      <p class="muted" style="margin-top:24px">Documento gerado eletronicamente para fins de comprovação interna.</p>
      <script>window.onload=()=>window.print()</script></body></html>`
    const w = window.open('', '_blank')
    if (!w) return toast.error('Permita pop-ups para imprimir.')
    w.document.write(html); w.document.close()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Comprovantes
            </CardTitle>
            <CardDescription>
              Pagamentos confirmados via Pix. Anexe o link do comprovante (Drive, S3,
              etc.) e gere um recibo imprimível.
            </CardDescription>
          </div>
          <Badge variant="secondary">{paid.length} confirmados</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {paid.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum pagamento confirmado ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paid.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.paid_at ? new Date(c.paid_at).toLocaleString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.payer_name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{c.payer_email ?? ''}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.plan_code}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatBRL(c.unique_amount_cents)}
                  </TableCell>
                  <TableCell>
                    {c.receipt_url ? (
                      <a
                        href={c.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Baixar
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title={c.receipt_url ? 'Editar link' : 'Anexar comprovante'}
                      onClick={() => { setEditing(c); setUrl(c.receipt_url ?? '') }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Imprimir recibo"
                      onClick={() => printReceipt(c)}
                    >
                      <Printer className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprovante do pagamento</DialogTitle>
            <DialogDescription>
              Cole o link do comprovante (Drive, S3, PDF público). Deixe em branco para
              remover.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
