/**
 * /restaurante/salao/notificacoes — Painel interno de notificações do salão.
 *
 * Lista todos os sinais INTERNOS gerados pela operação:
 *   - "Item pronto" (notifyItemReady): timestamp + lock idempotente.
 *   - "Pós-visita enviada": relacionamento, 24h–72h após fechamento.
 *
 * Nenhum dos itens aqui dispara push/WhatsApp ao cliente — são apenas
 * o histórico do que o sistema já fez de forma idempotente.
 */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Mail, RefreshCw, ShieldCheck, ScrollText } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getInternalSalaoNotifications } from '@/lib/restaurant-salao-notifications.functions'

export const Route = createFileRoute('/_authenticated/restaurante/salao/notificacoes')({
  component: NotificacoesSalaoPage,
})

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function NotificacoesSalaoPage() {
  const fetcher = useServerFn(getInternalSalaoNotifications)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['salao-internal-notifs'],
    queryFn: () => fetcher({ data: { limit: 100 } }),
    refetchInterval: 10_000,
  })

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Notificações internas do salão
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Histórico dos sinais INTERNOS disparados pela operação. Nada aqui sai para
            o cliente — comunicação ao cliente acontece apenas no recibo de fechamento
            e na régua pós-visita (24h–72h depois).
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/restaurante/salao/logs">
              <ScrollText className="h-4 w-4 mr-2" /> Ver logs
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <Bell className="h-4 w-4" /> Itens prontos — sinal interno (notifyItemReady)
        </h2>
        {isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : !data?.ready_signals.length ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum sinal recente.</Card>
        ) : (
          <div className="space-y-2">
            {data.ready_signals.map((r) => (
              <Card key={r.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.table_number ? `Mesa ${r.table_number}` : 'Mesa —'}
                    {r.customer_name ? ` · ${r.customer_name}` : ''}
                    <span className="ml-2 font-mono">{r.idempotency_key}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary">{r.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {fmt(r.notified_at)} · já notificado
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4" /> Pós-visita enviada (relacionamento)
        </h2>
        {isLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando…</Card>
        ) : !data?.postvisit.length ? (
          <Card className="p-6 text-sm text-muted-foreground">Nenhum disparo pós-visita ainda.</Card>
        ) : (
          <div className="space-y-2">
            {data.postvisit.map((p) => (
              <Card key={p.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {p.customer_name ?? 'Cliente'}{' '}
                    <span className="text-xs text-muted-foreground">{p.customer_email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.table_number ? `Mesa ${p.table_number}` : 'Mesa —'} · fechado em{' '}
                    {p.bill_notified_at ? fmt(p.bill_notified_at) : '—'}
                    <span className="ml-2 font-mono">{p.idempotency_key}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge>pós-visita</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {fmt(p.notified_at)} · já notificado
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
