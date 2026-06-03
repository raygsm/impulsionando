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
import { Download, UserPlus, Trophy, X } from "lucide-react";
import { fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/crm")({
  head: () => ({ meta: [{ title: "CRM — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(endOfMonthISO());

  const { data } = useQuery({
    queryKey: ["report-crm", companyId, from, to], enabled: !!companyId,
    queryFn: async () => {
      const [leads, opps] = await Promise.all([
        supabase.from("crm_leads").select("id, name, status, source, score, created_at, owner_user_id")
          .eq("company_id", companyId).gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`).order("created_at", { ascending: false }),
        supabase.from("crm_opportunities").select("id, status, value, created_at, closed_at")
          .eq("company_id", companyId).gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`),
      ]);
      return { leads: leads.data ?? [], opps: opps.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const leads = data?.leads ?? [];
    const opps = data?.opps ?? [];
    const won = opps.filter((o) => o.status === "won");
    return {
      leadsTotal: leads.length,
      leadsWon: leads.filter((l) => l.status === "won").length,
      leadsLost: leads.filter((l) => l.status === "lost").length,
      oppsCount: opps.length,
      oppsWonValue: won.reduce((a, b) => a + Number(b.amount ?? 0), 0),
      conv: leads.length ? (leads.filter((l) => l.status === "won").length / leads.length) * 100 : 0,
    };
  }, [data]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Relatório de CRM" description="Leads e oportunidades no período."
        action={
          <div className="flex items-end gap-2 flex-wrap">
            <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`leads_${from}_${to}.csv`, (data?.leads ?? []).map((l) => ({
              nome: l.name, status: l.status, origem: l.source, score: l.score, criado_em: l.created_at,
            })))}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Novos leads" value={fmtInt(stats.leadsTotal)} icon={UserPlus} />
        <StatCard label="Ganhos" value={fmtInt(stats.leadsWon)} icon={Trophy} accent />
        <StatCard label="Perdidos" value={fmtInt(stats.leadsLost)} icon={X} />
        <StatCard label="Conversão" value={`${stats.conv.toFixed(1)}%`} />
        <StatCard label="Receita ganha (oport.)" value={fmtInt(stats.oppsCount)} hint={`R$ ${stats.oppsWonValue.toLocaleString("pt-BR")}`} />
      </div>
      <Card className="shadow-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50 border-b">
          <div className="col-span-4">Lead</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Origem</div>
          <div className="col-span-1 text-right">Score</div>
          <div className="col-span-2 text-right">Criado em</div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {!data?.leads.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem leads no período.</div>}
          {data?.leads.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
              <div className="col-span-4 truncate">{l.name}</div>
              <div className="col-span-2"><Badge variant="secondary" className="text-xs">{l.status}</Badge></div>
              <div className="col-span-3 truncate text-xs text-muted-foreground">{l.source || "—"}</div>
              <div className="col-span-1 text-right">{l.score ?? 0}</div>
              <div className="col-span-2 text-right text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
