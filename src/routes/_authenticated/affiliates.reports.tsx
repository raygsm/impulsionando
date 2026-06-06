import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/affiliates/reports")({
  component: AffReportsPage,
});

function AffReportsPage() {
  const { companyId } = useActiveCompany();
  const { data: top } = useQuery({
    queryKey: ["aff_top_links", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_links").select("slug, clicks, leads, sales, revenue, commission_total").eq("company_id", companyId!).order("revenue", { ascending: false }).limit(20)).data ?? [],
  });
  const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Top links por receita. Relatórios por afiliado, gerente, coprodutor e campanha são derivados das tabelas <code>aff_sales</code> / <code>aff_commissions</code>.</p>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Comissão paga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(top ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sem dados ainda.</TableCell></TableRow>}
              {top?.map((r) => (
                <TableRow key={r.slug}>
                  <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                  <TableCell className="text-right">{r.clicks}</TableCell>
                  <TableCell className="text-right">{r.leads}</TableCell>
                  <TableCell className="text-right">{r.sales}</TableCell>
                  <TableCell className="text-right">{brl(r.revenue ?? 0)}</TableCell>
                  <TableCell className="text-right">{brl(r.commission_total ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
