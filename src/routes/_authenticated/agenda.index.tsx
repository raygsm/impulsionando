import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users2, Wrench, Clock, ListChecks, UsersRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/")({
  head: () => ({ meta: [{ title: "Agenda" }] }),
  component: AgendaHome,
});

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado", confirmed: "Confirmado", checked_in: "Check-in",
  in_progress: "Em atendimento", completed: "Concluído", no_show: "No-show", cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700", confirmed: "bg-emerald-100 text-emerald-700",
  checked_in: "bg-amber-100 text-amber-700", in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-gray-100 text-gray-700", no_show: "bg-red-100 text-red-700", cancelled: "bg-red-100 text-red-700",
};

function AgendaHome() {
  const { companyId } = useActiveCompany();
  const today = new Date();
  const start = new Date(today); start.setHours(0,0,0,0);
  const end = new Date(today); end.setHours(23,59,59,999);

  const { data: stats } = useQuery({
    queryKey: ["agenda-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [profs, srv, apptsToday, waitlist] = await Promise.all([
        supabase.from("agenda_professionals").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("agenda_services").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("agenda_appointments").select("id", { count: "exact", head: true })
          .eq("company_id", companyId).gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()),
        supabase.from("agenda_waitlist").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status","waiting"),
      ]);
      return {
        professionals: profs.count ?? 0,
        services: srv.count ?? 0,
        appointmentsToday: apptsToday.count ?? 0,
        waiting: waitlist.count ?? 0,
      };
    },
  });

  const { data: today_list } = useQuery({
    queryKey: ["agenda-today", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_appointments")
        .select("id, starts_at, ends_at, status, customer_name, agenda_professionals:professional_id(name,color), agenda_services:service_id(name)")
        .eq("company_id", companyId)
        .gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa para acessar a agenda." />;

  const cards = [
    { to: "/agenda/professionals", label: "Profissionais", icon: Users2, value: stats?.professionals ?? 0 },
    { to: "/agenda/services", label: "Serviços", icon: Wrench, value: stats?.services ?? 0 },
    { to: "/agenda/appointments", label: "Hoje", icon: Calendar, value: stats?.appointmentsToday ?? 0 },
    { to: "/agenda/waitlist", label: "Fila de espera", icon: UsersRound, value: stats?.waiting ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Agenda" description="Visão geral do dia, profissionais, serviços e fila."
        action={<CompanyPicker />} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="p-4 shadow-card hover:shadow-elegant transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-semibold mt-1">{c.value}</div>
                </div>
                <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <c.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="shadow-card">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium"><Clock className="w-4 h-4" />Hoje · {today.toLocaleDateString("pt-BR")}</div>
          <Link to="/agenda/schedules" className="text-xs text-primary inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />Gerenciar horários</Link>
        </div>
        <div className="divide-y">
          {!today_list?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum agendamento hoje.</div>}
          {today_list?.map((a) => {
            const p = a.agenda_professionals as unknown as { name: string; color: string } | null;
            const s = a.agenda_services as unknown as { name: string } | null;
            return (
              <div key={a.id} className="p-3 flex items-center gap-3">
                <div className="w-2 self-stretch rounded-sm" style={{ background: p?.color ?? "#6366f1" }} />
                <div className="w-20 text-sm font-mono">
                  {new Date(a.starts_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{a.customer_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s?.name} · {p?.name}</div>
                </div>
                <Badge variant="outline" className={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
