import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRevenueAttribution } from "@/lib/attribution.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/attribution")({
  head: () => ({ meta: [{ title: "Revenue Attribution — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AttributionPage,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function AttributionPage() {
  const fn = useServerFn(getRevenueAttribution);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "attribution"], queryFn: () => fn({}) });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (error) return <div className="p-6 text-destructive">Erro: {(error as Error).message}</div>;
  if (!data) return null;
  const { summary, rows } = data;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Compass className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Revenue Attribution 360</h1>
          <p className="text-sm text-muted-foreground">First-touch: origem/UTM → lead → demo → quote → MRR ativo (180d).</p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-6">
        {[
          { k: "Leads", v: summary.leads },
          { k: "Demos", v: summary.demos },
          { k: "Quotes", v: summary.quotes },
          { k: "Ganhas", v: summary.won },
          { k: "Tenants ativos", v: summary.active_tenants },
          { k: "MRR atribuído", v: brl(summary.mrr), accent: true },
        ].map((c) => (
          <Card key={c.k} className="p-4">
            <div className="text-xs text-muted-foreground">{c.k}</div>
            <div className={`text-xl font-bold ${c.accent ? "text-emerald-600" : ""}`}>{c.v}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4" /><h2 className="font-semibold">Origens por MRR atribuído</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-3">Origem / UTM</th>
                <th className="py-2 pr-3 text-right">Leads</th>
                <th className="py-2 pr-3 text-right">Demos</th>
                <th className="py-2 pr-3 text-right">Quotes</th>
                <th className="py-2 pr-3 text-right">Ganhas</th>
                <th className="py-2 pr-3 text-right">CVR L→W</th>
                <th className="py-2 pr-3 text-right">Tenants</th>
                <th className="py-2 pr-3 text-right">MRR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{r.origin}</div>
                    <div className="text-xs text-muted-foreground">{r.utm_source ?? "—"} · {r.utm_campaign ?? "—"}</div>
                  </td>
                  <td className="py-2 pr-3 text-right">{r.leads}</td>
                  <td className="py-2 pr-3 text-right">{r.demos}</td>
                  <td className="py-2 pr-3 text-right">{r.quotes}</td>
                  <td className="py-2 pr-3 text-right">{r.won}</td>
                  <td className="py-2 pr-3 text-right">
                    <Badge variant={r.cvr_lead_win >= 5 ? "default" : "secondary"}>{r.cvr_lead_win}%</Badge>
                  </td>
                  <td className="py-2 pr-3 text-right">{r.active_tenants}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-emerald-600">{brl(r.mrr)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Sem dados.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
