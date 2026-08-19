import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle2, PauseCircle, PlayCircle, RefreshCw, UserRoundCheck, XCircle } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/chrismed/time')({
  beforeLoad: requireChrismedManagement,
  component: TimeChrismedPage,
  head: () => ({ meta: [{ title: 'Time CHRISMED — Gestão de profissionais' }] }),
});

type Pro = { id:string; name:string; email:string|null; phone:string|null; profile_status:string; is_active:boolean; council_number:string|null; council_region:string|null; primary_area:string|null; service_modes:string[]; onboarding_completed_at:string|null; profession_id:string|null };
type Profession = { id:string; name:string; council_acronym:string|null };

const statusLabel:Record<string,string>={draft:'Rascunho',incomplete:'Incompleto',pending_review:'Pendente de aprovação',approved:'Aprovado — aguardando agenda',active:'Ativo',suspended:'Suspenso',rejected:'Não aprovado'};

function TimeChrismedPage(){
 const [rows,setRows]=useState<Pro[]>([]); const [professions,setProfessions]=useState<Profession[]>([]); const [loading,setLoading]=useState(true); const [tab,setTab]=useState<'pending'|'active'|'inactive'>('pending');
 async function load(){setLoading(true); const [p,c]=await Promise.all([supabase.from('agenda_professionals').select('id,name,email,phone,profile_status,is_active,council_number,council_region,primary_area,service_modes,onboarding_completed_at,profession_id').eq('company_id','642096b5-a9ff-4521-a82a-c004f6d2e2d2').order('created_at',{ascending:false}),supabase.from('health_professions').select('id,name,council_acronym').eq('is_active',true)]); setLoading(false); if(p.error||c.error){toast.error('Não foi possível atualizar o Time CHRISMED.');return;} setRows((p.data??[]) as Pro[]); setProfessions((c.data??[]) as Profession[]);}
 useEffect(()=>{void load();},[]);
 const filtered=useMemo(()=>rows.filter(r=>tab==='pending'?['draft','incomplete','pending_review'].includes(r.profile_status):tab==='active'?['approved','active'].includes(r.profile_status):['suspended','rejected'].includes(r.profile_status)),[rows,tab]);
 async function act(id:string,action:'approve'|'suspend'|'reactivate'|'reject'){const {error}=await supabase.rpc('chrismed_set_professional_status',{p_professional_id:id,p_action:action}); if(error){toast.error(error.message);return;} toast.success(action==='approve'?'Cadastro aprovado. O profissional foi avisado para criar o consultório e abrir a agenda.':action==='suspend'?'Profissional suspenso.':action==='reactivate'?'Profissional reativado.':'Cadastro marcado como não aprovado.'); await load();}
 return <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
  <header className="rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#596660]">Comitê CHRISMED</p><h1 className="mt-2 text-3xl font-bold">Time CHRISMED</h1><p className="mt-2 max-w-3xl text-sm text-[#3F4A47]">Analise novos cadastros. A aprovação libera o profissional para criar o consultório e abrir a agenda; a ativação pública ocorre somente após essa configuração.</p></div><Button onClick={()=>void load()} disabled={loading} variant="outline"><RefreshCw className={`mr-2 h-4 w-4 ${loading?'animate-spin':''}`}/>Atualizar</Button></div></header>
  <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-2">{([['pending','Pendentes'],['active','Aprovados / Ativos'],['inactive','Inativos']] as const).map(([k,l])=><Button key={k} variant={tab===k?'default':'ghost'} onClick={()=>setTab(k)} className={tab===k?'bg-[#071C18] text-white':''}>{l}</Button>)}</div>
  <div className="space-y-3">{!loading&&!filtered.length&&<Card><CardContent className="p-8 text-center text-sm text-[#596660]">Nenhum profissional nesta categoria.</CardContent></Card>}{filtered.map(p=>{const prof=professions.find(x=>x.id===p.profession_id);return <Card key={p.id} className="border-[#D9D3CB] bg-white"><CardHeader className="pb-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><CardTitle className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5"/>{p.name}</CardTitle><p className="mt-1 text-sm text-[#596660]">{prof?.name??'Profissão não informada'} {p.council_number?`· ${prof?.council_acronym??'Conselho'} ${p.council_number}${p.council_region?`/${p.council_region}`:''}`:''}</p></div><Badge variant="outline">{statusLabel[p.profile_status]??p.profile_status}</Badge></div></CardHeader><CardContent><div className="grid gap-2 text-sm md:grid-cols-3"><div><strong>E-mail</strong><p>{p.email??'—'}</p></div><div><strong>Área principal</strong><p>{p.primary_area??'—'}</p></div><div><strong>Modalidades</strong><p>{p.service_modes?.join(', ')||'—'}</p></div></div>{p.profile_status==='approved'&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Aprovado pelo Comitê. Aguardando o profissional concluir consultório, locais e agenda para ficar publicamente ativo.</p>}<div className="mt-5 flex flex-wrap gap-2">{['draft','incomplete','pending_review'].includes(p.profile_status)&&<><Button onClick={()=>void act(p.id,'approve')} className="bg-emerald-700 text-white hover:bg-emerald-800"><CheckCircle2 className="mr-2 h-4 w-4"/>Aprovar cadastro</Button><Button variant="outline" onClick={()=>void act(p.id,'reject')}><XCircle className="mr-2 h-4 w-4"/>Não aprovar</Button></>}{['approved','active'].includes(p.profile_status)&&<Button variant="outline" onClick={()=>void act(p.id,'suspend')} className="border-amber-400 text-amber-900"><PauseCircle className="mr-2 h-4 w-4"/>Suspender</Button>}{p.profile_status==='suspended'&&<Button onClick={()=>void act(p.id,'reactivate')} className="bg-emerald-700 text-white hover:bg-emerald-800"><PlayCircle className="mr-2 h-4 w-4"/>Reativar</Button>}</div></CardContent></Card>})}</div>
 </div></main>;
}
