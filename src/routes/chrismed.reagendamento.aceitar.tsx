import { createFileRoute, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useState } from 'react';
import { CalendarCheck2, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const searchSchema=z.object({token:z.string().min(32)});
export const Route=createFileRoute('/chrismed/reagendamento/aceitar')({
  validateSearch:zodValidator(searchSchema),
  head:()=>({meta:[{title:'Autorizar novo horário · CHRISMED'},{name:'robots',content:'noindex,nofollow'}]}),
  component:AcceptReschedule,
});

type Accepted={status:string;appointment_id:string;starts_at:string;ends_at:string;already_accepted?:boolean};
function fmt(v:string){return new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'full',timeStyle:'short'});}
function AcceptReschedule(){
  const {token}=Route.useSearch(); const [busy,setBusy]=useState(false); const [accepted,setAccepted]=useState<Accepted|null>(null); const [error,setError]=useState<string|null>(null);
  async function accept(){
    if(busy||accepted)return; setBusy(true);setError(null);
    const {data,error:rpcError}=await (supabase as any).rpc('chrismed_accept_appointment_reschedule',{p_token:token,p_ip:null,p_user_agent:navigator.userAgent});
    setBusy(false);
    if(rpcError){setError('Não foi possível confirmar este novo horário. O seu agendamento anterior não foi alterado. O link pode ter expirado ou o horário proposto pode não estar mais disponível.');return;}
    setAccepted(data as Accepted);
  }
  return <ChrismedShell><main className="min-h-[70vh] bg-[var(--chrismed-ivory)] px-5 py-14 text-[var(--chrismed-forest-deep)]"><div className="mx-auto max-w-2xl rounded-3xl border border-[var(--chrismed-sand)] bg-white p-7 shadow-sm md:p-10">
    {accepted?<div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700"/><h1 className="chrismed-serif mt-5 text-4xl">Novo horário confirmado.</h1><p className="mt-4 text-[var(--chrismed-graphite)]">Sua autorização foi registrada e o agendamento foi atualizado para <strong>{fmt(accepted.starts_at)}</strong>.</p><p className="mt-3 text-sm text-[var(--chrismed-graphite)]">A CHRISMED também enviou uma confirmação para o seu e-mail.</p><Button asChild className="mt-7"><Link to="/chrismed/minha-conta">Ver minha conta</Link></Button></div>:
    <><div className="flex items-center gap-3 text-sm font-bold uppercase tracking-[.14em] text-[var(--chrismed-forest)]"><CalendarCheck2 className="h-5 w-5"/>Proposta de novo horário</div><h1 className="chrismed-serif mt-4 text-4xl">A mudança só acontece com a sua autorização.</h1><div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/><div><strong>Seu horário atual continua confirmado.</strong><p className="mt-1 text-sm leading-relaxed">A CHRISMED não altera seu agendamento apenas porque a gestão sugeriu outro horário. Ao clicar no botão abaixo, você autoriza expressamente a mudança. Se não quiser mudar, simplesmente não clique.</p></div></div></div>{error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}<Button onClick={accept} disabled={busy} className="mt-7 w-full py-6 text-base">{busy?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Confirmando…</>:<>Aceitar expressamente o novo horário</>}</Button><p className="mt-4 text-center text-xs text-[var(--chrismed-graphite)]">Ao aceitar, sua autorização fica registrada na trilha de auditoria CHRISMED.</p></>}
  </div></main></ChrismedShell>;
}
