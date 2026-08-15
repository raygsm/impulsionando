import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Ticket = {
  ticket_id: string;
  protocol: string;
  conversation_id: string;
  export_status: string | null;
  export_requested_at: string | null;
  export_sent_at: string | null;
  closed_at: string | null;
  conversation_status: string;
  subject: string | null;
  last_channel: string | null;
  last_message_at: string | null;
  created_at: string;
};

export const Route = createFileRoute('/_authenticated/chrismed/protocolos')({
  component: ChrismedProtocolsPage,
  head: () => ({ meta: [{ title: 'Meus atendimentos e protocolos — CHRISMED' }] }),
});

function fmt(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function statusLabel(value: string | null) {
  const map: Record<string, string> = {
    open: 'Em atendimento',
    active: 'Em atendimento',
    resolved: 'Resolvido',
    closed: 'Encerrado',
    QUEUED: 'Exportação solicitada',
    PROCESSING: 'Preparando exportação',
    SENT: 'Exportação enviada',
  };
  return map[String(value)] ?? String(value ?? '—');
}

function ChrismedProtocolsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc('chrismed_get_my_support_tickets');
    setLoading(false);
    if (error) {
      console.error('[CHRISMED protocols]', error);
      toast.error('Não foi possível carregar seus protocolos.');
      return;
    }
    setTickets((data ?? []) as Ticket[]);
  }

  useEffect(() => { void load(); }, []);

  async function requestExport(ticket: Ticket) {
    setExporting(ticket.conversation_id);
    const { data, error } = await (supabase as any).rpc('chrismed_request_my_conversation_export', { p_conversation_id: ticket.conversation_id });
    setExporting(null);
    if (error) {
      console.error('[CHRISMED export request]', error);
      toast.error('Não foi possível solicitar a exportação agora.');
      return;
    }
    const result = data as { email?: string; protocol?: string } | null;
    toast.success(`Exportação solicitada${result?.email ? ` para ${result.email}` : ''}.`);
    await load();
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-8 text-[#071C18] sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Área exclusiva CHRISMED</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold"><MessageCircle className="h-7 w-7" />Meus atendimentos e protocolos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3F4A47]">Consulte protocolos de conversas vinculadas à sua conta e solicite uma cópia do histórico. A exportação só pode ser enviada ao e-mail da conta autenticada.</p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
        </header>

        {!loading && !tickets.length && <Card className="border-[#D9D3CB] bg-white"><CardContent className="py-12 text-center text-sm text-[#596660]">Você ainda não possui protocolos de atendimento vinculados a esta conta.</CardContent></Card>}

        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.ticket_id} className="border-[#D9D3CB] bg-white">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div><CardTitle className="text-lg">Protocolo {ticket.protocol}</CardTitle><p className="mt-1 text-xs text-[#596660]">Aberto em {fmt(ticket.created_at)} · Última interação {fmt(ticket.last_message_at)}</p></div>
                  <Badge className="w-fit border border-[#D9D3CB] bg-[#F7F3EA] text-[#071C18]">{statusLabel(ticket.conversation_status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-1 text-sm text-[#3F4A47]"><p><strong>Assunto:</strong> {ticket.subject || 'Atendimento CHRISMED'}</p><p><strong>Canal:</strong> {ticket.last_channel || 'Chat'}</p><p><strong>Exportação:</strong> {statusLabel(ticket.export_status)}{ticket.export_sent_at ? ` · enviada em ${fmt(ticket.export_sent_at)}` : ''}</p></div>
                <Button onClick={() => void requestExport(ticket)} disabled={exporting === ticket.conversation_id || ['QUEUED','PROCESSING'].includes(String(ticket.export_status))} className="bg-[#071C18] text-white hover:bg-[#0B2A24]"><Download className="mr-2 h-4 w-4" />{ticket.export_status === 'SENT' ? 'Solicitar nova cópia' : 'Exportar conversa'}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
