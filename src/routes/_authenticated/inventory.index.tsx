import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, ArrowDownUp, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inventory/")({
  head: () => ({ meta: [{ title: "Estoque — Visão geral" }] }),
  component: Page,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { companyId } = useActiveCompany();

  const { data: stats } = useQuery({
    queryKey: ["inv-stats", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [products, low, suppliers, movs] = await Promise.all([
        supabase.from("inv_products").select("id, current_stock, cost_price", { count: "exact" }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("inv_products").select("id, name, current_stock, min_stock").eq("company_id", companyId).eq("is_active", true).eq("track_stock", true),
        supabase.from("inv_suppliers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true),
        supabase.from("inv_movements").select("id, kind, quantity, created_at, inv_products(name)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(8),
      ]);
      const list = products.data ?? [];
      const totalValue = list.reduce((s, p) => s + Number(p.current_stock) * Number(p.cost_price), 0);
      const lowList = (low.data ?? []).filter((p) => Number(p.current_stock) <= Number(p.min_stock));
      return {
        productsCount: products.count ?? 0,
        totalValue,
        lowList,
        suppliersCount: suppliers.count ?? 0,
        recent: movs.data ?? [],
      };
    },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Estoque" description="Visão geral do inventário." action={<CompanyPicker />} />
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Produtos ativos</span><Package className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{stats?.productsCount ?? 0}</div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Valor em estoque</span><Package className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{fmt(stats?.totalValue ?? 0)}</div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Abaixo do mínimo</span><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats?.lowList.length ?? 0}</div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Fornecedores</span><Truck className="w-4 h-4 text-muted-foreground" /></div>
          <div className="text-2xl font-bold mt-1">{stats?.suppliersCount ?? 0}</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="shadow-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Reposição necessária</h3>
            <Link to="/inventory/products" className="text-xs text-primary hover:underline">Ver produtos</Link>
          </div>
          <div className="divide-y">
            {!stats?.lowList.length && <div className="p-4 text-sm text-muted-foreground">Nenhum produto abaixo do mínimo.</div>}
            {stats?.lowList.slice(0, 6).map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-muted-foreground">{Number(p.current_stock)} / mín {Number(p.min_stock)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="shadow-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><ArrowDownUp className="w-4 h-4" />Movimentações recentes</h3>
            <Link to="/inventory/movements" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y">
            {!stats?.recent.length && <div className="p-4 text-sm text-muted-foreground">Sem movimentações.</div>}
            {stats?.recent.map((m: { id: string; kind: string; quantity: number; created_at: string; inv_products: { name: string } | null }) => (
              <div key={m.id} className="p-3 flex items-center justify-between text-sm">
                <span className="truncate">{m.inv_products?.name ?? "—"}</span>
                <span className={`text-xs ${m.kind === "in" ? "text-emerald-600" : m.kind === "out" ? "text-red-600" : "text-muted-foreground"}`}>
                  {m.kind === "in" ? "+" : m.kind === "out" ? "-" : "±"}{Number(m.quantity)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
