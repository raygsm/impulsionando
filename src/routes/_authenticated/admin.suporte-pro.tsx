// Inbox do Suporte Inteligente — operadora/staff Impulsionando.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { operatorInbox, supportMetrics, reopenTicket, sendFollowUp } from '@/lib/support-pro.functions'
import { updateTicketStatus, addTicketMessage, getTicket } from '@/lib/support-tickets.functions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Headphones, Clock, AlertTriangle, CheckCircle2, MessageSquare, TrendingUp, RotateCcw, Send, Mail } from 'lucide-react'
import { reportError } from '@/lib/report-error'

export const Route = createFileRoute('/_authenticated/admin/suporte-pro')({
  head: () => ({ meta: [{ title: 'Suporte Inteligente — Gestão | Impulsionando' }] }),
  component: SuportePro,
  errorComponent: ({ error }) => {
    reportError(error, { route: 'admin.suporte-pro' })
    return <div className="p-6 text-sm text-destructive">Erro: {String((error as Error)?.message ?? error)}</div>
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
})

const STATUS_LABEL: Record<string, string> = {
  new: 'Novo', received: 'Recebido', in_review: 'Em análise',
  waiting_customer: 'Aguard. cliente', waiting_core: 'Aguard. Impulsionando',
  waiting_third_party: 'Aguard. terceiro', in_development: 'Em desenvolvimento',
  resolved: 'Resolvido', closed: 'Fechado', reopened: 'Reaberto', cancelled: 'Cancelado',
}
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
]
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-700 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  low: 'bg-muted text-muted-foreground',
}

function fmtMin(m: number | null): string {
  if (m == null) return '—'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.round(m / 60)}h`
  return `${Math.round(m / 1440)}d`
}

function SuportePro() {
  const inboxFn = useServerFn(operatorInbox)
  const metricsFn = useServerFn(supportMetrics)
  const qc = useQueryClient()

  const [status, setStatus] = useState<string>('all')
  const [priority, setPriority] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [openTicket, setOpenTicket] = useState<string | null>(null)

  const inbox = useQuery({
    queryKey: ['support-pro-inbox', status, priority, search, onlyMine],
    queryFn: () => inboxFn({ data: {
      status: status as any, priority: priority as any,
      search: search || undefined, assigned_to_me: onlyMine,
    } }),
    staleTime: 15_000,
  })

  const metrics = useQuery({
    queryKey: ['support-pro-metrics', 30],
    queryFn: () => metricsFn({ data: { days: 30 } }),
    staleTime: 60_000,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['support-pro-inbox'] })
    qc.invalidateQueries({ queryKey: ['support-pro-metrics'] })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            Suporte Inteligente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tickets integrados ao CRM, WhatsApp e Email. SLA, métricas e IA agrupando temas recorrentes.
          </p>
        </div>
        <Link to="/modulos/suporte-inteligente" className="text-xs text-primary underline">
          Ver detalhes comerciais do módulo →
        </Link>
      </div>

      <MetricsRow data={metrics.data} loading={metrics.isLoading} />

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="topics">IA · Temas recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 items-center">
              <Input placeholder="Buscar por protocolo, assunto ou email…"
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                Apenas meus
              </label>
              <Button variant="outline" size="sm" onClick={refresh}>Atualizar</Button>
            </CardContent>
          </Card>

          {inbox.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="space-y-2">
              {(inbox.data?.tickets ?? []).map((t: any) => (
                <Card key={t.id} className="hover:border-primary/50 cursor-pointer transition" onClick={() => setOpenTicket(t.id)}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{t.protocol}</span>
                          <Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                          <Badge variant="outline">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                          {t.sla_status === 'breach' && (
                            <Badge className="bg-red-500/15 text-red-700 border-red-500/30">
                              <AlertTriangle className="h-3 w-3 mr-1" />SLA estourado
                            </Badge>
                          )}
                          {t.sla_status === 'risk' && (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                              <Clock className="h-3 w-3 mr-1" />SLA em risco
                            </Badge>
                          )}
                          {t.reopened_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <RotateCcw className="h-3 w-3 mr-1" />Reaberto {t.reopened_count}×
                            </Badge>
                          )}
                          {t.ai_topic && (
                            <Badge variant="secondary" className="text-xs">{t.ai_topic}</Badge>
                          )}
                        </div>
                        <div className="mt-1.5 font-medium text-sm truncate">{t.subject}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.requester_email} · {new Date(t.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(inbox.data?.tickets ?? []).length === 0 && (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum ticket nesse filtro.</CardContent></Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Problemas mais recorrentes (IA — últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.isLoading ? <Skeleton className="h-40 w-full" /> :
                (metrics.data?.topics ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de IA ainda. O cron processa tickets a cada 5 minutos.</p>
                ) : (
                <div className="space-y-3">
                  {(metrics.data?.topics ?? []).map((t: any) => (
                    <div key={t.topic}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{t.topic}</span>
                        <span className="text-muted-foreground tabular-nums">{t.percentage}% · {t.count} tickets</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${t.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TicketDrawer
        ticketId={openTicket}
        onClose={() => setOpenTicket(null)}
        onChanged={refresh}
      />
    </div>
  )
}

function MetricsRow({ data, loading }: { data?: any; loading: boolean }) {
  const items = [
    { label: 'Backlog aberto', value: data?.backlog ?? '—', icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'TTFR médio (1ª resp.)', value: fmtMin(data?.ttfr_minutes_avg ?? null), icon: Clock, color: 'text-sky-600' },
    { label: 'TTR médio (resolução)', value: fmtMin(data?.ttr_minutes_avg ?? null), icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'CSAT médio', value: data?.csat_avg ? `${data.csat_avg} / 5 (${data.csat_count})` : '—', icon: MessageSquare, color: 'text-violet-600' },
    { label: 'Tickets reabertos', value: data?.reopened ?? '—', icon: RotateCcw, color: 'text-orange-600' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}><CardContent className="pt-5">
          <Icon className={`h-4 w-4 ${color} mb-2`} />
          <div className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-16" /> : value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        </CardContent></Card>
      ))}
    </div>
  )
}

function TicketDrawer({ ticketId, onClose, onChanged }: { ticketId: string | null; onClose: () => void; onChanged: () => void }) {
  const get = useServerFn(getTicket)
  const reply = useServerFn(addTicketMessage)
  const setStatus = useServerFn(updateTicketStatus)
  const reopen = useServerFn(reopenTicket)
  const followUp = useServerFn(sendFollowUp)
  const [reply_, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [follow, setFollow] = useState('')
  const [followChannel, setFollowChannel] = useState<'whatsapp'|'email'>('whatsapp')

  const q = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => (ticketId ? get({ data: { ticket_id: ticketId } }) : Promise.resolve(null)),
    enabled: !!ticketId,
  })
  const t = (q.data as any)?.ticket
  const messages = (q.data as any)?.messages ?? []

  const onSendReply = async () => {
    if (!ticketId || !reply_.trim()) return
    try {
      await reply({ data: { ticket_id: ticketId, body: reply_.trim(), is_internal: internal } as any })
      setReply(''); setInternal(false); q.refetch(); onChanged()
      toast.success('Mensagem enviada')
    } catch (e) { toast.error('Falha ao enviar', { description: String((e as Error).message) }) }
  }

  const onStatus = async (s: string) => {
    if (!ticketId) return
    try { await setStatus({ data: { ticket_id: ticketId, status: s as any } }); q.refetch(); onChanged(); toast.success('Status atualizado') }
    catch (e) { toast.error('Falha', { description: String((e as Error).message) }) }
  }

  const onReopen = async () => {
    if (!ticketId) return
    try { await reopen({ data: { ticket_id: ticketId } }); q.refetch(); onChanged(); toast.success('Ticket reaberto') }
    catch (e) { toast.error('Falha', { description: String((e as Error).message) }) }
  }

  const onFollow = async () => {
    if (!ticketId || !follow.trim()) return
    try {
      await followUp({ data: { ticket_id: ticketId, channel: followChannel, body: follow.trim() } })
      setFollow(''); toast.success(`Follow-up por ${followChannel} enfileirado`)
    } catch (e) { toast.error('Falha', { description: String((e as Error).message) }) }
  }

  return (
    <Dialog open={!!ticketId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {t && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs">{t.protocol}</span>
                <Badge>{STATUS_LABEL[t.status]}</Badge>
                <Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge>
                {t.ai_topic && <Badge variant="secondary">{t.ai_topic}</Badge>}
              </DialogTitle>
              <DialogDescription>{t.subject}</DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 flex-wrap items-center">
              <Select onValueChange={onStatus} value={t.status}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              {['resolved','closed','cancelled'].includes(t.status) && (
                <Button size="sm" variant="outline" onClick={onReopen}><RotateCcw className="h-3 w-3 mr-1" />Reabrir</Button>
              )}
            </div>

            {t.ai_summary && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 text-sm">
                  <div className="text-xs text-primary font-semibold mb-1">Resumo IA</div>
                  {t.ai_summary}
                </CardContent>
              </Card>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto">
              <div className="rounded border p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">{t.requester_email} · {new Date(t.created_at).toLocaleString('pt-BR')}</div>
                <div className="text-sm whitespace-pre-wrap">{t.description}</div>
              </div>
              {messages.map((m: any) => (
                <div key={m.id} className={`rounded border p-3 ${m.author_role === 'staff' ? 'bg-primary/5' : ''} ${m.is_internal ? 'border-amber-500/40 bg-amber-50' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.author_role === 'staff' ? 'Impulsionando' : 'Cliente'} · {new Date(m.created_at).toLocaleString('pt-BR')}
                    {m.is_internal && <span className="ml-2 text-amber-700 font-semibold">(nota interna)</span>}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-semibold">Responder ao cliente</div>
              <Textarea rows={3} value={reply_} onChange={(e) => setReply(e.target.value)} placeholder="Sua resposta…" />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Nota interna (não visível ao cliente)
                </label>
                <Button size="sm" onClick={onSendReply}><Send className="h-3 w-3 mr-1" />Enviar</Button>
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-semibold">Follow-up direto (WhatsApp / Email)</div>
              <div className="flex gap-2">
                <Select value={followChannel} onValueChange={(v) => setFollowChannel(v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={follow} onChange={(e) => setFollow(e.target.value)} placeholder="Mensagem curta de follow-up…" />
                <Button size="sm" variant="outline" onClick={onFollow}>
                  {followChannel === 'whatsapp' ? <MessageSquare className="h-3 w-3 mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
