import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Clock3, UserRoundCheck, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Appointment={appointment_id:string;patient_name:string;service_name:string;modality:string;starts_at:string;status:string};

export function CurrentPatientPresenceCard({appointments,now,onChanged}:{appointments:Appointment[];now:number;onChanged:()=>void}){
  const navigate=useNavigate();
  const [busy,setBusy]=useState(false);
  const current=useMemo(()=>appointments
    .filter(a=>a.status==='confirmed')
    .map(a=>({a,delta:new Date(a.starts_at).getTime()-now}))
    .filter(x=>x.delta<=15*60_000&&x.delta>=-15*60_000)
    .sort((x,y)=>Math.abs(x.delta)-Math.abs(y.delta))[0]?.a,[appointments,now]);
  if(!current)return null;
  const deadline=new Date(current.starts_at).getTime()+15*60_000;
  const remaining=Math.max(0,Math.ceil((deadline-now)/60_000));
  async function decide(outcome:'started'|'no_show'){
    setBusy(true);
    const {error}=await supabase.rpc('chrismed_mark_appointment_outcome' as never,{p_appointment_id:current.appointment_id,p_outcome:outcome,p_note:outcome==='no_show'?'Ausência confirmada pelo profissional.':null} as never);
    setBusy(false);
    if(error)return toast.error('Não foi possível registrar a presença. Atualize a tela e tente novamente.');
    onChanged();
    if(outcome==='started'){
      toast.success('Paciente presente. Prontuário aberto para iniciar o atendimento.');
      await navigate({to:'/chrismed/profissional/prontuario/$appointmentId',params:{appointmentId:current.appointment_id}});
    }else toast('Ausência registrada. A jornada adequada será iniciada.');
  }
  return <section className="rounded-[2rem] border-2 border-[#078f8b] bg-[#edf8f7] p-6 shadow-lg md:p-8" aria-label="Paciente da vez">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-[#06716e]"><UserRoundCheck className="h-5 w-5"/>Paciente da vez</div>
        <h2 className="truncate text-3xl font-black tracking-tight text-[#103f3d] md:text-4xl">{current.patient_name}</h2>
        <p className="mt-2 text-base text-[#365e5c]">{current.service_name} · {current.modality} · {new Date(current.starts_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#075c59]"><Clock3 className="h-4 w-4"/>Tolerância máxima: 15 min {remaining>0?`· ${remaining} min restantes`:'· encerrando agora'}</p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[30rem]">
        <Button disabled={busy} onClick={()=>void decide('started')} className="h-20 rounded-2xl text-xl font-black"><CheckCircle2 className="mr-2 h-7 w-7"/>CHEGOU</Button>
        <Button disabled={busy} onClick={()=>void decide('no_show')} variant="outline" className="h-20 rounded-2xl border-2 border-red-300 bg-white text-xl font-black text-red-800 hover:bg-red-50"><UserRoundX className="mr-2 h-7 w-7"/>NÃO CHEGOU</Button>
      </div>
    </div>
    <p className="mt-5 text-sm text-[#4d706e]">Sem confirmação de chegada, o sistema registra automaticamente NÃO CHEGOU após 15 minutos e inicia a jornada de ausência. Ao clicar CHEGOU, o prontuário é aberto imediatamente.</p>
  </section>;
}
