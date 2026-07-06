import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { listOutbox, resendOutbox, cancelOutbox } from '@/lib/comunicacao.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, MessageSquare, Bell, RotateCw, Ban, RefreshCw } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/admin/comunicacao')({
  component: ComunicacaoPage,
});

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'secondary',
  sending: 'default',
  sent: 'default',
  failed: 'destructive',
  skipped: 'outline',
  cancelled: 'outline',
};

const channelIcon = (c: string) =>
  c === 'whatsapp' ? <MessageSquare className="h-4 w-4" /> : c === 'email' ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />;

function ComunicacaoPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');

  const list = useServerFn(listOutbox);
  const resend = useServerFn(resendOutbox);
  const cancel = useServerFn(cancelOutbox);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-outbox', status, channel],
    queryFn: () => list({ data: { status: status as never, channel: channel as never, limit: 100 } }),
    refetchInterval: 15000,
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => resend({ data: { id } }),
    onSuccess: () => {
      toast.success('Mensagem reenfileirada');
      qc.invalidateQueries({ queryKey: ['admin-outbox'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success('Mensagem cancelada');
      qc.invalidateQueries({ queryKey: ['admin-outbox'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicação</h1>
          <p className="text-muted-foreground">Caixa unificada de e-mail, WhatsApp e in-app · auto-refresh 15s</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/mpago-eventos">Eventos MP</Link></Button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Contadores refletem os filtros ativos abaixo. Clique novamente no card selecionado para voltar a "todos".
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {['queued', 'sending', 'sent', 'failed', 'skipped', 'cancelled'].map((s) => {
            const active = status === s;
            return (
              <Card
                key={s}
                className={`cursor-pointer transition-colors ${active ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setStatus(active ? 'all' : s)}
              >
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground uppercase">{s}</div>
                  <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Mensagens recentes</CardTitle>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="queued">Na fila</SelectItem>
                <SelectItem value="sending">Enviando</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="skipped">Pulado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos canais</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Carregando...</div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">Nenhuma mensagem encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Canal</th>
                    <th className="py-2 pr-3">Evento</th>
                    <th className="py-2 pr-3">Destinatário</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Tent.</th>
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-accent/40">
                      <td className="py-2 pr-3"><div className="flex items-center gap-2">{channelIcon(r.channel)}<span>{r.channel}</span></div></td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.event_code}</td>
                      <td className="py-2 pr-3">
                        <div className="truncate max-w-[220px]">{r.recipient_name || r.recipient_email || r.recipient_phone || '—'}</div>
                        {r.subject && <div className="text-xs text-muted-foreground truncate max-w-[220px]">{r.subject}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={statusVariant[r.status] ?? 'outline'}>{r.status}</Badge>
                        {r.last_error && <div className="text-xs text-destructive mt-1 truncate max-w-[200px]" title={r.last_error}>{r.last_error}</div>}
                      </td>
                      <td className="py-2 pr-3 text-xs">{r.attempts}/{r.max_attempts}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-1">
                          {(r.status === 'failed' || r.status === 'cancelled' || r.status === 'skipped') && (
                            <Button size="sm" variant="outline" disabled={resendMut.isPending} onClick={() => resendMut.mutate(r.id)}>
                              <RotateCw className="h-3 w-3 mr-1" /> Reenviar
                            </Button>
                          )}
                          {(r.status === 'queued' || r.status === 'failed') && (
                            <Button size="sm" variant="ghost" disabled={cancelMut.isPending} onClick={() => cancelMut.mutate(r.id)}>
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
