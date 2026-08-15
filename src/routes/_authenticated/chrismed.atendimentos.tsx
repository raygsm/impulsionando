import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, RefreshCw, UserRoundCheck, Download, Clock3 } from 'lucide-react';
import { toast } from 'sonner';

type Ticket = { ticket_id:string; protocol:string; conversation_id:string; contact_id:string; display_name:string|null; contact_user_id:string|null; conversation_status:string; subject:string|null; last_channel:string|null; last_message_at:string|null; export_status:string; created_at:string; closed_at:string|null };
type Payload = { metrics:{ total_tickets:number; open_conversations:number; waiting_human:number; queued_exports:number }; tickets:Ticket[] };

export const Route = createFileRoute('/_authenticated/chrismed/atendimentos')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedSupportManagement,
  head: () => ({ meta: [{ title: 'Atendimentos — Gestão CHRISMED' }] }),
});

function fmt(value:string|null){ return value ? new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}) : '—'; }
function statusClass(status:string){ return ['OPEN','WAITING_HUMAN','HUMAN'].includes(status) ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-emerald-300 bg-emerald-50 text-emerald-900'; }

function ChrismedSupportManagement(){
  const [data,setData]=useState<Payload>({metrics:{total_tickets:0,open_conversations:0,waiting_human:0,queued_exports:0},tickets:[]});
  const [loading,setLoading]=useState(true);
  async function load(){ setLoading(true); const {data:result,error}=await (supabase as any).rpc('chrismed_support_management_overview',{p_limit:200}); setLoading(false); if(error){console.error(error);toast.error('Não foi possível carregar os atendimentos.');return;} setData(result as Payload); }
  useEffect(()=>{void load();},[]);
  return <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Oliver · Atendimento · CRM</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-bold"><MessageCircle className="h-7 w-7"/>Central de atendimentos CHRISMED</h1><p className="mt-2 text-sm text-[#3F4A47]">Protocolos, conversas, handoffs humanos e exportações do tenant CHRISMED.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Atualizar</Button></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={MessageCircle} label="Protocolos" value={data.metrics.total_tickets}/><Metric icon={Clock3} label="Conversas abertas" value={data.metrics.open_conversations}/><Metric icon={UserRoundCheck} label="Aguardando humano" value={data.metrics.waiting_human}/><Metric icon={Download} label="Exportações na fila" value={data.metrics.queued_exports}/></section>
    <Card className="border-[#D9D3CB] bg-white"><CardHeader><CardTitle>Últimos atendimentos</CardTitle></CardHeader><CardContent className="space-y-3">{!data.tickets.length&&!loading&&<p className="py-10 text-center text-sm text-[#596660]">Nenhum atendimento registrado.</p>}{data.tickets.map(t=><div key={t.ticket_id} className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{t.protocol}</strong><Badge className={statusClass(t.conversation_status)}>{t.conversation_status}</Badge>{t.contact_user_id&&<Badge variant="outline">CADASTRADO</Badge>}</div><div className="mt-1 text-sm text-[#3F4A47]">{t.display_name||'Contato sem nome'} · {t.subject||'Atendimento CHRISMED'}</div><div className="mt-1 text-xs text-[#596660]">Aberto em {fmt(t.created_at)} · última interação {fmt(t.last_message_at)}</div></div><div className="text-sm text-[#3F4A47]"><div>Canal: <strong>{t.last_channel||'—'}</strong></div><div>Exportação: <strong>{t.export_status||'NOT_REQUESTED'}</strong></div></div><Button variant="outline" asChild><a href={`/core/integracoes/omnichannel?conversation=${encodeURIComponent(t.conversation_id)}`}>Abrir conversa</a></Button></div>)}</CardContent></Card>
  </div></main>;
}
function Metric({icon:Icon,label,value}:{icon:typeof MessageCircle;label:string;value:number}){return <Card className="border-[#D9D3CB] bg-white"><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-[#F1E9D9] p-3"><Icon className="h-5 w-5"/></div><div><div className="text-xs uppercase tracking-[0.12em] text-[#596660]">{label}</div><div className="text-2xl font-bold">{value}</div></div></CardContent></Card>}
