import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Calendar, ChefHat, AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/operations/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit de Operações — Impulsionando" }] }),
  component: OpsCockpit,
});

function OpsCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["ops-cockpit"],
    staleTime: 30_000,
    queryFn: async () => {
      const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(); dayEnd.setHours(23, 59, 59, 999);

      const [stockRes, apptsRes, ordersRes, tablesRes] = await Promise.all([
        supabase.from("inv_products")
          .select("id, name, current_stock, min_stock, unit, is_active")
          .eq("is_active", true).eq("track_stock", true)
          .order("current_stock", { ascending: true })
          .limit(200),
        supabase.from("agenda_appointments")
          .select("id, customer_name, starts_at, ends_at, status, professional_id")
          .gte("starts_at", dayStart.toISOString()).lte("starts_at", dayEnd.toISOString())
          .order("starts_at"),
        supabase.from("sales_orders")
          .select("id, number, customer_name, status, total, created_at")
          .in("status", ["pending", "confirmed", "preparing", "ready"])
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("restaurant_table_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
      ]);

      const stockAll = stockRes.data ?? [];
      const lowStock = stockAll.filter((p: any) => Number(p.current_stock) <= Number(p.min_stock));
      const out = lowStock.filter((p: any) => Number(p.current_stock) <= 0);

      const appts = apptsRes.data ?? [];
      const today = appts.length;
      const pending = appts.filter((a: any) => a.status === "scheduled" || a.status === "confirmed").length;

      const orders = ordersRes.data ?? [];
      const kdsCount = orders.filter((o: any) => ["confirmed", "preparing"].includes(o.status)).length;
      const ready = orders.filter((o: any) => o.status === "ready").length;

      return {
        lowStock: lowStock.slice(0, 12),
        lowCount: lowStock.length,
        outCount: out.length,
        appts: appts.slice(0, 12),
        apptsToday: today,
        apptsPending: pending,
        orders: orders.slice(0, 12),
        kdsCount, ready,
        openTables: tablesRes.count ?? 0,
      };
    },
  });

  const kpis = [
    { label: "Estoque crítico", value: data?.lowCount ?? "—", sub: `${data?.outCount ?? 0} zerado(s)`, icon: AlertTriangle, color: "text-destructive" },
    { label: "Agendamentos hoje", value: data?.apptsToday ?? "—", sub: `${data?.apptsPending ?? 0} pendente(s)`, icon: Calendar, color: "text-sky-600" },
    { label: "Em preparo (KDS)", value: data?.kdsCount ?? "—", sub: `${data?.ready ?? 0} prontos`, icon: ChefHat, color: "text-amber-600" },
    { label: "Mesas abertas", value: data?.openTables ?? "—", icon: Package, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cockpit de Operações" description="Estoque, agenda e cozinha em uma única tela — para agir antes de virar problema." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Estoque */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Estoque crítico
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/inventory">Estoque <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Todos os produtos acima do mínimo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.lowStock.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell className="text-right font-semibold">{p.current_stock} {p.unit}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{p.min_stock}</TableCell>
                    <TableCell>
                      {Number(p.current_stock) <= 0
                        ? <Badge className="bg-destructive/15 text-destructive border-destructive/30">Zerado</Badge>
                        : <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Baixo</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Agenda hoje */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-600" /> Agenda de hoje
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/agenda">Abrir agenda <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.appts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem agendamentos para hoje.</p>
          ) : (
            <div className="space-y-2">
              {data?.appts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div className="flex items-center gap-3">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-sm text-muted-foreground">{a.customer_name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* KDS / pedidos */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-amber-600" /> Pedidos em andamento (KDS)
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/orders">Todos os pedidos <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        {isLoading ? <Skeleton className="h-32 w-full" /> : data?.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sem pedidos pendentes.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.orders.map((o: any) => {
                const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
                const late = mins > 20;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.number}</TableCell>
                    <TableCell className="font-medium text-sm">{o.customer_name ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs ${late ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {mins} min
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(o.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
