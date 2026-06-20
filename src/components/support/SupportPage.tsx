// Página de Suporte — usada por Cliente (`/suporte`) e Consumidor (`/ajuda`).
// Mesmo componente, escopo controlado por RLS.
import { useState } from 'react'
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { createTicket, listTickets, getTicket, addTicketMessage, updateTicketStatus } from '@/lib/support-tickets.functions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo', received: 'Recebido', in_review: 'Em análise',
  waiting_customer: 'Aguardando você', waiting_core: 'Aguardando Impulsionando',
  waiting_third_party: 'Aguardando terceiro', in_development: 'Em desenvolvimento',
  resolved: 'Resolvido', closed: 'Encerrado', reopened: 'Reaberto', cancelled: 'Cancelado',
}

const TYPE_OPTIONS_CUSTOMER = [
  'financial','payment','payout','commission','contract','access','technical',
  'whatsapp','email','mercadopago','dashboard','permission','registration',
  'marketplace','lgpd','suggestion','question','commercial',
]
const TYPE_OPTIONS_CONSUMER = [
  'clube','consumer','payment','access','lgpd','suggestion','question',
]

const ticketsQuery = (fetcher: () => Promise<any>) =>
  queryOptions({ queryKey: ['my-tickets'], queryFn: fetcher })

export function SupportPage({ audience }: { audience: 'customer' | 'consumer' }) {
  const list = useServerFn(listTickets)
  const create = useServerFn(createTicket)
  const detail = useServerFn(getTicket)
  const msg = useServerFn(addTicketMessage)
  const upd = useServerFn(updateTicketStatus)
  const qc = useQueryClient()

  const { data: tickets } = useSuspenseQuery(ticketsQuery(() => list({ data: {} })))
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('question')
  const [priority, setPriority] = useState<'low'|'medium'|'high'|'critical'>('medium')

  const onCreate = async () => {
    try {
      const r = await create({ data: { subject, description, type: type as any, priority } })
      toast.success('Chamado aberto', { description: `Protocolo ${r.protocol}` })
      setCreating(false); setSubject(''); setDescription('')
      qc.invalidateQueries({ queryKey: ['my-tickets'] })
      setOpenId(r.id)
    } catch (e) {
      toast.error('Falha ao abrir chamado', { description: String((e as Error).message) })
    }
  }

  const types = audience === 'consumer' ? TYPE_OPTIONS_CONSUMER : TYPE_OPTIONS_CUSTOMER

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{audience === 'consumer' ? 'Ajuda & Suporte' : 'Suporte'}</h1>
          <p className="text-sm text-muted-foreground">
            Abra um chamado e acompanhe o atendimento da equipe Impulsionando.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Abrir chamado</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo chamado</DialogTitle>
              <DialogDescription>Descreva o que está acontecendo. Respondemos por aqui.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Assunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={8000} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button onClick={onCreate} disabled={subject.length < 3 || description.length < 5}>Abrir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Meus chamados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aberto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tickets as any[]).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.protocol}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.subject}</TableCell>
                  <TableCell className="text-xs">{t.type}</TableCell>
                  <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                  <TableCell><Badge>{STATUS_LABEL[t.status] ?? t.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(t.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setOpenId(t.id)}>Abrir</Button></TableCell>
                </TableRow>
              ))}
              {(tickets as any[]).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Nenhum chamado ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TicketDialog
        ticketId={openId} onClose={() => setOpenId(null)}
        load={(id) => detail({ data: { ticket_id: id } })}
        sendMsg={(id, body) => msg({ data: { ticket_id: id, body } }).then(() => qc.invalidateQueries({ queryKey: ['ticket', id] }))}
        reopen={(id) => upd({ data: { ticket_id: id, status: 'reopened' } }).then(() => {
          qc.invalidateQueries({ queryKey: ['my-tickets'] })
          qc.invalidateQueries({ queryKey: ['ticket', id] })
        })}
        rate={(id, rating, comment) => upd({ data: { ticket_id: id, rating, rating_comment: comment } }).then(() => {
          qc.invalidateQueries({ queryKey: ['ticket', id] })
        })}
        audience={audience}
      />
    </div>
  )
}

function TicketDialog({
  ticketId, onClose, load, sendMsg, reopen, rate, audience,
}: {
  ticketId: string | null
  onClose: () => void
  load: (id: string) => Promise<any>
  sendMsg: (id: string, body: string) => Promise<void>
  reopen: (id: string) => Promise<void>
  rate: (id: string, rating: number, comment?: string) => Promise<void>
  audience: 'customer' | 'consumer'
}) {
  const qc = useQueryClient()
  const data = useSuspenseQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => (ticketId ? load(ticketId) : Promise.resolve(null)),
    staleTime: 5_000,
  }).data
  const [body, setBody] = useState('')

  const open = !!ticketId
  const t = (data as any)?.ticket
  const messages = (data as any)?.messages ?? []

  const onSend = async () => {
    if (!ticketId || body.trim().length === 0) return
    await sendMsg(ticketId, body.trim())
    setBody('')
    qc.invalidateQueries({ queryKey: ['my-tickets'] })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl">
        {t && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-xs">{t.protocol}</span>
                <Badge>{STATUS_LABEL[t.status] ?? t.status}</Badge>
              </DialogTitle>
              <DialogDescription>{t.subject}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div className="rounded border p-3 bg-muted/40">
                <div className="text-xs text-muted-foreground mb-1">Descrição inicial</div>
                <div className="text-sm whitespace-pre-wrap">{t.description}</div>
              </div>
              {messages.map((m: any) => (
                <div key={m.id} className={`rounded border p-3 ${m.author_role === 'staff' ? 'bg-primary/5' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.author_role === 'staff' ? 'Impulsionando' : audience === 'consumer' ? 'Você' : 'Sua equipe'}
                    {' · '}{new Date(m.created_at).toLocaleString('pt-BR')}
                    {m.is_internal && <span className="ml-2 text-amber-600">(interna)</span>}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            {['resolved','closed','cancelled'].includes(t.status) ? (
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" onClick={() => reopen(t.id)}>Reabrir</Button>
                {t.status === 'resolved' && !t.rating && (
                  <div className="flex gap-1 items-center">
                    {[1,2,3,4,5].map((n) => (
                      <Button key={n} size="sm" variant="ghost" onClick={() => rate(t.id, n)}>{'★'.repeat(n)}</Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva uma resposta…" />
                <div className="flex justify-end"><Button onClick={onSend} disabled={body.trim().length === 0}>Enviar</Button></div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
