import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/revela/crm")({ component: RevelaCrmPage });

const brl = (c:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((c||0)/100);

async function loadCrm(){
  const { data: company, error: ce } = await supabase.from("companies").select("id,name").ilike("name","REVELA").limit(1).maybeSingle();
  if(ce) throw ce; if(!company) throw new Error("Empresa REVELA não encontrada.");
  const { data: pipelines, error: pe } = await supabase.from("crm_pipelines").select("id,name,is_default,active").eq("company_id",company.id).eq("active",true).order("is_default",{ascending:false});
  if(pe) throw pe;
  const ids=(pipelines??[]).map((p:any)=>p.id);
  const [{data:stages,error:se},{data:opps,error:oe}] = await Promise.all([
    ids.length ? supabase.from("crm_pipeline_stages").select("id,pipeline_id,code,name,sort_order,is_won,is_lost,active").in("pipeline_id",ids).eq("active",true).order("sort_order") : Promise.resolve({data:[],error:null} as any),
    supabase.from("crm_opportunities").select("id,pipeline_id,stage_id,title,value_cents,source,campaign,product_interest,expected_close_date,lost_reason,closed_at,created_at").eq("company_id",company.id).order("created_at",{ascending:false})
  ]);
  if(se) throw se; if(oe) throw oe;
  return {company,pipelines:pipelines??[],stages:stages??[],opps:opps??[]};
}

function RevelaCrmPage(){
  const qc=useQueryClient();
  const q=useQuery({queryKey:["revela-crm"],queryFn:loadCrm});
  const [pipelineId,setPipelineId]=useState("");
  const [form,setForm]=useState({title:"",value:"0",source:"manual",product_interest:""});
  const data=q.data;
  const selected=pipelineId || data?.pipelines?.[0]?.id || "";
  const stages=useMemo(()=>data?.stages.filter((s:any)=>s.pipeline_id===selected)??[],[data,selected]);
  const opps=useMemo(()=>data?.opps.filter((o:any)=>o.pipeline_id===selected)??[],[data,selected]);

  const create=useMutation({mutationFn:async()=>{
    if(!data?.company.id||!selected||!stages[0]) throw new Error("Funil sem etapa válida.");
    const {error}=await supabase.from("crm_opportunities").insert({company_id:data.company.id,pipeline_id:selected,stage_id:stages[0].id,title:form.title.trim(),value_cents:Math.max(0,Math.round(Number(form.value.replace(",","."))*100)),source:form.source||null,product_interest:form.product_interest||null});
    if(error) throw error;
  },onSuccess:()=>{toast.success("Oportunidade criada");setForm({title:"",value:"0",source:"manual",product_interest:""});qc.invalidateQueries({queryKey:["revela-crm"]});},onError:(e:Error)=>toast.error(e.message)});

  const move=useMutation({mutationFn:async({id,stageId}:{id:string;stageId:string})=>{
    const stage=stages.find((s:any)=>s.id===stageId);
    const patch:any={stage_id:stageId,updated_at:new Date().toISOString()};
    patch.closed_at = stage?.is_won || stage?.is_lost ? new Date().toISOString() : null;
    const {error}=await supabase.from("crm_opportunities").update(patch).eq("id",id); if(error) throw error;
  },onSuccess:()=>qc.invalidateQueries({queryKey:["revela-crm"]}),onError:(e:Error)=>toast.error(e.message)});

  if(q.isLoading) return <Card className="p-6">Carregando CRM REVELA…</Card>;
  if(q.error||!data) return <Card className="p-6">{q.error instanceof Error?q.error.message:"Falha no CRM"}</Card>;
  const open=opps.filter((o:any)=>!o.closed_at), total=open.reduce((s:number,o:any)=>s+Number(o.value_cents||0),0);
  return <div className="mx-auto max-w-7xl space-y-5"><header><Badge>REVELA</Badge><h1 className="mt-2 text-3xl font-semibold">CRM operacional</h1><p className="text-muted-foreground">Funis e etapas usando o schema real de produção.</p></header>
    <div className="grid gap-4 md:grid-cols-3"><Card className="p-4"><div className="text-sm text-muted-foreground">Oportunidades abertas</div><div className="text-3xl font-semibold">{open.length}</div></Card><Card className="p-4"><div className="text-sm text-muted-foreground">Pipeline aberto</div><div className="text-3xl font-semibold">{brl(total)}</div></Card><Card className="p-4"><div className="text-sm text-muted-foreground">Funis ativos</div><div className="text-3xl font-semibold">{data.pipelines.length}</div></Card></div>
    <Card className="p-4"><div className="flex flex-wrap gap-3 items-end"><div><Label>Funil</Label><Select value={selected} onValueChange={setPipelineId}><SelectTrigger className="w-72"><SelectValue/></SelectTrigger><SelectContent>{data.pipelines.map((p:any)=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Título</Label><Input className="w-64" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><div><Label>Valor (R$)</Label><Input className="w-36" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/></div><div><Label>Interesse</Label><Input className="w-52" value={form.product_interest} onChange={e=>setForm({...form,product_interest:e.target.value})}/></div><Button disabled={!form.title.trim()||create.isPending} onClick={()=>create.mutate()}>Nova oportunidade</Button></div></Card>
    <div className="flex gap-3 overflow-x-auto pb-4">{stages.map((s:any)=>{const items=opps.filter((o:any)=>o.stage_id===s.id);return <Card key={s.id} className="w-72 shrink-0 p-3"><div className="flex items-center justify-between border-b pb-2"><div className="font-semibold">{s.name}</div><Badge variant="secondary">{items.length}</Badge></div><div className="space-y-2 pt-3">{items.length===0?<p className="text-xs text-muted-foreground">Sem oportunidades.</p>:items.map((o:any)=><Card key={o.id} className="p-3"><div className="font-medium">{o.title}</div><div className="mt-1 text-sm">{brl(Number(o.value_cents||0))}</div><div className="mt-2"><Select value={o.stage_id} onValueChange={v=>move.mutate({id:o.id,stageId:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{stages.map((st:any)=><SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}</SelectContent></Select></div></Card>)}</div></Card>})}</div>
  </div>;
}
