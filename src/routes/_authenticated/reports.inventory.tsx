import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, AlertTriangle, DollarSign } from "lucide-react";
import { fmtBRL, fmtInt, downloadCSV } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/inventory")({
  head: () => ({ meta: [{ title: "Estoque — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();

  const { data } = useQuery({
    queryKey: ["report-inventory", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("inv_products")
        .select("id, sku, name, current_stock, min_stock, cost_price, sale_price, is_active, track_stock")
        .eq("company_id", companyId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const active = rows.filter((r) => r.is_active);
    const low = active.filter((r) => r.track_stock && Number(r.current_stock) <= Number(r.min_stock ?? 0));
    const value = active.reduce((a, b) => a + Number(b.current_stock) * Number(b.cost_price ?? 0), 0);
    return { total: rows.length, active: active.length, low: low.length, value };
  }, [data]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Relatório de estoque" description="Posição atual dos produtos."
        action={
          <div className="flex gap-2">
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`estoque.csv`, (data ?? []).map((r) => ({
              sku: r.sku, nome: r.name, ativo: r.is_active, estoque: r.current_stock, minimo: r.min_stock,
              custo: r.cost_price, venda: r.sale_price, valor_total: Number(r.current_stock) * Number(r.cost_price ?? 0),
            })))}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Produtos" value={fmtInt(stats.total)} icon={Package} />
        <StatCard label="Ativos" value={fmtInt(stats.active)} />
        <StatCard label="Estoque baixo" value={fmtInt(stats.low)} icon={AlertTriangle} />
        <StatCard label="Valor em estoque" value={fmtBRL(stats.value)} icon={DollarSign} accent />
      </div>
      <Card className="shadow-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50 border-b">
          <div className="col-span-2">SKU</div>
          <div className="col-span-4">Produto</div>
          <div className="col-span-2 text-right">Estoque</div>
          <div className="col-span-2 text-right">Custo</div>
          <div className="col-span-2 text-right">Valor</div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem produtos.</div>}
          {data?.map((r) => {
            const low = r.track_stock && Number(r.current_stock) <= Number(r.min_stock ?? 0);
            return (
              <div key={r.id} className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
                <div className="col-span-2 font-mono text-xs truncate">{r.sku || "—"}</div>
                <div className="col-span-4 truncate flex items-center gap-2">
                  <span className="truncate">{r.name}</span>
                  {low && <Badge variant="destructive" className="text-xs">Baixo</Badge>}
                  {!r.is_active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                </div>
                <div className="col-span-2 text-right">{fmtInt(Number(r.current_stock))}</div>
                <div className="col-span-2 text-right text-muted-foreground">{fmtBRL(Number(r.cost_price ?? 0))}</div>
                <div className="col-span-2 text-right font-medium">{fmtBRL(Number(r.current_stock) * Number(r.cost_price ?? 0))}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
