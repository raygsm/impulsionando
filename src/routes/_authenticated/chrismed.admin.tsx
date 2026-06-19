import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

export const Route = createFileRoute('/_authenticated/chrismed/admin')({
  component: ChrismedAdmin,
  head: () => ({
    meta: [
      { title: 'CHRISMED — Painel Administrativo' },
      { name: 'description', content: 'KPIs financeiros, pagamentos PIX e fila de mensagens da CHRISMED.' },
    ],
  }),
});

type Payment = {
  id: string;
  status: string;
  amount_cents: number;
  payer_name: string | null;
  payer_email: string | null;
  payment_method: string | null;
  created_at: string;
  approved_at: string | null;
};

type OutboxRow = {
  id: string;
  channel: string;
  status: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusColor(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (['approved', 'sent'].includes(s)) return 'default';
  if (['pending', 'queued', 'sending'].includes(s)) return 'secondary';
  if (['failed', 'rejected', 'cancelled'].includes(s)) return 'destructive';
  return 'outline';
}

function ChrismedAdmin() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [pay, out] = await Promise.all([
      supabase
        .from('mpago_payments')
        .select('id,status,amount_cents,payer_name,payer_email,payment_method,created_at,approved_at')
        .eq('company_id', CHRISMED_COMPANY_ID)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('message_outbox')
        .select('id,channel,status,recipient_email,recipient_phone,subject,attempts,last_error,created_at,sent_at')
        .eq('company_id', CHRISMED_COMPANY_ID)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    setPayments((pay.data as Payment[]) ?? []);
    setOutbox((out.data as OutboxRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const approved = payments.filter((p) => p.status === 'approved');
  const gmv = approved.reduce((s, p) => s + Number(p.amount_cents || 0) / 100, 0);
  const pending = payments.filter((p) => p.status === 'pending').length;
  const queued = outbox.filter((o) => ['queued', 'sending'].includes(o.status)).length;
  const sent = outbox.filter((o) => o.status === 'sent').length;
  const failed = outbox.filter((o) => o.status === 'failed').length;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CHRISMED — Painel</h1>
          <p className="text-sm text-muted-foreground">KPIs, pagamentos e fila de mensagens em tempo real (atualiza a cada 15s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">GMV aprovado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{brl(gmv)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Aprovados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{approved.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">PIX pendentes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Outbox fila</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queued}</div>
            <div className="text-xs text-muted-foreground">{sent} enviadas · {failed} falhas</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Ticket médio</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{approved.length ? brl(gmv / approved.length) : brl(0)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Pagamentos recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Quando</th>
                  <th className="py-2 pr-3">Pagador</th>
                  <th className="py-2 pr-3">Método</th>
                  <th className="py-2 pr-3 text-right">Valor</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum pagamento ainda.</td></tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{p.payer_name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{p.payer_email ?? ''}</div>
                    </td>
                    <td className="py-2 pr-3 uppercase text-xs">{p.payment_method ?? '—'}</td>
                    <td className="py-2 pr-3 text-right font-medium">{brl(Number(p.amount_cents || 0) / 100)}</td>
                    <td className="py-2 pr-3"><Badge variant={statusColor(p.status)}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fila de mensagens (outbox)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Quando</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Destinatário</th>
                  <th className="py-2 pr-3">Assunto</th>
                  <th className="py-2 pr-3">Tent.</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {outbox.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nenhuma mensagem na fila.</td></tr>
                )}
                {outbox.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-3 uppercase text-xs">{o.channel}</td>
                    <td className="py-2 pr-3 text-xs">{o.recipient_email ?? o.recipient_phone ?? '—'}</td>
                    <td className="py-2 pr-3">{o.subject ?? '—'}</td>
                    <td className="py-2 pr-3">{o.attempts}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={statusColor(o.status)}>{o.status}</Badge>
                      {o.last_error && <div className="text-xs text-destructive mt-1 max-w-xs truncate" title={o.last_error}>{o.last_error}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
