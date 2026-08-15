import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChrismedShell } from "@/components/chrismed/ChrismedShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CalendarCheck, ClipboardList, Clock3, FileText, Home, MapPin, Receipt, UploadCloud, UserRound, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/chrismed/minha-conta")({
  head: () => ({ meta: [{ title: "Área do Paciente — CHRISMED" }, { name: "description", content: "Área exclusiva do paciente CHRISMED." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: MinhaContaPage,
});

type Appointment = { appointment_id:string; starts_at:string; ends_at:string; status:string; professional_id:string; professional_name:string; modality:string; service_name:string; replacement_decision?:{id:string;decision:string;expires_at:string;proposed_professional_id:string}|null };
type Payment = { id:string; payment_method:string; status:string; amount_cents:number; description:string|null; approved_at:string|null; created_at:string; context_id?:string };
type PatientProfile = { user_id:string; full_name:string; whatsapp:string; email:string; status:"pending"|"approved"|"rejected"|"suspended"; cpf?:string|null; postal_code?:string|null; address_line1?:string|null; address_line2?:string|null; district?:string|null; city?:string|null; state?:string|null; country?:string|null; fiscal_profile_complete:boolean; approved_at?:string|null; rejection_reason?:string|null };
type Invoice = { id:string; invoice_number?:string|null; status:string; amount_cents?:number|null; pdf_storage_path?:string|null; issued_at?:string|null; created_at:string };
type DocumentRow = { id:string; original_filename:string; mime_type?:string|null; size_bytes?:number|null; category:string; source:string; created_at:string };
type ClinicalRecord = { id:string; title:string; summary?:string|null; status:string; opened_at:string; closed_at?:string|null };
type Dashboard = { appointments:Appointment[]; payments:Payment[]; invoices:Invoice[]; documents:DocumentRow[]; clinical_records:ClinicalRecord[]; patient_profile:PatientProfile|null; profile:{user_id:string;email:string;display_name:string} };

const MOD_ICON = { presencial:MapPin, telemedicina:Video, teleconsulta:Video, domiciliar:Home } as const;
const db = supabase as any;
const money = (cents:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);

function MinhaContaPage(){
  const navigate=useNavigate();
  const [data,setData]=useState<Dashboard|null>(null);
  const [loading,setLoading]=useState(true);
  const [now,setNow]=useState(Date.now());
  const [busy,setBusy]=useState<string|null>(null);
  const [register,setRegister]=useState({full_name:"",whatsapp:"",email:""});
  const [fiscal,setFiscal]=useState({cpf:"",postal_code:"",address_line1:"",address_line2:"",district:"",city:"",state:"",country:"BR"});

  async function load(){
    const {data:auth}=await supabase.auth.getUser();
    if(!auth.user){ navigate({to:"/auth?persona=patient&next=%2Fchrismed%2Fminha-conta" as never}); return; }
    const {data:dashboard,error}=await supabase.rpc("chrismed_get_my_patient_dashboard");
    if(error){ toast.error("Não foi possível carregar sua área CHRISMED."); setLoading(false); return; }
    const d=dashboard as unknown as Dashboard; setData(d);
    setRegister({full_name:d.patient_profile?.full_name??d.profile.display_name??"",whatsapp:d.patient_profile?.whatsapp??"",email:d.patient_profile?.email??d.profile.email??""});
    if(d.patient_profile) setFiscal({cpf:d.patient_profile.cpf??"",postal_code:d.patient_profile.postal_code??"",address_line1:d.patient_profile.address_line1??"",address_line2:d.patient_profile.address_line2??"",district:d.patient_profile.district??"",city:d.patient_profile.city??"",state:d.patient_profile.state??"",country:d.patient_profile.country??"BR"});
    setLoading(false);
  }

  useEffect(()=>{ void load(); const tick=window.setInterval(()=>setNow(Date.now()),1000); const refresh=window.setInterval(()=>void load(),30000); return()=>{window.clearInterval(tick);window.clearInterval(refresh)}; },[]);

  const sorted=useMemo(()=>[...(data?.appointments??[])].sort((a,b)=>+new Date(a.starts_at)-+new Date(b.starts_at)),[data?.appointments]);
  const upcoming=useMemo(()=>sorted.filter(a=>+new Date(a.ends_at)>=now),[sorted,now]);
  const history=useMemo(()=>sorted.filter(a=>+new Date(a.ends_at)<now),[sorted,now]);
  const next=upcoming[0];
  const nextDelta=next?+new Date(next.starts_at)-now:0;

  async function submitRegistration(e:React.FormEvent){ e.preventDefault(); setBusy("register"); const {error}=await supabase.rpc("chrismed_register_patient_profile" as never,{p_full_name:register.full_name,p_whatsapp:register.whatsapp,p_email:register.email} as never); setBusy(null); if(error)return toast.error("Não foi possível enviar seu cadastro."); toast.success("Cadastro enviado para aprovação da CHRISMED."); await load(); }
  async function saveFiscal(e:React.FormEvent){ e.preventDefault(); setBusy("fiscal"); const {error}=await supabase.rpc("chrismed_complete_patient_fiscal_profile" as never,{p_cpf:fiscal.cpf,p_postal_code:fiscal.postal_code,p_address_line1:fiscal.address_line1,p_address_line2:fiscal.address_line2,p_district:fiscal.district,p_city:fiscal.city,p_state:fiscal.state,p_country:fiscal.country} as never); setBusy(null); if(error)return toast.error("Não foi possível salvar os dados fiscais."); toast.success("Dados fiscais atualizados."); await load(); }
  async function requestReschedule(id:string){ setBusy(id); const {error}=await supabase.rpc("chrismed_patient_request_reschedule" as never,{p_appointment_id:id,p_reason:"patient_portal"} as never); setBusy(null); if(error)return toast.error(error.message.includes("payment_not_approved")?"A remarcação só é liberada após a confirmação do pagamento.":"Não foi possível solicitar a remarcação."); toast.success("Pedido de remarcação registrado. O pagamento permanece vinculado à consulta."); await load(); }
  async function decideReplacement(id:string,accept:boolean){ setBusy(id); const {error}=await supabase.rpc("chrismed_patient_decide_replacement",{p_decision_id:id,p_accept:accept}); setBusy(null); if(error)return toast.error("Não foi possível registrar sua escolha."); toast.success(accept?"Profissional substituto confirmado.":"A CHRISMED buscará outra opção disponível."); await load(); }

  async function uploadDocument(file:File){
    if(!data?.patient_profile || data.patient_profile.status!=="approved") return toast.error("Seu cadastro precisa estar aprovado para enviar documentos.");
    setBusy("upload");
    const companyId="642096b5-a9ff-4521-a82a-c004f6d2e2d2";
    const path=`${companyId}/${data.profile.user_id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    const {error:upErr}=await supabase.storage.from("chrismed-clinical-documents").upload(path,file,{upsert:false,contentType:file.type});
    if(upErr){setBusy(null);return toast.error("Não foi possível enviar o arquivo.");}
    const {error:rowErr}=await db.from("chrismed_patient_documents").insert({company_id:companyId,patient_user_id:data.profile.user_id,storage_path:path,original_filename:file.name,mime_type:file.type,size_bytes:file.size,category:"other",source:"patient",visibility:"patient_and_care_team",status:"active",uploaded_by:data.profile.user_id});
    setBusy(null); if(rowErr)return toast.error("Arquivo enviado, mas não foi possível concluir o registro."); toast.success("Documento enviado à CHRISMED."); await load();
  }

  async function openDocument(doc:DocumentRow){ const {data:row}=await db.from("chrismed_patient_documents").select("storage_path").eq("id",doc.id).single(); if(!row?.storage_path)return; const {data:signed,error}=await supabase.storage.from("chrismed-clinical-documents").createSignedUrl(row.storage_path,120); if(error||!signed?.signedUrl)return toast.error("Não foi possível abrir o documento."); window.open(signed.signedUrl,"_blank","noopener,noreferrer"); }

  if(loading) return <ChrismedShell><div className="container max-w-6xl py-20 text-center text-[var(--chrismed-forest-deep)]">Carregando sua área CHRISMED…</div></ChrismedShell>;
  if(!data?.patient_profile) return <ChrismedShell><OnboardingForm value={register} setValue={setRegister} onSubmit={submitRegistration} busy={busy==="register"}/></ChrismedShell>;
  if(data.patient_profile.status!=="approved") return <ChrismedShell><StatusScreen profile={data.patient_profile}/></ChrismedShell>;

  return <ChrismedShell>
    <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><div className="container max-w-6xl py-10"><Badge className="mb-3 bg-[var(--chrismed-forest-deep)] text-white">Área exclusiva do paciente</Badge><h1 className="chrismed-serif text-4xl text-[var(--chrismed-forest-deep)] md:text-5xl">Olá, {data.patient_profile.full_name}</h1><p className="mt-3 max-w-3xl text-[var(--chrismed-graphite)]">Consultas, documentos, prontuário, notas fiscais e dados cadastrais em um único ambiente protegido.</p></div></section>

    <section className="container max-w-6xl py-8">
      {next && <div className="mb-8 grid gap-4 rounded-3xl bg-[var(--chrismed-forest-deep)] p-6 text-white md:grid-cols-[1fr_auto] md:items-center"><div><div className="text-[10px] uppercase tracking-[0.24em] text-[var(--chrismed-amber-soft)]">Próxima consulta</div><h2 className="chrismed-serif mt-2 text-3xl">{new Date(next.starts_at).toLocaleString("pt-BR")}</h2><p className="mt-1 text-white/70">{next.service_name} · {next.professional_name}</p><p className="mt-4 max-w-2xl text-sm text-white/70">Evite no-show. Se precisar mudar o horário, faça a remarcação pela sua área assim que possível. O pagamento confirmado permanece vinculado à consulta remarcada.</p></div><div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-5 text-center"><div className="text-[10px] uppercase tracking-[0.2em] text-white/55">Faltam</div><div className="mt-1 text-2xl font-bold text-[var(--chrismed-amber)]">{formatCountdown(nextDelta)}</div></div></div>}

      {!data.patient_profile.fiscal_profile_complete && <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><strong>Complete seus dados para emissão de nota fiscal.</strong><p className="mt-1 text-sm">CPF e endereço completo são necessários para a emissão e disponibilização automática dos documentos fiscais.</p></div>}

      <Tabs defaultValue="consultas"><TabsList className="flex h-auto flex-wrap bg-[var(--chrismed-bone)]"><TabsTrigger value="consultas"><CalendarCheck className="mr-1.5 h-4 w-4"/>Consultas</TabsTrigger><TabsTrigger value="prontuario"><ClipboardList className="mr-1.5 h-4 w-4"/>Prontuário</TabsTrigger><TabsTrigger value="documentos"><FileText className="mr-1.5 h-4 w-4"/>Documentos</TabsTrigger><TabsTrigger value="notas"><Receipt className="mr-1.5 h-4 w-4"/>Notas fiscais</TabsTrigger><TabsTrigger value="dados"><UserRound className="mr-1.5 h-4 w-4"/>Meus dados</TabsTrigger></TabsList>

        <TabsContent value="consultas" className="mt-6 space-y-4"><h2 className="chrismed-serif text-2xl text-[var(--chrismed-forest-deep)]">Próximos atendimentos</h2>{upcoming.length?upcoming.map(a=><AppointmentCard key={a.appointment_id} a={a} now={now} busy={busy} payments={data.payments} onReschedule={requestReschedule} onReplacement={decideReplacement}/>):<Empty text="Nenhuma consulta futura confirmada."/>}<h2 className="pt-6 chrismed-serif text-2xl text-[var(--chrismed-forest-deep)]">Histórico</h2>{history.length?history.reverse().map(a=><AppointmentCard key={a.appointment_id} a={a} now={now} busy={busy} payments={data.payments} onReschedule={requestReschedule} onReplacement={decideReplacement}/>):<Empty text="Seu histórico aparecerá aqui após os atendimentos."/>}</TabsContent>

        <TabsContent value="prontuario" className="mt-6 space-y-3">{data.clinical_records.length?data.clinical_records.map(r=><article key={r.id} className="rounded-2xl border border-[var(--chrismed-sand)] bg-white p-5"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-[var(--chrismed-forest-deep)]">{r.title}</h3><p className="mt-1 text-sm text-[var(--chrismed-graphite)]">{r.summary??"Registro clínico disponível para acompanhamento."}</p></div><Status status={r.status}/></div><p className="mt-3 text-xs text-[var(--chrismed-graphite)]">Aberto em {new Date(r.opened_at).toLocaleString("pt-BR")}</p></article>):<Empty text="Ainda não há registros clínicos liberados para visualização."/>}</TabsContent>

        <TabsContent value="documentos" className="mt-6"><label className="mb-5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--chrismed-forest)] bg-[var(--chrismed-bone)] p-5 font-semibold text-[var(--chrismed-forest-deep)]"><UploadCloud className="h-5 w-5"/>{busy==="upload"?"Enviando…":"Enviar exame, laudo ou documento"}<input type="file" className="hidden" accept=".pdf,image/jpeg,image/png,image/webp" disabled={busy==="upload"} onChange={e=>{const f=e.target.files?.[0];if(f)void uploadDocument(f);e.currentTarget.value=""}}/></label><div className="space-y-3">{data.documents.length?data.documents.map(d=><button key={d.id} onClick={()=>void openDocument(d)} className="flex w-full items-center justify-between rounded-2xl border border-[var(--chrismed-sand)] bg-white p-4 text-left hover:bg-[var(--chrismed-bone)]"><span><strong className="block text-[var(--chrismed-forest-deep)]">{d.original_filename}</strong><span className="text-xs text-[var(--chrismed-graphite)]">{d.source} · {new Date(d.created_at).toLocaleString("pt-BR")}</span></span><ArrowRight className="h-4 w-4"/></button>):<Empty text="Nenhum documento disponível."/>}</div></TabsContent>

        <TabsContent value="notas" className="mt-6 space-y-3">{data.invoices.length?data.invoices.map(i=><div key={i.id} className="grid gap-2 rounded-2xl border border-[var(--chrismed-sand)] bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong className="text-[var(--chrismed-forest-deep)]">Nota fiscal {i.invoice_number??"em processamento"}</strong><p className="text-xs text-[var(--chrismed-graphite)]">{i.issued_at?new Date(i.issued_at).toLocaleString("pt-BR"):new Date(i.created_at).toLocaleString("pt-BR")}</p></div>{i.amount_cents!=null&&<strong>{money(i.amount_cents)}</strong>}<Status status={i.status}/></div>):<Empty text="As notas fiscais emitidas serão disponibilizadas aqui automaticamente."/>}</TabsContent>

        <TabsContent value="dados" className="mt-6"><form onSubmit={saveFiscal} className="grid gap-4 rounded-2xl border border-[var(--chrismed-sand)] bg-white p-6 md:grid-cols-2"><div className="md:col-span-2"><h2 className="chrismed-serif text-2xl text-[var(--chrismed-forest-deep)]">Dados cadastrais e fiscais</h2><p className="mt-1 text-sm text-[var(--chrismed-graphite)]">Nome, WhatsApp e e-mail foram validados no cadastro inicial. Complete os dados necessários para documentos fiscais.</p></div><Readonly label="Nome" value={data.patient_profile.full_name}/><Readonly label="WhatsApp" value={data.patient_profile.whatsapp}/><Readonly label="E-mail" value={data.patient_profile.email}/><Field label="CPF" value={fiscal.cpf} onChange={v=>setFiscal({...fiscal,cpf:v})}/><Field label="CEP" value={fiscal.postal_code} onChange={v=>setFiscal({...fiscal,postal_code:v})}/><Field label="Endereço" value={fiscal.address_line1} onChange={v=>setFiscal({...fiscal,address_line1:v})}/><Field label="Complemento" value={fiscal.address_line2} onChange={v=>setFiscal({...fiscal,address_line2:v})}/><Field label="Bairro" value={fiscal.district} onChange={v=>setFiscal({...fiscal,district:v})}/><Field label="Cidade" value={fiscal.city} onChange={v=>setFiscal({...fiscal,city:v})}/><Field label="UF" value={fiscal.state} onChange={v=>setFiscal({...fiscal,state:v})}/><div className="md:col-span-2"><Button type="submit" disabled={busy==="fiscal"} className="bg-[var(--chrismed-forest-deep)] text-white">{busy==="fiscal"?"Salvando…":"Salvar dados fiscais"}</Button></div></form></TabsContent>
      </Tabs>
    </section>
  </ChrismedShell>;
}

function AppointmentCard({a,now,busy,payments,onReschedule,onReplacement}:{a:Appointment;now:number;busy:string|null;payments:Payment[];onReschedule:(id:string)=>Promise<void>;onReplacement:(id:string,accept:boolean)=>Promise<void>}){
  const Icon=MOD_ICON[a.modality as keyof typeof MOD_ICON]??MapPin; const delta=+new Date(a.starts_at)-now; const isTele=["telemedicina","teleconsulta"].includes(a.modality); const enter=isTele&&delta<=0&&+new Date(a.ends_at)>now; const paid=payments.some(p=>p.context_id===a.appointment_id&&p.status==="approved");
  return <article className="rounded-2xl border border-[var(--chrismed-sand)] bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex-1"><div className="flex items-center gap-2 text-xs text-[var(--chrismed-graphite)]"><Icon className="h-3.5 w-3.5"/>{a.modality} · {a.service_name}</div><h3 className="mt-1 chrismed-serif text-xl text-[var(--chrismed-forest-deep)]">{new Date(a.starts_at).toLocaleString("pt-BR")}</h3><p className="text-sm text-[var(--chrismed-graphite)]">{a.professional_name}</p></div><div className="flex flex-wrap gap-2"><Status status={a.status}/>{enter&&<Link to="/chrismed/teleconsulta/$appointmentId" params={{appointmentId:a.appointment_id}}><Button size="sm"><Video className="mr-1.5 h-4 w-4"/>Entrar</Button></Link>}{a.status==="confirmed"&&paid&&delta>0&&<Button size="sm" variant="outline" disabled={busy===a.appointment_id} onClick={()=>void onReschedule(a.appointment_id)}>Remarcar</Button>}</div></div>{a.replacement_decision?.decision==="pending"&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-800"/><div><strong className="text-amber-950">Há uma opção de profissional substituto.</strong><div className="mt-3 flex gap-2"><Button size="sm" disabled={busy===a.replacement_decision.id} onClick={()=>void onReplacement(a.replacement_decision!.id,true)}>Aceitar</Button><Button size="sm" variant="outline" disabled={busy===a.replacement_decision.id} onClick={()=>void onReplacement(a.replacement_decision!.id,false)}>Outra opção</Button></div></div></div></div>}</article>;
}

function OnboardingForm({value,setValue,onSubmit,busy}:{value:{full_name:string;whatsapp:string;email:string};setValue:(v:{full_name:string;whatsapp:string;email:string})=>void;onSubmit:(e:React.FormEvent)=>void;busy:boolean}){return <section className="mx-auto max-w-2xl px-5 py-20 text-[var(--chrismed-forest-deep)]"><Badge className="mb-4 bg-[var(--chrismed-forest-deep)] text-white">Cadastro do paciente</Badge><h1 className="chrismed-serif text-4xl">Crie sua área exclusiva CHRISMED</h1><p className="mt-4 text-[var(--chrismed-graphite)]">Neste primeiro momento precisamos apenas de nome completo, WhatsApp e e-mail. A equipe CHRISMED analisará o cadastro e, após aprovação, você receberá as boas-vindas e poderá completar os dados fiscais.</p><form onSubmit={onSubmit} className="mt-8 grid gap-4"><Field label="Nome completo" value={value.full_name} onChange={v=>setValue({...value,full_name:v})}/><Field label="WhatsApp" value={value.whatsapp} onChange={v=>setValue({...value,whatsapp:v})}/><Field label="E-mail" value={value.email} type="email" onChange={v=>setValue({...value,email:v})}/><Button type="submit" disabled={busy} className="mt-2 bg-[var(--chrismed-forest-deep)] text-white">{busy?"Enviando…":"Enviar cadastro para aprovação"}</Button></form></section>}
function StatusScreen({profile}:{profile:PatientProfile}){const rejected=profile.status==="rejected";return <section className="mx-auto max-w-2xl px-5 py-24 text-center text-[var(--chrismed-forest-deep)]"><Badge className="mb-5 bg-[var(--chrismed-forest-deep)] text-white">Área do Paciente</Badge><h1 className="chrismed-serif text-4xl">{rejected?"Cadastro não aprovado":"Cadastro em análise"}</h1><p className="mx-auto mt-4 max-w-xl text-[var(--chrismed-graphite)]">{rejected?(profile.rejection_reason??"Entre em contato com a CHRISMED para orientações sobre seu cadastro."):"Recebemos seus dados. Assim que a gestão CHRISMED concluir a análise, você receberá a confirmação e as próximas orientações."}</p></section>}
function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--chrismed-graphite)]">{label}</span><input required type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 py-3 text-[var(--chrismed-forest-deep)] outline-none focus:border-[var(--chrismed-forest)]"/></label>}
function Readonly({label,value}:{label:string;value:string}){return <div><span className="mb-1 block text-xs text-[var(--chrismed-graphite)]">{label}</span><strong className="text-[var(--chrismed-forest-deep)]">{value}</strong></div>}
function Status({status}:{status:string}){const good=["confirmed","completed","approved","issued","active"].includes(status);const bad=["cancelled","rejected","refunded","no_show","failed"].includes(status);return <span className={cnStatus(good,bad)}>{status.replaceAll("_"," ")}</span>}
function cnStatus(good:boolean,bad:boolean){return `rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${good?"border-[var(--chrismed-forest)] bg-[var(--chrismed-forest-deep)] text-white":bad?"border-red-200 bg-red-50 text-red-700":"border-amber-200 bg-amber-50 text-amber-900"}`}
function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-[var(--chrismed-sand)] bg-white p-8 text-center text-[var(--chrismed-graphite)]">{text}</div>}
function formatCountdown(ms:number){if(ms<=0)return"Agora";const total=Math.floor(ms/1000);const d=Math.floor(total/86400);const h=Math.floor((total%86400)/3600);const m=Math.floor((total%3600)/60);return d>0?`${d}d ${h}h`:h>0?`${h}h ${m}min`:`${m}min`;}
