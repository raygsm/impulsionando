import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Target, TrendingUp, Trophy, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/commercial/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit Comercial — Impulsionando" }] }),
  component: CommercialCockpit,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function CommercialCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["commercial-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [oppsRes, stagesRes, leadsRes] = await Promise.all([
        supabase.from("crm_opportunities")
          .select("id, title, value, status, owner_user_id, stage_id, created_at, closed_at, expected_close_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("crm_stages").select("id, name, win_probability, stage_type"),
        supabase.from("crm_leads").select("id", { count: "exact", head: true })
          .gte("created_at", monthStart),
      ]);

      const opps = oppsRes.data ?? [];
      const stages = new Map((stagesRes.data ?? []).map((s: any) => [s.id, s]));

      const open = opps.filter((o: any) => o.status === "open");
      const won = opps.filter((o: any) => o.status === "won");
      const lost = opps.filter((o: any) => o.status === "lost");

      const wonThisMonth = won.filter((o: any) => o.closed_at && o.closed_at >= monthStart);
      const wonRevenueMonth = wonThisMonth.reduce((a, o: any) => a + Number(o.value ?? 0), 0);

      // Pipeline ponderado por probabilidade do stage
      const weighted = open.reduce((acc, o: any) => {
        const s: any = stages.get(o.stage_id);
        const p = (s?.win_probability ?? 0) / 100;
        return acc + Number(o.value ?? 0) * p;
      }, 0);
      const pipelineTotal = open.reduce((a, o: any) => a + Number(o.value ?? 0), 0);

      const closed = won.length + lost.length;
      const winRate = closed > 0 ? (won.length / closed) * 100 : 0;

      // Ranking por vendedor (owner_user_id)
      const byOwner = new Map<string, { wonCount: number; wonValue: number; openCount: number; openValue: number }>();
      for (const o of opps as any[]) {
        const k = o.owner_user_id ?? "—";
        const cur = byOwner.get(k) ?? { wonCount: 0, wonValue: 0, openCount: 0, openValue: 0 };
        if (o.status === "won") { cur.wonCount++; cur.wonValue += Number(o.value ?? 0); }
        if (o.status === "open") { cur.openCount++; cur.openValue += Number(o.value ?? 0); }
        byOwner.set(k, cur);
      }
      const ranking = Array.from(byOwner.entries())
        .map(([owner, v]) => ({ owner, ...v }))
        .sort((a, b) => b.wonValue - a.wonValue)
        .slice(0, 10);

      // Funnel por estágio
      const byStage = new Map<string, { name: string; count: number; value: number; prob: number }>();
      for (const o of open as any[]) {
        const s: any = stages.get(o.stage_id) ?? { name: "—", win_probability: 0 };
        const cur = byStage.get(o.stage_id) ?? { name: s.name, count: 0, value: 0, prob: s.win_probability };
        cur.count++;
        cur.value += Number(o.value ?? 0);
        byStage.set(o.stage_id, cur);
      }
      const funnel = Array.from(byStage.values()).sort((a, b) => b.value - a.value);

      return {
        leadsMonth: leadsRes.count ?? 0,
        openCount: open.length,
        pipelineTotal,
        weighted,
        wonThisMonth: wonThisMonth.length,
        wonRevenueMonth,
        winRate,
        ranking,
        funnel,
      };
    },
  });

  const kpis = [
    { label: "Leads (mês)",         value: data?.leadsMonth ?? "—",                           icon: Users,      color: "text-sky-600" },
    { label: "Pipeline aberto",     value: data ? brl(data.pipelineTotal) : "—",              icon: Briefcase,  color: "text-violet-600" },
    { label: "Pipeline ponderado",  value: data ? brl(data.weighted) : "—",                   icon: Target,     color: "text-primary" },
    { label: "Ganho no mês",        value: data ? `${brl(data.wonRevenueMonth)}` : "—",       icon: Trophy,     color: "text-emerald-600", sub: data ? `${data.wonThisMonth} negócio(s)` : undefined },
    { label: "Taxa de conversão",   value: data ? `${data.winRate.toFixed(1)}%` : "—",        icon: TrendingUp, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit Comercial" description="Pipeline ponderado, taxa de conversão e ranking de vendedores em tempo real." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-20" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" /> Funil por estágio (oportunidades em aberto)
        </h2>
        {isLoading ? <Skeleton className="h-32 w-full" /> : data?.funnel.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem oportunidades em aberto.</p>
        ) : (
          <div className="space-y-2">
            {data?.funnel.map((s, i) => {
              const max = data.funnel[0].value || 1;
              const pct = (s.value / max) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium truncate">{s.name}</div>
                  <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                      <span>{s.count} opp</span>
                      <span>{brl(s.value)} · {s.prob}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Ranking */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-600" /> Ranking de vendedores
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/crm">Abrir CRM <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        {isLoading ? <Skeleton className="h-32 w-full" /> : data?.ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem dados de vendedores ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Ganhos</TableHead>
                <TableHead className="text-right">Receita ganha</TableHead>
                <TableHead className="text-right">Pipeline aberto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.ranking.map((r, i) => (
                <TableRow key={r.owner}>
                  <TableCell className="font-bold">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{r.owner === "—" ? "Sem dono" : `${r.owner.slice(0, 8)}…`}</TableCell>
                  <TableCell className="text-right">{r.wonCount}</TableCell>
                  <TableCell className="text-right font-semibold">{brl(r.wonValue)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{brl(r.openValue)} <span className="text-[10px]">({r.openCount})</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Atalhos</h3>
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/crm/leads">Leads</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/crm/pipelines">Pipelines</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/crm/activities">Atividades</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/reports/crm">Relatório CRM</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/insights/oportunidades">Central de Oportunidades</Link></Button>
        </div>
      </Card>
    </div>
  );
}
