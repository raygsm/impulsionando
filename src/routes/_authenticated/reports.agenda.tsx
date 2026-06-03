import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(endOfMonthISO());

  const { data } = useQuery({
    queryKey: ["report-agenda", companyId, from, to], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_appointments")
        .select("id, status, starts_at, ends_at, customer_name, price, professional_id, service_id, agenda_professionals(name), agenda_services(name)")
        .eq("company_id", companyId)
        .gte("starts_at", `${from}T00:00:00`).lte("starts_at", `${to}T23:59:59`)
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    return {
      total: rows.length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled" || r.status === "no_show").length,
      scheduled: rows.filter((r) => r.status === "scheduled" || r.status === "confirmed").length,
    };
  }, [data]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Relatório de agenda" description="Agendamentos no período."
        action={
          <div className="flex items-end gap-2 flex-wrap">
            <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`agenda_${from}_${to}.csv`, (data ?? []).map((r) => ({
              status: r.status, inicio: r.starts_at, fim: r.ends_at, cliente: r.customer_name,
              profissional: (r.agenda_professionals as { name?: string } | null)?.name ?? "",
              servico: (r.agenda_services as { name?: string } | null)?.name ?? "",
              preco: r.price,
            })))}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={fmtInt(stats.total)} icon={Calendar} />
        <StatCard label="Agendados" value={fmtInt(stats.scheduled)} />
        <StatCard label="Concluídos" value={fmtInt(stats.completed)} icon={CheckCircle2} />
        <StatCard label="Cancelados / Faltas" value={fmtInt(stats.cancelled)} icon={XCircle} />
      </div>
      <Card className="shadow-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50 border-b">
          <div className="col-span-3">Data</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2">Profissional</div>
          <div className="col-span-2">Serviço</div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem registros no período.</div>}
          {data?.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
              <div className="col-span-3 text-xs">{new Date(r.starts_at).toLocaleString("pt-BR")}</div>
              <div className="col-span-2"><Badge variant="secondary" className="text-xs">{r.status}</Badge></div>
              <div className="col-span-3 truncate">{r.customer_name || "—"}</div>
              <div className="col-span-2 truncate text-xs text-muted-foreground">{(r.agenda_professionals as { name?: string } | null)?.name ?? "—"}</div>
              <div className="col-span-2 truncate text-xs text-muted-foreground">{(r.agenda_services as { name?: string } | null)?.name ?? "—"}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
