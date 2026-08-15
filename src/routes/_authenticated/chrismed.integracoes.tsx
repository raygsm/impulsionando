import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bot, Cloud, FileText, RefreshCw, ShieldCheck, TicketCheck } from 'lucide-react';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const CHRISMED_TENANT_ID = '94bf647c-c851-41ab-8700-1e062263e54d';

type DriveConnection = { id: string; provider_account_email: string | null; status: string; connected_at: string | null; last_sync: string | null; last_error: string | null };
type Agent = { id: string; name: string; role: string | null; active: boolean; reply_route: string | null };
type Counts = { tickets: number; openConversations: number; queuedExports: number; indexedDocuments: number };

export const Route = createFileRoute('/_authenticated/chrismed/integracoes')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedIntegrations,
  head: () => ({ meta: [{ title: 'Integrações — Gestão CHRISMED' }] }),
});

function ChrismedIntegrations() {
  const [drive, setDrive] = useState<DriveConnection | null>(null);
  const [oliver, setOliver] = useState<Agent | null>(null);
  const [counts, setCounts] = useState<Counts>({ tickets: 0, openConversations: 0, queuedExports: 0, indexedDocuments: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  async function load() {
    setLoading(true);
    const [driveResult, agentResult, ticketsResult, conversationsResult, exportsResult, docsResult] = await Promise.all([
      supabase.from('client_drive_connections').select('id,provider_account_email,status,connected_at,last_sync,last_error').eq('company_id', CHRISMED_COMPANY_ID).eq('provider', 'google_drive').maybeSingle(),
      supabase.from('communication_agents').select('id,name,role,active,reply_route').eq('tenant_id', CHRISMED_TENANT_ID).eq('name', 'Oliver').maybeSingle(),
      supabase.from('communication_conversation_tickets').select('id', { count: 'exact', head: true }).eq('tenant_id', CHRISMED_TENANT_ID),
      supabase.from('communication_conversations').select('id', { count: 'exact', head: true }).eq('tenant_id', CHRISMED_TENANT_ID).eq('status', 'OPEN'),
      supabase.from('communication_conversation_export_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', CHRISMED_TENANT_ID).eq('status', 'QUEUED'),
      supabase.from('client_drive_documents').select('id', { count: 'exact', head: true }).eq('company_id', CHRISMED_COMPANY_ID).eq('status', 'indexed'),
    ]);
    setDrive((driveResult.data as DriveConnection | null) ?? null);
    setOliver((agentResult.data as Agent | null) ?? null);
    setCounts({ tickets: ticketsResult.count ?? 0, openConversations: conversationsResult.count ?? 0, queuedExports: exportsResult.count ?? 0, indexedDocuments: docsResult.count ?? 0 });
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function connectGoogleDrive() {
    setConnecting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sessão administrativa não encontrada.');
      const response = await fetch('/api/chrismed/google-drive/start', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok || !body.authorizationUrl) throw new Error(body.error || 'Não foi possível iniciar a conexão.');
      window.location.assign(body.authorizationUrl);
    } catch (error) {
      toast.error((error as Error).message);
      setConnecting(false);
    }
  }

  const driveReady = drive?.status === 'connected';
  const oliverReady = Boolean(oliver?.active && oliver.reply_route);

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Gestão · IA · Documentos</p><h1 className="mt-1 text-3xl font-bold">Integrações CHRISMED</h1><p className="mt-2 max-w-3xl text-sm text-[#3F4A47]">Google Drive, Oliver, protocolos e exportações em um único cockpit operacional.</p></div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={TicketCheck} label="Protocolos" value={counts.tickets} />
          <Metric icon={Bot} label="Conversas abertas" value={counts.openConversations} />
          <Metric icon={FileText} label="Exportações na fila" value={counts.queuedExports} />
          <Metric icon={Cloud} label="Docs indexados" value={counts.indexedDocuments} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className={driveReady ? 'border-emerald-300 bg-white' : 'border-amber-300 bg-white'}>
            <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />Google Drive CHRISMED</CardTitle><Badge className={driveReady ? 'border border-emerald-300 bg-emerald-50 text-emerald-900' : 'border border-amber-300 bg-amber-50 text-amber-950'}>{driveReady ? 'CONECTADO' : 'PENDENTE'}</Badge></div></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-[#3F4A47]">Fonte documental oficial da CHRISMED para o Oliver consultar e classificar documentos. A leitura não autoriza o compartilhamento com pacientes.</p>
              <Info label="Conta autorizada" value={drive?.provider_account_email ?? 'Ainda não conectada'} />
              <Info label="Conectado em" value={drive?.connected_at ? new Date(drive.connected_at).toLocaleString('pt-BR') : '—'} />
              <Info label="Última sincronização" value={drive?.last_sync ? new Date(drive.last_sync).toLocaleString('pt-BR') : '—'} />
              {drive?.last_error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{drive.last_error}</div>}
              <Button onClick={() => void connectGoogleDrive()} disabled={connecting} className="bg-[#071C18] text-white">{connecting ? 'Abrindo Google…' : driveReady ? 'Reconectar Google Drive' : 'Conectar Google Drive'}</Button>
            </CardContent>
          </Card>

          <Card className={oliverReady ? 'border-emerald-300 bg-white' : 'border-amber-300 bg-white'}>
            <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Oliver</CardTitle><Badge className={oliverReady ? 'border border-emerald-300 bg-emerald-50 text-emerald-900' : 'border border-amber-300 bg-amber-50 text-amber-950'}>{oliverReady ? 'ATIVO' : 'ATENÇÃO'}</Badge></div></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-[#3F4A47]">Instância especializada do cérebro Impulsionito para atendimento, suporte, engajamento, vendas, orientação de jornadas e operação CHRISMED.</p>
              <Info label="Agente" value={oliver?.name ?? 'Oliver não localizado'} />
              <Info label="Papel" value={oliver?.role ?? '—'} />
              <Info label="Rota omnichannel" value={oliver?.reply_route ?? '—'} />
              <div className="rounded-xl border bg-[#FDFCFB] p-4"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Regra documental</div><p className="mt-2 text-xs text-[#596660]">Oliver pode localizar, ler, compreender e relacionar documentos internos. A entrega de documento é limitada ao proprietário autenticado ou contexto autorizado.</p></div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-[#D9D3CB] bg-white"><CardHeader><CardTitle>Atendimento e protocolo</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3 text-sm"><Info label="Protocolo automático" value="ATD-AAAAMMDD-XXXXXXX" /><Info label="Exportação" value="Somente usuário autenticado e proprietário da conversa" /><Info label="Retenção operacional" value="Auditável pelo Core de comunicação" /></CardContent></Card>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: number }) { return <Card className="border-[#D9D3CB] bg-white"><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-[#F1E9D9] p-3"><Icon className="h-5 w-5" /></div><div><div className="text-xs uppercase tracking-[0.12em] text-[#596660]">{label}</div><div className="text-2xl font-bold">{value}</div></div></CardContent></Card>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[#E3DDD4] bg-[#FDFCFB] p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-[#596660]">{label}</div><div className="mt-1 font-medium break-words">{value}</div></div>; }
