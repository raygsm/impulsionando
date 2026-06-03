import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, StatCard, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ShoppingCart, Receipt, TrendingUp } from "lucide-react";
import { fmtBRL, fmtInt, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/sales")({
  head: () => ({ meta: [{ title: "Vendas — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(endOfMonthISO());

  const { data } = useQuery({
    queryKey: ["report-sales", companyId, from, to], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_orders")
        .select("id, number, status, total, subtotal, discount, customer_name, confirmed_at, created_at, created_by")
        .eq("company_id", companyId)
        .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const confirmed = rows.filter((r) => r.status === "confirmed");
    const cancelled = rows.filter((r) => r.status === "cancelled");
    return {
      total: rows.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      grossConfirmed: confirmed.reduce((a, b) => a + Number(b.total), 0),
      discounts: rows.reduce((a, b) => a + Number(b.discount ?? 0), 0),
      avgTicket: confirmed.length ? confirmed.reduce((a, b) => a + Number(b.total), 0) / confirmed.length : 0,
    };
  }, [data]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Relatório de vendas" description="Pedidos do PDV no período."
        action={
          <div className="flex items-end gap-2 flex-wrap">
            <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`vendas_${from}_${to}.csv`, (data ?? []).map((r) => ({
              numero: r.number, status: r.status, criado_em: r.created_at, confirmado_em: r.confirmed_at,
              cliente: r.customer_name, subtotal: r.subtotal, desconto: r.discount, total: r.total,
            })))}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Pedidos" value={fmtInt(stats.total)} icon={ShoppingCart} />
        <StatCard label="Confirmados" value={fmtInt(stats.confirmed)} icon={Receipt} />
        <StatCard label="Cancelados" value={fmtInt(stats.cancelled)} />
        <StatCard label="Receita bruta" value={fmtBRL(stats.grossConfirmed)} icon={TrendingUp} />
        <StatCard label="Ticket médio" value={fmtBRL(stats.avgTicket)} />
      </div>
      <Card className="shadow-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50 border-b">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-3">Data</div>
          <div className="col-span-3 text-right">Total</div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem registros no período.</div>}
          {data?.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
              <div className="col-span-1 font-mono text-xs">#{r.number}</div>
              <div className="col-span-2"><Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>{r.status}</Badge></div>
              <div className="col-span-3 truncate">{r.customer_name || "—"}</div>
              <div className="col-span-3 text-xs text-muted-foreground">{new Date(r.confirmed_at ?? r.created_at).toLocaleString("pt-BR")}</div>
              <div className="col-span-3 text-right font-medium">{fmtBRL(Number(r.total))}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
