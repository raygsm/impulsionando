import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listPendingPixCharges,
  confirmPixCharge,
  cancelPixCharge,
} from '@/lib/pix-charges.functions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Search, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/admin/pix-pendentes')({
  component: PixPendentesPage,
  head: () => ({
    meta: [
      { title: 'Pix pendentes — Admin' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
})

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PixPendentesPage() {
  const fetchList = useServerFn(listPendingPixCharges)
  const confirmFn = useServerFn(confirmPixCharge)
  const cancelFn = useServerFn(cancelPixCharge)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pix-pending'],
    queryFn: () => fetchList(),
    refetchInterval: 30_000,
  })

  const [confirmTarget, setConfirmTarget] = useState<{
    id: string
    amount: number
    payer: string | null
  } | null>(null)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [filter, setFilter] = useState('')

  const confirmMut = useMutation({
    mutationFn: (input: { id: string; receiptUrl?: string }) => confirmFn({ data: input }),
    onSuccess: () => {
      toast.success('Cobrança confirmada e plano liberado.')
      setConfirmTarget(null)
      setReceiptUrl('')
      qc.invalidateQueries({ queryKey: ['admin-pix-pending'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao confirmar.'),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success('Cobrança cancelada.')
      qc.invalidateQueries({ queryKey: ['admin-pix-pending'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Falha ao cancelar.'),
  })

  const filtered = (data ?? []).filter((c: any) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      c.payer_name?.toLowerCase().includes(q) ||
      c.payer_email?.toLowerCase().includes(q) ||
      c.plan_code?.toLowerCase().includes(q) ||
      String(c.unique_amount_cents).includes(q)
    )
  })

  const pending = filtered.filter((c: any) => c.status === 'pending')
  const recent = filtered.filter((c: any) => c.status === 'paid').slice(0, 20)

  return (
    <main className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="w-7 h-7 text-primary" />
          Pix pendentes
        </h1>
        <p className="text-muted-foreground mt-1">
          Cruze o valor exato com o extrato do banco e confirme. A confirmação aciona a
          mesma rotina de liberação que o webhook do Mercado Pago usará no futuro.
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Nome, e-mail, plano ou valor em centavos"
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aguardando pagamento ({pending.length})</CardTitle>
          <CardDescription>
            Procure no extrato do CNPJ 54.295.500/0001-27 por um Pix com o
            <strong> valor exato</strong> da linha. Se bater, clique em Confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem cobranças pendentes.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criada</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead className="text-right">Valor exato</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.plan_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.payer_name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.payer_email ?? c.payer_whatsapp ?? ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {formatBRL(c.unique_amount_cents)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.expires_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setConfirmTarget({
                            id: c.id,
                            amount: c.unique_amount_cents,
                            payer: c.payer_name,
                          })
                        }
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Cancelar essa cobrança?')) cancelMut.mutate(c.id)
                        }}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmadas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma confirmação recente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmada</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.paid_at ? new Date(c.paid_at).toLocaleString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.plan_code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.payer_name ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatBRL(c.unique_amount_cents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmTarget} onOpenChange={(v) => !v && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento Pix</DialogTitle>
            <DialogDescription>
              Você está confirmando o recebimento de{' '}
              <strong>{confirmTarget ? formatBRL(confirmTarget.amount) : ''}</strong>
              {confirmTarget?.payer ? ` de ${confirmTarget.payer}` : ''}. Isso libera o
              plano imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL do comprovante (opcional)</label>
            <Input
              placeholder="https://… (Drive, S3, etc.)"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={confirmMut.isPending}
              onClick={() =>
                confirmTarget &&
                confirmMut.mutate({
                  id: confirmTarget.id,
                  receiptUrl: receiptUrl || undefined,
                })
              }
            >
              {confirmMut.isPending ? 'Confirmando…' : 'Confirmar e liberar plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
