// Painel STAFF de Suporte: KPIs + fila completa + ações.
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'
import { listTickets, getTicket, addTicketMessage, updateTicketStatus, supportDashboard } from '@/lib/support-tickets.functions'
import { reportError } from '@/lib/report-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo', received: 'Recebido', in_review: 'Em análise',
  waiting_customer: 'Aguarda cliente', waiting_core: 'Aguarda Core',
  waiting_third_party: 'Aguarda terceiro', in_development: 'Em dev',
  resolved: 'Resolvido', closed: 'Encerrado', reopened: 'Reaberto', cancelled: 'Cancelado',
}
const STATUSES = ['new','received','in_review','waiting_customer','waiting_core','waiting_third_party','in_development','resolved','closed','reopened','cancelled']

export const Route = createFileRoute('/_authenticated/core/suporte')({
  component: CoreSuportePage,
  head: () => ({ meta: [{ title: 'Suporte — CORE Impulsionando' }] }),
  errorComponent: ({ error }) => {
    reportError(error, { route: 'core.suporte' })
    return <div className="p-6"><h1 className="text-xl font-semibold">Erro</h1><p className="text-sm text-muted-foreground mt-2">{String((error as Error)?.message ?? error)}</p></div>
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

function CoreSuportePage() {
  const list = useServerFn(listTickets)
  const detail = useServerFn(getTicket)
  const msg = useServerFn(addTicketMessage)
  const upd = useServerFn(updateTicketStatus)
  const dash = useServerFn(supportDashboard)
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const { data: kpis } = useSuspenseQuery(queryOptions({
    queryKey: ['core', 'support-dashboard'],
    queryFn: () => dash(),
  }))
  const { data: tickets } = useSuspenseQuery(queryOptions({
    queryKey: ['core', 'support-tickets', statusFilter],
    queryFn: () => list({ data: statusFilter === 'all' ? {} : { status: statusFilter as any } }),
  }))

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['core', 'support-tickets'] })
    qc.invalidateQueries({ queryKey: ['core', 'support-dashboard'] })
  }

  const onStatus = async (id: string, status: string) => {
    try {
      await upd({ data: { ticket_id: id, status: status as any } })
      toast.success('Status atualizado')
      refresh()
      qc.invalidateQueries({ queryKey: ['ticket', id] })
    } catch (e) { toast.error(String((e as Error).message)) }
  }

  const k = (kpis as any).totals
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suporte — Central Core</h1>
          <p className="text-sm text-muted-foreground">Últimos 30 dias.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi title="Total (30d)" value={k.total} />
        <Kpi title="Abertos" value={k.open} />
        <Kpi title="Vencidos SLA" value={k.overdue} accent={k.overdue > 0} />
        <Kpi title="1ª resposta (min)" value={k.first_response_avg_min} />
        <Kpi title="Resolução (min)" value={k.resolve_avg_min} />
      </div>

      <Card>
        <CardHeader><CardTitle>Fila</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tickets as any[]).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.protocol}</TableCell>
                  <TableCell className="text-xs">{t.companies?.name ?? '— (consumidor)'}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.subject}</TableCell>
                  <TableCell className="text-xs">{t.type}</TableCell>
                  <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => onStatus(t.id, v)}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs">{t.sla_due_at ? new Date(t.sla_due_at).toLocaleString('pt-BR') : '—'}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setSelected(t.id)}>Abrir</Button></TableCell>
                </TableRow>
              ))}
              {(tickets as any[]).length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Sem chamados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffTicketDialog
        ticketId={selected}
        onClose={() => setSelected(null)}
        load={(id) => detail({ data: { ticket_id: id } })}
        sendMsg={(id, body, internal) => msg({ data: { ticket_id: id, body, is_internal: internal } }).then(() => {
          qc.invalidateQueries({ queryKey: ['ticket', id] })
        })}
      />
    </div>
  )
}

function Kpi({ title, value, accent }: { title: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${accent ? 'text-destructive' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function StaffTicketDialog({
  ticketId, onClose, load, sendMsg,
}: {
  ticketId: string | null
  onClose: () => void
  load: (id: string) => Promise<any>
  sendMsg: (id: string, body: string, internal: boolean) => Promise<void>
}) {
  const data = useSuspenseQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => (ticketId ? load(ticketId) : Promise.resolve(null)),
    staleTime: 5_000,
  }).data
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)

  const t = (data as any)?.ticket
  const messages = (data as any)?.messages ?? []

  const send = async () => {
    if (!ticketId || body.trim().length === 0) return
    await sendMsg(ticketId, body.trim(), internal)
    setBody('')
  }

  return (
    <Dialog open={!!ticketId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl">
        {t && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-xs">{t.protocol}</span>
                <Badge>{STATUS_LABEL[t.status] ?? t.status}</Badge>
                <Badge variant="outline">{t.priority}</Badge>
              </DialogTitle>
              <DialogDescription>{t.subject} · {t.companies?.name ?? 'consumidor'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
              <div className="rounded border p-3 bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Descrição inicial</div>
                <div className="text-sm whitespace-pre-wrap">{t.description}</div>
              </div>
              {messages.map((m: any) => (
                <div key={m.id} className={`rounded border p-3 ${m.is_internal ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300' : m.author_role === 'staff' ? 'bg-primary/5' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.author_role} · {new Date(m.created_at).toLocaleString('pt-BR')}
                    {m.is_internal && <span className="ml-2 text-amber-700">(interna)</span>}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={internal} onCheckedChange={setInternal} id="int" />
                <Label htmlFor="int" className="text-xs">Nota interna (cliente não vê)</Label>
              </div>
              <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Responder ao chamado…" />
            </div>
            <DialogFooter>
              <Button onClick={send} disabled={body.trim().length === 0}>Enviar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
