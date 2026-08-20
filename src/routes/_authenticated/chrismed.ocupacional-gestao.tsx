import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireChrismedManagement } from "@/lib/chrismed-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HeartPulse,
  Network,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

export const Route = createFileRoute("/_authenticated/chrismed/ocupacional-gestao")({
  beforeLoad: requireChrismedManagement,
  component: OccupationalCockpit,
  head: () => ({
    meta: [
      { title: "Medicina Ocupacional — Gestão CHRISMED" },
      { name: "description", content: "Cockpit de medicina ocupacional CHRISMED: empresas, trabalhadores, riscos, programas, ASO, exames, documentos e eSocial SST." },
    ],
  }),
});

type AsoRow = {
  id: string;
  aso_type: string;
  status: string;
  fitness_status: string | null;
  exam_date: string | null;
  next_exam_due: string | null;
  employee_id: string;
  client_company_id: string;
};

type AlertRow = {
  id: string;
  severity: string;
  title: string;
  due_at: string | null;
  status: string;
};

async function loadCockpit() {
  const [companies, employees, programs, asos, alerts, esocial, referrals, workflows] = await Promise.all([
    supabase.from("chrismed_occ_client_companies").select("id", { count: "exact", head: true }).eq("company_id", CHRISMED_COMPANY_ID).eq("status", "active"),
    supabase.from("chrismed_occ_employees").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("chrismed_occ_programs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("chrismed_occ_asos").select("id,aso_type,status,fitness_status,exam_date,next_exam_due,employee_id,client_company_id").order("created_at", { ascending: false }).limit(12),
    supabase.from("chrismed_occ_alerts").select("id,severity,title,due_at,status").in("status", ["open", "acknowledged"]).order("created_at", { ascending: false }).limit(10),
    supabase.from("chrismed_occ_esocial_events").select("id", { count: "exact", head: true }).in("status", ["pending", "ready", "rejected"]),
    supabase.from("chrismed_occ_referrals").select("id", { count: "exact", head: true }).in("status", ["created", "sent", "scheduled", "pending"]),
    supabase.from("n8n_workflow_registry").select("id,status,n8n_workflow_id", { count: "exact" }).like("workflow_slug", "chrismed.occupational.%"),
  ]);

  const wf = workflows.data ?? [];
  return {
    companies: companies.count ?? 0,
    employees: employees.count ?? 0,
    programs: programs.count ?? 0,
    asos: (asos.data ?? []) as AsoRow[],
    alerts: (alerts.data ?? []) as AlertRow[],
    esocialPending: esocial.count ?? 0,
    referralsPending: referrals.count ?? 0,
    workflowTotal: wf.length,
    workflowActive: wf.filter((row: any) => row.status === "ACTIVE" && row.n8n_workflow_id).length,
  };
}

function humanAso(type: string) {
  const map: Record<string, string> = {
    admissional: "Admissional",
    periodic: "Periódico",
    return_to_work: "Retorno ao trabalho",
    change_of_risk: "Mudança de riscos",
    dismissal: "Demissional",
    monitoring: "Monitoração",
  };
  return map[type] ?? type;
}

function severityClass(severity: string) {
  if (severity === "critical") return "border-red-300 bg-red-50 text-red-900";
  if (severity === "high") return "border-orange-300 bg-orange-50 text-orange-900";
  if (severity === "medium") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function OccupationalCockpit() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["chrismed-occupational-cockpit"],
    queryFn: loadCockpit,
    refetchInterval: 30_000,
  });

  const automationReady = (data?.workflowTotal ?? 0) > 0 && data?.workflowActive === data?.workflowTotal;

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#7A651E]">CHRISMED · Saúde corporativa</p>
            <h1 className="mt-2 text-3xl font-bold">Medicina Ocupacional</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#46524E]">
              Empresas, unidades, trabalhadores, cargos, riscos, PGR, PCMSO, exames, ASOs, documentos, encaminhamentos, eSocial SST e jornadas automatizadas em uma única operação.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 lg:mt-0">
            <Button asChild variant="outline"><a href="/ehr"><Stethoscope className="mr-2 h-4 w-4" />Prontuário</a></Button>
            <Button asChild variant="outline"><a href="/chrismed/medicina-ocupacional"><HeartPulse className="mr-2 h-4 w-4" />Página institucional</a></Button>
            <Button onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Atualizar</Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [Building2, "Empresas ativas", data?.companies ?? 0],
            [Users, "Trabalhadores ativos", data?.employees ?? 0],
            [ShieldCheck, "Programas ativos", data?.programs ?? 0],
            [Network, "eSocial pendente", data?.esocialPending ?? 0],
          ].map(([Icon, label, value]) => {
            const C = Icon as typeof Building2;
            return <Card key={String(label)} className="border-[#D9D3CB] bg-white"><CardContent className="pt-6"><C className="h-5 w-5 text-[#7A651E]" /><p className="mt-3 text-sm text-[#596660]">{String(label)}</p><p className="mt-1 text-3xl font-bold">{String(value)}</p></CardContent></Card>;
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Card className="border-[#D9D3CB] bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Operação ocupacional</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Empresas e unidades", "/chrismed/ocupacional-gestao#empresas", Building2],
                ["Trabalhadores", "/chrismed/ocupacional-gestao#trabalhadores", Users],
                ["Riscos e funções", "/chrismed/ocupacional-gestao#riscos", ShieldCheck],
                ["PGR e PCMSO", "/chrismed/ocupacional-gestao#programas", FileCheck2],
                ["ASO e exames", "/chrismed/ocupacional-gestao#aso", ClipboardCheck],
                ["Agenda e encaminhamentos", "/agenda/appointments", CalendarClock],
              ].map(([label, href, Icon]) => {
                const C = Icon as typeof Building2;
                return <a key={String(label)} href={String(href)} className="rounded-2xl border border-[#D9D3CB] p-4 transition hover:border-[#7A651E] hover:bg-[#FCFAF4]"><C className="h-5 w-5 text-[#7A651E]" /><p className="mt-3 text-sm font-semibold">{String(label)}</p></a>;
              })}
            </CardContent>
          </Card>

          <Card className={`bg-white ${automationReady ? "border-emerald-300" : "border-amber-300"}`}>
            <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />Automação n8n</CardTitle><p className="mt-1 text-sm text-[#596660]">Jornadas ocupacionais registradas no Core.</p></div><Badge className={automationReady ? "bg-emerald-700" : "bg-amber-700"}>{automationReady ? "ATIVO" : "EM PROVISIONAMENTO"}</Badge></div></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.workflowActive ?? 0}/{data?.workflowTotal ?? 0}</div>
              <p className="mt-1 text-sm text-[#596660]">workflows ativos e vinculados ao runtime n8n.</p>
              <div className="mt-4 rounded-xl border p-3 text-xs text-[#596660]">Nenhum fluxo é apresentado como ativo sem `n8n_workflow_id` real e status ACTIVE.</div>
            </CardContent>
          </Card>
        </section>

        <section id="aso" className="grid gap-4 lg:grid-cols-2">
          <Card className="border-[#D9D3CB] bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />ASOs recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <p className="text-sm text-[#596660]">Carregando…</p> : data?.asos.length ? data.asos.map((aso) => (
                <div key={aso.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <div><p className="font-semibold">{humanAso(aso.aso_type)}</p><p className="text-xs text-[#596660]">{aso.exam_date ? new Date(`${aso.exam_date}T12:00:00`).toLocaleDateString("pt-BR") : "Data em definição"} · {aso.fitness_status ?? "avaliação pendente"}</p></div>
                  <Badge variant="outline">{aso.status}</Badge>
                </div>
              )) : <p className="text-sm text-[#596660]">Nenhum ASO emitido ainda.</p>}
            </CardContent>
          </Card>

          <Card className="border-[#D9D3CB] bg-white">
            <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Pendências e vencimentos</CardTitle><Badge variant="outline">{data?.alerts.length ?? 0}</Badge></div></CardHeader>
            <CardContent className="space-y-2">
              {data?.alerts.length ? data.alerts.map((alert) => (
                <div key={alert.id} className={`rounded-xl border p-3 text-sm ${severityClass(alert.severity)}`}>
                  <div className="flex items-center justify-between gap-3"><strong>{alert.title}</strong><span className="text-xs uppercase">{alert.severity}</span></div>
                  {alert.due_at ? <p className="mt-1 text-xs">Prazo: {new Date(alert.due_at).toLocaleString("pt-BR")}</p> : null}
                </div>
              )) : <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4" />Sem alertas ocupacionais abertos.</div>}
            </CardContent>
          </Card>
        </section>

        <section id="programas" className="rounded-3xl bg-[#071C18] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#E8C96A]">Arquitetura integrada</p>
          <h2 className="mt-2 text-2xl font-bold">Do risco ao relacionamento pós-atendimento.</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/70">O módulo conecta cadastro empresarial, trabalhadores, funções e riscos ao PGR/PCMSO, determina protocolos de exames, acompanha ASO, agenda e encaminhamento, controla documentos e vencimentos, prepara eSocial SST e entrega os eventos às jornadas do Core e do n8n.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">{["NR-1 · GRO/PGR","NR-7 · PCMSO/ASO","S-2210","S-2220","S-2240","LGPD · dados sensíveis","Auditoria clínica","CRM e jornadas"].map((item) => <span key={item} className="rounded-full border border-white/20 px-3 py-1.5">{item}</span>)}</div>
        </section>
      </div>
    </main>
  );
}
