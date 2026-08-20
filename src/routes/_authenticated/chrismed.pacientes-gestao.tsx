import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Send, UserRound, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/chrismed/pacientes-gestao')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedPatientsManagement,
  head: () => ({ meta: [{ title: 'Pacientes — Gestão CHRISMED' }] }),
});

type Patient = {
  user_id: string;
  full_name: string;
  whatsapp: string | null;
  email: string | null;
  status: string;
  cpf: string | null;
  city: string | null;
  state: string | null;
  fiscal_profile_complete: boolean;
  created_at: string;
};

function ChrismedPatientsManagement() {
  const [rows, setRows] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending'|'active'|'other'>('pending');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('chrismed_patient_profiles').select('user_id,full_name,whatsapp,email,status,cpf,city,state,fiscal_profile_complete,created_at').order('created_at',{ascending:false}).limit(500);
    setLoading(false);
    if (error) return toast.error('Não foi possível carregar os pacientes.');
    setRows((data ?? []) as Patient[]);
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => tab === 'pending' ? ['pending','pending_review','incomplete'].includes(r.status) : tab === 'active' ? ['approved','active'].includes(r.status) : !['pending','pending_review','incomplete','approved','active'].includes(r.status)), [rows,tab]);

  async function review(userId:string, approve:boolean) {
    const reason = approve ? null : 'Cadastro não aprovado pela Gestão CHRISMED.';
    const { error } = await (supabase as any).rpc('chrismed_approve_patient',{p_user_id:userId,p_approve:approve,p_reason:reason});
    if(error) return toast.error(error.message || 'Não foi possível atualizar o cadastro.');
    toast.success(approve ? 'Paciente aprovado.' : 'Cadastro não aprovado.');
    await load();
  }

  return <main className="min-h-screen bg-[#f5f7f6] px-4 py-7 text-[#102b29] sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#61706d]">Gestão CHRISMED</p><h1 className="mt-2 text-3xl font-bold">Pacientes</h1><p className="mt-2 text-sm text-muted-foreground">Cadastros, aprovação administrativa e acesso rápido ao convite e à agenda.</p></div><div className="flex gap-2"><Button asChild><a href="/chrismed/convites"><Send className="mr-2 h-4 w-4"/>Convidar paciente</a></Button><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Atualizar</Button></div></div></header>
    <section className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-2">{([['pending','Pendentes'],['active','Ativos'],['other','Outros']] as const).map(([k,label])=><Button key={k} variant={tab===k?'default':'ghost'} onClick={()=>setTab(k)}>{label}</Button>)}</section>
    <section className="space-y-3">{!loading&&!filtered.length&&<Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum paciente nesta categoria.</CardContent></Card>}{filtered.map((p)=><Card key={p.user_id}><CardHeader className="pb-3"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5"/>{p.full_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{p.email || 'Sem e-mail'} · {p.whatsapp || 'Sem WhatsApp'}</p></div><Badge variant="outline">{p.status}</Badge></div></CardHeader><CardContent><div className="grid gap-2 text-sm md:grid-cols-3"><div><strong>Localidade</strong><p>{[p.city,p.state].filter(Boolean).join(' / ') || '—'}</p></div><div><strong>CPF</strong><p>{p.cpf ? 'Informado' : 'Pendente'}</p></div><div><strong>Fiscal</strong><p>{p.fiscal_profile_complete ? 'Completo' : 'Pendente'}</p></div></div>{['pending','pending_review','incomplete'].includes(p.status)&&<div className="mt-5 flex flex-wrap gap-2"><Button onClick={()=>void review(p.user_id,true)}><CheckCircle2 className="mr-2 h-4 w-4"/>Aprovar</Button><Button variant="outline" onClick={()=>void review(p.user_id,false)}><XCircle className="mr-2 h-4 w-4"/>Não aprovar</Button></div>}</CardContent></Card>)}</section>
  </div></main>;
}
