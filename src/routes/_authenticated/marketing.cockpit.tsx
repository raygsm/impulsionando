import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, TrendingUp, Users, Target, ArrowRight, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketing/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit de Marketing — Impulsionando" }] }),
  component: MarketingCockpit,
});

function MarketingCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["marketing-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const last30 = new Date(Date.now() - 30 * 86400_000).toISOString();

      const [leadsAll, leadsMonth, oppsMonth, demoLeads] = await Promise.all([
        supabase.from("marketing_leads")
          .select("id, source, status, utm_source, utm_medium, utm_campaign, page_url, recommended_plan, created_at")
          .gte("created_at", last30)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("marketing_leads").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("crm_opportunities").select("id", { count: "exact", head: true })
          .eq("status", "won").gte("closed_at", monthStart),
        supabase.from("demo_leads").select("id", { count: "exact", head: true }).gte("created_at", last30),
      ]);

      const leads = leadsAll.data ?? [];

      const bySource = new Map<string, number>();
      const byMedium = new Map<string, number>();
      const byStatus = new Map<string, number>();
      const byCampaign = new Map<string, number>();

      for (const l of leads as any[]) {
        const src = l.utm_source || l.source || "direto";
        const med = l.utm_medium || "—";
        const camp = l.utm_campaign || "—";
        bySource.set(src, (bySource.get(src) ?? 0) + 1);
        byMedium.set(med, (byMedium.get(med) ?? 0) + 1);
        byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
        if (camp !== "—") byCampaign.set(camp, (byCampaign.get(camp) ?? 0) + 1);
      }

      const sourceList = Array.from(bySource.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      const campaigns = Array.from(byCampaign.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const qualified = (byStatus.get("qualified") ?? 0) + (byStatus.get("won") ?? 0);
      const conversion = leads.length > 0 ? (qualified / leads.length) * 100 : 0;

      return {
        leadsMonth: leadsMonth.count ?? 0,
        leads30dCount: leads.length,
        oppsWonMonth: oppsMonth.count ?? 0,
        demoLeads30d: demoLeads.count ?? 0,
        conversion,
        sourceList,
        campaigns,
        recent: leads.slice(0, 10),
      };
    },
  });

  const kpis = [
    { label: "Leads (mês)",         value: data?.leadsMonth ?? "—",     icon: Users,      color: "text-sky-600" },
    { label: "Leads (30d)",         value: data?.leads30dCount ?? "—",  icon: Globe,      color: "text-primary" },
    { label: "Demos (30d)",         value: data?.demoLeads30d ?? "—",   icon: Target,     color: "text-violet-600" },
    { label: "Vendas ganhas (mês)", value: data?.oppsWonMonth ?? "—",   icon: TrendingUp, color: "text-emerald-600" },
    { label: "Conversão (30d)",     value: data ? `${data.conversion.toFixed(1)}%` : "—", icon: Megaphone, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit de Marketing" description="Origens, campanhas e conversão dos leads dos últimos 30 dias." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Origem */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" /> Leads por origem (30d)
          </h2>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.sourceList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem leads no período.</p>
          ) : (
            <div className="space-y-2">
              {data?.sourceList.slice(0, 8).map((s) => {
                const max = data.sourceList[0].count || 1;
                const pct = (s.count / max) * 100;
                return (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium truncate">{s.source}</div>
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%` }} />
                      <div className="absolute inset-0 flex items-center justify-end px-3 text-xs font-medium">
                        {s.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Campanhas */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Top campanhas UTM (30d)
          </h2>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem campanhas rastreadas via UTM.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.campaigns.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="text-sm font-medium truncate max-w-[260px]">{c.name}</TableCell>
                    <TableCell className="text-right font-semibold">{c.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Recentes */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Leads recentes</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/marketing/leads">Todos os leads <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        {isLoading ? <Skeleton className="h-40 w-full" /> : data?.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem leads no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recent.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">{l.utm_source || l.source || "—"}</TableCell>
                  <TableCell className="text-xs truncate max-w-[200px]">{l.utm_campaign || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{l.page_url || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Atalhos</h3>
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/marketing/leads">Leads do site</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/marketing">Página de marketing</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/commercial/cockpit">Cockpit Comercial</Link></Button>
        </div>
      </Card>
    </div>
  );
}
