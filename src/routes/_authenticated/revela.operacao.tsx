import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Headphones, Mail, MessageCircle, ShieldCheck, Workflow, BriefcaseBusiness, ReceiptText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/revela/operacao")({ component: RevelaOperationsPage });

async function loadOverview() {
  const { data: company, error: companyError } = await supabase.from("companies").select("id,name").ilike("name","REVELA").limit(1).maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error("Empresa canônica REVELA não encontrada.");
  const { data: tenant, error: tenantError } = await supabase.from("communication_tenants").select("id").eq("slug","revela").limit(1).maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant) throw new Error("Tenant de comunicação REVELA não encontrado.");

  const [templates, automations, whatsapp, tickets, ombudsman, opportunities, appointments] = await Promise.all([
    supabase.from("communication_templates").select("id,status", { count:"exact" }).eq("tenant_id",tenant.id),
    supabase.from("communication_automations").select("id,status,n8n_workflow_id").eq("tenant_id",tenant.id),
    supabase.from("communication_whatsapp_tenant_settings").select("enabled,instance_name,settings").eq("tenant_id",tenant.id).maybeSingle(),
    supabase.from("support_tickets").select("id,status", { count:"exact" }).eq("company_id",company.id),
    supabase.from("revela_ombudsman_cases").select("id,status", { count:"exact" }).eq("company_id",company.id),
    supabase.from("crm_opportunities").select("id,closed_at", { count:"exact" }).eq("company_id",company.id),
    supabase.from("agenda_appointments").select("id,status", { count:"exact" }).eq("company_id",company.id),
  ]);

  const activeAutomations = (automations.data ?? []).filter((x:any)=>x.status === "ACTIVE" && x.n8n_workflow_id).length;
  const openTickets = (tickets.data ?? []).filter((x:any)=>!["resolved","closed"].includes(String(x.status))).length;
  const openOmbudsman = (ombudsman.data ?? []).filter((x:any)=>!["resolved","closed","dismissed"].includes(String(x.status))).length;
  const openOpps = (opportunities.data ?? []).filter((x:any)=>!x.closed_at).length;
  const scheduled = (appointments.data ?? []).filter((x:any)=>!["completed","cancelled","no_show"].includes(String(x.status))).length;

  return {
    companyId: company.id,
    tenantId: tenant.id,
    templates: templates.count ?? 0,
    activeAutomations,
    automationsTotal: automations.data?.length ?? 0,
    whatsapp: whatsapp.data ?? null,
    openTickets,
    ticketsTotal: tickets.count ?? 0,
    openOmbudsman,
    ombudsmanTotal: ombudsman.count ?? 0,
    openOpps,
    opportunitiesTotal: opportunities.count ?? 0,
    scheduled,
    appointmentsTotal: appointments.count ?? 0,
  };
}

function Tile({title,value,detail,to,icon:Icon,badge}:{title:string;value:string|number;detail:string;to:string;icon:any;badge?:string}){
  return <Card className="flex flex-col p-5"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div>{badge?<Badge variant="secondary">{badge}</Badge>:null}</div><div className="mt-4 text-3xl font-semibold">{value}</div><h2 className="mt-1 font-semibold">{title}</h2><p className="mt-1 flex-1 text-sm text-muted-foreground">{detail}</p><Button asChild variant="ghost" className="mt-4 justify-start px-0"><Link to={to as never}>Abrir <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></Card>;
}

function RevelaOperationsPage(){
  const q = useQuery({queryKey:["revela-full-overview"],queryFn:loadOverview,refetchInterval:30000});
  if(q.isLoading) return <Card className="p-6">Carregando operação REVELA…</Card>;
  if(q.error || !q.data) return <Card className="p-6"><h1 className="text-xl font-semibold">Falha ao carregar a operação</h1><p className="mt-2 text-sm text-muted-foreground">{q.error instanceof Error ? q.error.message : "Não foi possível carregar os dados."}</p></Card>;
  const d=q.data;
  const waEnabled=Boolean(d.whatsapp?.enabled);
  return <div className="mx-auto max-w-7xl space-y-6"><header className="rounded-2xl border bg-card p-6"><Badge>Plano Full</Badge><h1 className="mt-3 text-3xl font-semibold">REVELA — Operação</h1><p className="mt-2 max-w-3xl text-muted-foreground">Estado real das capacidades compartilhadas do Core. Nenhum canal é exibido como ativo sem configuração operacional válida.</p></header><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <Tile title="Comunicação" value={d.templates} detail="Templates versionados do tenant REVELA." to="/admin/comunicacoes" icon={Mail} />
    <Tile title="WhatsApp oficial" value={waEnabled?"Ativo":"Pendente"} detail={waEnabled?"Canal habilitado para o tenant.":"Aguardando número e credenciais reais da API oficial."} to="/admin/comunicacoes" icon={MessageCircle} badge={waEnabled?"habilitado":"não conectado"}/>
    <Tile title="Automações" value={`${d.activeAutomations}/${d.automationsTotal}`} detail="Workflows ativos e realmente vinculados ao runtime." to="/admin/comunicacoes" icon={Workflow}/>
    <Tile title="CRM REVELA" value={d.openOpps} detail={`${d.opportunitiesTotal} oportunidades registradas.`} to="/revela/crm" icon={BriefcaseBusiness}/>
    <Tile title="Suporte" value={d.openTickets} detail={`${d.ticketsTotal} tickets no histórico.`} to="/revela/suporte" icon={Headphones}/>
    <Tile title="Ouvidoria" value={d.openOmbudsman} detail={`${d.ombudsmanTotal} manifestações no histórico.`} to="/revela/suporte" icon={ShieldCheck}/>
    <Tile title="Agenda" value={d.scheduled} detail={`${d.appointmentsTotal} agendamentos registrados.`} to="/agenda" icon={CalendarDays}/>
    <Tile title="Financeiro / Fiscal" value="Core" detail="Cobrança e fiscal dependem da configuração jurídica e do provedor válido." to="/dashboards/operacao" icon={ReceiptText}/>
  </section></div>;
}
