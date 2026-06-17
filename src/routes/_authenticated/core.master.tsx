import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { Building2, TrendingUp, Activity, AlertTriangle, Beaker } from "lucide-react";
import { fmtBRL } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/core/master")({
  head: () => ({ meta: [{ title: "Dashboard Master — Core" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" });
    return { coreAccess: r.level };
  },
  component: MasterDashboard,
});

type CompanyAgg = {
  id: string;
  name: string;
  is_active: boolean | null;
  is_master: boolean | null;
  is_demo: boolean | null;
  company_kind: string | null;
  status_commercial: string | null;
  status_financial: string | null;
  status_technical: string | null;
  niche_id: string | null;
  created_at: string;
  niches: { name: string; slug: string } | null;
};

function MasterDashboard() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["core-master-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, is_active, is_master, is_demo, company_kind, status_commercial, status_financial, status_technical, niche_id, created_at, niches:niche_id(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CompanyAgg[];
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["core-master-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_contracts")
        .select("company_id, recurring_amount, status")
        .eq("status", "active");
      if (error) return [];
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const cs = (companies ?? []).filter((c) => !c.is_master);
    const real = cs.filter((c) => c.company_kind === "real" || (!c.company_kind && !c.is_demo));
    const demo = cs.filter((c) => c.company_kind === "demo" || c.is_demo);
    const active = real.filter((c) => c.is_active);
    const implant = real.filter((c) => c.status_commercial === "implantacao" || c.status_technical === "configuracao");
    const inadimp = real.filter((c) => c.status_financial === "inadimplente" || c.status_financial === "suspensa");
    const realIds = new Set(real.map((r) => r.id));
    const mrrCents = (contracts ?? []).reduce((acc, c) => {
      if (!realIds.has(c.company_id)) return acc;
      return acc + Math.round(Number(c.recurring_amount ?? 0) * 100);
    }, 0);
    const byNiche = new Map<string, { name: string; total: number; real: number; demo: number }>();
    for (const c of cs) {
      const key = c.niches?.slug ?? "sem-nicho";
      const name = c.niches?.name ?? "Sem nicho";
      const cur = byNiche.get(key) ?? { name, total: 0, real: 0, demo: 0 };
      cur.total += 1;
      if (c.company_kind === "demo" || c.is_demo) cur.demo += 1; else cur.real += 1;
      byNiche.set(key, cur);
    }
    return {
      totalReal: real.length, totalDemo: demo.length,
      active: active.length, implant: implant.length, inadimp: inadimp.length,
      mrrCents,
      byNiche: Array.from(byNiche.values()).sort((a, b) => b.total - a.total),
    };
  }, [companies, contracts]);

  if (isLoading) return <Card className="p-6">Carregando…</Card>;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Master" description="Visão consolidada da plataforma Impulsionando — empresas reais, demo, implantações e MRR." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={TrendingUp} label="MRR" value={fmtBRL(stats.mrrCents / 100)} />
        <StatCard icon={Building2} label="Empresas reais" value={String(stats.totalReal)} />
        <StatCard icon={Activity} label="Ativas" value={String(stats.active)} />
        <StatCard icon={Beaker} label="Implantação" value={String(stats.implant)} />
        <StatCard icon={AlertTriangle} label="Inadimplentes" value={String(stats.inadimp)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Por nicho</h2>
            <Badge variant="outline">{stats.byNiche.length} nichos</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nicho</TableHead><TableHead className="text-right">Real</TableHead><TableHead className="text-right">Demo</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {stats.byNiche.map((n) => (
                <TableRow key={n.name}>
                  <TableCell>{n.name}</TableCell>
                  <TableCell className="text-right font-medium">{n.real}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{n.demo}</TableCell>
                  <TableCell className="text-right">{n.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Demo ({stats.totalDemo})</h2>
            <Link to="/companies" className="text-xs text-primary hover:underline">Gerenciar →</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Empresas demo são isoladas do MRR e dos relatórios financeiros. Use a aba <strong>Demo</strong> em Empresas para ações em massa.
          </p>
          <div className="mt-4 space-y-2">
            {(companies ?? []).filter((c) => c.company_kind === "demo" || c.is_demo).slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b pb-1.5">
                <span>{c.name}</span>
                <Badge variant="outline" className="text-xs">{c.niches?.name ?? "—"}</Badge>
              </div>
            ))}
            {stats.totalDemo === 0 && <p className="text-xs text-muted-foreground">Nenhum ambiente demo ativo.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
