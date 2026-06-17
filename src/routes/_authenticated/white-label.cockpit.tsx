import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Building2, DollarSign, Users, TrendingUp, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/white-label/cockpit")({
  head: () => ({ meta: [{ title: "White Label Cockpit — Impulsionando" }] }),
  component: WLCockpit,
});

function WLCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["wl-cockpit"],
    staleTime: 60_000,
    queryFn: async () => {
      const [wlList, mrr, invoicesOpen, modules] = await Promise.all([
        supabase.from("companies")
          .select("id, name, slug, white_label_id, created_at")
          .not("white_label_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("billing_invoices").select("amount_cents", { count: "exact" }).eq("status", "paid"),
        supabase.from("billing_invoices").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("company_modules").select("id", { count: "exact", head: true }).eq("is_enabled", true),
      ]);
      return {
        whiteLabels: wlList.data ?? [],
        mrrCents: (mrr.data ?? []).reduce((a, b: any) => a + (b.amount_cents ?? 0), 0),
        openInvoices: invoicesOpen.count ?? 0,
        enabledModules: modules.count ?? 0,
      };
    },
  });

  const kpis = [
    { label: "Operações White Label", value: data?.whiteLabels.length ?? 0, icon: Layers },
    { label: "MRR consolidado", value: data ? `R$ ${(data.mrrCents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—", icon: DollarSign },
    { label: "Faturas em aberto", value: data?.openInvoices ?? 0, icon: TrendingUp },
    { label: "Módulos ativos", value: data?.enabledModules ?? 0, icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="White Label Cockpit" description="Visão executiva das operações revenda: clientes, faturamento e módulos." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-20" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Operações White Label</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/companies">Ver todas <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        {isLoading ? <Skeleton className="h-48 w-full" /> : data?.whiteLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma operação White Label ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operação</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>White Label ID</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.whiteLabels.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="font-mono text-xs">{c.white_label_id?.slice(0, 8)}…</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Atalhos</h3>
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/companies">Empresas</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/admin/billing">Billing Master</Link></Button>
          <Button asChild size="sm" variant="outline" className="justify-start"><Link to="/modules">Módulos</Link></Button>
        </div>
      </Card>
    </div>
  );
}
