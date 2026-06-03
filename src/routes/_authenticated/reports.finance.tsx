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
import { Download, ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { fmtBRL, startOfMonthISO, endOfMonthISO, downloadCSV } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/finance")({
  head: () => ({ meta: [{ title: "Financeiro — Relatórios" }] }),
  component: Page,
});

function Page() {
  const { companyId } = useActiveCompany();
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(endOfMonthISO());

  const { data } = useQuery({
    queryKey: ["report-finance", companyId, from, to], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_transactions")
        .select("id, description, kind, status, amount, net_amount, due_date, paid_at, category_id, account_id")
        .eq("company_id", companyId)
        .or(`and(paid_at.gte.${from}T00:00:00,paid_at.lte.${to}T23:59:59),and(due_date.gte.${from},due_date.lte.${to})`)
        .order("paid_at", { ascending: false, nullsFirst: false }).limit(2000);
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const paid = rows.filter((r) => r.status === "paid");
    const inc = paid.filter((r) => r.kind === "income").reduce((a, b) => a + Number(b.net_amount), 0);
    const exp = paid.filter((r) => r.kind === "expense").reduce((a, b) => a + Number(b.net_amount), 0);
    const open = rows.filter((r) => r.status !== "paid" && r.status !== "refunded");
    return { inc, exp, profit: inc - exp, openCount: open.length, openSum: open.reduce((a, b) => a + Number(b.net_amount), 0) };
  }, [data]);

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Relatório financeiro" description="Receitas, despesas e fluxo no período."
        action={
          <div className="flex items-end gap-2 flex-wrap">
            <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
            <CompanyPicker />
            <Button variant="outline" size="sm" onClick={() => downloadCSV(`financeiro_${from}_${to}.csv`, (data ?? []).map((r) => ({
              descricao: r.description, tipo: r.kind, status: r.status,
              valor: r.amount, valor_liquido: r.net_amount, vencimento: r.due_date, pago_em: r.paid_at,
            })))}><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Receitas pagas" value={fmtBRL(stats.inc)} icon={ArrowUp} accent />
        <StatCard label="Despesas pagas" value={fmtBRL(stats.exp)} icon={ArrowDown} />
        <StatCard label="Resultado" value={fmtBRL(stats.profit)} />
        <StatCard label="Em aberto" value={String(stats.openCount)} hint={fmtBRL(stats.openSum)} icon={Wallet} />
        <StatCard label="Lançamentos" value={String(data?.length ?? 0)} />
      </div>
      <Card className="shadow-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2 text-xs font-medium bg-muted/50 border-b">
          <div className="col-span-5">Descrição</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Valor</div>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem registros no período.</div>}
          {data?.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 p-2 text-sm items-center">
              <div className="col-span-5 truncate">
                <div className="truncate">{r.description}</div>
                <div className="text-xs text-muted-foreground">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : `Venc.: ${r.due_date ?? "—"}`}</div>
              </div>
              <div className="col-span-2"><Badge variant={r.kind === "income" ? "default" : "secondary"}>{r.kind}</Badge></div>
              <div className="col-span-2 text-xs">{r.status}</div>
              <div className={`col-span-3 text-right font-medium ${r.kind === "income" ? "text-emerald-600" : "text-red-600"}`}>{fmtBRL(Number(r.net_amount))}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
