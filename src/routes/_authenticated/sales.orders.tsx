import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales/orders")({
  head: () => ({ meta: [{ title: "Pedidos — Vendas" }] }),
  component: Page,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");

  const { data } = useQuery({
    queryKey: ["sales-orders", companyId, status], enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("sales_orders")
        .select("id, number, status, total, customer_name, created_at, confirmed_at")
        .eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_orders").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sales-orders"] }); toast.success("Cancelado e estornado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Pedidos" description="Histórico de vendas." action={
        <div className="flex gap-2">
          <CompanyPicker />
          <Button asChild><Link to="/sales/new"><Plus className="w-4 h-4 mr-1" />Nova venda</Link></Button>
        </div>
      } />

      <div className="mb-4 max-w-xs">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card divide-y">
        {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum pedido.</div>}
        {data?.map((o) => (
          <div key={o.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2">
                #{o.number}
                {o.status === "confirmed" && <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">Confirmado</Badge>}
                {o.status === "draft" && <Badge variant="outline">Rascunho</Badge>}
                {o.status === "cancelled" && <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">Cancelado</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {o.customer_name ?? "Sem cliente"} · {new Date(o.created_at).toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="text-right text-sm font-semibold">{fmt(Number(o.total))}</div>
            {o.status === "confirmed" && (
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Cancelar e estornar?")) cancel.mutate(o.id); }}>
                <Ban className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
