import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Receipt, Plus, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sales/")({
  head: () => ({ meta: [{ title: "Vendas — Visão geral" }] }),
  component: Page,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { companyId } = useActiveCompany();
  const today = new Date(); today.setHours(0,0,0,0);

  const { data: stats } = useQuery({
    queryKey: ["sales-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [confirmedToday, drafts, recent] = await Promise.all([
        supabase.from("sales_orders").select("id, total")
          .eq("company_id", companyId).eq("status", "confirmed")
          .gte("confirmed_at", today.toISOString()),
        supabase.from("sales_orders").select("id", { count: "exact", head: true })
          .eq("company_id", companyId).eq("status", "draft"),
        supabase.from("sales_orders").select("id, number, status, total, customer_name, created_at")
          .eq("company_id", companyId).order("created_at", { ascending: false }).limit(10),
      ]);
      const total = (confirmedToday.data ?? []).reduce((s, o) => s + Number(o.total), 0);
      return {
        ordersToday: confirmedToday.data?.length ?? 0,
        revenueToday: total,
        drafts: drafts.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Vendas" description="Ponto de venda e pedidos." action={
        <div className="flex gap-2">
          <CompanyPicker />
          <Button asChild><Link to="/sales/new"><Plus className="w-4 h-4 mr-1" />Nova venda</Link></Button>
        </div>
      } />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Vendas hoje</span><ShoppingCart className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{stats?.ordersToday ?? 0}</div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Faturamento hoje</span><Receipt className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{fmt(stats?.revenueToday ?? 0)}</div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Rascunhos abertos</span><Receipt className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{stats?.drafts ?? 0}</div>
        </Card>
      </div>

      <Card className="shadow-card mt-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Pedidos recentes</h3>
          <Link to="/sales/orders" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y">
          {!stats?.recent.length && <div className="p-4 text-sm text-muted-foreground">Sem pedidos.</div>}
          {stats?.recent.map((o) => (
            <div key={o.id} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {o.status === "confirmed" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : o.status === "cancelled" ? <XCircle className="w-4 h-4 text-red-600" />
                  : <Receipt className="w-4 h-4 text-muted-foreground" />}
                <span className="font-medium">#{o.number}</span>
                <span className="text-muted-foreground truncate">{o.customer_name ?? "—"}</span>
              </div>
              <span className="text-sm font-semibold">{fmt(Number(o.total))}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
