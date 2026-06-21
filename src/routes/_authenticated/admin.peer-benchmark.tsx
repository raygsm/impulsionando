import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPeerBenchmark } from "@/lib/peer-benchmark.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Building2, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/peer-benchmark")({
  head: () => ({ meta: [{ title: "Peer Benchmark — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PeerBenchmarkPage,
});

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PeerBenchmarkPage() {
  const fn = useServerFn(getPeerBenchmark);
  const { data, isLoading } = useQuery({ queryKey: ["peer-benchmark"], queryFn: () => fn() });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Peer Benchmark Anônimo</h1>
        <p className="text-sm text-muted-foreground">Compara cada tenant contra p25/p50/p75 dos peers do mesmo nicho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> Tenants ativos</div><div className="text-2xl font-bold mt-1">{data.summary.totalTenants}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="h-4 w-4" /> Nichos</div><div className="text-2xl font-bold mt-1">{data.summary.niches}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> MRR médio</div><div className="text-2xl font-bold mt-1">{fmtBRL(data.summary.avgMrr)}</div></Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Benchmarks por nicho</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr><th className="py-2">Nicho</th><th>Peers</th><th>MRR p25</th><th>MRR p50</th><th>MRR p75</th><th>Módulos p50</th><th>Tickets p50</th></tr>
            </thead>
            <tbody>
              {data.benchmarks.map((b: any) => (
                <tr key={b.niche} className="border-b last:border-0">
                  <td className="py-2 font-medium">{b.niche}</td>
                  <td>{b.peers}</td>
                  <td>{fmtBRL(b.mrr_p25)}</td>
                  <td>{fmtBRL(b.mrr_p50)}</td>
                  <td>{fmtBRL(b.mrr_p75)}</td>
                  <td>{b.modules_p50}</td>
                  <td>{b.tickets_p50}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Posicionamento por tenant</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b">
              <tr><th className="py-2">Empresa</th><th>Nicho</th><th>MRR</th><th>Quartil</th><th>Módulos</th><th>Gap módulos</th><th>Tickets</th></tr>
            </thead>
            <tbody>
              {data.tenants.map((t: any) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td>{t.niche}</td>
                  <td>{fmtBRL(t.mrr)}</td>
                  <td>
                    <Badge variant={t.mrrQuartile === "top" ? "default" : t.mrrQuartile === "above" ? "secondary" : t.mrrQuartile === "below" ? "outline" : "destructive"}>
                      {t.mrrQuartile}
                    </Badge>
                  </td>
                  <td>{t.modules}</td>
                  <td className={t.modulesGap > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>{t.modulesGap > 0 ? `+${t.modulesGap}` : "—"}</td>
                  <td>{t.tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
