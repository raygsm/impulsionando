import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, LockKeyhole, PenLine, ShieldCheck, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route=createFileRoute('/_authenticated/chrismed/profissional/prontuario/$appointmentId')({
  head:()=>({meta:[{title:'Prontuário eletrônico — CHRISMED'},{name:'robots',content:'noindex, nofollow'}]}),
  component:ClinicalRecordPage,
});

const db=supabase as any;
type Entry={id:string;entry_type:string;content:{text?:string};visibility:string;authored_by:string;signed_at?:string|null;created_at:string;updated_at:string};
type DocumentRow={id:string;original_filename:string;mime_type?:string|null;size_bytes?:number|null;category:string;source:string;visibility:string;status:string;created_at:string};
type ClinicalData={record:{id:string;title:string;summary?:string|null;status:string;opened_at:string;closed_at?:string|null};appointment:{id:string;patient_name:string;starts_at:string;ends_at:string;status:string;professional_id:string};entries:Entry[];documents:DocumentRow[]};

const ENTRY_TYPES=[['evolution','Evolução'],['anamnesis','Anamnese'],['assessment','Avaliação'],['diagnostic_hypothesis','Hipótese diagnóstica'],['plan','Plano / conduta'],['exam_reference','Exame / resultado'],['procedure','Procedimento'],['observation','Observação']] as const;

function ClinicalRecordPage(){
  const {appointmentId}=Route.useParams();
  const [data,setData]=useState<ClinicalData|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<string|null>(null);
  const [draft,setDraft]=useState({type:'evolution',text:'',visibility:'patient_visible'});
  const [summary,setSummary]=useState('');

  async function load(){
    setLoading(true);
    const {data:row,error}=await supabase.rpc('chrismed_get_or_open_clinical_record' as never,{p_appointment_id:appointmentId} as never);
    if(error){toast.error(error.message.includes('not_authorized')?'Você não tem acesso clínico a este atendimento.':'Não foi possível abrir o prontuário.');setLoading(false);return;}
    const d=row as unknown as ClinicalData;setData(d);setSummary(d.record.summary??'');setLoading(false);
  }
  useEffect(()=>{void load()},[appointmentId]);

  async function addEntry(e:React.FormEvent){e.preventDefault();if(!data||!draft.text.trim())return;setBusy('entry');const {error}=await supabase.rpc('chrismed_add_clinical_entry' as never,{p_record_id:data.record.id,p_entry_type:draft.type,p_text:draft.text,p_visibility:draft.visibility} as never);setBusy(null);if(error)return toast.error('Não foi possível registrar a evolução.');setDraft({...draft,text:''});toast.success('Registro clínico salvo. Assine quando estiver concluído.');await load();}
  async function signEntry(id:string){setBusy(id);const {error}=await supabase.rpc('chrismed_sign_clinical_entry' as never,{p_entry_id:id} as never);setBusy(null);if(error)return toast.error('Não foi possível assinar o registro.');toast.success('Registro assinado e bloqueado para edição.');await load();}
  async function closeRecord(){if(!data)return;setBusy('close');const {error}=await supabase.rpc('chrismed_set_clinical_record_status' as never,{p_record_id:data.record.id,p_status:'closed',p_summary:summary} as never);setBusy(null);if(error)return toast.error('Não foi possível encerrar o prontuário.');toast.success('Prontuário encerrado.');await load();}
  async function reopenRecord(){if(!data)return;setBusy('reopen');const {error}=await supabase.rpc('chrismed_set_clinical_record_status' as never,{p_record_id:data.record.id,p_status:'active',p_summary:summary} as never);setBusy(null);if(error)return toast.error('Não foi possível reabrir o prontuário.');await load();}
  async function openDocument(doc:DocumentRow){const {data:row}=await db.from('chrismed_patient_documents').select('storage_path').eq('id',doc.id).single();if(!row?.storage_path)return;const {data:signed,error}=await supabase.storage.from('chrismed-clinical-documents').createSignedUrl(row.storage_path,120);if(error||!signed?.signedUrl)return toast.error('Não foi possível abrir o documento.');window.open(signed.signedUrl,'_blank','noopener,noreferrer');}
  async function uploadDocument(file:File){if(!data)return;setBusy('upload');const {data:auth}=await supabase.auth.getUser();if(!auth.user){setBusy(null);return;}const companyId='642096b5-a9ff-4521-a82a-c004f6d2e2d2';const patientUser=await findPatientUser(appointmentId);if(!patientUser){setBusy(null);return toast.error('Paciente ainda não possui usuário vinculado.');}const path=`${companyId}/${patientUser}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error:upError}=await supabase.storage.from('chrismed-clinical-documents').upload(path,file,{contentType:file.type});if(upError){setBusy(null);return toast.error('Não foi possível enviar o arquivo.');}const {error:rowError}=await db.from('chrismed_patient_documents').insert({company_id:companyId,patient_user_id:patientUser,appointment_id:appointmentId,record_id:data.record.id,professional_id:data.appointment.professional_id,storage_path:path,original_filename:file.name,mime_type:file.type,size_bytes:file.size,category:'other',source:'professional',visibility:'patient_and_care_team',status:'active',uploaded_by:auth.user.id});setBusy(null);if(rowError)return toast.error('Arquivo enviado, mas o registro documental falhou.');toast.success('Documento anexado ao prontuário.');await load();}

  if(loading)return <div className="container mx-auto max-w-6xl py-10">Carregando prontuário CHRISMED…</div>;
  if(!data)return <div className="container mx-auto max-w-4xl py-10"><div className="rounded-2xl border p-8 text-center">Prontuário indisponível para este usuário.</div></div>;
  const active=data.record.status==='active';
  return <div className="container mx-auto max-w-6xl space-y-6 py-8">
    <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between"><div><Link to="/_authenticated/agenda/profissional" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>Voltar à agenda</Link><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#078f8b]">Prontuário eletrônico CHRISMED</p><h1 className="mt-1 text-3xl font-bold">{data.appointment.patient_name}</h1><p className="mt-1 text-sm text-muted-foreground">Atendimento: {new Date(data.appointment.starts_at).toLocaleString('pt-BR')} · {data.appointment.status}</p></div><div className="flex gap-2"><Badge variant={active?'default':'secondary'}>{active?'PRONTUÁRIO ATIVO':'ENCERRADO'}</Badge>{active?<Button variant="outline" disabled={busy==='close'} onClick={()=>void closeRecord()}><LockKeyhole className="mr-1.5 h-4 w-4"/>Encerrar</Button>:<Button variant="outline" disabled={busy==='reopen'} onClick={()=>void reopenRecord()}>Reabrir</Button>}</div></header>

    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <main className="space-y-6">
        <section className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#078f8b]"/><h2 className="text-lg font-semibold">Resumo clínico</h2></div><textarea value={summary} onChange={e=>setSummary(e.target.value)} disabled={!active} rows={3} placeholder="Resumo sintético do atendimento e contexto clínico." className="mt-4 w-full rounded-xl border px-3 py-3 outline-none focus:border-[#078f8b] disabled:bg-muted"/><p className="mt-2 text-xs text-muted-foreground">O resumo é salvo ao encerrar/reabrir o prontuário.</p></section>

        <section className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-2"><PenLine className="h-5 w-5 text-[#078f8b]"/><h2 className="text-lg font-semibold">Novo registro clínico</h2></div><form onSubmit={addEntry} className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Tipo</span><select disabled={!active} value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})} className="w-full rounded-xl border px-3 py-2.5">{ENTRY_TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-sm"><span className="mb-1 block font-medium">Visibilidade</span><select disabled={!active} value={draft.visibility} onChange={e=>setDraft({...draft,visibility:e.target.value})} className="w-full rounded-xl border px-3 py-2.5"><option value="patient_visible">Visível ao paciente</option><option value="professional_only">Somente equipe clínica</option></select></label></div><textarea disabled={!active} required rows={7} value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})} placeholder="Registre a evolução clínica com objetividade e precisão." className="w-full rounded-xl border px-3 py-3 outline-none focus:border-[#078f8b] disabled:bg-muted"/><Button disabled={!active||busy==='entry'}>{busy==='entry'?'Salvando…':'Salvar registro'}</Button></form></section>

        <section><h2 className="mb-3 text-xl font-semibold">Linha clínica</h2><div className="space-y-3">{data.entries.map(entry=><article key={entry.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="outline">{entry.entry_type.replaceAll('_',' ')}</Badge><Badge variant="outline" className="ml-2">{entry.visibility==='patient_visible'?'Paciente + equipe':'Somente equipe'}</Badge></div>{entry.signed_at?<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4"/>Assinado em {new Date(entry.signed_at).toLocaleString('pt-BR')}</span>:<Button size="sm" variant="outline" disabled={busy===entry.id} onClick={()=>void signEntry(entry.id)}>Assinar registro</Button>}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{entry.content?.text??'Registro sem texto.'}</p><p className="mt-3 text-xs text-muted-foreground">Criado em {new Date(entry.created_at).toLocaleString('pt-BR')}</p></article>)}{!data.entries.length&&<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum registro clínico ainda.</div>}</div></section>
      </main>

      <aside className="space-y-4"><section className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#078f8b]"/><h2 className="font-semibold">Documentos</h2></div><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-sm font-semibold hover:bg-muted"><UploadCloud className="h-4 w-4"/>{busy==='upload'?'Enviando…':'Anexar arquivo'}<input type="file" className="hidden" accept=".pdf,image/jpeg,image/png,image/webp" disabled={busy==='upload'} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadDocument(f);e.currentTarget.value=''}}/></label><div className="mt-4 space-y-2">{data.documents.map(doc=><button key={doc.id} type="button" onClick={()=>void openDocument(doc)} className="w-full rounded-xl border p-3 text-left text-sm hover:bg-muted"><strong className="block truncate">{doc.original_filename}</strong><span className="text-[11px] text-muted-foreground">{doc.source} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}</span></button>)}{!data.documents.length&&<p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>}</div></section><section className="rounded-2xl border bg-[#edf8f7] p-5 text-sm text-[#075c59]"><strong>Privacidade clínica</strong><p className="mt-2 leading-relaxed">O acesso é restrito ao profissional vinculado ao atendimento e à gestão clínica autorizada. Registros assinados permanecem auditáveis.</p></section></aside>
    </div>
  </div>;
}

async function findPatientUser(appointmentId:string){const {data,error}=await db.from('chrismed_appointments').select('patient_user_id').eq('id',appointmentId).single();if(error)return null;return data?.patient_user_id as string|null;}
